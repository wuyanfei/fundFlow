var http = require('./httpTool');
var request = require('request');
var configs = require('../etc/loadConfigure').configure;
// var log = require('./web-log').log('mainCapital.log');
var _ = require('underscore');
var jsonStocks;
var requestData = function(url, cb) {
		var _timeout = 20000;
		request.get({
			'uri': url,
			'timeout': _timeout
		}, function(error, res, body) {
			if(error) {
				cb(null);
			} else if(body) {
				cb(body);
			}
		});
	}
var sendType = '';
var MainCapital = function() {
		this.getMainstockCodes = function(task,callback,type) {
			sendType = type;
			var stocks = task.allIDs.stockIds
			jsonStocks = stocks;
			var stockCodes = [];
			for(var code in stocks) {
				stockCodes.push(code);
			}
			calculateMainCapital(stockCodes,callback);
		}
		var calculateMainCapital = function(stockCodes,callback) {
				try {
					var time = new Date();
					var url = configs.url.main;
					requestData(url, function(data) {
						if(data != null && data != '{}') {
							var json_obj = {
								'data': JSON.parse(data),
								'stocks': jsonStocks,
								'type': 'kline',
								'sendType':sendType
							};							
							callback(json_obj);
							log.debug('发送主力/多空资金分时日K成功');
							// http.post(json_obj, function() {
							// 	log.debug('主力/多空资金分时日K存储完毕');
							// });
						} else {
							log.error('wav3 fetch null.主力/多空资金saving failed.data=' + data);
						}
					});
				} catch(e) {
					console.log(e.stack);
				}
			}
	}

exports.createMainCapital = function() {
	return new MainCapital();
}
var log = {
	debug: function(msg) {
		console.log(msg);
	},
	error: function(msg) {
		console.log(msg);
	}
}