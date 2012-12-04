var httpTool = require('./httpTool');
var async = require('async');
var configs = require('../etc/loadConfigure').configure;
var log = require('./log').createLog('validStockCode');
var initRedis = require('redis').createClient(configs.redis.split(':')[1],configs.redis.split(':')[0]);
var _ = require('underscore');
var random = require('./random');
var results = {};
/**catch Exception*/
process.on('uncaughtException', function(e){
  if(e && e.stack){
    log.error('ERROR:'+e.stack);
  }else{
    log.error('ERROR:'+e.toString());
  }
});

var fetchData = function(url,callback){
  if(url == undefined){
   callback('url is undefined',null);
  }else{
    var begin = url.indexOf('=')+1;
    var end = url.indexOf('|');
    var item = url.substring(begin,end);
    httpTool.fetch(url,function(res){
     try{
      if(res != null && res != undefined){
        if(res != 403){
          res = checkSuffix(res);
        }
        callback(null,res,item);
      }else{
        var error_msg = 'url='+url;
        callback(error_msg,null,item);
      }
     }catch(e){
      callback(e,null,item);
     }
    });
  }
}

var checkSuffix = function(value){
  var value = JSON.stringify(value);
  var suffix = value.slice(-1);
  if(suffix === '0'){
    value = value.slice(0,value.length-1);
  }
  if(value !== '[]' && value !== '[-1]' && value != '403'){
    value = JSON.parse(value);
  }else{
    value = null;
  }
  return value;
}

/*异常日志*/
var getException = function(err){
  if(err && err.stack)
    return err.stack;
  else
    return err;
}

var GetValidCode = function(){
/*
  *加载股票列表
  */
 var loadAllStockCodes = function(callback){
   log.debug('加载股票列表开始');
   var task = {};
   var url = random.random(configs.url.allStockCodes);
  // log.debug(url);
   httpTool.request(url,function(error,res){
   // log.debug(typeof res);
    try{
      if(error == null){
        res = res.substring(0,res.length-1);
        res = JSON.parse(res);
         //log.debug(res);
        task.stocks = {};
         for(var i in res){
          var data = res[i];
          if(_.size(data) == 2){
            if(task.stocks[data[0]] == undefined){
              task.stocks[data[0]] = {};
              task.stocks[data[0]].code = data[0];
              task.stocks[data[0]].name = decodeURIComponent(data[1]);
                }
          }else{
           log.debug('wrong data.'+data);
             }
           }
         log.debug('加载股票列表结束');
         callback(null,task);
      }else{
        callback(error,task);
        }  
    }catch(exception){
        callback(getException(exception),task);
      }
   });
 }
 /*
   *股票代码转ID
   */
var stockCode2Id = function(task,callback){
//log.debug(JSON.stringify(task)); 
log.debug('股票代码转ID开始');
 task.allIDs={};
 task.allIDs.stockIds = {};
 var q = async.queue(function(item,cb){
//log.debug(q.length());
    var stockCode = item.stockCode;
    var url = random.random(configs.url.code2id).replace(/<SC>/g,stockCode);
    //log.debug(url);
    fetchData(url,function(error,res,code){
     if(res != null){
      //log.debug(code,res[0]);
      task.stocks[code].id = res[0];
      task.allIDs.stockIds[code] = res[0];
      task.allIDs[res[0]] = code;
      cb();
     }else{
      var err_msg = code+' converted failed,result: '+res;
      cb(err_msg);
     }
    }); 
  },50);
 q.drain = function(){
  log.debug('股票代码转ID结束');
  callback(null,task);
 };
 for(var i in task.stocks){
  log.debug(i);
  q.push({'stockCode':i},function(err){
    if(err){
      log.error(getException(err));
     }      
   });
  }
}
/*
  *股票所属板块
  */
var stocksBelongToBoards = function(task,callback){
   log.debug('抓去股票所属板块开始');
   task.boards = {};
   var q = async.queue(function(item,cb){
      var stockCode = item.stockCode;
      var url = random.random(configs.url.stockBelongBoard).replace(/CODE/g,stockCode);
      //log.debug(url);
      fetchData(url,function(err,res,code){
      //log.debug(res);
       if(res != null){
        for(var i in res){
         if(i.indexOf('HQ') == -1){
          var prefix = i.substring(0,1);
          var boardCode = 'BARDZ0'+i;
          var boardName = decodeURIComponent(res[i][0]);
          var boardList = task.stocks[code].boardList;
          if(boardList == undefined){
           boardList = {};
           boardList[prefix] = [];
           var temp = [];
           temp.push(boardCode);
           temp.push(boardName);
           boardList[prefix].push(temp);
           task.stocks[code].boardList = boardList;
          }else{
           var array = boardList[prefix];
           var temp = [];
           temp.push(boardCode);
           temp.push(boardName);
           if(array != undefined){
            for(var i in array){
             var tArray = array[i];
             if(tArray[0] != boardCode && i == (array.length-1)){
              array.push(temp);
             }else{
              break;
                 }
                }
           }else{
            array = [];
            array.push(temp);
            boardList[prefix] = array;
              }
            }
          task.boards[boardCode] = {};
          task.boards[boardCode].name = boardName;
          task.boards[boardCode].code = boardCode;
          if(boardCode.substring(6,7) == '1'){
           task.stocks[code].boardCode = boardCode;
             }
           }
          }
        cb();
       }else{
         cb(err);
         }
      });
   },50);
   q.drain = function(){
    log.debug('抓取股票所属板块结束');
    callback(null,task);
   };
   for(var i in task.stocks){
    q.push({'stockCode':i},function(err){
      if(err){
        log.error(getException(err));
       }
    });
   }
  }
  
  /*
    *板块CODE转ID
    */
 var boardCode2Id = function(task,callback){
   log.debug('板块CODE转ID开始');
   task.allIDs.boardIds={};
   var q = async.queue(function(item,cb){
    var boardCode = item.boardCode;
      var url = random.random(configs.url.code2id).replace(/<SC>/g,boardCode);
      log.debug(url);
      fetchData(url,function(err,res,code){
       if(res != null){
       log.debug(code,res[0]);
        task.allIDs.boardIds[code] = res[0];
        task.allIDs.boardIds[res[0]] = code;
        task.boards[code].id = res[0];
        cb();
       }else{
        var err_msg = code+' converted failed.';
        cb(err_msg);
          }
         });
   },50);
   q.drain = function(){
    log.debug('板块CODE转ID结束');
    results = task;
    callback(null,task);
   };
   for(var i in task.boards){
    q.push({'boardCode':i},function(err){
      if(err){
        log.error(getException(err));
      }
    });
   }
  }
  
/*
  *任务开始
  */
this.startMission = function(){
    async.waterfall([loadAllStockCodes,stockCode2Id,stocksBelongToBoards,boardCode2Id],function(err){
      if(err){
        log.error(getException(err));
      }else{
        try{
          results = JSON.stringify(results);
            //log.debug(results);
          initRedis.set('task',results,function(e,res){
            if(e == null){
             log.debug('有效key抓取结束');
            }else{
              log.error(getException(e));    
              }
            });
        }catch(exception){
          log.error(getException(exception));
          }
      }
    });
  }
}
exports.createGetValidCode = function(){
  return new GetValidCode();
}
var test = new GetValidCode();
test.startMission();


