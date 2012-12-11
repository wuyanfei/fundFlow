var util = require('./util').createUtil();
var http = require('./httpTool');
var configs = require('../etc/loadConfigure').configure;
var log = require('./web-log').log('/opt/node-pro/logs/growth.log');
var jsonStocks;

var Growth = function(){
	this.getGrowth = function(){
		log.debug('抓取成长性排行开始');
		try{
			var url = configs.url.growth;
			http.fetchData(url,function(data){
			  if(data != null){
					for(var i in data){
						data[i][0] = data[i][0].replace(/HQ/g,'');
					}
					saveGrowth(data);
			  }
			});
		}catch(ex){
		 log.error(new Date().toString()+ex);
		}
	}

	var saveGrowth = function(data){
		var val = ['list',[['SORT.GROWTH',data]]];
		http.post(val,function(){});
		log.debug('抓取成长性排行结束');
	}
}

exports.createGrowth = function(){
	return new Growth();
}
