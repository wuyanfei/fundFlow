var gzip = require('gzip');
var str = '吴燕飞sdfasfafdf';
var dd = str;
var zlib = require('zlib');
var bb = new Buffer(dd);
gzip(str,function(err,data){
  console.log(data);
  zlib.unzip(data,function(e,r){
    console.log(e);
    console.log(r.toString());
  })
});

