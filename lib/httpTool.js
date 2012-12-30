  var request = require('request');
  var configs = require('../etc/loadConfigure').configure;
    var zlib = require('zlib');
  // var log = require('./web-log').log('/opt/node-pro/logs/httpTool.log');

  exports.post = function(data, cback) {
    var str = JSON.stringify(data);
    zlib.gzip(str, function(err, buff) {
      var option = {
        method: 'POST',
        url: configs.pushUrl,
        body: buff,
        headers: {
          'accept-encoding': 'gzip,deflate'
        },
        timeout: 20000,
        pool: {
          maxSockets: 2000
        }
      };
      request(option, function(e, r, body) {
        if(e) {
          console.error('method=post,' + e + ',url=' + configs.pushUrl);
          if(cback) {
            cback(null);
          }
        } else {
          if(cback) {
            cback(body);
          }
        }
      });
    });
  }