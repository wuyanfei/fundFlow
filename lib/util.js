//var logger = require('./exportLog');
var Util = function(settings){
    if(settings){
      for(var i in settings.logs){
        if(!this.logPath){
          this.logPath = {};
        }else{
          this.logPath[i] = settings.logs[i];
        }        
      }
    }
}
/*从配置文件中取logPath及projectName，实例化log*/
//Util.prototype.getLog = function(projectName){
//  if(!this.log){
//    this.log = {};
//  }
//  if(this.log[projectName]){
//    return this.log[projectName];
//  }else{
//    this.log[projectName] = logger.createLog(projectName,this.logPath[projectName]);
//    return this.log[projectName];
//  }
//}
/*根据传进来的参数实例化log*/
//Util.prototype.log = function(projectName,logPath){
//  return logger.createLog(projectName,logPath);
//}
var pad = function(i){
  if (i < 10) {
      return '0' + i;
    }
    return i;
}
Date.prototype.format = function(pattern){
  var date = this;
  var year4=date.getFullYear();
  var year2=year4.toString().substring(2);
  pattern=pattern.replace(/yyyy/,year4);
  pattern=pattern.replace(/yy/,year2);

  var month=date.getMonth();
  month = month + 1;
  month = pad(month);
  pattern=pattern.replace(/MM/,month);

  var dayOfMonth=date.getDate();
  var dayOfMonth2=pad(dayOfMonth);  
  pattern=pattern.replace(/dd/,dayOfMonth2);
  pattern=pattern.replace(/d/,dayOfMonth);

  var hours=date.getHours();
  var hours2=pad(hours);
  pattern=pattern.replace(/HH/,hours2);
  pattern=pattern.replace(/H/,hours);

  var minutes=date.getMinutes();
  var minutes2=pad(minutes);
  pattern=pattern.replace(/mm/,minutes2);
  pattern=pattern.replace(/m/,minutes);

  var seconds=date.getSeconds();
  var seconds2=pad(seconds);
  pattern=pattern.replace(/ss/,seconds2);
  pattern=pattern.replace(/s/,seconds);

  var milliSeconds=date.getMilliseconds();
  pattern=pattern.replace(/S+/,milliSeconds);
  var day=date.getDay();
  var kHours=hours;
  if(kHours==0){
  kHours=24;	
  }
  var kHours2=pad(kHours);
  pattern=pattern.replace(/kk/,kHours2);
  pattern=pattern.replace(/k/,kHours);
  var KHours=hours;
  if(hours>11){
  KHours=hours-12;	
  }
  var KHours2=pad(KHours);
  pattern=pattern.replace(/KK/,KHours2);
  pattern=pattern.replace(/K/,KHours);
  var hHours=KHours;
  if(hHours==0){
  hHours=12;	
  }
  var hHours2=pad(hHours);
  pattern=pattern.replace(/hh/,hHours2);
  pattern=pattern.replace(/h/,hHours);
  return pattern;
}
Date.prototype.toString = function(){
  return this.format('yyyy-MM-dd HH:mm:ss');  
}
exports.createUtil = function(settings){
  return new Util(settings);
}
