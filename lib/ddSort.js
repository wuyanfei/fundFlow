var http = require('./httpTool');
var async = require('async');
var fetch = require('./fetch');
var configs = require('../etc/loadConfigure').configure;
var log = require('./web-log').log('ddSort.log');
var _ = require('underscore');
process.setMaxListeners(0);
var sendType = '';
var DDSort = function() {
		this.calculateDDSort = function(cb, type) {
			sendType = type;
			var sendValue = ['list', []];
			async.waterfall([

			function(callback) {
				saveDDZSort(sendValue, callback);
			}, function(sendValue, callback) {
				saveDDXSort(sendValue, callback);
			}, function(sendValue, callback) {
				saveDDYSort(sendValue, callback);
			}], function() {
				cb({
					'data': sendValue,
					'sendType': sendType,
					'type': 'oneList'
				});
				log.debug('大单排行结束');
			});
		}
		var saveDDXSort = function(sendValue, cback) {
				var url = configs.url.ddx;
				var temp = [];
				var values = ['list', [
					['SORT.DDX.TOP100', temp]
				]];
				url = url +(parseInt(Math.random()*1000+1))+'';
				fetch.post(url, function(data) {
					if(data != null && data != '[-1]0' && data != '[-6]0') {
						try {
							// console.log(data);
							data = data.substring(0, data.length-1);
							data = JSON.parse(data);
							for(var i = 0; i < data.length; i++) {
								var item = data[i].toString();
								var val = item.split(',');
								val[2] = decodeURIComponent(val[2]);
								temp.push(val.join('|'));
							}
							// console.log(JSON.stringify(values));
							if(_.size(temp) > 0) {
								sendValue[1].push(['SORT.DDX.TOP100', temp]);
								// http.post(JSON.stringify(values),function(){});
								log.debug('DDX 抓取成功');
							}
							cback(null, sendValue);
						} catch(ex) {
							console.log(ex.stack);
							cback(null, sendValue);
						}
					} else {
						log.error('DDX 抓取失败');
						cback(null, sendValue);
					}
				});
			}

		var saveDDYSort = function(sendValue, cback) {
				var url = configs.url.ddy;
				var temp = [];
				var values = ['list', [
					['SORT.DDY.TOP100', temp]
				]];
				url = url +(parseInt(Math.random()*1000+1))+'';
				fetch.post(url, function(data) {
					if(data != null && data != '[-1]0' && data != '[-6]0') {
						try {
							data = data.substring(0, data.length-1);
							data = JSON.parse(data);
							for(var i = 0; i < data.length; i++) {
								var item = data[i].toString();
								var val = item.split(',');
								val[2] = decodeURIComponent(val[2]);
								temp.push(val.join('|'));
							}
							// console.log(JSON.stringify(values));
							if(_.size(temp) > 0) {
								// http.post(JSON.stringify(values),function(){});
								sendValue[1].push(['SORT.DDY.TOP100', temp]);
								log.debug('DDY抓取成功');
							}
							cback(null, sendValue);
						} catch(ex) {
							console.log(ex.stack);
							cback(null, sendValue);
						}
					} else {
						log.error('DDY 抓取失败');
						cback(null, sendValue);
					}
				});
			}

		var saveDDZSort = function(sendValue, cback) {
				var url = configs.url.ddz;
				var temp = [];
				var values = ['list', [
					['SORT.DDZ.TOP100', temp]
				]];
				url = url +(parseInt(Math.random()*1000+1))+'';
				fetch.post(url, function(data) {
					if(data != null && data != '[-1]0' && data != '[-6]0') {
						try {
							data = data.substring(0, data.length-1);
							data = JSON.parse(data);
							for(var i = 0; i < data.length; i++) {
								var item = data[i].toString();
								var val = item.split(',');
								val[2] = decodeURIComponent(val[2]);
								temp.push(val.join('|'));
							}
							// console.log(JSON.stringify(values));
							if(_.size(temp) > 0) {
								// http.post(JSON.stringify(values),function(){});
								sendValue[1].push(['SORT.DDZ.TOP100', temp]);
								log.debug('DDZ 抓取成功');
							}
							cback(null, sendValue);
						} catch(ex) {
							console.log(ex.stack);
							cback(null, sendValue);
						}
					} else {
						log.error('DDZ抓取失败');
						cback(null, sendValue);
					}
				});
			}
	}
exports.createDDSort = function() {
	return new DDSort();
}