var http = require('./httpTool');
var fetch = require('./fetch');
var configs = require('../etc/loadConfigure').configure;
var log = require('./web-log').log('growth.log');
var jsonStocks;
var sendType = '';
var Growth = function(){
	this.getGrowth = function(cb,type){
		sendType = type;
		var temp = [];
		log.debug('抓取成长性排行开始');
		try{
			var url = configs.url.growth;
			url = url +(parseInt(Math.random()*1000+1))+'';
			fetch.post(url,function(data){
				// console.log(data);
			  if(data != null && data !='[-1]0' && data != '[-6]0'){
			  	try{
			  		data = JSON.parse(data);
			  		for(var i=0;i<data.length;i++){
						data[i][0] = data[i][0].replace(/HQ/g,'');
						temp.push(data[i].join('|'));
					}
					saveGrowth(temp,cb);
			  	}catch(ex){
			  		console.log(ex.stack);
			  		cb({'sendType':sendType,'error':'err'});
			  	}					
			  }
			});
		}catch(ex){
		 log.error(new Date().toString()+ex);
		 cb({'sendType':sendType,'error':'err'});
		}
	}

	var saveGrowth = function(data,cb){
		var val = ['list',[['SORT.GROWTH',data]]];
		cb({'data':val,'type':'oneList','sendType':sendType});
		// http.post(JSON.stringify(val),function(){});
		log.debug('抓取成长性排行结束');
	}
}

exports.createGrowth = function(){
	return new Growth();
}
