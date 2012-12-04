var async = require('async');
var _ = require('underscore');
var worker = require('./worker');
var REDIS_INSTANCE = null;
var FLAG = null;


process.on('message', function(task) {
	REDIS_INSTANCE = require('redis').createClient(task.redis.split(':')[1],task.redis.split(':')[0]);
	FLAG = task.flag;
  	dealData(task.array,task.res);
}); 

var dealData = function(keys,results){
	var q = async.queue(function(item,cback){
	    convertTrade(item,results,cback);
	  },200);
	  q.drain = function(){
	    console.log(process.pid+'K线处理结束');
	    REDIS_INSTANCE.quit();
	    process.exit(0);
	  };
	  keys.forEach(function(item){
	    q.push(item,function(){});
	  });
};

var convertTrade = function(code,results,cback){
  var key = FLAG+'.'+code.toString().toUpperCase();
    REDIS_INSTANCE.lrange(key,0,-1,function(err,res){
      if(err){
        console.log(err);
         cback();
      }else if(res !=null && res.length > 0){
        res.forEachSync(function(item,index,cb){
          var temp = item.split('|');
          temp[2] = parseFloat(temp[2])*results[key.split('.')[1]];
          temp[4] = parseFloat(temp[4])*results[key.split('.')[1]];
          REDIS_INSTANCE.lset(key,index,temp.join('|'),function(e,r){
            if(e)console.log(key+e);
            cb();
          });
        },function(){
          console.log(key+'over.');
           cback();
        });
      }else{
        console.log(key+'不存在');
         cback();
      }     
    });
};

