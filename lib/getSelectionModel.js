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

				var temp_array = [];
				var mapData = ['map',['SELECT-MAP',temp_array];
				dapan = dapan || 0;
				for(var i in value){
					var code = temp[i];
					//console.log(code);
					var selectionVal = value[i];
					if(selectionVal == '8'){
						wenjianzhuizhang.push(code);
						temp_array.push(['SELECT-MODEL.wenjianzhuizhang',code]);
					}else if(selectionVal == '16'){
						niushihuitiao.push(code);
						temp_array.push(['SELECT-MODEL.niushihuitiao',code]);
					}else if(selectionVal == '32'){
						gaopaodixi.push(code);
						temp_array.push(['SELECT-MODEL.gaopaodixi',code]);
					}else if(selectionVal == '64'){
						qiangshihuitiao.push(code);
						temp_array.push(['SELECT-MODEL.qiangshihuitiao',code]);
					}else if(selectionVal == '128'){
						if(parseInt(dapan) == 1){
							xiongshichaodie.push(code);
							temp_array.push(['SELECT-MODEL.xiongshichaodie',code]);
						}else if(parseInt(dapan) == 2){
							zhendangchaodie.push(code);
							temp_array.push(['SELECT-MODEL.zhendangchaodie',code]);
						}else if(parseInt(dapan) == 4){
							niushichaodie.push(code);
							temp_array.push(['SELECT-MODEL.niushichaodie',code]);
						}
					}else if(selectionVal == '256'){
						if(dapan == 1){
							xiongshibuzhang.push(code);
							temp_array.push(['SELECT-MODEL.xiongshibuzhang',code]);
						}else if(dapan == 2){
							zhendangbuzhang.push(code);
							temp_array.push(['SELECT-MODEL.zhendangbuzhang',code]);
						}else if(dapan == 4){
							niushibuzhang.push(code);
							temp_array.push(['SELECT-MODEL.niushibuzhang',code]);
						}
					}else if(selectionVal == '512'){
						jijinzhuizhang.push(code);
						temp_array.push(['SELECT-MODEL.jijinzhuizhang',code]);
					}
				}
				var _temp = ['list',[['SELECT-MODEL.wenjianzhuizhang',wenjianzhuizhang],['SELECT-MODEL.jijinzhuizhang',jijinzhuizhang],
				['SELECT-MODEL.niushihuitiao',niushihuitiao],['SELECT-MODEL.niushichaodie',niushichaodie],['SELECT-MODEL.niushibuzhang',SELECT-MODEL.niushibuzhang],
				['SELECT-MODEL.gaopaodixi',gaopaodixi],['SELECT-MODEL.qiangshihuitiao',qiangshihuitiao],['SELECT-MODEL.zhendangchaodie',zhendangchaodie],
				['SELECT-MODEL.zhendangbuzhang',zhendangbuzhang],['SELECT-MODEL.xiongshichaodie',xiongshichaodie],['SELECT-MODEL.xiongshibuzhang',xiongshibuzhang]]];
				http.post(_temp,function(){});
				http.post(mapData,function(){});
			}
			],function(){
		});	
	}
}

exports.createSelectionModel = function(){
	return new SelectModel();
}
