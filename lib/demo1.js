
var async = require('async');
var _ = require('underscore');
var directory = '/opt/node-pro/loggs/';
var Monitor = function(){
	this.q = async.queue(function(task,cb){
    var name = directory+task.name+'.log';
    var messages = task.message;
    var log = require('./log').getLog('',name);
    if(messages && _.size(messages)>0){
	    for(var i in messages){
	    	log.debug(messages[i]);
	    }
    }
    cb();
	},10);
}

Monitor.prototype.push = function(task){
  this.q.push(task,function(err){
  	//console.error(err);
  });
}

exports.createMonitor = function(){
	return new Monitor();
}

