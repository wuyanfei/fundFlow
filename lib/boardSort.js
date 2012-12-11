var http = require('./httpTool');
var async = require('async');
var _ = require('underscore');
var configs = require('../etc/loadConfigure').configure;
var log = require('./web-log').log('/opt/node-pro/logs/boardSort.log');

var BoardSort = function() {
		this.getBoardCodes = function(task) {
			log.debug('板块资金排行和上涨空间排行开始');
			var stocks = task.allIDs.boardIds;
			var boardCodes = [];
			for(var code in stocks) {
				if(code.indexOf('BARDZ0') != -1) {
					boardCodes.push(code);
				}
			}
			calculateBoardCapital(boardCodes, stocks);
		}
	}
var calculateBoardCapital = function(boardCodes, stocks) {
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
			if(_.size(sort_temp) > 0) { /**行业板块资金流向排行*/
				http.post(sortValue, function(res) {
					//log.debug(res);
				});
			}
			if(_.size(sort_bn) > 0) { /**行业上涨空间排行*/
				http.post(sortValue,function(){
					
				});
			}
			log.debug('板块资金排行和上涨空间排行存储完毕');
		});
	}
var dealFetch = function(stocks, code, cb, sort_temp, sort_bn) {
		var id = stocks[code];
		var url = configs.url.board.replace(/<BC>/g, code).replace(/<BD>/g, id);
		http.fetchData(url, function(data) {
			if(data) {
				saveBoardMline(data, code, cb, sort_temp, sort_bn);
			} else {
				cb();
			}
		});
	}
var saveBoardMline = function(data, boardCode, cb, sort_temp, sort_bn) {
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
		cb();
	}
}