var httpTool = require('./httpTool');
var async = require('async');
var util = require('util')
var configs = require('../etc/loadConfigure').configure;
var log = require('./web-log').log('/opt/node-pro/logs/validStockCode.log');
var initRedis = require('redis').createClient(configs.redis.split(':')[1],
		configs.redis.split(':')[0]);
var _ = require('underscore');
var random = require('./random');
var results = {};
/** catch Exception */
process.on('uncaughtException', function(e) {
	if (e && e.stack) {
		log.error('ERROR:' + e.stack);
	} else {
		log.error('ERROR:' + e.toString());
	}
});

var fetchData = function(url, callback) {
	if (url == undefined) {
		callback('url is undefined', null);
	} else {
		var begin = url.indexOf('=') + 1;
		var end = url.indexOf('|');
		var item = url.substring(begin, end);
		httpTool.fetch(url, function(res) {
			try {
				if (res != null && res != undefined) {
					if (res != 403) {
						res = checkSuffix(res);
					}
					callback(null, res, item);
				} else {
					var error_msg = 'url=' + url;
					callback(error_msg, null, item);
				}
			} catch (e) {
				callback(e, null, item);
			}
		});
	}
}

var checkSuffix = function(value) {
	var value = JSON.stringify(value);
	var suffix = value.slice(-1);
	if (suffix === '0') {
		value = value.slice(0, value.length - 1);
	}
	if (value !== '[]' && value !== '[-1]' && value != '403') {
		value = JSON.parse(value);
	} else {
		value = null;
	}
	return value;
}

/* 异常日志 */
var getException = function(err) {
	if (err && err.stack)
		return err.stack;
	else
		return err;
}

