var http = require('./httpTool');
var configs = require('../etc/loadConfigure').configure;
var log = require('./web-log').log('/opt/node-pro/logs/stocksUnderBoardSort.log');
var StocksUnderBoardSort = function() {
		this.getNet = function(stocksUnderBoard) {
			log.debug('板块下股票资金净流入排行开始');
			var url = configs.url.main;
			http.request(url, function(err, data) {
				if(err) {
					log.error('抓取数据ID=142失败');
				} else {
					saveMainMline(data, stocksUnderBoard);
				}
			});
		}
		var getFullTime = function(ymd, hms) {
				if(hms.length == 5) {
					return ymd.append('0').append(hms);
				} else {
					return ymd.append(hms);
				}
			};
		var saveMainMline = function(data, stocksUnderBoard) {
				try {
					var values = {};
					data = JSON.parse(data);
					for(var i in data) {
						var val = data[i];
						if(val == undefined) continue;
						var time = getFullTime(val.cut(2, 3),val.cut(3,4));
						var mainIn = parseFloat(val.cut(6, 7)) + parseFloat(val.cut(12, 13));
						var mainOut = parseFloat(val.cut(9, 10)) + parseFloat(val.cut(15, 16));
						var netIn = parseFloat(mainIn) - parseFloat(mainOut);
						var tmp = i.cut(-2) + i.cut(0, 6);
						values[tmp] = netIn;
					}
					setNetIn(values, stocksUnderBoard);
				} catch(ex) {
					log.error(ex + '--->stocksUnderBoardSort:saveMainMline');
				}
			}
		var setNetIn = function(values, stocksUnderBoard) {
				try {
					var netSort = ['sort',[]];
					for(var i in stocksUnderBoard) {
						var stocks = stocksUnderBoard[i];
						var key = 'NETSORT.' + i;
						var temp = [];
						for(var i in stocks) {							
							var field = stocks[i];
							var value = parseFloat(values[field.toString()]);
							temp.push([field,value]);
						}
						netSort[1].push([key,temp])
						http.pushData(netSort,function(){});
					}
					log.debug('板块下股票资金净流入排行结束');
				} catch(ex) {
					log.error(ex + '--->stocksUnderBoardSort:setNetIn');
				}
			}
	}
exports.createStocksUnderBoardSort = function() {
	return new StocksUnderBoardSort();
}