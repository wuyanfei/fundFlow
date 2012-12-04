var http = require('./httpTool');
var dateFormat = require('./dateFormat');
var arraysForEach = require('./forEachSync');
var configs = require('../etc/loadConfigure').configure;
var log = require('./web-log').log('/opt/node-pro/logs/mainCapital.log');
var jsonStocks;
var MainCapital = function(){
	this.getMainstockCodes = function(task){
		var stocks = task.allIDs.stockIds
		jsonStocks = stocks;
		var stockCodes = [];
		for(var code in stocks){
			stockCodes.push(code);
		}
		calculateMainCapital(stockCodes);
	}

	var calculateMainCapital = function(stockCodes){
		//console.log(stockCodes);
		var time = new Date();
		var url = configs.url.main;
		http.request(url,function(err,data){
			if(err == null && data != '{}'){
				saveMainMline(data);
				saveEmptyMline(data);
				//console.log(data);
				saveMainKLine(data);
				saveEmptyKLine(data);
				log.debug('主力/多空资金分时日K存储完毕');
			}else{
				log.error('wav3 fetch null.主力/多空资金saving failed.');
			}
			
		});
	}
	/*
	 * fenzhong k
	 */
	var saveMinuteKline = function(prefix,results,type){
		
		var klineJson = {};
		var arrays = [];
		for(var i in results){
			var temp = [];
			temp.push([i]);
			temp.push(results[i][0]);
			arrays.push(temp);
		}
		//console.log(arrays);
		arrays.forEachSync(function(item,index,cback){
			var stockCode = item[0][0];
			var key = prefix+stockCode+'.'+type+'M';
			var val = item[1][0].split('|');
			var time = val[0];
			var minutes = parseFloat(time.substring(10,12));
			var count = parseInt(minutes/parseFloat(type));
			var flag = (parseFloat(minutes/parseFloat(type))+'').indexOf('.')>0?true:false;
			minutes = flag?(count+1)*parseFloat(type)-minutes:0;
			var date = time.toDate();
			time = date.addMinutes(minutes).format('yyyyMMddhhMM');
			val[0] = time;
			var temp = [];
			temp.push([val.join('|')]);
			klineJson[key] = temp;
			cback();
		},function(){
			http.pushData('','list',klineJson,'03');
			//console.log(klineJson);
		});
	};
	/*
	 * day k
	 */
	var saveDayKline = function(prefix,results,suffix){
		var klineJson = {};
		var arrays = [];
		for(var i in results){
			var temp = [];
			temp.push([i]);
			temp.push(results[i][0]);
			arrays.push(temp);
		}
		arrays.forEachSync(function(item,index,cback){
			//console.log(item);
			var stockCode = item[0][0];
			var key = prefix+stockCode+'.'+suffix;
			var val = item[1][0].split('|');
			//console.log(stockCode,val);
			var time = val[0];
			var ymd = parseFloat(time.substring(0,8));
			val[0] = ymd;
			var temp = [];
			temp.push([val.join('|')]);
			klineJson[key] = temp;
			cback();
		},function(){
			http.pushData('','list',klineJson,'03');
			//console.log(klineJson);
		});
	};
	/*
	 * week K
	 */
	var saveWeekKline = function(prefix,results,suffix){
		var klineJson = {};
		var arrays = [];
		for(var i in results){
			var temp = [];
			temp.push([i]);
			temp.push(results[i][0]);
			arrays.push(temp);
		}
		arrays.forEachSync(function(item,index,cback){
			var stockCode = item[0][0];
			var key = prefix+stockCode+'.'+suffix;
			var val = item[1][0].split('|');
			var time = val[0];
			var ymd = time.substring(0,8);
			ymd = new Date(ymd.substring(0,4)+'-'+ymd.substring(4,6)+'-'+ymd.substring(6,8));
			var weekDay = ymd.getDay();
			var diff = 0;
			if(weekDay ==6){
			 diff = -1;
			}
			if(weekDay == 0){
			 diff = -2;
			}
			if(diff ==0){
			 diff = 5-weekDay;
			}
			ymd = ymd.addDays(diff).format('yyyyMMdd');
			val[0] = ymd;
			var temp = [];
			temp.push([val.join('|')]);
			klineJson[key] = temp;
			cback();
		},function(){
			http.pushData('','list',klineJson,'03');
			//console.log(klineJson);
		});
	};
	/*
	 * month k
	 */
	var saveMonthKline = function(prefix,results,suffix){
		var klineJson = {};
		var arrays = [];
		for(var i in results){
			var temp = [];
			temp.push([i]);
			temp.push(results[i][0]);
			arrays.push(temp);
		}
		arrays.forEachSync(function(item,index,cback){
			var stockCode = item[0][0];
			var key = prefix+stockCode+'.'+suffix;
			var val = item[1][0].split('|');
			var time = val[0];
			var ymd = time.substring(0,6);
			val[0] = ymd;
			var temp = [];
			temp.push([val.join('|')]);
			klineJson[key] = temp;
			cback();
		},function(){
			http.pushData('','list',klineJson,'03');
			//console.log(klineJson);
		});
	};
	/*
	 * half year k
	 */
	var saveHalfYearKline = function(prefix,results,suffix){
		var klineJson = {};
		var arrays = [];
		for(var i in results){
			var temp = [];
			temp.push([i]);
			temp.push(results[i][0]);
			arrays.push(temp);
		}
		arrays.forEachSync(function(item,index,cback){
			var stockCode = item[0][0];
			var key = prefix+stockCode+'.'+suffix;
			var val = item[1][0].split('|');
			var time = val[0];
			var ymd = time.substring(0,8);
			var date = null;
			var firstDate = new Date(ymd.substring(0,4)+'-06-30');
			var lastDate = new Date(ymd.substring(0,4)+'-12-31');
			if(parseFloat(firstDate.format('yyyyMMdd')) >= parseFloat(ymd)){
				date = firstDate;
			}else if(parseFloat(firstDate.format('yyyyMMdd')) < parseFloat(ymd) && parseFloat(lastDate.format('yyyyMMdd')) >= parseFloat(ymd)){
				date = lastDate;
			}
			while(date.getDay() == 6 || date.getDay() == 0){
				date = date.minusDays(1);
			}
			ymd = date.format('yyyyMMdd');
			val[0] = ymd;
			var temp = [];
			temp.push([val.join('|')]);
			klineJson[key] = temp;
			cback();
		},function(){
			http.pushData('','list',klineJson,'03');
			console.log(klineJson);
		});
	};
	var saveYearKline = function(prefix,results,suffix){
		var klineJson = {};
		var arrays = [];
		for(var i in results){
			var temp = [];
			temp.push([i]);
			temp.push(results[i][0]);
			arrays.push(temp);
		}
		arrays.forEachSync(function(item,index,cback){
			var stockCode = item[0][0];
			var key = prefix+stockCode+'.'+suffix;
			var val = item[1][0].split('|');
			var time = val[0];
			var ymd = time.substring(0,8);
			var date = new Date(ymd.substring(0,4)+'-12-31');
			while(date.getDay() == 6 || date.getDay() == 0){
				date = date.minusDays(1);
			}
			ymd = date.format('yyyyMMdd');
			val[0] = ymd;
			var temp = [];
			temp.push([val.join('|')]);
			klineJson[key] = temp;
			cback();
		},function(){
			http.pushData('','list',klineJson,'03');
			//console.log(klineJson);
		});
	};
	var saveSYearKline = function(prefix,results,suffix){
		var klineJson = {};
		var arrays = [];
		for(var i in results){
			var temp = [];
			temp.push([i]);
			temp.push(results[i][0]);
			arrays.push(temp);
		}
		arrays.forEachSync(function(item,index,cback){
			var stockCode = item[0][0];
			var key = prefix+stockCode+'.'+suffix;
			var val = item[1][0].split('|');
			var time = val[0];
			var ymd = time.substring(0,8);
			var date = null;
			var winter = new Date(ymd.substring(0,4)+'-12-31');
			var spring = new Date(ymd.substring(0,4)+'-03-31');
			var summer = new Date(ymd.substring(0,4)+'-06-30');
			var autumn =  new Date(ymd.substring(0,4)+'-09-30');
			if(parseFloat(ymd) <= parseFloat(spring.format('yyyyMMdd'))){
				date = spring;
			}else if(parseFloat(spring.format('yyyyMMdd')) < parseFloat(ymd) && parseFloat(ymd) <= parseFloat(summer.format('yyyyMMdd'))){
				date = summer;
			}else if(parseFloat(summer.format('yyyyMMdd')) < parseFloat(ymd) && parseFloat(ymd) <= parseFloat(autumn.format('yyyyMMdd'))){
				date = autumn;
			}else if(parseFloat(autumn.format('yyyyMMdd')) < parseFloat(ymd) && parseFloat(ymd) <= parseFloat(winter.format('yyyyMMdd'))){
				date = winter;
			}
			while(date.getDay() == 6 || date.getDay() == 0){
				date = date.minusDays(1);
			}
			ymd = date.format('yyyyMMdd');
			val[0] = ymd;
			var temp = [];
			temp.push([val.join('|')]);
			klineJson[key] = temp;
			cback();
		},function(){
			http.pushData('','list',klineJson,'03');
			//console.log(klineJson);
		}); 
	};

	var saveKLine = function(prefix,results){
		saveMinuteKline(prefix,results,'05');
		saveMinuteKline(prefix,results,'15');
		saveMinuteKline(prefix,results,'30');
		saveMinuteKline(prefix,results,'60');
		saveDayKline(prefix,results,'DAY');
		saveWeekKline(prefix,results,'WK');
		saveMonthKline(prefix,results,'MTH');
		saveHalfYearKline(prefix,results,'HY');
		saveYearKline(prefix,results,'FY');
		saveSYearKline(prefix,results,'SY');
	};
	var saveMainKLine = function(data){
		try{
			var values = {};
			data = JSON.parse(data);
			for(var i in jsonStocks){
				var tmp = i.replace(/HQ/g,'');
				var key = tmp.slice(2,tmp.length)+'.'+tmp.slice(0,2);
				var val = data[key]
				if(val !== undefined){
					//var time = val.slice(2,3);
					var ymdhms = val[2]+''+val[3];
					var emptyIn = parseFloat(val.slice(6,7))+parseFloat(val.slice(12,13));
					var emptyOut = parseFloat(val.slice(9,10))+parseFloat(val.slice(15,16));
					//var pushValue = time+'|'+emptyIn+'|'+emptyOut;
					var pushValue = ymdhms+'|'+emptyIn+'|'+emptyOut;
					values[tmp] = [];
					values[tmp].push([pushValue]);
				}
			}
			saveKLine('KEMCF.MAIN.',values);
			//http.pushData('KEMCF.MAIN.','list',values,'03');
			log.debug('主力日K存储结束');
		}catch(ex){
      log.error(ex+'--->saveMainKLine');
		}
	}
	var saveEmptyKLine = function(data){
		try{
			var values = {};
			data = JSON.parse(data);
			for(var i in jsonStocks){
				var tmp = i.replace(/HQ/g,'');
				var key = tmp.slice(2,tmp.length)+'.'+tmp.slice(0,2);
				var val = data[key]
				if(val !== undefined){
					//var time = val.slice(2,3);
					var ymdhms = val[2]+''+val[3];
					var emptyIn = parseFloat(val.slice(6,7))+parseFloat(val.slice(12,13))+parseFloat(val.slice(48,49));
					var emptyOut = parseFloat(val.slice(9,10))+parseFloat(val.slice(15,16))+parseFloat(val.slice(51,52));
					//var pushValue = time+'|'+emptyIn+'|'+emptyOut;
					var pushValue = ymdhms+'|'+emptyIn+'|'+emptyOut;
					values[tmp] = [];
					values[tmp].push([pushValue]);
				}
			}
			saveKLine('KEMCF.EMPTY.',values);
			//http.pushData('KEMCF.EMPTY.','list',values,'03');
			log.debug('多空日K存储结束');
		}catch(ex){
			log.error(ex+'--->saveEmptyMline');
		}
	}
	var saveEmptyMline = function(data){
		try{
			var values = {};
			var sortValues = {'SORT.ECF':[]};
			data = JSON.parse(data);
			for(var i in jsonStocks){
				var tmp = i.replace(/HQ/g,'');
					var key = tmp.slice(2,tmp.length)+'.'+tmp.slice(0,2);
					var val = data[key]
					if(val !== undefined){
						var time = val.slice(2,3);
						var tmpTime = val.slice(3,4).toString();
						if(tmpTime.length === 5){
							tmpTime = '0'+tmpTime;
						}
						time = time + tmpTime;
						var emptyIn = parseFloat(val.slice(6,7))+parseFloat(val.slice(12,13))+parseFloat(val.slice(48,49));
						var emptyOut = parseFloat(val.slice(9,10))+parseFloat(val.slice(15,16))+parseFloat(val.slice(51,52));
						var netIn = parseFloat(emptyIn) - parseFloat(emptyOut);
						var sortTmp = [];
						sortTmp.push(tmp);
						sortTmp.push(netIn);
		        if (tmp.indexOf('SZ399001') == -1 && tmp.indexOf('SH000001') == -1) {
							sortValues['SORT.ECF'].push(sortTmp);
		        }
						var _tmp = [],
							tmpValues = [];
						var pushValue = time+'|'+emptyIn+'|'+emptyOut;
						_tmp.push(pushValue);
						tmpValues.push(_tmp);
						values[tmp] = tmpValues;
					}
			}
			http.pushData('MEMCF.EMPTY.','list',values,'02');
			http.pushData('','sort',sortValues,'02');
			log.debug('多空分时存储结束');
		}catch(ex){
     // log.error(ex+'--->saveEmptyMline');
		}			
	}
	var saveMainMline = function(data){
		try{
      var values = {};
			var sortValues = {'SORT.MCF':[]};
			data = JSON.parse(data);
			for(var i in jsonStocks){
				var tmp = i.replace(/HQ/g,'');
					var key = tmp.slice(2,tmp.length)+'.'+tmp.slice(0,2);
					var val = data[key]
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
						var sortTmp = [];
						sortTmp.push(tmp);
						sortTmp.push(netIn);
				    if (tmp.indexOf('SZ399001') == -1 && tmp.indexOf('SH000001') == -1) {
							sortValues['SORT.MCF'].push(sortTmp);
				    }
						var _tmp = [],
						tmpValues = [];
						var pushValue = time+'|'+mainIn+'|'+mainOut;
						_tmp.push(pushValue);
						tmpValues.push(_tmp);
						values[tmp] = tmpValues;
					}
			}
			http.pushData('MEMCF.MAIN.','list',values,'02');
			http.pushData('','sort',sortValues,'02');
			log.debug('主力分时存储结束');
		}catch(ex){
      log.error(ex+'--->saveMainMline');
		}
	}
}

exports.createMainCapital = function(){
  return new MainCapital();
}
