var validKey = {'boardsReferStock': [],'rightOut': [], 'oneKeyStockSelection': [], 'opMeals': [], 'main': [],
'empty': [], 'board': []};
var task = {'allIDs': {'stockIds': {}, 'boardIds': {}},'validKey': validKey, 'stocks': {}, 'boards': {}};
var httpTool = require('./httpTool');
var async = require('async');
var configs = require('../etc/loadConfigure').configure;
var log = require('./web-log').log('/opt/node-pro/logs/validStockCode.log');
var initRedis = require('redis').createClient(configs.redis.split(':')[1],configs.redis.split(':')[0]);
var _ = require('underscore');
var random = require('./random');

var debug = function(value){
  log.debug(value);
}

var error = function(value){
  log.error(value);
}

/**catch Exception*/
process.on('uncaughtException', function(e){
  if(e && e.stack){
    error('ERROR:'+e.stack);
  }else{
    error('ERROR:'+e.toString());
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
      if(res != null && res != undefined && res != 403){
        res = checkSuffix(res);
        callback(null,res,item);
      }else{
        var error_msg = 'url='+url+', line:44,index.js';
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
var GetValidCode = function(){
  var init = function(callback){
    debug('init begin...');
    initRedis.get('task',function(e,r){
      if(!e){
        task = JSON.parse(r);
        callback(null,task);
      }else{
        callback(e,r);
      }
    });
  }
  /*
   * load all stockCodes
   **/
  var loadAllStockCodes = function(task,callback){
   debug('load all stockCodes start...');
   var url = random.random(configs.url.allStockCodes);
   httpTool.request(url,function(err,res){
    if(err == null){
      res = res.slice(-1);
      res = JSON.parse(res);
     for(var i in res){
      var data = res[i];
      if(_.size(data) == 2){
        if(task.stocks[data[0]] == undefined){
         task.stocks[data[0]] = {};
         task.stocks[data[0]].code = data[0];
         task.stocks[data[0]].name = decodeURIComponent(data[1]);
       }
      }else{
       debug('wrong data.'+data);
      }
     }
     debug('load all stockCodes end.');
     callback(null,task);
    }else{
      callback(err,task);
    }    
   });
  }

  /*
   * stockCode2id
   **/
  var stockCode2Id = function(task,callback){
   debug('stockCode2Id start...');
   var q = async.queue(function(item,cb){
     if(task.stocks[item].id == undefined){
      debug('stockCode:'+item+',stockID:'+task.stocks[item].id);
      var url = random.random(configs.url.code2id).replace(/<SC>/g,item);
      fetchData(url,function(err,res,code){
       if(err == null){
        task.stocks[code].id = res[0];
        task.allIDs.stockIds[code] = res[0];
        task.allIDs[res[0]] = code;
        cb();
       }else{
        var err_msg = code+' converted failed,result: '+res;
        error(err_msg);
        cb();
       }
      }); 
    }else{
      cb();
    }
   },100);
   q.drain = function(){
    debug('stockCode2Id end.');
    callback(null,task);
   };
   for(var i in task.stocks){
    q.push(i,function(err){
      if(err){
        if(err && err.stack){
          error(err.stack);
        }else{
          error(err);
        }
      }      
    });
   }
  }

  /*
   * stocks belong to boards
   **/
  var stocksBelongToBoards = function(task,callback){
   debug('stocks belong to boards start...');
   var q = async.queue(function(item,cb){
     if(task.stocks[item].boardList == undefined){
      var url = random.random(configs.url.stockBelongBoard).replace(/CODE/g,item);
      fetchData(url,function(err,res,code){
       if(err == null){
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
    }else{
      cb();
    }
   },100);
   q.drain = function(){
    debug('stocks belong to boards end.');
    callback(null,task);
   };
   for(var i in task.stocks){
    q.push(i,function(err){
      if(err){
        if(err && err.stack){
          //error(err.stack);
        }else{
          //error(err);
        }
      }
    });
   }
  }

  /*
   * boardCode2Id
   **/
  var boardCode2Id = function(task,callback){
   debug('boardCode2Id start...');
   var q = async.queue(function(item,cb){
     if(task.boards[item].id == undefined){
        //debug(item);
        if(item.length == 10){
          var url = random.random(configs.url.code2id).replace(/<SC>/g,item);
          fetchData(url,function(err,res,code){
           if(err == null){
           // debug(res);
            task.allIDs.boardIds[code] = res[0];
            task.allIDs.boardIds[res[0]] = code;
            task.boards[code].id = res[0];
            cb();
           }else{
            var err_msg = code+' converted failed.';
            cb(err_msg);
           }
          });
        }else{
          delete task.boards[item];
          cb();
        }
      }else{
        if(item.length != 10){
          delete task.boards[item];
        }
        cb();
      }
   },100);
   q.drain = function(){
    debug('boardCode2Id end.');
    callback(null,task);
   };
   for(var i in task.boards){
    q.push(i,function(err){
      if(err){
        error(JSON.stringify(err));
      }
    });
   }
  }

  this.startMission = function(){
    async.waterfall([init,loadAllStockCodes,stockCode2Id,stocksBelongToBoards,boardCode2Id],function(err){
      if(err){
        if(err && err.stack){
            error(err.stack);
          }else{
            error(err);
          }    
      }else{
       initRedis.set('task',JSON.stringify(task),function(err,res){
        if(err == null){
         debug(' task save OK.');
        }else{
          error(err);    
        }
       });
     }
    });
  }
}
var v = new GetValidCode();
v.startMission();
exports.createGetValidCode = function(){
  return new GetValidCode();
}
