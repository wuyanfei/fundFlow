var async = require('async');
var request = require('request');
var util = require('util');
var events = require('events').EventEmitter;
var configs = require('../etc/loadConfigure').configure;
var zlib = require('zlib');
var cp = require('child_process');
var proc = null;
if(proc == null) {
  proc = cp.fork('./fetch_proc.js');
}

var post = function(data) {
    var str = JSON.stringify(data);
    zlib.gzip(str, function(err, buff) {
      var option = {
        method: 'POST',
        url: configs.pushUrl,
        body: buff,
        headers: {
          'accept-encoding': 'gzip,deflate'
        },
        timeout: 20000,
        pool: {
          maxSockets: 2000
        }
      };
      request(option, function(e, r, body) {
        if(e) console.log(e);
      });
    });
  }

var Worker = function() {
    var self = this;
    proc.on('message', function(res) {
      // console.log(res.stocks);
      var msg = 'receive' + res.sendType;
      console.log(msg);
      self.emit(msg, res.sendType);
      var json_obj = {
        data: res.data,
        type: res.type,
        stocks: res.stocks || ''
      };
      // console.log(JSON.stringify(json_obj));
      if(res.error == undefined){
        post(json_obj);
      }      
    });
    this.q = async.queue(function(task, cb) {
      var type = task.type;
      switch(type) {
      case 1:
        proc.send({
          'type': 1,
          'data': task.task.stocks
        });
        // getStockInfo.setSelection(task.task.stocks);
        break;
      case 2:
        proc.send({
          'type': 2,
          'data': task.task.stocks
        });
        // getOpMeal.setOpMeal(task.task.stocks);
        break;
      case 3:
        proc.send({
          'type': 3,
          'data': task.task.stocks
        });
        // setSelectionModel.setSelectionModel(task.task.stocks);
        break;
      case 4:
        proc.send({
          'type': 4,
          'data': task.task
        });
        // getBoardInfo.setBoardsId(task.task);
        break;
      case 5:
        proc.send({
          'type': 5,
          'data': task.task
        });
        // boardSort.getBoardCodes(task.task);
        break;
      case 6:
        proc.send({
          'type': 6,
          'data': task.task
        });
        // mainCapital.getMainstockCodes(task.task);
        break;
      case 7:
        proc.send({
          'type': 7,
          'data': task.task
        });
        // stocksUnderBoard.loadCodeTable(task.task);
        break;
      case 8:
        proc.send({
          'type': 8,
          'data': task.task
        });
        // stocksUnderBoardSort.getNet(task.task);
        break;
      case 9:
        proc.send({
          'type': 9
        });
        // ddSort.calculateDDSort();
        break;
      case 10:
        proc.send({
          'type': 10
        });
        // growth.getGrowth();
        break;
      case 11:
        proc.send({
          'type': 11
        });
        // stpool.calculateSTPool();
        break;
      case 12:
        proc.send({
          'type': 12
        });
        // validCode.startMission();
        break;
      case 13:
        proc.send({
          'type': 13,
          'data': task.task
        });
        // salePoint.getSaleOfPoint(task.task);
        break;
      }
      cb();
    }, 50);
  }
util.inherits(Worker, events);

Worker.prototype.push = function(task) {
  this.q.push(task, function() {});
}

exports.createWorker = function() {
  return new Worker();
}