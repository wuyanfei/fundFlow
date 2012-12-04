var async = require('async');
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
var Worker = function(){
	this.q = async.queue(function(task,cb){
    var type = task.type;
    switch(type){
    	case 1:
    	  getStockInfo.setSelection(task.task.stocks);
    	  break;
    	case 2:
    	  getOpMeal.setOpMeal(task.task.stocks);
    	  break;
    	case 3:
    	  setSelectionModel.setSelectionModel(task.task.stocks);
    	  break;
      case 4:
        getBoardInfo.setBoardsId(task.task);
        break;
      case 5:
        boardSort.getBoardCodes(task.task);
        break;
      case 6:
        mainCapital.getMainstockCodes(task.task);
        break;
      case 7:
        stocksUnderBoard.loadCodeTable(task.task);
        break;
      case 8:
        stocksUnderBoardSort.getNet(task.task);
        break;
      case 9:
        ddSort.calculateDDSort();
        break;
      case 10:
        growth.getGrowth();
        break;
      case 11:
        stpool.calculateSTPool();
        break;
      case 12:
        validCode.startMission();
        break;
      case 13:
        salePoint.getSaleOfPoint(task.task);
        break;
    }
    cb();
	},50);
}

Worker.prototype.push = function(task){
  this.q.push(task,function(){});
}

exports.createWorker = function(){
	return new Worker();
}
