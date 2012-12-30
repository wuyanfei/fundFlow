var BoardInfo = function(){
	this.amountTime = '';					//板块资金时间
	this.inAmount = 0;					//板块资金总流入
	this.outAmount = 0;				//板块资金总流出
	this.totalAmount = 0;			//板块资金总流量
	this.markup = 0;						//板块涨跌幅
	this.potency = 0;					//板块力度
	this.upSpace = 0;					//上涨空间
	this.priceEarningsRatio = 0;	//市盈率（动）
	this.marketRate = 0;				//市场比
	this.upStockCount = 0;					//领涨股
	this.upRatio = 0;						//领涨股所占比例
	this.amount = 0;                    //成交额等于板块下所有股票成交额之和
	this.code = '';				//板块/股票代码
	this.id = '';					//板块/股票ID
	this.name = '';				//板块/股票名称
	this.time = '';					//牛市熊市的时间
	this.marketSituation = 0;	//市场形势 1熊;2震荡;4牛
	this.stockPoolType = 0;	
}
exports.BoardInfo = BoardInfo;