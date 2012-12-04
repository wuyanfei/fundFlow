var http = require('./httpTool');
var _ = require('underscore');
var configs = require('../etc/loadConfigure').configure;
//var log = require('./web-log').log('/opt/node-pro/logs/stpool.log');
var  Stpool = function(){
	this.calculateSTPool = function(){
		var url = configs.url.stpool
		http.request(url,function(err,data){
			if(err){
        log.error('股票池数抓取失败');
			}else{
				data = JSON.parse(data);
				if(_.size(data) == 0){
          log.error('股票池数抓取失败');
				}else{
					saveSTPool(data);
				}				
			}			
		});
	}

	var saveSTPool = function(data){		
		/**短线池 对应波段仓位*/
		var STPOOLZD = [];
		/**中线池 对应中线仓位*/
		var STPOOLZC = [];
		/**长线池 对应价值仓位*/
		var STPOOLCL = [];
		for(var i in data){
			if(i.indexOf('BARDZ') == -1){
				try{
					var val = data[i];
					var stockCode = i.slice(-2)+i.slice(0,6);
					var codeVal,binaryNum;
					/**短线*/
					binaryNum = ('00000'+val[5].toString(2)).slice(-5);
					var suffix = binaryNum.slice(-1);
					var preffix = binaryNum.slice(0,3);
					if(suffix === '1'){
						if(parseInt(preffix) > 0){
							STPOOLZD.push([stockCode,0]);
						}else{
							STPOOLZD.push([stockCode,1]);
						}
					}
					/**中线*/
					binaryNum = ('00000'+val[6].toString(2)).slice(-5);
					var suffix = binaryNum.slice(-1);
					var preffix = binaryNum.slice(0,3);
					if(suffix === '1'){
						if(parseInt(preffix) > 0){
							STPOOLZC.push([stockCode,0]);
						}else{
							STPOOLZC.push([stockCode,1]);
						}
					}
					/**长线*/
					binaryNum = ('00000'+val[7].toString(2)).slice(-5);
					var suffix = binaryNum.slice(-1);
					var preffix = binaryNum.slice(0,3);
					if(suffix === '1'){
						if(parseInt(preffix) > 0){
							STPOOLCL.push([stockCode,0]);
						}else{
							STPOOLCL.push([stockCode,1]);
						}
					}
				}catch(ex){
					log.error(ex+'stpool.js line:66');
				}
			}
		}
		/**短线*/
		var tmp = {'STPOOL.ZD':STPOOLZD};
		http.pushData('','list',tmp,'01');
	      
	     
		/**中线*/
		tmp = {'STPOOL.ZC':STPOOLZC};
		http.pushData('','list',tmp,'01');
	      
	     
		/**长线*/
		tmp = {'STPOOL.CL':STPOOLCL};
		http.pushData('','list',tmp,'01');
	  log.debug('股票池存储结束');
	}
}
exports.createStpool = function(){
	return new Stpool();
}
