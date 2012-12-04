var util = require('./util').createUtil();
var http = require('./httpTool');
var configs = require('../etc/loadConfigure').configure;
//var log = require('./log').createLog('growth');
var jsonStocks;

var Growth = function(){
	this.getGrowth = function(){
		console.log('抓取成长性排行开始');
		try{
			var url = 'http://hqdata.compass.cn/zcr/tmttop50.txt?45125';
			http.fetchData(url,function(data){
			//console.log(data);
			  if(data != null){
					for(var i in data){
						data[i][0] = data[i][0].replace(/HQ/g,'');
					}
					saveGrowth(data);
			  }
			});
		}catch(ex){
		 console.log(new Date().toString()+ex);
		}
	}

	var saveGrowth = function(data){
	console.log(data);
		var val = {'SORT.GROWTH':data};
		http.pushData('','list',val,'01');
		console.log('抓取成长性排行结束');
	}
}
var growth = new Growth();
growth.getGrowth();
exports.createGrowth = function(){
	return new Growth();
}
