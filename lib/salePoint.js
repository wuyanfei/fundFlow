
var SalePoint = function(){
	this.binaryNum = '';
	this.type = '';
	this.time = '';
}
SalePoint.prototype.toString = function(){
	return this.time+'|'+this.binaryNum+'|'+this.type;
}
exports.SalePoint = SalePoint;