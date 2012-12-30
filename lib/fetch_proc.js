var getStockInfo = require('./getStockInfo').createStockInfo();
var getOpMeal = require('./getOpMeal').createOpMeal();
var setSelectionModel = require('./getSelectionModel').createSelectionModel();
var getBoardInfo = require('./getBoardInfo').createBoardInfo();
var boardSort = require('./boardSort').createBoardSort();
var mainCapital = require('./mainCapital').createMainCapital();
var stocksUnderBoard = require('./stocksUnderBoard').createStocksUnderBoard();
var stocksUnderBoardSort = require('./stocksUnderBoardSort').createStocksUnderBoardSort();
var ddSort = require('./ddSort').createDDSort();
var growth = require('./growth').createGrowth();
var stpool = require('./stpool').createStpool();
var salePoint = require('./getSalePoint').createSalePoint();
var validCode = require('./validCode').createGetValidCode();

process.on('message',function(obj){
  var type = obj.type;
  var data = obj.data;
  deal(type,data,function(res){
      process.send(res);
  });
});
var deal = function(type,data,cback){
    switch(type){
      case 1:
        getStockInfo.setSelection(data,cback,type);
        break;
      case 2:
        getOpMeal.setOpMeal(data,cback,type);
        break;
      case 3:
        setSelectionModel.setSelectionModel(data,cback,type);
        break;
      case 4:
        getBoardInfo.setBoardsId(data,cback,type);
        break;
      case 5:
        boardSort.getBoardCodes(data,cback,type);
        break;
      case 6:
        mainCapital.getMainstockCodes(data,cback,type);
        break;
      case 7:
        stocksUnderBoard.loadCodeTable(data,cback,type);
        break;
      case 8:
        stocksUnderBoardSort.getNet(data,cback,type);
        break;
      case 9:
        ddSort.calculateDDSort(cback,type);
        break;
      case 10:
        growth.getGrowth(cback,type);
        break;
      case 11:
        stpool.calculateSTPool(cback,type);
        break;
      case 12:
        validCode.startMission(cback,type);
        break;
      case 13:
        salePoint.getSaleOfPoint(data,cback,type);
        break;
    }
}