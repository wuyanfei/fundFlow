var http = require('./httpTool');
var dateFormat = require('./dateFormat');
var arraysForEach = require('./forEachSync');
var configs = require('../etc/loadConfigure').configure;
var log = require('./web-log').log('/opt/node-pro/logs/mainCapital.log');
var _ = require('underscore');
var jsonStocks;
var MainCapital = function() {
		this.getMainstockCodes = function(task) {
			var stocks = task.allIDs.stockIds
			jsonStocks = stocks;
			var stockCodes = [];
			for(var code in stocks) {
				stockCodes.push(code);
			}
			calculateMainCapital(stockCodes);
		}
		var calculateMainCapital = function(stockCodes) {
				try {
					var time = new Date();
					var url = configs.url.main;
					http.request(url, function(err, data) {
						if(err == null && data != '{}') {
							saveKLine(data);
							log.debug('主力/多空资金分时日K存储完毕');
						} else {
							log.error('wav3 fetch null.主力/多空资金saving failed.');
						}
					});
				} catch(e) {
					error(e);
				}
			}
		var getMinuteDataStr = function(array, type) {
				var time = array[0];
				var openTime = new Date(time.cut(0, 4) + '-' + time.cut(4, 6) + '-' + time.cut(6, 8));
				if(parseFloat(new Date().format('hhMM')) >= 1300) {
					openTime.setHours(13);
					openTime.setMinutes(00);
					openTime.setSeconds(0);
				} else {
					openTime.setHours(9);
					openTime.setMinutes(30);
					openTime.setSeconds(0);
				}
				var date = time.toDate();
				var diff = date.getTime() - openTime.getTime();
				var diffMinutes = parseInt(diff / 1000 / 60);
				var count = parseInt(diffMinutes / parseFloat(type));
				var flag = (parseFloat(diffMinutes / parseFloat(type)) + '').indexOf('.') > 0 ? true : false;
				minutes = flag ? (count + 1) * parseFloat(type) : 0;
				time = openTime.addMinutes(minutes).format('yyyyMMddhhMM');
				array[0] = time;
				return array.join('|');
			}
		var error = function(ex) {
				if(ex && ex.stack) return ex.stack;
				else return ex;
			}
			/*
			 * fenzhong k
			 */
		var saveMinuteKline = function(results, type) {
				var type = type || ['05', '15', '30', '60'];
				type.each(function(item) {
					var send_values = ['list', []];
					for(var i in results) {
						var temp = [];
						temp.push(i.append('.').append(type).'M');
						temp.push([getMinuteDataStr(results[i])]);
						send_values[1].push(temp);
					}
					http.pushData(send_values, function() {});
				});
			};
		var getDayDataStr = function(array) {
				array[0] = array[0].cut(0, 8);
				return array.join('|');
			};
		/*
		 * day k
		 */
		var saveDayKline = function(results) {
				var suffix = ['.DAY', '.WK', '.MTH', '.HY', '.FY', '.SY'];
				suffix.each(function(item) {
					var send_values = ['list', []];
					for(var i in results) {
						var temp = [];
						temp.push(i.append(item));
						temp.push([getDayDataStr(results[i])]);
						send_values[1].push(temp);
					}
					http.postData(send_values, function() {});
				});
			};
		var saveKLine = function(results) {
				saveMinuteKline(results);
				saveDayKline(results);
			};
		var getFullTime = function(ymd, hms) {
				if(hms.length == 5) {
					return ymd.append('0').append(hms);
				} else {
					return ymd.append(hms);
				}
			};
		var saveKLine = function(data) {
				try {
					var values = {};
					var sortValues = ['sort', []];
					data = JSON.parse(data);
					var prefix = ['KEMCF.MAIN.', 'MEMCF.MAIN.', 'KEMCF.EMPTY.', 'MEMCF.EMPTY.'];
					prefix.each(function(item) {
						for(var i in jsonStocks) {
							var field = i.replace(/HQ/g, '');
							var key = item + field;
							var sortKey = '';
							var temp = [i.replace(/HQ/g, '').cut(2), i.replace(/HQ/g, '').cut(0, 2)].join('.');
							var val = data[temp];
							if(val == undefined) continue;
							var ymdhms = getFullTime(val[2], val[3]);
							var emptyIn = 0;
							var emptyOut = 0;
							var netIn = 0;
							if(item.contains('EMPTY')) {
								emptyIn = parseFloat(val.slice(6, 7)) + parseFloat(val.slice(12, 13)) + parseFloat(val.slice(48, 49));
								emptyOut = parseFloat(val.slice(9, 10)) + parseFloat(val.slice(15, 16)) + parseFloat(val.slice(51, 52));
								sortKey = 'SORT.ECF';
								netIn = parseFloat(emptyIn) - parseFloat(emptyOut);
							} else {
								emptyIn = parseFloat(val.slice(6, 7)) + parseFloat(val.slice(12, 13));
								emptyOut = parseFloat(val.slice(9, 10)) + parseFloat(val.slice(15, 16));
								sortKey = 'SORT.MCF';
								netIn = parseFloat(emptyIn) - parseFloat(emptyOut);
							}
							sortValues[1].push([sortKey,[field,netIn]]);
							var pushValue = [ymdhms, emptyIn, emptyOut];
							values[stockCode] = pushValue;
						}
						if(item.contains('KEMCF')) {
							saveKLine(values);
						} else {
							saveMinuteKline(values, ['01']); //分时
						}
						http.pushData(sortValues,function({}));
					});
					log.debug('日K 分时 资金排行 存储结束');
				} catch(ex) {
					error(e);
				}
			}
	}

exports.createMainCapital = function() {
	return new MainCapital();
}