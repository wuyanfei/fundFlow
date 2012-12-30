var http = require('./httpTool');
var _ = require('underscore');
var fetch = require('./fetch');
var configs = require('../etc/loadConfigure').configure;
var log = require('./web-log').log('stpool.log');
var sendType = '';
var Stpool = function() {
		this.calculateSTPool = function(cb, type) {
			sendType = type;
			var url = configs.url.stpool
			fetch.post(url, function(data) {
				try {
					if(data != null && data != '[-1]0' && data != '[-6]0') {
						data = JSON.parse(data);
						if(_.size(data) == 0) {
							log.error('股票池数抓取失败,返回个数为0');
						} else {
							saveSTPool(data, cb);
						}
					}else{
						cb({'sendType':sendType,'error':'err'});
					}
				} catch(ex) {
					console.log(ex.stack);
					cb({'sendType':sendType,'error':'err'});
				}
			});
		}
		var compute = function(val, stockCode, temp) {
				var codeVal, binaryNum;
				binaryNum = ('00000' + val.toString(2));
				binaryNum = binaryNum.substring(binaryNum.length - 5);
				var suffix = binaryNum.substring(binaryNum.length - 1);
				var preffix = binaryNum.substring(0, 3);
				if(suffix === '1') {
					if(parseInt(preffix) > 0) {
						temp.push([stockCode, 0]);
					} else {
						temp.push([stockCode, 1]);
					}
				}
			};
		/*
		 *STPOOL.ZD＝短线－>波段仓位 STPOOL.ZC=中线 STPOOL.CL＝长线
		 */
		var saveSTPool = function(data, cb) {
				var send_value = ['list', []];
				var prefix = ['STPOOL.ZD', 'STPOOL.ZC', 'STPOOL.CL']
				prefix.each(function(item) {
					var temp = [];
					for(var i in data) {
						if(i.indexOf('BARDZ') == -1) {
							try {
								var val = data[i];
								var stockCode = i.substring(i.length - 2) + i.substring(0, 6);
								if(item.indexOf('ZD') != -1) {
									val = val[5];
								} else if(item.indexOf('ZC') != -1) {
									val = val[6];
								} else if(item.indexOf('CL') != -1) {
									val = val[7];
								}
								compute(val, stockCode, temp);
							} catch(ex) {
								log.error(ex + 'stpool.js line:66');
							}
						}
					}
					var array = [];
					array.push(item);
					array.push(temp);
					send_value[1].push(array);
					// http.post(JSON.stringify(send_value), function() {});
				});
				cb({
					'data': send_value,
					'type': 'oneList',
					'sendType': sendType
				});
				//http.post(JSON.stringify(send_value), function() {});
				log.debug('股票池存储结束');
			}
	}
exports.createStpool = function() {
	return new Stpool();
}