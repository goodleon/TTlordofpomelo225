//**************************************
//三人两房----玩法!!!!
//create by huyan
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

function CGameCodeFight3p(majiang, _GLOG, _app, tTable, logid, gameid, publicIp) {
    this.majiang = majiang;
    this.GLog = _GLOG;
    this.app = _app;
    this.GLog("CGameCodeFight3p！！！");
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

g_Inherit(require("./CGameCodeDoubleCard.js"), CGameCodeFight3p)


/**
 * 玩家出牌（打牌）
 */
CGameCodeFight3p.prototype.fRecieveMjPut = function(pl, msg, session, next, tTable) {
    var isAutoPut = true;
    if (next) {
        next(null, null); //if(this.GamePause()) return;
        isAutoPut = false;
    }


    this.GLog("CGameCodeFight3p-----Table.prototype.MJPut1!!!!!!!!");
    var tData = tTable.tData;

    if (tData.tState == TableState.waitPut && pl.uid == tData.uids[tData.curPlayer]) {
        this.GLog("Table.prototype.MJPut2 fight3p");
        var cdIdx = pl.mjhand.indexOf(msg.card);
        this.GLog("Table.prototype.MJPut2_1");
        if (cdIdx >= 0) {
            if (!isAutoPut) {
                tTable.InitAutoState(pl);
            }
            if (tData.doubleCarHouse) {
                this.GLog("Table.prototype.MJPut3");
            } else {
                if (!tData.noBigWin &&
                    this.majiang.cardType(msg.card) != pl.mjMiss &&
                    this.majiang.cardTypeNum(pl.mjhand, pl.mjMiss) > 0
                ) {
                    return; //必须打缺的牌
                }
            }
            this.GLog("Table.prototype.MJPut4");

            pl.mjhand.splice(cdIdx, 1);

            pl.mjput.push(msg.card);

            pl.skipHu = 0;

            msg.uid = pl.uid;

            tData.lastPut = msg.card;

            tData.lastPutPlayer = tData.curPlayer;

            tData.tState = TableState.waitEat;

            pl.mjState = TableState.waitCard;

            pl.eatFlag = 0; //自己不能吃
            //如果message是1认为客户端点了报听
            this.GLog("Table.prototype.MJPut5");
            if (msg.ting == 1) {

                this.GLog("huyan:" + JSON.stringify(pl.mjhand));
                var maxWin = this.majiang.checkMJTing(pl, tTable);

                if (maxWin > 0 && pl.firstPick == 1) {
                    this.GLog("recieve MJPut9");
                    pl.mjting = true;
                    msg.mjting = true;
                    msg.firstPick = pl.firstPick;
                }
            }
            this.GLog("Table.prototype.MJPut6");
            if (tData.putType > 0 && tData.putType < 4) {
                tData.putType = 4;
            } else {
                tData.putType = 0;
            }
            this.GLog("Table.prototype.MJPut7");
            var GLog = this.GLog;
            var pThis = this;
            tTable.AllPlayerRun(function(p) {
                if (p != pl) {
                    if (p.mjState != TableState.roundFinish && p.winType == 0) {
                        p.eatFlag = pThis.GetEatFlag(p, tData);

                        //this.GLog(" tData.fight3p GetHuType(tData,p,tData.lastPut) = " + this.GetHuType(tData,p,tData.lastPut))
                        if (p.eatFlag & 8) {
                            var huFlag = false;
                            //海底胡之类的
                            if (tData.cardNext == tTable.cards.length) {
                                huFlag = true
                            }
                            //this.GLog("小胡不能点跑"); 
                            if (!tData.xiaohu) {
                                if (pThis.GetHuType(tData, p, tData.lastPut) > 0 && pThis.GetSkipHu(tData, p, tData.putType == 4 ? 2 : 1) == 1 && !huFlag) {
                                    p.eatFlag = p.eatFlag ^ 8;
                                }
                            }
                        }

                        if (p.eatFlag != 0) {
                            p.mjState = TableState.waitEat;
                        } else {
                            p.mjState = TableState.waitCard;
                        }
                    }
                }
            });
            this.GLog("Table.prototype.MJPut8");
            var cmd = msg.cmd;
            msg.putType = tData.putType;
            msg.eatFlag = tTable.PlayerPtys(function(p) { return p.eatFlag });
            tTable.newNotifyAllWithMsgID(cmd, msg);
            tTable.mjlog.push(cmd, msg); //打牌

            this.GLog("CGameCodeFight3p.js------------>push(cmd,msg) = ");

            this.SendNewCard(tTable, "b"); //打牌后尝试发牌
        }
        this.GLog("Table.prototype.MJPut9");
    }
}
module.exports = CGameCodeFight3p;