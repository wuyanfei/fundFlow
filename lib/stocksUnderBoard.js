var http = require('./httpTool');
var configs = require('../etc/loadConfigure').configure;
var log = require('./web-log').log('/opt/node-pro/logs/stocksUnderBoard.log');
var async = require('async');
var _ = require('underscore');
var StocksUnderBoard = function() {
		this.loadCodeTable = function(task) {
			var boards = task.boards;
			var send_object = {
				'type': 'list',
				'val': {
					'flag': 'key',
					'keys': ['SC.STOCK']
				}
			}; /**取码表里面的所有key*/
			http.pushData(send_object, function(data) {
				if(data != null) {
					var codeStr = data[0][1].join('|');
					getAllstocksUnderBoardCode(boards, codeStr);
				} else {
					log.error('获取码表失败');
				}
			});
		}

		var getDatas = function(key,codeStr,cb) {
				var url = configs.url.stocksUnderBoard.replace(/<BC>/g, key);
				http.fetchData(url, function(data) {
					if(data) {
						var temp = [];
						for(var i in data) {
							var tempCode = data[i].replace(/HQ/g, '');
							if(codeStr.contains(tempCode)) {
								temp.push(tempCode);
							}
						}
						cb(temp,key);
					} else {
						cb([],key);
					}
				});
			};
		var getAllstocksUnderBoardCode = function(boards, codeStr) {
				log.debug('抓取板块下股票列表开始');
				var send_object = ['list', []];
				var q = async.queue(function(key, cb) {
					getDatas(key, codeStr, function(res,code) {
						var temp = [];
						temp.push(code);
						temp.push(res);
						send_object[1].push(temp);
					});
				}, 100);
				q.drain = function(ee) {
					if(ee) {
						log.error(ee);
					} else {
						if(_.size(send_object[1]) > 0) {
							http.post(send_object,function(){});
							log.debug('抓取板块下股票列表结束');
						}
					}
				};
				for(var code in boards) {
					q.push(code, function() {});
				}
			}
	}

exports.createStocksUnderBoard = function() {
	return new StocksUnderBoard();
}