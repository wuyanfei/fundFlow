
var StockInfo = function(){
	this.boardCode = '';
	this.stockCode = '';
	this.emptyTime = '';
	this.emptyMainInPrice = 0;
	this.emptyMainOutPrice = 0;
	this.emptyRetailInPrice = 0;
	this.emptyRetailOutPrice = 0;
	this.mainTime = '';
	this.mainInPrice = 0;
	this.mainOutPrice = 0;
	this.retailInPrice = 0;
	this.retailOutPrice = 0;
	this.organInPrice = 0;
	this.organOutPrice = 0;
	this.inflowsStrength = 0;
	this.dragBrace1 = 0;
	this.dragBrace2 = 0;
	this.dragBrace3 = 0;
	this.dbPrice = 0;
	this.traded= 0;
	this.cyw = 0;
	this.grailRisk = 0;
	this.industrialRisk = 0;
	this.stocksRisk = 0;
	this.boardList = {};
	this.code = '';
	this.id = '';
	this.name = '';
	this.time = '';
	this.marketSituation = 0;
	this.stockPoolType = 0;
}
exports.StockInfo = StockInfo;