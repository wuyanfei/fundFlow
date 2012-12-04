var http = require('./httpTool');
var async = require('async');
var configs = require('../etc/loadConfigure').configure;
var _random = require('./random');
var log = require('./web-log').log('/opt/node-pro/logs/ddSort.log');
var _ = require('underscore');
process.setMaxListeners(0);
var DDSort = function(){
	this.calculateDDSort = function(){
		async.waterfall([
			function(callback){
				saveDDZSort(callback);
			},
			function(callback){
				saveDDXSort(callback);
			},
			function(callback){
				saveDDYSort(callback);				
			}
			],function(){
				 log.debug('大单排行结束');  
		});
	}
	var saveDDXSort = function(cback){
	  var url = configs.url.ddx;
	  url = _random.random(url);
	  var values = {'SORT.DDX.TOP100':[]};
	  http.fetchData(url,function(data){
	    if(data != null){
			  for(var i in data){
			    var item = data[i].toString();
		      var val = item.split(',');
		      val[2] = decodeURIComponent(val[2]);
			    values['SORT.DDX.TOP100'].push(val.join('|'));
			  }
			  if(_.size(values)>0){
			   http.pushData('','list',values,'01');
			   log.debug('DDX 抓取成功');
			  }
			  cback(null);
			}else{
				log.error('DDX 抓取失败');
				cback(null);
			}
	  });
	}

	var saveDDYSort = function(cback){
	  var url = configs.url.ddy;
	  url = _random.random(url);
	  var values = {'SORT.DDY.TOP100':[]};
	  http.fetchData(url,function(data){
	    if(data != null){
			  for(var i in data){
			    var item = data[i].toString();
		      var val = item.split(',');
		      val[2] = decodeURIComponent(val[2]);
			    values['SORT.DDY.TOP100'].push(val.join('|'));
			  }
			  if(_.size(values)>0){
			   http.pushData('','list',values,'01');
			   log.debug('DDY抓取成功');
			  }	
		    cback(null);	  
			}else{
				log.error('DDY 抓取失败');
				cback(null);
			}
	  });
	}

	var saveDDZSort = function(cback){
	  var url = configs.url.ddz;
	  url = _random.random(url);
	  var values = {'SORT.DDZ.TOP100':[]};
	  http.fetchData(url,function(data){
	    if(data != null){
			  for(var i in data){
			    var item = data[i].toString();
		      var val = item.split(',');
		      val[2] = decodeURIComponent(val[2]);
			    values['SORT.DDZ.TOP100'].push(val.join('|'));
			  }
			  if(_.size(values)>0){
			   http.pushData('','list',values,'01');
			   log.debug('DDZ 抓取成功');
			  }
			  cback(null);
			}else{
				log.error('DDZ抓取失败');
				cback(null);
			}
	  });
	}
}
exports.createDDSort = function(){
	return new DDSort();
}
