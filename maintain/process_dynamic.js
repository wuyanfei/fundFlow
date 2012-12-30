var async = require('async');
var _ = require('underscore');
var worker = require('./worker');
var REDIS_INSTANCE = null;
var FLAG = null;


process.on('message', function(task) {
	REDIS_INSTANCE = require('redis').createClient(task.redis.split(':')[1],task.redis.split(':')[0]);
	FLAG = task.flag;
	//console.log(task.array);
  	dealData(task.array,task.res);
}); 

var dealData = function(keys,results){
	var q = async.queue(function(item,cback){
		//console.log(q.length());
	    convertDynamic(item,results,cback);
	  },50);
	  q.drain = function(){
	    console.log(process.pid+'K线处理结束');
	    REDIS_INSTANCE.quit();
	    process.exit(0);
	  };
	  keys.forEach(function(item){
	    q.push(item,function(){});
	  });
};

var convertDynamic = function(code,results,cback){
  var key = FLAG+'.'+code.toString().toUpperCase();
    REDIS_INSTANCE.get(key,function(err,res){
      if(err){
        console.log(err);
        cback();
      }else if(res !=null){
          var temp = res.split('|');
          temp[5] = parseFloat(temp[5])*results[key.split('.')[1]];
          temp[4] = parseFloat(temp[4])*results[key.split('.')[1]];
          temp[12] = parseFloat(temp[12])*results[key.split('.')[1]];
          temp[28] = parseFloat(temp[28])*results[key.split('.')[1]];
          temp[29] = parseFloat(temp[29])*results[key.split('.')[1]];
          temp[30] = parseFloat(temp[30])*results[key.split('.')[1]];
          temp[31] = parseFloat(temp[31])*results[key.split('.')[1]];
          temp[32] = parseFloat(temp[32])*results[key.split('.')[1]];
          temp[33] = parseFloat(temp[33])*results[key.split('.')[1]];
          temp[34] = parseFloat(temp[34])*results[key.split('.')[1]];
          temp[35] = parseFloat(temp[35])*results[key.split('.')[1]];
          temp[36] = parseFloat(temp[36])*results[key.split('.')[1]];
          temp[37] = parseFloat(temp[37])*results[key.split('.')[1]];
          temp[40] = parseFloat(temp[40])*results[key.split('.')[1]];
          REDIS_INSTANCE.set(key,temp.join('|'),function(e,r){
            if(e){console.log(key+e);}
            console.log('pid:'+process.pid+key+'is over.');
            cback();
          });
      }else{
        console.log('pid:'+process.pid+','+key+'不存在');
        cback();
      }
    });
};