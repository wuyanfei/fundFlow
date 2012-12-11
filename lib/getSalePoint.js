var http = require('./httpTool');
var configs = require('../etc/loadConfigure').configure;
var log = require('./web-log').log('/opt/node-pro/logs/salePoint.log');
var BoardInfo = require('./boardInfo').BoardInfo;
var async = require('async');
var task;
var _ = require('underscore');

var SalePointUnit = function() {
    this.binaryNum = '';
    this.type = '';
    this.time = '';
  }
SalePointUnit.prototype.toString = function() {
  return this.time + '|' + this.binaryNum + '|' + this.type;
}
var SalePoint = function() {
    /*
     * saleOfPoint
     **/
    this.getSaleOfPoint = function(task) {
      log.debug('抓取买卖点开始');
      var stockCodes = [];
      var stocks = task.stocks;
      for(var code in stocks) {
        stockCodes.push(code);
      }
      calculateSaleOfPoint(stockCodes, task);
    }
    var calculateSaleOfPoint = function(stockCodes, task) {
        var url = configs.url.saleOfPoint;
        http.request(url, function(err, data) {
          if(err == null) {
            saveSaleOfPoint(data, task);
          } else {
            log.error('抓取买卖点失败');
          }
        });
      }

    var saveSaleOfPoint = function(data, task) {
        try {
          var salePoint;
          data = JSON.parse(data);
          var values = ['list', []];
          var jsonStocks = task.stocks;
          //console.log(jsonStocks);
          for(var i in jsonStocks) {
            var tmp = i.replace(/HQ/g, '');
            var key = tmp.slice(2, tmp.length) + '.' + tmp.slice(0, 2);
            var val = data[key]
            if(val !== undefined) {
              var date = val[2];
              var saleOfPoint = ("00000" + val[5].toString(2)).slice(-5);
              var prefix = saleOfPoint.slice(0, 3);
              var suffix = saleOfPoint.slice(-1);
              // console.log('suffix='+suffix);
              if(suffix === 1) {
                if(parseInt(prefix) === 0) {
                  salePoint = new SalePointUnit();
                  salePoint.binaryNum = saleOfPoint;
                  salePoint.type = '2';
                  salePoint.time = date;
                } else if(parseInt(prefix) > 0) {
                  salePoint = new SalePointUnit();
                  salePoint.binaryNum = saleOfPoint;
                  salePoint.type = '1';
                  salePoint.time = date;
                }
              } else {
                salePoint = new SalePointUnit();
                salePoint.binaryNum = saleOfPoint;
                salePoint.type = '0';
                salePoint.time = date;
              }
              var _tmp = [],
              var pushValue = salePoint.toString();
              _tmp.push(key);
              _tmp.push([pushValue]);
              values[1].push(_tmp);
            }
          }
          http.post(values, function() {});
          log.debug('抓取买卖点结束');
          //  console.log(JSON.stringify(values));
        } catch(exception) {
          console.log(exception);
          log.error('抓取买卖点失败');
          log.error(exception);
        }
      }
  }

exports.createSalePoint = function() {
  return new SalePoint();
}