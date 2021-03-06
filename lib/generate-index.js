var fs = require('fs');
var http = require('./httpTool');
var async = require('async');
var dateFormat = require('./dateFormat');
var worker = require('./worker').createWorker();
var log = require('./web-log').log('generate.log');
var configs = require('../etc/loadConfigure').configure;
fs.writeFileSync(__dirname + '/generate.pid', process.pid.toString(), 'ascii');
//捕获系统异常
process.on('uncaughtException', function(e) {
  if(e && e.stack) {
    console.error('uncaughtException:', e.stack);
  } else {
    console.error('uncaughtException:', e);
  }
}); /*初始化*/
var init = function() {
    log.info('初始化开始');
    var _redis = configs.redis.split(':');
    var redis = require('redis').createClient(_redis[1], _redis[0]);
    redis.get('task', function(err, res) {
      if(err) {
        log.error('初始化失败' + err);
        console.error('初始化失败' + err);
      } else {
        try {
          var task = JSON.parse(res);
          // getSalePoint(task);
          ddSort(task);
          // boardSort(task);          
          // mainCapital(task);
        } catch(e) {
          log.error('JSON.parse(task)时出错。' + e);
          console.log('JSON.parse(task)时出错。' + e);
        }
      }
    });
  }

  // /*清空选股模型*/
  // var emptySelectModel = function(task){
  //   var date = parseFloat(new Date().format('HHmm'));
  //   if(date < 930){
  //     http.pushData('SELECT-MAP','map',{},'01');
  //     log.debug('清空选股模型');
  //   }
  //   getSalePoint(task);
  // }
  // /*存储所有板块 一天一次*/
  // var saveBDALL = function(task){
  //     log.debug('存储所有板块');
  //     var send_object = {'type':'list','val':{'keys':['BD.ALL']}};
  //     http.post(send_object,function(data){});
  //     getSalePoint(task);
  // }
  /*买卖点一个小时一次*/
  // var getSalePoint = function(task) {
  //     var _task = {
  //       'type': 13,
  //       'task': task
  //     };
  //     worker.push(_task);
  //     setInterval(function() {
  //       worker.push(_task);
  //     }, 60000 * 60);
  //     // getValidKey(task);
  //     ddSort(task);
  //   }
  //   /*有效key处理*/
  // var getValidKey = function(task) {
  //     var _task = {
  //       'type': 12
  //     };
  //     worker.push(_task);
  //     //setInterval(function(){
  //     worker.push(_task);
  //     //},60000*120);
  //     ddSort(task);
  //   }
  /*大单排行 5分钟一次*/
var ddSort = function(task) {
  var interval = 300000;
    var _task = {
      'type': 9
    };
    var now_time = new Date();
    worker.push(_task);
    worker.on('receive9', function(obj) {
      var after_time = new Date();
      var diff = parseInt((after_time.getTime() - now_time.getTime()) / 1000);
      diff = interval - diff;
      if(diff < 0) {
        worker.push(_task);
      } else {
        setTimeout(function() {
          worker.push(_task);
        }, diff);
      }
    });
    growth(task);
  } /*成长性排行 5分钟一次*/
var growth = function(task) {
  var interval = 300000;
    var _task = {
      'type': 10
    };
    var now_time = new Date();
    worker.push(_task);
    worker.on('receive10', function(obj) {
      var after_time = new Date();
      var diff = parseInt((after_time.getTime() - now_time.getTime()) / 1000);
      diff = interval - diff;
      if(diff < 0) {
        worker.push(_task);
      } else {
        setTimeout(function() {
          worker.push(_task);
        }, diff);
      }
    });
    stpool(task);
  } /*股票池数据 5分钟一次*/
