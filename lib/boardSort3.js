var http = require('./httpTool');
var async = require('async');
var _ = require('underscore');
var configs = require('../etc/loadConfigure').configure;
var log = require('./web-log').log('/opt/node-pro/logs/boardSort.log');
var BoardInfo = require('./boardInfo').BoardInfo;
var jsonStocks;
var BoardSort = function(){
	this.getBoardCodes = function(task){
		log.debug('板块资金排行和上涨空间排行开始');
		var stocks = task.allIDs.boardIds;
		jsonStocks = stocks;
		var boardCodes = [];
		for(var code in stocks){
	    if(code.indexOf('BARDZ0') != -1){
				boardCodes.push(code);
	    }
		}
		calculateBoardCapital(boardCodes);
	}

	var calculateBoardCapital = function(boardCodes){
		var sortValues = {'SORT.PCF':[]};
		var sortBN = {'SORT.UPSPACE':[]};
		async.forEach(boardCodes,function(code,cb){
			try{
				var url = configs.url.board;
				var id = jsonStocks[code];
				url = url.replace(/<BC>/g,code);
				url = url.replace(/<BD>/g,id);
				http.fetchData(url,function(data,_url){
					if(data){
						saveBoardMline(data,_url,cb,sortValues,sortBN);
					}
				},url);
			}catch(exception){
				log.error(exception);
        cb();
			}				
		},function(){
			//log.info('板块资金排行存储完毕'+consumeTime+'秒');
	    if(_.size(sortValues['SORT.PCF']) > 0){
			/**行业板块资金流向排行*/
				http.pushData('','sort',sortValues,'02');
	    }
	    if(_.size(sortBN['SORT.UPSPACE'])>0){
			/**行业上涨空间排行*/
				http.pushData('','sort',sortBN,'02');
	    }
	      log.debug('板块资金排行和上涨空间排行存储完毕');
		});
		
	}

	var saveBoardMline = function(data,url,cb,sortValues,sortBN){
		var boardCode = url.slice(54,64);
		var time = data[5];
		var boardIn = data[0];
		var boardOut = data[1];
		var boardNet = data[2];
		var upspace = data[6];
		var sortTmp = [];
		sortTmp.push(boardCode);
		sortTmp.push(boardNet);

		var sortBNTmp = [];
		sortBNTmp.push(boardCode);
		sortBNTmp.push(upspace);
		if(boardCode.slice(6,7) === '1'){
			sortValues['SORT.PCF'].push(sortTmp);
			sortBN['SORT.UPSPACE'].push(sortBNTmp);
		}
		cb();
	}
}
exports.createBoardSort = function(){
	return new BoardSort();
}