var GetValidCode = function() {
	var count = 5;
	var init = function(callback) {
		initRedis.get('task', function(e, r) {
			if (e) {
				if (count > 0) {// 连接5次后失败就退出
					count = count - 1;
					setTimeout(init, 5000);
				} else {
					log.error(e);
				}
			} else {
				var task = JSON.parse(r);
				callback(null, task);
			}
		});
	};
	/*
	 * 加载股票列表
	 */
	var loadAllStockCodes = function(task, callback) {
		log.debug('加载股票列表开始');
		var url = random.random(configs.url.allStockCodes);
		httpTool.request(url, function(error, res) {
			try {
				if (error == null) {
					res = res.substring(0, res.length - 1);// 去掉末尾的0
					res = JSON.parse(res);
					var originalCode = [];//
					for ( var i in res) {
						var data = res[i];
						if (_.size(data) == 2) {// 数组不是两位则舍弃[code,name]
							var stockCode = data[0];
							var stockName = decodeURIComponent(data[1]);
							originalCode.push(stockCode);// 把请求的股票代码存起来，以便下面判断使用
							if (task.stocks[stockCode] == undefined) {// 不存在该股票，则加进去
								task.stocks[stockCode] = {};
								task.stocks[stockCode].code = stockCode;
								task.stocks[stockCode].name = stockName;
								log.debug('新加入了股票，stockCode=' + stockCode + ',stockName='
										+ stockName);
							}
						} else {
							log.debug('wrong data.' + data);
						}
					}
					log.debug('加载股票列表结束');
					callback(null, originalCode, task);
				} else {
					callback(error, task);
				}
			} catch (exception) {
				callback(getException(exception), task);
			}
		});
	}

	var getDatas = function(code, url, task, cb) {
		fetchData(url, function(error, res) {
			if (res != null) {
				task.stocks[code].id = res[0];
				task.allIDs.stockIds[code] = res[0];
				task.allIDs[res[0]] = code;
				cb();
			} else {
				var err_msg = code + ' converted failed,result: ' + res;
				cb(err_msg);
			}
		});
	};
	/*
	 * 股票代码转ID
	 */
	var stockCode2Id = function(originalCode, task, callback) {
		log.debug('股票代码转ID开始');
		var stockIds = task.allIDs.stockIds;// redis中的股票ID
		var q = async.queue(function(item, cb) {
			var stockCode = item.stockCode;
			var url = random.random(configs.url.code2id).replace(/<SC>/g, stockCode);
			getDatas(stockCode, url, task, cb);
		}, 50);
		q.drain = function() {
			log.debug('股票代码转ID结束');
			callback(null, originalCode, task);
		};
		for ( var i in originalCode) {
			if (stockIds[originalCode[i]] == undefined) {// 股票ID中没有这个股票，则加入请求队列
				log.debug('股票ID中新加入了股票，stockCode=' + originalCode[i]);
				q.push({
					'stockCode' : originalCode[i]
				}, function(err) {
					if (err) {
						log.error(getException(err));
					}
				});
			}
		}
	}

	var getBelongDatas = function(url, code, task, cb) {
		fetchData(url, function(err, res) {
			// log.debug(res);
			if (res != null) {
				for ( var i in res) {
					if (i.indexOf('HQ') == -1) {
						var prefix = i.substring(0, 1);
						var boardCode = 'BARDZ0' + i;
						var boardName = decodeURIComponent(res[i][0]);
						var boardList = task.stocks[code].boardList;
						if (boardList == undefined) {
							boardList = {};
							boardList[prefix] = [];
							var temp = [];
							temp.push(boardCode);
							temp.push(boardName);
							boardList[prefix].push(temp);
							task.stocks[code].boardList = boardList;
						} else {
							var array = boardList[prefix];
							var temp = [];
							temp.push(boardCode);
							temp.push(boardName);
							if (array != undefined) {
								for ( var i in array) {
									var tArray = array[i];
									if (tArray[0] != boardCode && i == (array.length - 1)) {
										array.push(temp);
									} else {
										break;
									}
								}
							} else {
								array = [];
								array.push(temp);
								boardList[prefix] = array;
							}
						}
						task.boards[boardCode] = {};
						task.boards[boardCode].name = boardName;
						task.boards[boardCode].code = boardCode;
						if (boardCode.substring(6, 7) == '1') {
							task.stocks[code].boardCode = boardCode;
						}
					}
				}
				cb();
			} else {
				cb(err);
			}
		});
	};
	/*
	 * 股票所属板块
	 */
	var stocksBelongToBoards = function(originalCode, task, callback) {
		log.debug('抓取股票所属板块开始');
		var q = async.queue(function(item, cb) {
			var stockCode = item.stockCode;
			var url = random.random(configs.url.stockBelongBoard).replace(/CODE/g,
					stockCode);
			// log.debug(url);
			getBelongDatas(url, stockCode, task, cb);
		}, 50);
		q.drain = function() {
			log.debug('抓取股票所属板块结束');
			callback(null, task);
		};
		var stocks = task.stocks;
		for ( var i in originalCode) {
			if (stocks[originalCode[i]] != undefined
					&& stocks[originalCode[i]]['boardList'] != undefined) {

			} else {
				// log.debug('股票所属板块中新加入了股票，stockCode='+originalCode[i]);
				q.push({
					'stockCode' : originalCode[i]
				}, function(err) {
					if (err) {
						log.error(getException(err));
					}
				});
			}
		}
	}

	var getBoardDatas = function(url, code, task, cb) {
		fetchData(url, function(err, res) {
			if (res != null) {
				// log.debug(code,res[0]);
				task.allIDs.boardIds[code] = res[0];
				task.allIDs.boardIds[res[0]] = code;
				task.boards[code].id = res[0];
				cb();
			} else {
				var err_msg = code + ' converted failed.';
				cb(err_msg);
			}
		});
	};
	/*
	 * 板块CODE转ID
	 */
	var boardCode2Id = function(task, callback) {
		log.debug('板块CODE转ID开始');
		var q = async.queue(function(item, cb) {
			var boardCode = item.boardCode;
			var url = random.random(configs.url.code2id).replace(/<SC>/g, boardCode);
			// log.debug(url);
			getBoardDatas(url, boardCode, task, cb);
		}, 50);
		q.drain = function() {
			log.debug('板块CODE转ID结束');
			results = task;
			callback(null, task);
		};
		for ( var i in task.boards) {
			q.push({
				'boardCode' : i
			}, function(err) {
				if (err) {
					log.error(getException(err));
				}
			});
		}
	}

	/*
	 * 任务开始
	 */
	this.startMission = function() {
		async.waterfall([ init, loadAllStockCodes, stockCode2Id,
				stocksBelongToBoards, boardCode2Id ], function(err) {
			if (err) {
				log.error(getException(err));
			} else {
				try {
					var timeStr = new Date().toString();
					results['taskTime']= timeStr;
					results = JSON.stringify(results);
					// log.debug(results);
					initRedis.set('task', results, function(e, res) {
						if (e == null) {
							log.debug('有效key抓取结束');
						} else {
							log.error(getException(e));
						}
					});
				} catch (exception) {
					log.error(getException(exception));
				}
			}
		});
	}
}
exports.createGetValidCode = function() {
	return new GetValidCode();
}
//console.log(new Date().toString());
//var test = new GetValidCode();
//test.startMission();