var stpool = function(task) {
  var interval = 300000;
    var _task = {
      'type': 11
    };
    var now_time = new Date();
    worker.push(_task);
    worker.on('receive11', function(obj) {
      var after_time = new Date();
      var diff = parseInt((after_time.getTime() - now_time.getTime()) / 1000);
      diff = interval - diff;
      if(diff < 0) {
        worker.push(_task);
      } else {
        setTimeout(function() {
          worker.push(_task);
        }, diff);
      }
    });
    // getStockInfo(task);
    boardSort(task);
  }
  //   /*存储动态行情 一分钟执行一次*/
  // var getStockInfo = function(task) {
  //     // log.debug('存储动态行情');
  //     var _task = {
  //       'type': 1,
  //       'task': task
  //     };
  //     worker.push(_task);
  //     setInterval(function() {
  //       worker.push(_task);
  //     }, 60000);
  //     setOpMeal(task);
  //   }
  /*存储策略选股 一天执行一次*/
  // var setOpMeal = function(task) {
  //     log.debug('存储策略选股');
  //     var _task = {
  //       'type': 2,
  //       'task': task
  //     };
  //     worker.push(_task);
  //     //selectionModel(task);
  //     //getBoardInfo(task);
  //     mainCapital(task);
  //   }
  //   /*选股模型 100秒执行一次*/
  // var selectionModel = function(task) {
  //     log.debug('存储选股模型');
  //     var _task = {
  //       'type': 3,
  //       'task': task
  //     };
  //     worker.push(_task);
  //     setInterval(function() {
  //       worker.push(_task);
  //     }, 100000);
  //     getBoardInfo(task);
  //   }
  //   /*存储板块行情 一分钟一次*/
  // var getBoardInfo = function(task) {
  //     log.debug('存储板块行情');
  //     var _task = {
  //       'type': 4,
  //       'task': task
  //     };
  //     worker.push(_task);
  //     setInterval(function() {
  //       worker.push(_task);
  //     }, 60000);
  //     boardSort(task);
  //   }
  /*板块资金排行 一分钟一次*/
var boardSort = function(task) {
    var interval = 55000;
    log.debug('存储板块资金排行');
    var _task = {
      'type': 5,
      'task': task
    };
    var now_time = new Date();
    worker.push(_task);
    worker.on('receive5', function(obj) {
      var after_time = new Date();
      var diff = parseInt((after_time.getTime() - now_time.getTime()) / 1000);
      diff = interval - diff;
      if(diff < 0) {
        worker.push(_task);
      } else {
        setTimeout(function() {
          worker.push(_task);
        }, diff);
      }
    });
    mainCapital(task);
  }

  /*主力资金排行 分时 日K 一分钟一次*/
var mainCapital = function(task) {
    var interval = 50000;
    log.debug('存储主力资金排行');
    console.log('存储主力资金排行');
    var _task = {
      'type': 6,
      'task': task
    };
    var now_time = new Date();
    worker.push(_task);
    worker.on('receive6', function(obj) {
      var after_time = new Date();
      var diff = parseInt((after_time.getTime() - now_time.getTime()) / 1000);
      diff = interval - diff;
      if(diff < 0) {
        worker.push(_task);
      } else {
        setTimeout(function() {
          worker.push(_task);
        }, diff);
      }
    });
    // setInterval(function() {
    //   worker.push(_task);
    // }, 10000);
    // stocksUnderBoard(task);
  }

  //   /*板块下股票列表 一天一次*/
  // var stocksUnderBoard = function(task) {
  //     log.debug('存储板块下股票列表');
  //     var _task = {
  //       'type': 7,
  //       'task': task
  //     };
  //     worker.push(_task);
  //     stocksUnderBoardSort(task);
  //   }
  // var getDatas = function(key, cb, temp) {
  //     try {
  //       var url = configs.url.stocksUnderBoard.replace(/<BC>/g, key);
  //       http.post(url, function(data) {
  //         if(data) {
  //           var boardCode = key;
  //           temp[boardCode] = [];
  //           for(var i = 0; i < data.length; i++) {
  //             var _temp = [];
  //             var vv = data[i];
  //             _temp.push(vv.replace(/HQ/g, ''));
  //             temp[boardCode].push(_temp);
  //           }
  //           cb();
  //         } else {
  //           cb('板块下股票列表抓取失败' + url);
  //         }
  //       },1);
  //     } catch(e) {
  //       cb(e);
  //     }
  //   }; 
  // /*板块下股票列表 资金净流入排行*/
  // var stocksUnderBoardSort = function(task) {
  //     var boards = task.boards;
  //     var temp = {};
  //     var q = async.queue(function(key, cb) {
  //       getDatas(key, cb, temp);
  //     }, 10);
  //     q.drain = function(ex) {
  //       if(ex) {
  //         log.error(ex);
  //       } else {
  //         var _task = {
  //           'type': 8,
  //           'task': temp
  //         };
  //         log.debug('存储板块下股票资金净流入排行');
  //         worker.push(_task);
  //         setInterval(function() {
  //           worker.push(_task);
  //         }, 60000);
  //       }
  //     };
  //     for(var code in boards) {
  //       q.push(code, function() {});
  //     }
  //   }
  init();