var http = require('./httpTool');
var async = require('async');
var configs = require('../etc/loadConfigure').configure;
var _random = require('./random');
var log = require('./web-log').log('/opt/node-pro/logs/ddSort.log');
var _ = require('underscore');
process.setMaxListeners(0);
var DDSort = function() {
		this.calculateDDSort = function() {
			async.waterfall([

			function(callback) {
				saveDDZSort(callback);
			}, function(callback) {
				saveDDXSort(callback);
			}, function(callback) {
				saveDDYSort(callback);
			}], function() {
				log.debug('大单排行结束');
			});
		}
		var saveDDXSort = function(cback) {
				var url = configs.url.ddx;
				url = _random.random(url);
				var temp = [];
				var values = ['list', [
					['SORT.DDX.TOP100', temp]
				]];
				http.fetchData(url, function(data) {
					if(data != null) {
						for(var i in data) {
							var item = data[i].toString();
							var val = item.split(',');
							val[2] = decodeURIComponent(val[2]);
							temp.push(val.join('|'));
						}
						if(_.size(temp) > 0) {
							http.pushData(values,function(){});
							log.debug('DDX 抓取成功');
						}
						cback(null);
					} else {
						log.error('DDX 抓取失败');
						cback(null);
					}
				});
			}

		var saveDDYSort = function(cback) {
				var url = configs.url.ddy;
				url = _random.random(url);
				var temp = [];
				var values = ['list', [
					['SORT.DDY.TOP100', temp]
				]];
				http.fetchData(url, function(data) {
					if(data != null) {
						for(var i in data) {
							var item = data[i].toString();
							var val = item.split(',');
							val[2] = decodeURIComponent(val[2]);
							temp.push(val.join('|'));
						}
						if(_.size(temp) > 0) {
							http.pushData(values,function(){});
							log.debug('DDY抓取成功');
						}
						cback(null);
					} else {
						log.error('DDY 抓取失败');
						cback(null);
					}
				});
			}

		var saveDDZSort = function(cback) {
				var url = configs.url.ddz;
				url = _random.random(url);
				var temp = [];
				var values = ['list', [
					['SORT.DDZ.TOP100', temp]
				]];
				http.fetchData(url, function(data) {
					if(data != null) {
						for(var i in data) {
							var item = data[i].toString();
							var val = item.split(',');
							val[2] = decodeURIComponent(val[2]);
							temp.push(val.join('|'));
						}
						if(_.size(temp) > 0) {
							http.pushData(values,function(){});
							log.debug('DDZ 抓取成功');
						}
						cback(null);
					} else {
						log.error('DDZ抓取失败');
						cback(null);
					}
				});
			}
	}
exports.createDDSort = function() {
	return new DDSort();
}