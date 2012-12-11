var http = require('./httpTool');
var configs = require('../etc/loadConfigure').configure;
var async = require('async');
var log = require('./web-log').log('/opt/node-pro/logs/opMeal.log'); /**赋值策略选股*/
var OpMeal = function() {
		this.setOpMeal = function(stocks) {
			log.info('抓取策略选股开始。');
			var temp = [];
			for(var i in stocks) {
				temp.push(i);
			}
			async.forEach(temp, function(code, cb) {
				var url = configs.url.opMeal;
				url = url.replace(/<SC>/g, code);
				http.fetchData(url, function(data, orignalCode) {
					try {
						var stockCode = orignalCode.replace(/HQ/g, '');
						if(data) {
							var val = data['riskRating'];
							var value;
							if(val != undefined) {
								val = val['zlzc'];
								if(val != undefined) {
									//阻力支撑1
									stocks[orignalCode].dragBrace1 = val[0];
									//阻力支撑2
									stocks[orignalCode].dragBrace2 = val[1];
									//阻力支撑3
									stocks[orignalCode].dragBrace3 = val[2];
									//现价
									stocks[orignalCode].dbPrice = val[3];
									//控盘力度
									stocks[orignalCode].cyw = data['qyLeiDa']['mainRatio'];
									//大盘风险
									stocks[orignalCode].grailRisk = data['vspace']['risk'][0];
									//行业风险
									stocks[orignalCode].industrialRisk = data['vspace']['risk'][1];
									//个股风险
									stocks[orignalCode].stocksRisk = data['vspace']['risk'][2];
								}
							}
							cb();
						} else {
							cb();
						}
					} catch(e) {
						cb();
						log.error(e + url);
					}
				}, code);
			}, function() {
				//指数策略选股
				var codes = configs.url.indexCode.split(',');
				var url = configs.url.opMeal;
				async.forEach(codes, function(item, ccb) {
					url = url.replace(/<SC>/g, item);
					http.fetchData(url, function(data, orignalCode) {
						try {
							if(data) {
								var val = data['riskRating'];
								var value;
								if(val != undefined) {
									val = val['zlzc'];
									if(val != undefined) {
										//阻力支撑1
										stocks[orignalCode].dragBrace1 = val[0];
										//阻力支撑2
										stocks[orignalCode].dragBrace2 = val[1];
										//阻力支撑3
										stocks[orignalCode].dragBrace3 = val[2];
										//现价
										stocks[orignalCode].dbPrice = val[3];
										//控盘力度
										stocks[orignalCode].cyw = data['qyLeiDa']['mainRatio'];
										//大盘风险
										stocks[orignalCode].grailRisk = data['vspace']['risk'][0];
										//行业风险
										stocks[orignalCode].industrialRisk = data['vspace']['risk'][1];
										//个股风险
										stocks[orignalCode].stocksRisk = data['vspace']['risk'][2];
									}
								}
								ccb();
							} else {
								ccb();
							}
						} catch(e) {
							log.error('指数策略选股：' + e);
							ccb();
						}
					}, item);
				}, function() {
					var values = ['string', []];
					for(var i in stocks) {
						try {
							var code = i.replace(/HQ/g, '');
							var stockInfo = stocks[i];
							var temp = [];
							var key = 'OPMEAL.' + code;
							var date = new Date().format('yyyyMMdd');
							var value = date + '|' + stockInfo.dragBrace1 + '|' + stockInfo.dragBrace2 + '|' + stockInfo.dragBrace3 + '|' + stockInfo.dbPrice + '|' + stockInfo.cyw + '|' + stockInfo.grailRisk + '|' + stockInfo.industrialRisk + '|' + stockInfo.stocksRisk;
							temp.push(key);
							temp.push([value]);
							values[1].push(temp);
						} catch(e) {
							log.error(e + 'line:107,getOpMeal.js');
						}
					}
					http.pushData(values, function() {});
					log.info('策略选股结束');
				});
			});
		}
	}

exports.createOpMeal = function() {
	return new OpMeal();
}