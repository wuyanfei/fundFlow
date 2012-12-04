var http = require('./httpTool');
var configs = require('../etc/loadConfigure').configure;
var log = require('./web-log').log('/opt/node-pro/logs/getStockInfo.log');
var _ = require('underscore');
var async = require('async');

var GetStockInfo = function(){

	/**赋值多空 主力*/
	var setMainEmpty = function(stocks){
		log.debug('抓取多空 主力资金开始');
		var values = {};
		var url = configs.url.main;
		http.request(url,function(err,res){
			try{
	     if(err == null && res != '{}'){
				res = JSON.parse(res);
				for(var i in res){
					if(i.indexOf('BARDZ') == -1){
						try{
							var stockCode = i.slice(-2)+i.slice(0,6);
							var code = stockCode.slice(0,2)+'HQ'+stockCode.slice(2,8);
							var val = res[i];
	            var hourMinutSecond = val[3].toString();
	            if(hourMinutSecond.length ==5){
	              hourMinutSecond = '0' + hourMinutSecond;
	            }
							var time = val[2]+''+hourMinutSecond;
							//主力资金流入
							var mainIn = parseFloat(val.slice(6,7))+parseFloat(val.slice(12,13));
							//主力资金流出
							var mainOut = parseFloat(val.slice(9,10))+parseFloat(val.slice(15,16));
							//多空资金流入
							var emptyIn = parseFloat(val.slice(6,7))+parseFloat(val.slice(12,13))+parseFloat(val.slice(48,49));
							//多空资金流出
							var emptyOut = parseFloat(val.slice(9,10))+parseFloat(val.slice(15,16))+parseFloat(val.slice(51,52));
							//散户和散户敢死队资金流入
							var retailKamikazeIn = parseFloat(val.slice(18,19))+parseFloat(val.slice(24,25));
							//散户和散户敢死队资金流出
							var retailKamikazeOut = parseFloat(val.slice(21,22))+parseFloat(val.slice(27,28));
							//散户敢死队资金流入
							var kamikazeIn = parseFloat(val.slice(48,49));
							//散户敢死队资金流出
							var kamikazeOut = parseFloat(val.slice(51,52));
							//散户资金流入
							var retailIn = retailKamikazeIn - kamikazeIn;
							//散户资金流出
							var retailOut = retailKamikazeOut - kamikazeOut;
							//机构买入
							var organizationIn = parseFloat(val.slice(42,43));
							//机构卖出
							var organizationOut = parseFloat(val.slice(45,46));
							stocks[code].mainTime = time;
							stocks[code].mainInPrice = mainIn;
							stocks[code].mainOutPrice = mainOut;
							stocks[code].emptyTime = time;
							stocks[code].emptyMainInPrice = emptyIn;
							stocks[code].emptyMainOutPrice = emptyOut;
							stocks[code].retailInPrice = retailIn;
							stocks[code].retailOutPrice = retailOut;
							stocks[code].organInPrice = organizationIn;
							stocks[code].organOutPrice = organizationOut;
							stocks[code].emptyRetailInPrice = retailKamikazeIn;
							stocks[code].emptyRetailOutPrice = retailKamikazeOut;

							var stockInfo = stocks[code];
							var value = [stockInfo['id']+'|'+stockInfo['name']+'|'+stockInfo['boardCode']+'|'+stockInfo['emptyTime']+'|'+stockInfo['emptyMainInPrice']+'|'+stockInfo['emptyMainOutPrice']+'|'+stockInfo['emptyRetailInPrice']+'|'+stockInfo['emptyRetailOutPrice']+'|'+stockInfo['mainTime']+'|'+stockInfo['mainInPrice']+'|'+stockInfo['mainOutPrice']+'|'+stockInfo['retailInPrice']+'|'+stockInfo['retailOutPrice']+'|'+stockInfo['organInPrice']+'|'+stockInfo['organOutPrice']+'|'+stockInfo['inflowsStrength']+'|'+stockInfo['traded']+'|'+stockInfo['dragBrace1']+'|'+stockInfo['dragBrace2']+'|'+stockInfo['dragBrace3']+'|'+stockInfo['dbPrice']+'|'+stockInfo['cyw']+'|'+stockInfo['grailRisk']+'|'+stockInfo['industrialRisk']+'|'+stockInfo['stocksRisk']+'|'+JSON.stringify(stockInfo['boardList'])+'|'+stockInfo['time']+'|'+stockInfo['marketSituation']+'|'+stockInfo['stockPoolType']];
							var key = 'ESDC.'+ stockCode.replace(/HQ/g,'');
							var temp = [];
							temp.push(value);
							values[key] = temp;
						}catch(e){
							log.error(e+'getStockInfo.js line:205'+code);
						}
					}
				}
				http.pushData('','string',values,'00');
				log.debug('抓取多空 主力资金结束');
				log.debug('存储stockInfo结束');
	    }else{
	     log.error('wav3 fetch null.stockInfo saving failed.');
	    }	
			}catch(e){
				log.error(e+'getStockInfo.js line:107');
			}
		});
	}

	 /*
	  * 一键选股
	  **/
	 this.setSelection = function(stocks){
	  log.debug('股票一键选股开始');
	  var selectTime = new Date();
	 	var url = configs.url.selection;
	 	http.request(url,function(err,res){
	 		try{
	 			  if(err){log.error(err);}
	        if(res){
	 				res = JSON.parse(res); 		
					for(var i in res){
						try{
							var stockCode = i.slice(-2)+'HQ'+i.substring(0,6);
							var data = res[i];
							if(data){
								if(stockCode.indexOf('BARDZ') == -1){
									var stockInfo = stocks[stockCode];
									if(stockInfo != undefined){
										var time = data[3]+'';
										if(time.length == 5){
											time = '0'+time;
										}
										stockInfo.time = data[2]+''+time;
										stockInfo.marketSituation = parseInt(data[4])&0x07;
										stockInfo.stockPoolType = data[10];
									}else{
										log.debug('stockCode='+stockCode);
									}
								}
							} 					
						}catch(ex){
							log.error(ex+i);
						}
					}
					log.debug('股票一键选股抓取结束');
	 			}else{
	 				log.error('股票一键选股抓取失败');
	 			}
			}catch(e){
	 			log.error(e+'一键选股解析出错');
	 		}
	    setMainEmpty(stocks);
	 	});
	 }
}

exports.createStockInfo = function(){
	return new GetStockInfo();
}
