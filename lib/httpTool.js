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

  String.prototype.contains = function(subStr) {
    return this.toString().indexOf(subStr) != -1 ? true : false;
  }
  Object.prototype.cut = function(start, end) {
    var item = this.toString();
    end = end || item.length;
    if(start >= 0 && end >= 0) return item.substring(start, end);
    else if(start < 0) return item.substring(parseInt(item.length + parseInt(start)), item.length);
  };
  Array.prototype.each = function(cb) {
    for(var i = 0; i < this.length; i++) {
      process.nextTick(function() {
        cb(this[i]);
      });
    }
  };
  Object.prototype.append = function(object) {
    return this.toString() + object.toString();
  };
  exports.request = function(url, cb, item) {
    try {
      var _timeout = configs.timeout.request;
      request.get({
        'uri': url,
        'timeout': _timeout
      }, function(error, res, body) {
        if(res && res.statusCode == 200) {
          cb(null, body, item);
        } else {
          log.error('method=request, ' + error);
          cb(error, null, item);
        }
      });
    } catch(e) {
      log.error('method=request--->try{}catch(e){}, Error=[' + e + '],url=' + url + ',item=' + item);
    }
  }

  //抓取数据
  exports.fetch = function(_url, cb, obj) {
    var u = url.parse(_url);
    var host = u.host;
    if(host.indexOf(':') != -1) {
      host = _url.split(':')[1].substring(2);
    }
    var options = {
      'host': host,
      'port': u['port'] || 80,
      'path': u['path']
    };
    var data = [];
    var nSize = 0;
    var req = http.get(options, function(res) {
      res.on('data', function(chunk) {
        data.push(chunk);
        nSize += chunk.length;
      });

      res.on('end', function() {
        var buff = new Buffer(nSize);
        var pos = 0;
        for(var i = 0; i < data.length; i++) {
          data[i].copy(buff, pos, 0, data[i].length);
          pos += data[i].length;
        }

        var newTime = new Date();
        if(res.statusCode == 200) {
          var value = buff.toString();
          if('0' === value.slice(-1)) {
            value = value.slice(0, value.length - 1);
          }
          var temp;
          try {
            temp = JSON.parse(value);
          } catch(e) {
            cb(null, obj);
          }
          if(temp == '-1' || temp == [-1]) {
            cb(null, obj);
          } else {
            cb(temp, obj);
          }
        } else {
          cb(null, obj);
          if((res.statusCode + '') != '404') {
            log.error('method=fetch,[' + _url + ']' + '抓取失败。    ' + res.statusCode);
          } else {
            log.debug('[' + _url + ']' + '抓取失败。    ' + res.statusCode);
          }

        }
      });
      req.on('close', function() {
        //log.info('closed');
      });
      res.on('error', function() { //http头错误处理
        var error = {
          error: "FETHC_URL_ERROR",
          msg: "response error"
        };
        cb(null, obj);
      });
    });

    req.on('error', function(e) {
      error.error = 'FETCH_DATA_TIME_OUT';
      error.msg = 'request timeout 100s';
      error.url = _url;
      log.error('method=fetch,' + JSON.stringify(error));
      cb(null, obj);
    });

    req.setTimeout(configs.timeout.fetch, function() {
      req.abort();
    });
  };

  exports.post = function(data, cback,type) {
      var option = {
        url: type == undefined?configs.pushUrl:configs.fetchUrl,
        json: data,
        timeout: 20000,
        pool: {
          maxSockets: 2000
        }
      };
      request.post(option, function(e, r, body) {
        if(e) {
          log.error('method=post,' + e + ',url=' + url);
          if(cback) {
            cback(null);
          }
        } else {
          if(cback) {
            cback(body);
          }
        }
      });
    }

  exports.fetchData = function(url_fetch, cback, json) {
    if(json == undefined) {
      json = {};
    }
    var url;
    var type = json['type'];
    if(type == undefined) {
      url = _random.random(url_fetch);
    } else {
      url = url_fetch;
    }
    exports.fetch(url, cback, json);
  }