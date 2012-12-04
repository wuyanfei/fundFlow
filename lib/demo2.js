var worker = require('./demo1').createMonitor();
var util = require('./util').createUtil();
var redis = require('redis').createClient(6390,'172.16.39.44');

var messages = function(){
	var name = new Date().format('yyyyMMddHHmm');
	var task = {
		"name":name
	};
	redis.lrange('MLINE.SH000001',0,-1,function(ee,rr){
    if(rr){
    	task.message = rr;
    }
    worker.push(task);		
	});	
}
var startMission = function () {
  messages();
  setInterval(function(){
  	messages();
  },60000);
}
startMission();