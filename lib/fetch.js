var request = require('request');
var async = require('async');
var configs = require('../etc/loadConfigure').configure;
var zlib = require('zlib');
var log = require('./web-log').log('/opt/node-pro/logs/httpTool.log');
String.prototype.contains = function(subStr) {
  if(!this) return this;
  return this.toString().indexOf(subStr) != -1 ? true : false;
}
Object.prototype.cut = function(start, end) {
  if(!this) return this;
  var item = this.toString();
  end = end || item.length;
  if(start >= 0 && end >= 0) return item.substring(start, end);
  else if(start < 0) return item.substring(parseInt(item.length + parseInt(start)), item.length);
};
Array.prototype.each = function(cb) {
  if(!this) return this;
  for(var i = 0; i < this.length; i++) {
    cb(this[i]);
  }
};
Object.prototype.append = function(object) {
  if(!this) return this;
  return this.toString() + object.toString();
};
var q = null;
exports.post = function(url, cback) {
  if(q == null) {
    console.log('初始化队列');
    q = async.queue(function(item, cb) {
     // if(q.length() > 50) {
    //   console.log('抓取队列=' + q.length());
     // }
      doTask(item.url, item.cb,cb);
    }, 50);
  }
  q.push({
    'url': url,
    'cb': cback
  });
  var doTask = function(url, cback,cb) {
      var option = {
        method: 'GET',
        url: url,
        timeout: 10000,
        pool: {
          maxSockets: 2000
        }
      };
      request(option, function(e, r, body) {
        if(e) {
          // console.log(e, url);
          cback(null);
          cb();
        } else {
          cback(body);
          cb();
        }
      });
    }
};
// 抓取数据
// exports.fetch = function(_url, cb) {
//   var u = url.parse(_url);
//   var host = u.host;
//   if(host.indexOf(':') != -1) {
//     host = _url.split(':')[1].substring(2);
//   }
//   var options = {
//     'host': host,
//     'port': u['port'] || 80,
//     'path': u['path']
//   };
//   var data = [];
//   var nSize = 0;
//   var req = http.get(options, function(res) {
//     res.on('data', function(chunk) {
//       data.push(chunk);
//       nSize += chunk.length;
//     });
//     res.on('end', function() {
//       var buff = new Buffer(nSize);
//       var pos = 0;
//       for(var i = 0; i < data.length; i++) {
//         data[i].copy(buff, pos, 0, data[i].length);
//         pos += data[i].length;
//       }
//       var newTime = new Date();
//       if(res.statusCode == 200) {
//         var value = buff.toString();
//         if('0' === value.slice(-1)) {
//           value = value.slice(0, value.length - 1);
//         }
//         var temp;
//         try {
//           temp = JSON.parse(value);
//         } catch(e) {
//           cb(null);
//         }
//         if(temp == '-1' || temp == [-1]) {
//           cb(null);
//         } else {
//           cb(temp);
//         }
//       } else {
//         cb(null);
//         if((res.statusCode + '') != '404') {
//           log.error('method=fetch,[' + _url + ']' + '抓取失败。    ' + res.statusCode);
//         } else {
//           log.debug('[' + _url + ']' + '抓取失败。    ' + res.statusCode);
//         }
//       }
//     });
//     req.on('close', function() {
//       //log.info('closed');
//     });
//     res.on('error', function() { //http头错误处理
//       var error = {
//         error: "FETHC_URL_ERROR",
//         msg: "response error"
//       };
//       cb(null);
//     });
//   });
//   req.on('error', function(e) {
//     error.error = 'FETCH_DATA_TIME_OUT';
//     error.msg = 'request timeout 100s';
//     error.url = _url;
//     log.error('method=fetch,' + JSON.stringify(error));
//     cb(null, obj);
//   });
//   req.setTimeout(20000, function() {
//     req.abort();
//   });
// };