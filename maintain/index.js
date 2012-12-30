var program = require('./commander');
var FLAG = null;//数据类别 kline mline trade dynamic
var REDIS = null;
var async = require('async');
var _ = require('underscore');
var worker = require('./worker');
var REDIS_INSTANCE = null;
var SC_STOCK = {};

//捕获系统异常
process.on('uncaughtException', function (e) {
  if (e && e.stack) {
   console.log('uncaughtException:', e.stack);
  } else {
    console.log('uncaughtException:', e);
  }
});

/*
 *初始化redis和数据类型
 */
var init = function(callback){
  if(REDIS == null){
    console.log('redis地址为null');
    process.exit(0);
  }
  console.log(REDIS);
  REDIS_INSTANCE = require('redis').createClient(REDIS.split(':')[1],REDIS.split(':')[0]);
  if(FLAG == null){
    FLAG = 'KLINE';
  }
  FLAG = FLAG.toString().toUpperCase();
  REDIS_INSTANCE.hvals('SC.STOCK',function(err,res){
    if(err){
      console.log(err);
      process.exit(0);
    }else{
      res.forEach(function(item){
        var type = item.split('|')[4];//股票品种
        var preffix = item.split('|')[3];//市场类型
        var code = item.split('|')[1];//股票code，不带SH 或 SZ
        var stockCode = preffix.toString().toUpperCase()+code;
        if(type.indexOf('H_ZQ') != -1 || type.indexOf('Z_ZQ') != -1){
          SC_STOCK[stockCode] = 10;//债券一手等于10股
        }else if(type.indexOf('K_GP') == -1 && type.indexOf('K_WS') == -1 && type.indexOf('K_NX') == -1){//排除港股
          SC_STOCK[stockCode] = 100;//股票 权证 指数 一手=100股
        }
      });
       callback(SC_STOCK);
    }
  });
};

var test = function(ip){
  REDIS = ip;
  FLAG = 'kline';
  try{
    init();
  }catch(e){
    console.log(e.stack);
  }
};

/*
 * 调用子进程处理
 */
var process_deal = function(array,results,fileName){
    var cp = require('child_process');
    var n = cp.fork(__dirname + '/'+fileName+'.js');
    n.on('message', function (m) {});
    n.send({'array':array,'res':results,'redis':REDIS,'flag':FLAG});
};

var process_f = function(results,fileName){
    var keys = _.keys(results);
    var length = keys.length;
    var index = parseInt(length/8);

    var temp = keys.slice(0,index);
    process_deal(temp,results,fileName);

    temp = keys.slice(index,index*2);
    process_deal(temp,results,fileName);

    temp = keys.slice(index*2,index*3);
    process_deal(temp,results,fileName);

    temp = keys.slice(index*3,index*4);
    process_deal(temp,results,fileName);

    temp = keys.slice(index*4,index*5);
    process_deal(temp,results,fileName);

    temp = keys.slice(index*5,index*6);
    process_deal(temp,results,fileName);

    temp = keys.slice(index*6,index*7);
    process_deal(temp,results,fileName);

    temp = keys.slice(index*7,length);
    process_deal(temp,results,fileName);

}
/*
 * 转换所有的K线 成交量由手变成股
 */
var dealKlineAll = function(results){
  process_f(results,'process_kline');
};

/*
 * 转换所有的分时线 成交量由手变成股
 */
var dealMlineAll = function(results){
  process_f(results,'process_mline');
};

/*
 * 转换所有的交易 成交量由手变成股
 */
var dealTradeAll = function(results){
  process_f(results,'process_trade');
};

/*
 * 转换所有的动态行情 成交量由手变成股
 */
var dealDynamicAll = function(results){
  process_f(results,'process_dynamic');
};

/*
 *根据数据类型转换所有数据
 */
var convertAll = function(type){
  init(function(results){
    if(FLAG == 'KLINE'){
      dealKlineAll(results);//所有K线
    }else if(FLAG == 'MLINE'){
      dealMlineAll(results);//所有分时
    }else if(FLAG == 'TRADE'){
      dealTradeAll(results);//所有交易
    }else if(FLAG == 'SDC'){
      dealDynamicAll(results);//所有动态行情
    }else{
      console.log('-t对应的数据类型错误');
    }
//    process.exit(0);
  });  
};

/*
 * 根据股票代码转换k线数据
 */
var dealKlineByCode = function(code){
  init(function(results){
    convertKLine(code,results);
  });  
};

var convertKLine = function(code,results){
  var array_key = getKlineKeys(['05M','15M','30M','60M','DAY','WK','MTH','HY','FY','SY'],code);
    async.forEach(array_key,function(key,callback){
      convertKLineByCode(REDIS_INSTANCE,key,callback,results[key.split('.')[1]]);
    },function(err){
      if(err){
        console.log('pid:'+process.pid+','+err);
      }else{
        console.log('pid:'+process.pid+','+code+'K线转换完成');
      }
    });
};

/*
 *获得K线key数组
 */
var getKlineKeys = function(types,code){
  var array_key = [];
  types.forEach(function(type){
    array_key.push(getKlineKey(type,code));
  });
  return array_key;
}

/*
 *获得K线key
 */
var getKlineKey = function(type,code){
  var key = FLAG+'.'+code.toString().toUpperCase();
  var temp = key.split('.');
  temp.push(type);
  return temp.join('.');
};

/*
 *k线转换，成交量由手变成股
 */
