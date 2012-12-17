var http = require('./httpTool');
var configs = require('../etc/loadConfigure').configure;
var async = require('async');
var log = require('./web-log').log('opMeal.log'); /**赋值策略选股*/
var OpMeal = function() {

		var getStockOpMeal = function(url, stocks, orignalCode, cb) {
				http.fetchData(url, function(data) {
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
								//console.log(stocks[orignalCode],orignalCode);
							}
							cb();
						} else {
							cb();
						}
					} catch(e) {
						cb();
						log.error(e + url);
					}
				});
			};

		var getIndexOpMeal = function(url, stocks, orignalCode, ccb) {
				http.fetchData(url, function(data) {
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
								// console.log(stocks[orignalCode], orignalCode);
							}
							ccb();
						} else {
							ccb();
						}
					} catch(e) {
						log.error('指数策略选股：' + e);
						ccb();
					}
				});
			};

		var post = function(stocks) {
				var values = ['string', []];
				//console.log(stocks);
				for(var i in stocks) {
					try {
						var code = i.replace(/HQ/g, '');
						var stockInfo = stocks[i];
						var temp = [];
						var key = 'OPMEAL.' + code;
						var date = new Date().format('yyyyMMdd');
						var value = date + '|' + stockInfo.dragBrace1 || 0 + '|' + stockInfo.dragBrace2 || 0 + '|' + stockInfo.dragBrace3 || 0 + '|' + stockInfo.dbPrice || 0 + '|' + stockInfo.cyw || 0 + '|' + stockInfo.grailRisk || 0 + '|' + stockInfo.industrialRisk || 0 + '|' + stockInfo.stocksRisk || 0;
						temp.push(key);
						temp.push([value]);
						values[1].push(temp);
						//console.log(values[1]);
					} catch(e) {
						log.error(e + 'line:107,getOpMeal.js');
					}
				}
				// console.log(JSON.stringify(values));
				http.post(JSON.stringify(values), function() {});
				log.info('策略选股结束');
			};

		this.setOpMeal = function(stocks) {
			log.info('抓取策略选股开始。');
			var temp = [];
			for(var i in stocks) {
				temp.push(i);
			}
			async.forEach(temp, function(code, cb) {
				var url = configs.url.opMeal;
				url = url.replace(/<SC>/g, code);
				getStockOpMeal(url, stocks, code, cb);
			}, function() {
				//指数策略选股
				var codes = configs.url.indexCode.split(',');
				var url = configs.url.opMeal;
				async.forEach(codes, function(item, ccb) {
					url = url.replace(/<SC>/g, item);
					getIndexOpMeal(url, stocks, item, ccb);
				}, function() {
					post(stocks);
				});
			});
		}
	}

exports.createOpMeal = function() {
	return new OpMeal();
}