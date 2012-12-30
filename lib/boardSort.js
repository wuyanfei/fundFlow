var http = require('./httpTool');
var fetch = require('./fetch');
var async = require('async');
var _ = require('underscore');
var configs = require('../etc/loadConfigure').configure;
var log = require('./web-log').log('/opt/node-pro/logs/boardSort.log');
var sendType = '';
var BoardSort = function() {
		this.getBoardCodes = function(task, callback,type) {
			sendType = type;
			console.log('板块资金排行和上涨空间排行开始');
			var stocks = task.allIDs.boardIds;
			var boardCodes = [];
			for(var code in stocks) {
				if(code.indexOf('BARDZ0') != -1) {
					boardCodes.push(code);
				}
			}
			calculateBoardCapital(boardCodes, stocks, callback);
		}
		var calculateBoardCapital = function(boardCodes, stocks, callback) {
				var sort_temp = [];
				var sort_bn = [];
				var sortValue = ['sort', [
					['SORT.PCF', sort_temp]
				]];
				var sortBN = ['sort', [
					['SORT.UPSPACE', sort_bn]
				]];
				async.forEach(boardCodes, function(code, cb) {
					dealFetch(stocks, code, cb, sort_temp, sort_bn);
				}, function() {
					var send_values = ['sort', []];
					if(sort_temp.length > 0) { /**行业板块资金流向排行*/
						send_values[1].push(sortValue[1][0]);
						// http.post({'data':sortValue,'type':'sort'}, function(res) {
						// 	//log.debug(res);
						// });
					}
					if(sort_bn.length> 0) { /**行业上涨空间排行*/
						send_values[1].push(sortBN[1][0]);
						// http.post({'data':sortValue,'type':'sort'}, function() {
						// });
					}
					// console.log(send_values,111);
					if(send_values[1].length > 0) {
						callback({
							'data': send_values,
							'type': 'sort',
							'sendType':sendType
						});
					}
					console.log('发送板块资金排行和上涨空间排行成功');
					// log.debug('板块资金排行和上涨空间排行存储完毕');
				});
			}
		var dealFetch = function(stocks, code, cb, sort_temp, sort_bn) {
				var id = stocks[code];
				var url = configs.url.board.replace(/<BC>/g, code).replace(/<BD>/g, id);
				url = url +(parseInt(Math.random()*1000+1))+'';
				fetch.post(url, function(data) {
					// console.log(url,data);
					if(data != null && data != '[-6]0' && data != '[-1]0') {
						saveBoardMline(data, code, cb, sort_temp, sort_bn);
					} else {						
						cb();
					}
				});
			}
		var saveBoardMline = function(data, boardCode, cb, sort_temp, sort_bn) {
			// console.log(data);
				data = data.substring(0, data.length - 1);
				try {
					data = JSON.parse(data);
					var boardNet = data[2];
					var upspace = data[6];
					var sortTmp = [];
					sortTmp.push(boardNet);
					sortTmp.push(boardCode);


					var sortBNTmp = [];
					sortBNTmp.push(upspace);
					sortBNTmp.push(boardCode);

					if(boardCode.cut(6, 7) === '1') {
						sort_temp.push(sortTmp);
						sort_bn.push(sortBNTmp);
					}
				} catch(ex) {
					console.log(ex.stack);
				}
				cb();
			}
	}
exports.createBoardSort = function() {
	return new BoardSort();
}