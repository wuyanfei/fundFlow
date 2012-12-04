var http = require('./httpTool');
var configs = require('../etc/loadConfigure').configure;
var log = require('./web-log').log('/opt/node-pro/logs/stocksUnderBoardSort.log');
var StocksUnderBoardSort = function(){
	this.getNet = function(stocksUnderBoard){
		log.debug('板块下股票资金净流入排行开始');
		var url = configs.url.main;
		http.request(url,function(err,data){
			if(err){
        log.error('抓取数据ID=142失败');
			}else{
			  saveMainMline(data,stocksUnderBoard);
			}			
		});
	}
	var saveMainMline = function(data,stocksUnderBoard){
		try{
			var values = {};
			data = JSON.parse(data);
			for(var i in data){
				var val = data[i];
				if(val !== undefined){
					var time = val.slice(2,3);
					var tmpTime = val.slice(3,4).toString();
					if(tmpTime.length === 5){
						tmpTime = '0'+tmpTime;
					}
					time = time + tmpTime;
					var mainIn = parseFloat(val.slice(6,7))+parseFloat(val.slice(12,13));
					var mainOut = parseFloat(val.slice(9,10))+parseFloat(val.slice(15,16));
					var netIn = parseFloat(mainIn) - parseFloat(mainOut);
					var tmp = i.slice(-2)+i.slice(0,6);
					if(isNaN(netIn)){
						log.debug(mainIn+','+mainOut);
					}else{
						values[tmp] = netIn;
					}
				}
			}
			setNetIn(values,stocksUnderBoard);
		}catch(ex){
      log.error(ex+'--->stocksUnderBoardSort:saveMainMline');
		}	
	}
	var setNetIn = function(values,stocksUnderBoard){
		try{
			var netSort = {};
			for(var i in stocksUnderBoard){
				var stocks = stocksUnderBoard[i];
				var key = 'NETSORT.'+i;
				var netCapital = {};
				netCapital[key] = [];
				for(var i in stocks){
					var temp = parseFloat(values[stocks[i].toString()]);
					if(isNaN(temp)){
					}else{
						netCapital[key].push([stocks[i].toString(),temp]);
					}
				}
				http.pushData('','sort',netCapital,'02');
			}
			log.debug('板块下股票资金净流入排行结束');
		}catch(ex){
      log.error(ex+'--->stocksUnderBoardSort:setNetIn');
		}
	}
}
exports.createStocksUnderBoardSort = function(){
	return new StocksUnderBoardSort();
}
