var async = require('async');
var _ = require('underscore');
var worker = require('./worker');
var REDIS_INSTANCE = null;
var FLAG = null;


process.on('message', function(task) {
	REDIS_INSTANCE = require('redis').createClient(task.redis.split(':')[1],task.redis.split(':')[0]);
	FLAG = task.flag;
  	dealData(task.array,task.res);
}); 

var dealData = function(keys,results){
	var q = async.queue(function(item,cback){
	    convertKLine(item,results,cback);
	  },50);
	  q.drain = function(){
	    console.log(process.pid+'K线处理结束');
	    REDIS_INSTANCE.quit();
	    process.exit(0);
	  };
	  keys.forEach(function(item){
	    q.push(item,function(){});
	  });
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

var convertKLine = function(code,results,cback){
  var array_key = getKlineKeys(['05M','15M','30M','60M','DAY','WK','MTH','HY','FY','SY'],code);
    async.forEach(array_key,function(key,callback){
      convertKLineByCode(REDIS_INSTANCE,key,callback,results[key.split('.')[1]]);
    },function(err){
      if(err){
        console.log('pid:'+process.pid+','+err);
      }else{
        console.log('pid:'+process.pid+','+code+'K线转换完成');
      }
       cback();
    });
};