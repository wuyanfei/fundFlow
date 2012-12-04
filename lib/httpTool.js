  var request = require('request');
  var util = require('./util').createUtil();
  var PushModel = require('./pushModel').PushModel;
  var configs = require('../etc/loadConfigure').configure;
  var _random = require('./random');
  var http = require('http');
  var url = require('url');
  var log = require('./web-log').log('/opt/node-pro/logs/httpTool.log');
  var error = {};
  process.setMaxListeners(0);

  exports.request = function(url,cb,item){
    try{
     var _timeout = configs.timeout.request;
     request.get({ 'uri':url, 'timeout':_timeout }, function (error, res, body) {
      if(res && res.statusCode == 200){
        cb(null, body,item);
      }else{
        log.error('method=request, '+error);
         cb(error, null,item);
      }
     });
    }catch(e){
      log.error('method=request--->try{}catch(e){}, Error=['+e +'],url='+url+',item='+item);
    }
  }

  //抓取数据
  exports.fetch = function(_url,cb,obj) {
    var u=url.parse(_url);
    var host = u.host;
    if(host.indexOf(':') != -1){
       host = _url.split(':')[1].substring(2);
    }
    var options = {
      'host': host,
      'port': u['port']||80,
      'path': u['path']
    };
    var data = [];
    var nSize = 0;
    var req = http.get(options, function(res){
      res.on('data', function(chunk) {
        data.push(chunk);
        nSize +=chunk.length;
      });

      res.on('end', function() {
        var buff = new Buffer(nSize);
        var pos = 0;
        for(var i=0;i<data.length;i++){
          data[i].copy(buff,pos,0,data[i].length);
          pos +=data[i].length;
        }

        var newTime = new Date();
        if(res.statusCode == 200){
            var value = buff.toString();            
            if('0' === value.slice(-1)){
              value = value.slice(0,value.length-1);
            }
            var temp;
            try{
              temp = JSON.parse(value);
            }catch(e){
              cb(null,obj);
            }
            if(temp == '-1' || temp == [-1]){
             cb(null,obj);
            }else{
             cb(temp,obj);
            }
        }else{
      	  cb(null,obj);
          if((res.statusCode+'') != '404'){
            log.error('method=fetch,['+_url+']'+'抓取失败。    '+res.statusCode);
          }else{
            log.debug('['+_url+']'+'抓取失败。    '+res.statusCode);
          }
          
        } 
      });
      req.on('close',function(){
        //log.info('closed');
      });
      res.on('error', function(){ //http头错误处理
        var error = {
          error: "FETHC_URL_ERROR",
          msg: "response error"
        };
        cb(null,obj);
      });
    });

  	req.on('error',function(e){
  		error.error = 'FETCH_DATA_TIME_OUT';
  		error.msg = 'request timeout 100s';
      error.url = _url;
      log.error('method=fetch,'+JSON.stringify(error));
      cb(null,obj);
  	});

    req.setTimeout(configs.timeout.fetch, function(){
      req.abort();
    });
  };

  var post = function(url,_sdata,cback,count,_timeout){
    var _timeOut = _timeout || configs.timeout.post;
	  var option = {
      url: url,
      json: _sdata,
      timeout: _timeOut,
      pool: {
        maxSockets: configs.postUrl.maxSockets
      }
    };
    var reqData = function(count,sdata){
      request.post(option, function(e, r, body) {
        if (e) {
          if(count == 0){
            log.error('method=post,'+e+',url='+url);
            if(cback){
              cback(null);
            }
          }else{
            count = count - 1;
            reqData(count,sdata);
          }
        } else {
          if(cback){
            cback(body);
          }        
        }  
      });
    }
    reqData(count,_sdata);
  }
  //推送数据
  var push = function(sdata,cback) {
    var _url = configs.postUrl.url;
    post(_url,sdata,cback,0,100000);
  }
  
  /*
   * repeat为true时会重复抓取4次
   */
  exports.postData = function(url,sdata,cback,repeat){
    var count = 0;
    if(repeat){
      count = 4;
    }
    post(url,sdata,cback,count);
  }

  exports.fetchData = function(url_fetch,cback,json){
    if(json == undefined){
      json = {};
    }
    var url;
    var type = json['type'];
    if(type == undefined){
      url = _random.random(url_fetch);
    }else{
      url = url_fetch;
    }
    exports.fetch(url,cback,json);
  }

  exports.pushData = function(prefix,valType,equities,del){
    var pushModel = new PushModel();
    pushModel.prefix = prefix;
    pushModel.valType = valType;
    pushModel.equities = equities;
    pushModel.timestamp = new Date().format('yyyyMMdd');
    pushModel.del = del;
    push(pushModel);
  }

  /*
   * key是redis里的key
   * index是key所对应的value中的下标,是个数组，支持传多个
   * callback 回调函数
   * type 是数据类型string list map等
   **/
  exports.fetchDataFromRedis = function(key,index,type,stockCodes,callback){
    var interface = 'fetch';
    var value = {"interface":interface,"key":key,"index":index,"type":type,"stockCodes":stockCodes};
    push(value,callback);
  }