var convertKLineByCode = function(redis,key,cb,headValue){
  redis.lrange(key,0,-1,function(e,r){
    if(e){
      cb(e);
    }else if(r !=null && r.length > 0){
      r.forEachSync(function(item,index,cback){
        var temp = item.split('|');
        temp[5] = parseFloat(temp[5])*headValue;
        temp[7] = parseFloat(temp[7])*headValue;
        redis.lset(key,index,temp.join('|'),function(err,res){
          if(err){
            console.log('pid:'+process.pid+err);
          }else{
          }            
          cback();
        });
      },function(){
        cb();
      });
    }else{
      cb(key+'不存在');
    }
  });
};

/*
 * 根据股票代码转换分时数据，成交量由手变成股
 */
var convertMlineByCode = function(code){
  init(function(results){
    convertMline(code,results);
  });
};
var convertMline = function(code,results){
  var key = FLAG+'.'+code.toString().toUpperCase();
    REDIS_INSTANCE.lrange(key,0,-1,function(err,res){
      if(err){
        console.log(err);
        process.exit(0);
      }else if(res !=null && res.length > 0){
        res.forEachSync(function(item,index,cb){
          var temp = item.split('|');
          temp[2] = parseFloat(temp[2])*results[key.split('.')[1]];
          REDIS_INSTANCE.lset(key,index,temp.join('|'),function(e,r){
            if(e)console.log(key+e);
            cb();
          });
        },function(){
          console.log(key+'over.');
        });
      }else{
        console.log(key+'不存在');
        process.exit(0);
      }
    });
};


/*
 * 根据股票代码转换交易数据，成交量由手变成股
 */
var convertTradeByCode = function(code){
  init(function(results){
    convertTrade(code,results);
  });
};

var convertTrade = function(code,results){
  var key = FLAG+'.'+code.toString().toUpperCase();
    REDIS_INSTANCE.lrange(key,0,-1,function(err,res){
      if(err){
        console.log(err);
        process.exit(0);
      }else if(res !=null && res.length > 0){
        res.forEachSync(function(item,index,cb){
          var temp = item.split('|');
          temp[2] = parseFloat(temp[2])*results[key.split('.')[1]];
          temp[4] = parseFloat(temp[4])*results[key.split('.')[1]];
          REDIS_INSTANCE.lset(key,index,temp.join('|'),function(e,r){
            if(e)console.log(key+e);
            cb();
          });
        },function(){
          console.log(key+'over.');
          process.exit(0);
        });
      }else{
        console.log(key+'不存在');
        process.exit(0);
      }
    });
};

/*
 * 根据股票代码转换动态行情数据，成交量由手变成股
 */
var convertDynamicByCode = function(code){
  init(function(results){
    convertDynamic(code,results);
  });
};

var convertDynamic = function(code,results){
  var key = FLAG+'.'+code.toString().toUpperCase();
    REDIS_INSTANCE.get(key,function(err,res){
      if(err){
        console.log(err);
        process.exit(0);
      }else if(res !=null){
          var temp = res.split('|');
          temp[5] = parseFloat(temp[5])*results[key.split('.')[1]];
          temp[4] = parseFloat(temp[4])*results[key.split('.')[1]];
          temp[12] = parseFloat(temp[12])*results[key.split('.')[1]];
          temp[28] = parseFloat(temp[28])*results[key.split('.')[1]];
          temp[29] = parseFloat(temp[29])*results[key.split('.')[1]];
          temp[30] = parseFloat(temp[30])*results[key.split('.')[1]];
          temp[31] = parseFloat(temp[31])*results[key.split('.')[1]];
          temp[32] = parseFloat(temp[32])*results[key.split('.')[1]];
          temp[33] = parseFloat(temp[33])*results[key.split('.')[1]];
          temp[34] = parseFloat(temp[34])*results[key.split('.')[1]];
          temp[35] = parseFloat(temp[35])*results[key.split('.')[1]];
          temp[36] = parseFloat(temp[36])*results[key.split('.')[1]];
          temp[37] = parseFloat(temp[37])*results[key.split('.')[1]];
          temp[40] = parseFloat(temp[40])*results[key.split('.')[1]];
          REDIS_INSTANCE.set(key,temp.join('|'),function(e,r){
            if(e){
              console.log(key+e);
            }else{
              console.log(key+'over.');
              process.exit(0);
            }
          });
      }else{
        console.log(key+'不存在');
        process.exit(0);
      }
    });
};

var getStockCode = function(stockCode) {
    if(FLAG.toString().toLowerCase() == 'kline'){
      dealKlineByCode(stockCode);
    }else if(FLAG.toString().toLowerCase() == 'mline'){
      convertMlineByCode(stockCode);
    }else if(FLAG.toString().toLowerCase() == 'trade'){
      convertTradeByCode(stockCode);
    }else if(FLAG.toString().toLowerCase() == 'sdc'){
      convertDynamicByCode(stockCode);
    }else{
      console.log('-t对应的数据类型错误');
      process.exit(0);
    }
  };

var getKFlag = function(args_flag) {
    FLAG = args_flag;
  };

var getRedis = function(redis_ip){
  REDIS = redis_ip;
};


program.version('0.1')
  .usage('[options] <股票代码或者数据类型>')
  .option('-c, --code <n>','股票代码',getStockCode)
  .option('-t, --type <n>', '数据类型,kline,mline,trade,sdc', getKFlag)
  .option('-r --redis <n>','redis地址',getRedis)
  .option('-a --all <n>','根据数据类型转换所有数据',convertAll)
  .option('-d --demo <n>','测试用接口',test);

program.on('--help', function(){
  console.log('  Examples:');
  console.log('');
  console.log('    数据类型默认取k线');
  console.log('    $ node replaceKline.js -r 172.16.33.203:6390 -t kline -c SH600000');
  console.log('');
});

program.parse(process.argv);
