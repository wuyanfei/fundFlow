var http = require('./httpTool');
var dateFormat = require('./dateFormat');
var arraysForEach = require('./forEachSync');
var configs = require('../etc/loadConfigure').configure;
var log = require('./web-log').log('mainCapital.log');
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
						//console.log(data);
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
				// console.log(diffMinutes,type);
				var count = parseInt(diffMinutes / parseFloat(type));
				var flag = (parseFloat(diffMinutes / parseFloat(type)) + '').indexOf('.') > 0 ? true : false;
				minutes = flag ? (count + 1) * parseFloat(type) : count * parseFloat(type);
				time = openTime.addMinutes(minutes).format('yyyyMMddhhMM');
				// console.log(minutes);
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
				console.log(type);
				type.each(function(item) {
					var send_values = ['list', []];
					for(var i in results) {
						if(!_.isArray(results[i])) continue;
						var temp = [];
						temp.push(i.append('.').append(item).append('M'));
						temp.push([getMinuteDataStr(results[i],item)]);
						send_values[1].push(temp);
					}
					console.log(JSON.stringify(send_values));
					http.post(JSON.stringify(send_values), function() {});
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
						if(!_.isArray(results[i])) continue;
						var temp = [];
						temp.push(i.append(item));
						temp.push([getDayDataStr(results[i])]);
						// console.log(temp);
						send_values[1].push(temp);
					}
					 // console.log(JSON.stringify(send_values));
					http.post(JSON.stringify(send_values), function() {});
				});
			};
		var saveList = function(results) {
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
					var sortValues = ['sort', []];
					data = JSON.parse(data);
					var prefix = ['KEMCF.MAIN.', 'MEMCF.MAIN.', 'KEMCF.EMPTY.', 'MEMCF.EMPTY.'];
					var flgMCF = false;
					var flgECF = false;
					for(var j = 0; j < prefix.length; j++) {
						var values = {};
						item = prefix[j];
						var array_temp = [];
						var sortKey = '';
						for(var i in jsonStocks) {
							try {
								if(i.length != 10) continue;
								var field = i.replace(/HQ/g, '');
								var key = item + field;
								var temp = [i.replace(/HQ/g, '').cut(2), i.replace(/HQ/g, '').cut(0, 2)].join('.');
								var val = data[temp];
								//console.log(temp,val);
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
								array_temp.push([netIn, field]);
								var pushValue = [ymdhms, emptyIn, emptyOut,emptyIn, emptyOut];
								values[key] = pushValue;
							} catch(ex) {
								console.log(ex.stack);
							}
						}
						if(!flgMCF && sortKey == 'SORT.MCF') {
							sortValues[1].push([sortKey, array_temp]);
							flgMCF = true;
						}
						if(!flgECF && sortKey == 'SORT.ECF') {
							sortValues[1].push([sortKey, array_temp]);
							flgECF = true;
						}
						// console.log(values);
						if(item.contains('KEMCF')) {
							console.log(333333);
							saveList(values);
						} else {
							saveMinuteKline(values, ['01']); //分时
						}
					}
					// console.log(sortValues);
					http.post(JSON.stringify(sortValues), function() {});
					log.debug('日K 分时 资金排行 存储结束');
				} catch(ex) {
					error(ex);
				}
			}
	}

exports.createMainCapital = function() {
	return new MainCapital();
}