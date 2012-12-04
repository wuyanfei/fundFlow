var http = require('./httpTool');
var configs = require('../etc/loadConfigure').configure;
var log = require('./web-log').log('/opt/node-pro/logs/stocksUnderBoard.log');
var async = require('async');
var _ = require('underscore');
var StocksUnderBoard = function() {
	this.loadCodeTable = function(task) {
		var boards = task.boards;
		http.fetchDataFromRedis('SC.STOCK', [ 1 ], 'map', null, function(data) {
			if (data != null) {
				var codeStr = data.body.code;
				getAllstocksUnderBoardCode(boards, codeStr);
			} else {
				log.error('获取码表失败');
			}
		});
	}

	var getDatas = function(key, cb, temp,codeStr) {
		var url = configs.url.stocksUnderBoard.replace(/<BC>/g, key);
		http.fetchData(url, function(data) {
			if (data) {
				var boardCode = key;
				temp[boardCode] = [];
				for ( var i in data) {
					var _temp = [];
					var tempCode = data[i].replace(/HQ/g, '');
					if (codeStr != null && codeStr != undefined) {
						if (codeStr.indexOf(tempCode) != -1) {
							_temp.push(tempCode);
							temp[boardCode].push(_temp);
						}
					}
				}
				cb();
			} else {
				cb('抓取板块下股票列表失败' + url);
			}
		});
	};
	var getAllstocksUnderBoardCode = function(boards, codeStr) {
		log.debug('抓取板块下股票列表开始');
		var temp = {};
		var q = async.queue(function(key, cb) {
			getDatas(key, cb, temp,codeStr);
		}, 100);
		q.drain = function(ee) {
			if (ee) {
				log.error(ee);
			} else {
				if (_.size(temp) > 0) {
					http.pushData('', 'list', temp, '01');
					log.debug('抓取板块下股票列表结束');
				}
			}
		};
		for ( var code in boards) {
			q.push(code, function() {
			});
		}
	}
}

exports.createStocksUnderBoard = function() {
	return new StocksUnderBoard();
}
