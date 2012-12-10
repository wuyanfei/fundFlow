var http = require('./httpTool');
var configs = require('../etc/loadConfigure').configure;
var log = require('./web-log').log('/opt/node-pro/logs/getBoardInfo.log');
var _random = require('./random');
var _ = require('underscore');
var async = require('async');
var newPrices = [];
process.setMaxListeners(0);
var tempTask;
var GetBoardInfo = function() {
		/*
		 *克隆对象
		 */
		var clone = function(object) {
				if(typeof object != 'object') {
					return object;
				}
				if(object == null || object == undefined) {
					return object;
				}
				var newObject = new Object();
				for(var i in object) {
					newObject[i] = clone(object[i]);
				}
				return newObject;
			}; /**取板块ID*/
		this.setBoardsId = function(task) {
			tempTask = task;
			var boards = task.boards;
			var boardIds = task.allIDs.boardIds;
			for(var i in boards) {
				if(boardIds[i] != undefined) {
					boards[i].id = boardIds[i];
				}
			}
			setMarketRatio(boards);
		}
		/*
		 *板块市场比
		 */
		var setMarketRatio = function(boards) {
				log.debug('抓取市场比开始');
				try {
					var url = configs.url.marketRatio;
					http.fetchData(url, function(data) {
						if(data) {
							async.forEach(data, function(item, cb) {
								var code = item[0].toString();
								var rate = item[1];
								boards[code].marketRate = rate;
								cb();
							}, function() {
								log.debug('抓取市场比结束');
								setUpstocks(boards);
							});
						} else {
							log.error('抓取市场比出错' + url);
							process.nextTick(function() { //重新抓
								setMarketRatio(boards);
							});
						}
					});
				} catch(exx) {
					log.error(exx);
				}
			}
		var setUpstocks = function(boards) {
				log.info('抓取领涨股开始');
				var stocks = tempTask.stocks;
				var stockCodes = [];
				var boardCodes = [];
				for(var i in stocks) {
					stockCodes.push(i.replace(/HQ/g, ''));
				}
				for(var i in boards) {
					if(i.indexOf('BARDZ0') != -1 && i.length＝＝10) {
						boardCodes.push(i);
					}
				}
				var send_object = null;
				async.waterfall([

				function(callback) {
					stockCodes = _.map(stockCodes,function(code){return 'SDC.'+code;});
					send_object = {
						'type': 'string',
						'val': {
							'keys': stockCodes,
							'index': [13,11]
						}
					};
					http.fetchData(send_object,function(res){
						if(res){
							var values = JSON.parse(res);
							callback(null, values);
						}else{
							callback('SDC获取失败', values);
						}
					});
				}, function(values, callback) {
					send_object = {
						'type': 'list',
						'val': {
							'keys': boardCodes,
							'index': [0]
						}
					};
					http.fetchData(send_object,function(res){
						if(res){
							res = JSON.parse(res);
							
						}else{

						}
					});
					http.fetchDataFromRedis('', [0], 'list', boardCodes, function(data) {
						if(data) {
							var temp = [];
							if(data instanceof String) {
								data = JSON.parse(data);
							}
							data = data.body;
							for(var i in data) {
								temp.push(i);
							}
							async.forEach(temp, function(key, cb) {
								var codes = data[key];
								var tMarkUp = 0;
								var tAmout = 0;
								var tCount = 0;
								var upCode = '';
								for(var i in codes) {
									var code = codes[i];
									if(values[code] != undefined) {
										var markUp = values[code][0];
										var amout = values[code][1];
										tAmout = parseFloat(tAmout) + parseFloat(amout);
										if(parseFloat(markUp) > 0) {
											tCount = tCount + 1;
										}
										if(parseFloat(tMarkUp) < parseFloat(markUp)) {
											tMarkUp = parseFloat(markUp);
											upCode = code;
										}
									} else {
										//log.debug('There is not '+code+'in values.');
									}
								}
								if(boards[key] != undefined) {
									boards[key].upStockCode = upCode;
									boards[key].amount = tAmout;
									boards[key].upRatio = parseFloat(tCount / (codes.length));
								}
								cb();
							}, function() {
								callback(null, values);
							});
						} else {
							callback('BARDZ0*æŠ“å–å¤±è´¥', values);
						}
					});
				}], function(err) {
					if(err) {
						log.error(err + 'line:118,getBoardInfo.js');
					} else {
						log.info(' é¢†æ¶¨è‚¡æŠ“å–ç»“æŸ');
						setSelection(boards);
					}
				});
			}
			/*
			 * æ¿å—ä¸€é”®é€‰è‚¡
			 **/
		var setSelection = function(boards) {
				log.debug('æŠ“å–æ¿å—ä¸€é”®é€‰è‚¡å¼€å§‹');
				var url = configs.url.selection;
				http.request(url, function(err, res) {
					try {
						if(res) {
							res = JSON.parse(res);
							for(var i in res) {
								if(i.indexOf('BARDZ0') != -1) {
									try {
										var data = res[i];
										if(data) {
											var boardInfo = boards[i];
											if(boardInfo != undefined) {
												var time = data[3] + '';
												if(time.length == 5) {
													time = '0' + time;
												}
												time = data[2] + '' + time;
												boardInfo.time = time || dateFormat.DateFormat('yyyyMMdd', new Date());
												boardInfo.marketSituation = parseInt(data[4]) & 0x07;
												boardInfo.stockPoolType = data[10];
											} else {
												//console.log(i);
											}
										}
									} catch(ex) {
										log.error(ex + i);
									}
								}
							}
							log.debug('æŠ“å–æ¿å—ä¸€é”®é€‰è‚¡ç»“æŸ');
						} else {
							log.error('æŠ“å–æ¿å—ä¸€é”®é€‰è‚¡å‡ºé”™' + url);
						}
					} catch(e) {
						log.error(e + 'è§£æžæ¿å—ä¸€é”®é€‰è‚¡å‡ºé”™');
					}
					setBoardCapital(boards);
				});
			}

		var setBoardCapital = function(boards) {
				log.debug('æŠ“å–æ¿å—èµ„é‡‘å¼€å§‹');
				var values = {};
				var q = async.queue(function(code, cb) {
					var url = configs.url.board;
					var boardId = code.id + '';
					if(boardId.substring(0, 1) == '[') {
						boardId = boardId.substring(1, boardId.length - 1);
					}
					url = url.replace(/<BC>/g, code.code);
					url = url.replace(/<BD>/g, boardId);
					url = _random.random(url);
					http.fetchData(url, function(data, obj) {
						if(data) {
							if(data.length > 7) {
								boards[obj.code].inAmount = data[0];
								boards[obj.code].outAmount = data[1];
								boards[obj.code].totalAmount = data[2];
								boards[obj.code].markup = data[3];
								boards[obj.code].potency = data[4];
								boards[obj.code].amountTime = data[5];
								boards[obj.code].upSpace = data[6];
								boards[obj.code].priceEarningsRatio = data[7];
								var boardInfo = boards[obj.code];
								var value = [boardInfo.id + '|' + boardInfo.name + '|' + boardInfo.amountTime + '|' + boardInfo.inAmount + '|' + boardInfo.outAmount + '|' + boardInfo.totalAmount + '|' + boardInfo.markup + '|' + boardInfo.potency + '|' + boardInfo.upSpace + '|' + boardInfo.priceEarningsRatio + '|' + boardInfo.time + '|' + boardInfo.marketSituation + '|' + boardInfo.stockPoolType + '|' + boardInfo.marketRate + '|' + boardInfo.upStockCode + '|' + boardInfo.upRatio + '|' + boardInfo.amount];
								var key = 'PCF.' + obj.code;
								var temp = [];
								temp.push(value);
								values[key] = temp;
							}
							cb();
						} else {
							cb();
						}
					}, {
						'type': 1,
						'code': code.code
					});
				}, 100);
				q.drain = function() {
					http.pushData('', 'string', values, '00');
					log.debug('æŠ“å–æ¿å—èµ„é‡‘ç»“æŸ');
				};
				for(var i in boards) {
					q.push({
						'code': i,
						'id': boards[i].id
					}, function() {});
				}
			}
	}
exports.createBoardInfo = function() {
	return new GetBoardInfo();
}