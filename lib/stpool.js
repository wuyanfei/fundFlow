var http = require('./httpTool');
var _ = require('underscore');
var configs = require('../etc/loadConfigure').configure;
var log = require('./web-log').log('stpool.log');
var Stpool = function() {
		this.calculateSTPool = function() {
			var url = configs.url.stpool
			http.request(url, function(err, data) {
				console.log(data);
				if(err) {
					log.error('股票池数抓取失败');
				} else {
					data = JSON.parse(data);
					if(_.size(data) == 0) {
						log.error('股票池数抓取失败,返回个数为0');
					} else {
						saveSTPool(data);
					}
				}
			});
		}
		var compute = function(val, stockCode,temp) {
				var codeVal, binaryNum;
				binaryNum = ('00000' + val.toString(2)).cut(-5);
				var suffix = binaryNum.cut(-1);
				var preffix = binaryNum.cut(0, 3);
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
		var saveSTPool = function(data) {
				var send_value = ['list', []];				
				var prefix = ['STPOOL.ZD', 'STPOOL.ZC', 'STPOOL.CL']
				prefix.each(function(item) {
					var temp = [];
					for(var i in data) {
						if(i.indexOf('BARDZ') == -1) {
							try {
								var val = data[i];
								var stockCode = i.cut(-2) + i.cut(0, 6);
								if(item.contains('ZD')){
									val = val[5];
								}else if(item.contains('ZC')){
									val = val[6];
								}else if(item.contains('CL')){
									val = val[7];
								}
								compute(val,stockCode,temp);
							} catch(ex) {
								log.error(ex + 'stpool.js line:66');
							}
						}
					}
					var array = [];
					array.push(item);
					array.push(temp);
					send_value[1].push(array);
					http.post(send_value,function(){});
				});
				http.post(JSON.stringify(send_value), function() {});
				log.debug('股票池存储结束');
			}
	}
exports.createStpool = function() {
	return new Stpool();
}