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
		var getSDC = function(stockCodes, cb) {
				stockCodes = _.map(stockCodes, function(code) {
					return 'SDC.' + code;
				});
				var send_object = {
					'type': 'string',
					'val': {
						'keys': stockCodes,
						'index': [13, 11]
					}
				};
				http.post(send_object, function(res) {
					if(res) {
						var values = JSON.parse(res);
						cb(values);
					} else {
						cb(null);
					}
				},1);
			};
		var getBARDZ0 = function(boardCodes, cb) {
				var send_object = {
					'type': 'list',
					'val': {
						'keys': boardCodes
					}
				};
				http.post(send_object, function(res) {
					if(res) {
						res = JSON.parse(res);
						cb(res);
					} else {
						cb(null);
					}
				},1);
			};

		/*重新组织 涨幅和成交金额 
		 *eg:{
		 *  	SH600000:{
		 *			markup:0.34,
		 *			amount:238740.23
		 *  	}
		 *	}
		 */
		var get_object_markup_amount = function(markup_amount, callback) {
				var markup_amount_val = {};
				markup_amount.forEachSync(function(item, index, cb) {
					key = item[0].toString().split('.')[1];
					markup_amount_val.key = key;
					markup_amount_val.key.markup = item[1][0];
					markup_amount_val.key.amount = item[1][1];
				}, function() {
					callback(markup_amount_val);
				});
			};

		/*
		 *计算最大涨幅和对应的股票代码
		 */
		var compute_upstock_amount_ratio = function(markup_amount_object, stockCodes) {
				var upStockCode = null;
				var upStockCodeCount = 0;
				var maxMarkUp = -100;
				var totalAmount = 0;
				for(var i = 0; i < stockCodes.length; i++) {
					if(parseFloat(maxMarkUp) < parseFloat(markup_amount_object[stockCodes[i]].markup)) {
						maxMarkUp = markup_amount_object[stockCodes[i]].markup;
						upStockCode = stockCodes[i];
					}
					upStockCodeCount += parseFloat(markup_amount_object[stockCodes[i]].markup) > 0 ? 1 : 0;
					totalAmount = parseFloat(totalAmount) + parseFloat(markup_amount_object[stockCodes[i]].amount);
				}
				return [upStockCode, upStockCodeCount / stockCodes.length, totalAmount];
			};
		var computeAmounts = function(markup_amount, bardz, boards, callback) {
				get_object_markup_amount(markup_amount, function(res) {
					bardz.forEachSync(function(item, index, cb) {
						var boardCode = item[0];
						var stockCodes = item[1];
						var array = compute_upstock_amount_ratio(res, stockCodes);
						boards[boardCode] = boards[boardCode] || {};
						boards[boardCode].upStockCode = array[0];
						boards[boardCode].upRatio = array[1];
						boards[boardCode].amount = array[2];
					}, function() {
						callback(null);
					});
				});
			};
		var setUpstocks = function(boards) {
				log.info('抓取领涨股开始');
				var stocks = tempTask.stocks;
				var stockCodes = [];
				var boardCodes = [];
				for(var i in stocks) {
					stockCodes.push(i.replace(/HQ/g, ''));
				}
				for(var i in boards) {
					if(i.indexOf('BARDZ0') != -1 && i.length==10) {
						boardCodes.push(i);
					}
				}
				async.waterfall([

				function(callback) {
					getSDC(stockCodes, function(res) {
						if(res) callback(null, res);
						else callback('SDC获取失败', res);
					})
				}, function(values, callback) {
					getBARDZ0(boardCodes, function(res) {
						if(res) computeAmounts(values, res, boards, callback);
						else callback('抓取板块列表失败');
					});
				}], function(err) {
					if(err) log.error(err + 'line:143,getBoardInfo.js');
					else {
						log.info('抓取领涨股结束');
						setSelection(boards);
					}
				});
			}
			/*
			 * 板块一键选股
			 */
		var setSelection = function(boards) {
				log.debug('板块一键选股开始');
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
							log.debug('板块一键选股结束');
						} else {
							log.error('板块一键选股出错' + url);
						}
					} catch(e) {
						error(e);
					}
					setBoardCapital(boards);
				});
			}

		var setBoardCapital = function(boards) {
				log.debug('抓取板块资金开始');
				var values = ['string', []];
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
								boards[obj.code]=boards[obj.code] || {};
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
								temp.push(key);
								temp.push(value);
								values[1].push(temp);
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
					http.post(values, function() {

					});
					log.debug('抓取板块资金结束');
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