var http = require('./httpTool');
var configs = require('../etc/loadConfigure').configure;
var _ = require('underscore');
var async = require('async');
var ids = [];
var SelectModel = function(){
	this.setSelectionModel = function(stocks){
		var url = configs.url.selectionModel;
		var sdata1 = ["S", "SHHQ",150];
		var sdata2 = ["S", "SZHQ",150];
		async.waterfall([
			function(callback){
				var temp = {};
				var value = {};
				for(var i in stocks){
	        var stockInfo = stocks[i];
	        var id = stockInfo.id;
				  temp[id] = stockInfo.code.replace(/HQ/g,'');
				}
				callback(null,temp,value);
			},
			function(temp,value,callback){
				http.postData(url,sdata1,function(data){
	         if(data){
						for(var i in data){
							value[data[i][0]] = data[i][4];
						}
						callback(null,temp,value);
					}else{
						callback(null,temp,value);
					}
				},true);
			},
			function(temp,value,callback){
				http.postData(url,sdata2,function(data){
					if(data){
						for(var i in data){
							value[data[i][0]] = data[i][4];
						}
						callback(null,temp,value);
					}else{
						callback(null,temp,value);
					}
				});
			},
			function(temp,value,callback){
				var dapan = value['55351'];
				var wenjianzhuizhang = [];
				var jijinzhuizhang = [];
				var niushihuitiao = [];
				var niushichaodie = [];
				var niushibuzhang = [];
				var gaopaodixi = [];
				var qiangshihuitiao = [];
				var zhendangchaodie = [];
				var zhendangbuzhang = [];
				var xiongshichaodie = [];
				var xiongshibuzhang = [];

				var mapData = {};
				dapan = dapan || 0;
				for(var i in value){
					var code = temp[i];
					//console.log(code);
					var selectionVal = value[i];
					if(selectionVal == '8'){
						wenjianzhuizhang.push(code);
						mapData[code] = ['SELECT-MODEL.wenjianzhuizhang'];
					}else if(selectionVal == '16'){
						niushihuitiao.push(code);
						mapData[code] = ['SELECT-MODEL.niushihuitiao'];
					}else if(selectionVal == '32'){
						gaopaodixi.push(code);
						mapData[code] = ['SELECT-MODEL.gaopaodixi'];
					}else if(selectionVal == '64'){
						qiangshihuitiao.push(code);
						mapData[code] = ['SELECT-MODEL.qiangshihuitiao'];
					}else if(selectionVal == '128'){
						if(parseInt(dapan) == 1){
							xiongshichaodie.push(code);
							mapData[code] = ['SELECT-MODEL.xiongshichaodie'];
						}else if(parseInt(dapan) == 2){
							zhendangchaodie.push(code);
							mapData[code] = ['SELECT-MODEL.zhendangchaodie'];
						}else if(parseInt(dapan) == 4){
							niushichaodie.push(code);
							mapData[code] = ['SELECT-MODEL.niushichaodie'];
						}
					}else if(selectionVal == '256'){
						if(dapan == 1){
							xiongshibuzhang.push(code);
							mapData[code] = ['SELECT-MODEL.xiongshibuzhang'];
						}else if(dapan == 2){
							zhendangbuzhang.push(code);
							mapData[code] = ['SELECT-MODEL.zhendangbuzhang'];
						}else if(dapan == 4){
							niushibuzhang.push(code);
							mapData[code] = ['SELECT-MODEL.niushibuzhang'];
						}
					}else if(selectionVal == '512'){
						jijinzhuizhang.push(code);
						mapData[code] = ['SELECT-MODEL.jijinzhuizhang'];
					}
				}
				var _temp = {'SELECT-MODEL.wenjianzhuizhang':wenjianzhuizhang};
				http.pushData('','list',_temp,'01');

				_temp = {'SELECT-MODEL.jijinzhuizhang':jijinzhuizhang};
				http.pushData('','list',_temp,'01');

				_temp = {'SELECT-MODEL.niushihuitiao':niushihuitiao};
				http.pushData('','list',_temp,'01');

				_temp = {'SELECT-MODEL.niushichaodie':niushichaodie};
				http.pushData('','list',_temp,'01');

				_temp = {'SELECT-MODEL.niushibuzhang':niushibuzhang};
				http.pushData('','list',_temp,'01');

				_temp = {'SELECT-MODEL.gaopaodixi':gaopaodixi};
				http.pushData('','list',_temp,'01');

				_temp = {'SELECT-MODEL.qiangshihuitiao':qiangshihuitiao};
				http.pushData('','list',_temp,'01');

				_temp = {'SELECT-MODEL.zhendangchaodie':zhendangchaodie};
				http.pushData('','list',_temp,'01');

				_temp = {'SELECT-MODEL.zhendangbuzhang':zhendangbuzhang};
				http.pushData('','list',_temp,'01');

				_temp = {'SELECT-MODEL.xiongshichaodie':xiongshichaodie};
				http.pushData('','list',_temp,'01');

				_temp = {'SELECT-MODEL.xiongshibuzhang':xiongshibuzhang};
				http.pushData('','list',_temp,'01');

				http.pushData('SELECT-MAP','map',mapData,'00');

			}
			],function(){
		});	
	}
}

exports.createSelectionModel = function(){
	return new SelectModel();
}
