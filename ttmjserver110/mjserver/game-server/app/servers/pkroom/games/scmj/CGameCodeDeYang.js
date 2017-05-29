//**************************************
//德阳麻将----玩法
//create by likecheng
//
/**
 * 拍桌状态
 */
var TableState = {
        waitJoin: 1,
        waitReady: 2,
        waitPut: 3,
        waitEat: 4,
        waitCard: 5,
        roundFinish: 6,
        isReady: 7,
        waitMiss: 8, //选缺
        waitChange: 9
    }
    /**
     * 赢的状态
     */
var WinType = {
    eatPut: 1, //普通出牌点炮 
    eatGangPut: 2, //开杠打牌点炮
    eatGang: 3, //抢杠
    pickNormal: 4, //普通自摸
    pickGang1: 5, //吃牌开明杠后补牌自摸(点杠者包3家)
    pickGang23: 6 //摸牌开杠补牌自摸
}

var fs = require('fs');

function CGameCodeDeYang(majiang, _GLOG, _app, tTable, logid, gameid, publicIp) {
    this.majiang = majiang;
    this.GLog = _GLOG;
    this.app = _app;
    this.GLog("CGameCodeDeYang-----构造函数");
    this.tTable = tTable;
    this.existCheck = {};
    this.logid = logid;
    this.gameid = gameid;
    this.publicIp = publicIp;
    // this.tData 		  = tTable.tData;
    // this.NotifyAll 	  = tTable.NotifyAll;
    // this.mjlog 		  = tTable.mjlog;//打牌
    // this.AllPlayerRun = tTable.AllPlayerRun;
    // this.PlayerPtys	  = tTable.PlayerPtys;
    // this.AllPlayerCheck = tTable.AllPlayerCheck;
    //this.players = tTable.players
}

/**
 * 继承方法
 */
function g_Inherit(superType, subType) {
    var _prototype = Object.create(superType.prototype);
    _prototype.constructor = subType;
    subType.prototype = _prototype;
}

g_Inherit(require("./CGameCodeFightEnd.js"), CGameCodeDeYang)

module.exports = CGameCodeDeYang;