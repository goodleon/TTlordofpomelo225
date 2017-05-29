//**************************************
//玩法-内江麻将----CGameCodeDoubleCard
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

function CGameCodeDoubleCard(majiang, _GLOG, _app, tTable, logid, gameid, publicIp) {
    this.majiang = majiang;
    this.GLog = _GLOG;
    this.app = _app;
    this.GLog("CGameCodeDoubleCard");
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

g_Inherit(require("./CGameCodeFightEnd.js"), CGameCodeDoubleCard)


//发牌不要求在线
CGameCodeDoubleCard.prototype.SendNewCard = function(tb, from) {
    var tData = tb.tData;
    var cards = tb.cards;
    //console.info(from+" newCard "+tb.AllPlayerCheck(function(pl){ return pl.mjState==TableState.waitCard||(!tData.noBigWin&&pl.mjState==TableState.roundFinish )  }));
    this.GLog("SendNewCard--------------->1  TableState " + JSON.stringify(TableState));
    if (tb.AllPlayerCheck(function(pl) {
            return pl.mjState == TableState.waitCard || (!tData.noBigWin && pl.mjState == TableState.roundFinish)
        })) {
        this.GLog("SendNewCard------------>2");
        this.GLog("tData.cardNext = " + tData.cardNext);
        this.GLog("tData.cardNext = " + cards.length);
        if (tData.cardNext < cards.length) {
            this.GLog("SendNewCard------------>3 curPlayer: " + tData.curPlayer);
            var newCard = cards[tData.cardNext++];
            if (tData.putType == 0 || tData.putType == 4) {
                tData.curPlayer = (tData.curPlayer + 1) % tData.maxPlayers;
                this.GLog("SendNewCard------------>3  __ 1 curPlayer: " + tData.curPlayer);
            }
            if (!tData.noBigWin) //跳过已经胡的玩家
            {
                this.GLog("SendNewCard------------>4 maxPlayers: " + tData.maxPlayers + "  Uids: " + JSON.stringify(tData.uids));
                for (var i = 0; i < tData.maxPlayers; i++) {
                    this.GLog("SendNewCard------------>4__1__ i: " + i);
                    var uid = tData.uids[(tData.curPlayer + i) % tData.maxPlayers];
                    var pi = tb.getPlayer(uid);
                    this.GLog("SendNewCard------------>4__2__ uid: " + uid);
                    if (pi.winType <= 0) {
                        tData.curPlayer = (tData.curPlayer + i) % tData.maxPlayers;
                        this.GLog("SendNewCard------------>4__3__ curPlayer: " + tData.curPlayer);
                        break;

                    }
                }
            }
            this.GLog("SendNewCard------------>4 end");
            if (tData.huLastPlayer >= 0) {
                var getCurPlayer = -1;
                for (var i = 1; i < tData.maxPlayers; i++) {
                    var huPlayer = (tData.huLastPlayer + i) % tData.maxPlayers;
                    var uid = tData.uids[huPlayer];
                    var pi = tb.getPlayer(uid);
                    if (pi.winType <= 0) {
                        getCurPlayer = huPlayer;
                        break;
                    }
                }
                tData.curPlayer = getCurPlayer;
                tData.huLastPlayer = -1;
                this.GLog("Dingo:  curPlayer : " + tData.curPlayer);
            }
            this.GLog("SendNewCard------------>5");
            var uid = tData.uids[tData.curPlayer];
            pl = tb.getPlayer(uid);
            pl.mjhand.push(newCard);
            pl.isNew = true;
            pl.getNum++;
            tData.tState = TableState.waitPut;
            tb.AllPlayerRun(function(pl) {
                if (pl.mjState != TableState.roundFinish) pl.mjState = TableState.waitPut;
                pl.eatFlag = 0;
            });
            if (pl.onLine) {
                var msg = {};
                pl.firstPick++;
                msg.firstPick = pl.firstPick;
                msg.newCard = newCard
                    //pl.notify("newCard",newCard);
                pl.notifyWithMsgID("newCard", msg);
                pl.pengFlag = false;
                this.GLog("SendNewCard------------>6");
            }
            if (!tData.noBigWin && tData.cardNext == (13 * 4 + 1)) //首次发牌 选缺
            {
                //如果两牌房去掉定缺和换牌
                this.GLog("SendNewCard------------>tData.doubleCarHouse=" + tData.doubleCarHouse + " tData.with3=" + tData.with3);
                if (tData.doubleCarHouse) {
                    if (tData.with3) { //add by wcx 内江开启 换三张
                        tData.tState = TableState.waitChange;
                        tb.AllPlayerRun(function(p) { p.mjState = TableState.waitChange; });
                    }
                } else {
                    if (tData.with3) {
                        tData.tState = TableState.waitChange;
                        tb.AllPlayerRun(function(p) { p.mjState = TableState.waitChange; });
                    } else {
                        tData.tState = TableState.waitMiss;
                        tb.AllPlayerRun(function(p) { p.mjState = TableState.waitMiss; });
                    }
                }
            }
            this.GLog("SendNewCard------------>7");
            tb.newNotifyAllWithMsgID("waitPut", tData);
            tb.AllPlayerRun(function(p) { p.eatFlag = 0; });
            tb.mjlog.push("newCard", this.app.CopyPtys(tData)); //发牌
            this.GLog("SendNewCard------------>8");
            this.GLog("CGameCodeDoubleCard.js------------>newCard");
            return true;
        } else //没有牌了 
        {
            // if(tData.blood){
            //     this.EndCalBloodWinOne(tb);
            // }

            this.GLog("gameEnd");
            this.EndGame(tb, null);
        }
    }
    this.GLog("SendNewCard--------------->end");
    return false;
}

CGameCodeDoubleCard.prototype.EndGame = function(tb, pl, byEndRoom) {
    var tData = tb.tData;
    var fakeWin = [];
    var fakeLose = [];
    var gThis = this;
    tb.AllPlayerRun(function(p) {
        p.mjState = TableState.roundFinish;
        if (!pl && !byEndRoom) {
            if (p.winType == 0) {
                if (!tData.noBigWin) {
                    //检测是否停牌 停牌的为赢家 
                    p.baseWin = gThis.majiang.missHandMax(p, tData, true);
                    if (p.baseWin > 0) {
                        fakeWin.push(p);
                        if (p.baseWin > tData.maxWin) p.baseWin = tData.maxWin;
                    } else {
                        fakeLose.push(p);
                    }
                } else tData.wuid.push(p.uid);
            }
        }

    });
    //处理血站查大叫描述问题
    //if(!tData.noBigWin)
    //{
    //if( tData.blood )
    //{
    for (var j = 0; j < fakeWin.length; j++) {
        var pW = fakeWin[j];
        //添加查大叫描述
        if (fakeLose.length == 0) {

        } else {
            this.majiang.missHandMax(pW, tData);
        }

    }
    //}
    // else
    // {
    //     for(var j=0;j<fakeWin.length;j++)
    //     {
    //         var pW=fakeWin[j];
    //         this.majiang.missHandMax(pW,tData);
    //     }
    //     for(var i=0;i<fakeLose.length;i++)
    //     {
    //         var pW=fakeLose[i];
    //         this.majiang.missHandMax(pW,tData);
    //     }
    // }

    //}

    //if(!tData.noBigWin)
    //{
    //查大叫
    for (var j = 0; j < fakeWin.length; j++) {
        var pW = fakeWin[j];
        if (tData.wuid.indexOf(pW.uid) < 0) {
            tData.wuid.push(pW.uid);
        }

        if (fakeLose.length == 0) {
            pW.baseWin = 0;
            pW.mjhand.length = pW.mjhand.length - 1;
            //if(tData.blood){
            // pW.mjdesc=[];
            //}
            // else
            // {
            //pW.mjdesc=[];
            // }
        }
    }
    for (var i = 0; i < fakeLose.length; i++) {
        var pL = fakeLose[i];
        pL.mjdesc.push("查大叫");
        this.ReturnGangWin(tb, pL, false);
        if (tData.wuid.indexOf(pL.uid) < 0) {
            tData.wuid.push(pL.uid);
        }
        for (var j = 0; j < fakeWin.length; j++) {
            var pW = fakeWin[j];
            pW.winone += pW.baseWin;
            pL.winone -= pW.baseWin;
        }
    }

    //}
    tData.tState = TableState.roundFinish;
    tb.clearTimeout4Table123(tb);
    tb.clearAllPlayersTrustee();
    var owner = tb.players[tData.uids[0]].info;
    if (!byEndRoom && !tb.tData.coinRoomCreate) {
        if (!owner.$inc) {
            if (tb.isFree(tb)) {
                owner.$inc = { money: 0 };
            } else {
                owner.$inc = { money: -tb.createPara.money };
            }

        }

        tb.AllPlayerRun(function(p) {
            if (!p.info.$inc) {
                //GLog("===初始化 playNum=1");
                p.info.$inc = { playNum: 1 };
            } else if (!p.info.$inc.playNum) {
                p.info.$inc.playNum = 1;
            } else {
                p.info.$inc.playNum += 1;
                //GLog("===增加 playNum="+p.info.$inc.playNum);
            }
        });
    }
    tb.AllPlayerRun(function(p) {
        p.winall += p.winone;
        // 金币场
        if (tb.tData.coinRoomCreate) {
            var info = p.info;
            if (!info.$inc) {
                info.$inc = { coin: 0 };
            }
        }

        tb.InitAutoState(p);
    });
    tData.roundNum--;

    var roundEnd = {};
    if (tb.tData.coinRoomCreate) {
        if (tb.calculateCoin()) {
            tData.roundNum = 0;
        }
        roundEnd = {
            players: tb.collectPlayer('mjhand',
                'mjdesc',
                'winone',
                'winall',
                'winType',
                'baseWin',
                'mjhu',
                'autoState',
                'winCoinOne',
                'winCoinAll',
                'coin'),
            tData: this.app.CopyPtys(tData)
        };
    } else {
        roundEnd = {
            players: tb.collectPlayer('mjhand',
                'mjdesc',
                'winone',
                'winall',
                'winType',
                'baseWin',
                'mjhu'),
            tData: this.app.CopyPtys(tData)
        };
    }

    // var roundEnd = { players: tb.collectPlayer('mjhand', 'mjdesc', 'winone', 'winall', 'winType', 'baseWin', 'mjhu'), tData: this.app.CopyPtys(tData) };
    tb.mjlog.push("roundEnd", roundEnd); //一局结束
    this.GLog("CGameCodeDoubleCard.js------------>roundEnd");
    var playInfo = null;
    if (tData.roundNum == 0) {
        playInfo = this.EndRoom(tb); //结束
    } else if (tData.coinRoomCreate && !tData.isVIPTable) { //非vip房
        playInfo = this.EndRoom(tb); //结束
    }
    if (playInfo) {
        roundEnd.playInfo = playInfo;
    }
    tb.newNotifyAllWithMsgID("roundEnd", roundEnd);
}



CGameCodeDoubleCard.prototype.EndCalBloodWinOne = function(tb) {
    var tData = tb.tData;
    this.GLog("EndCalBloodWinOne");
    for (var i = 0; i < tData.huResult.length; i++) {
        var plEnd = tb.players[tData.huResult[i].uid];
        //plEnd.mjdesc=[];
        //plEnd.winone+=tData.huResult[i].winone;
        //break;
    }
    tData.huResult = [];
}

/**
 * 杠 
 */
CGameCodeDoubleCard.prototype.MJGang = function(pl, msg, session, next, pTable) {
    this.GLog("huyan:Table.prototype.MJGang");
    var isAutoPut = true;
    if (next) {
        next(null, null); //if(this.GamePause()) return;
        isAutoPut = false;
    }
    var tData = pTable.tData;
    //不可以杠缺的牌
    if (!tData.noBigWin && this.majiang.cardType(msg.card) == pl.mjMiss) {
        return;
    }
    var isBlood = false;

    if (pl.mjhu.length == 0) {
        isBlood = true;
    } else if (pl.mjpeng.indexOf(pl.mjhand[pl.mjhand.length - 1]) >= 0) {
        isBlood = true;
    }


    if (!isBlood) {
        this.GLog("DoubleCard:Table.prototype.MJGang blood return");
        return;
    }

    if (
        //最后一张不能杠		
        tData.cardNext < pTable.cards.length &&
        (
            tData.tState == TableState.waitEat && pl.mjState == TableState.waitEat && tData.uids[tData.curPlayer] != pl.uid &&
            (
                pTable.AllPlayerCheck(function(p) {
                    if (p == pl) {
                        return true;
                    } else {
                        //this.GLog("p.eatFlag = " + p.eatFlag);
                        return p.eatFlag < 4;
                    }
                }))
            //摸牌杠
            ||
            tData.tState == TableState.waitPut && pl.mjState == TableState.waitPut && tData.uids[tData.curPlayer] == pl.uid
        )
    )

    {
        var hand = pl.mjhand;
        var handNum = 0;
        for (var i = 0; i < hand.length; i++) {
            if (hand[i] == msg.card) {
                handNum++;
            }
        }

        if (!isAutoPut) {
            pTable.InitAutoState(pl);
        }

        if (tData.tState == TableState.waitEat && handNum == 3 && tData.lastPut == msg.card) {

            var fp = pTable.getPlayer(tData.uids[tData.curPlayer]);
            var mjput = fp.mjput;
            if (mjput.length > 0 && mjput[mjput.length - 1] == msg.card) {
                mjput.length = mjput.length - 1;
            } else {
                return;
            }
            fp.mjdesc.push("点杠");
            pl.mjgang0.push(msg.card); //吃明杠
            pl.gang0uid[msg.card] = tData.curPlayer;
            pl.lastGangPlayer = tData.curPlayer; //记录点明杠的玩家 目前只记录明杠
            hand.splice(hand.indexOf(msg.card), 1);
            hand.splice(hand.indexOf(msg.card), 1);
            hand.splice(hand.indexOf(msg.card), 1);
            msg.gang = 1;
            msg.from = tData.curPlayer;
            pl.isNew = false;
            pl.getNum++;

        } else if (tData.tState == TableState.waitPut && handNum == 4) {
            pl.mjgang1.push(msg.card); //暗杠
            hand.splice(hand.indexOf(msg.card), 1);
            hand.splice(hand.indexOf(msg.card), 1);
            hand.splice(hand.indexOf(msg.card), 1);
            hand.splice(hand.indexOf(msg.card), 1);
            msg.gang = 3;
        } else if (tData.tState == TableState.waitPut && handNum == 1 && pl.mjpeng.indexOf(msg.card) >= 0 && pl.mjpeng4.indexOf(msg.card) < 0) {
            pl.mjgang0.push(msg.card); //自摸明杠
            hand.splice(hand.indexOf(msg.card), 1);
            pl.mjpeng.splice(pl.mjpeng.indexOf(msg.card), 1);
            msg.gang = 2;
        } else {
            return;
        }
        pl.lastGang = msg.card;
        tData.putType = msg.gang; //  1 吃明杠 2  自摸明杠 3  暗杠
        tData.lastPut = msg.card;
        msg.uid = pl.uid;
        var canEatGang = msg.gang == 2 && tData.canEatHu; //血战和倒倒胡只有自摸名杠可以抢
        var eatGangOK = false;
        var gThis = this;
        pTable.AllPlayerRun(function(p) {
            if (p.mjState != TableState.roundFinish) p.mjState = TableState.waitCard;
            p.eatFlag = 0;

            //开杠马上结算
            if (p != pl && p.mjState != TableState.roundFinish) {
                if (msg.gang == 1) {
                    if (p.uid == tData.uids[tData.curPlayer]) {
                        p.winone -= 2;
                        pl.winone += 2;
                        pl.gangWin[msg.card + "|" + p.uid] = 2;
                        //this.GLog( "huyan:pl.gangWin1" + pl.gangWin[msg.card+"|"+p.uid] );
                    }
                } else if (msg.gang == 2) {
                    p.winone--;
                    pl.winone++;
                    pl.gangWin[msg.card + "|" + p.uid] = 1;
                    //this.GLog( "huyan:pl.gangWin2" + pl.gangWin[msg.card+"|"+p.uid] );
                } else if (msg.gang == 3) {
                    p.winone -= 2;
                    pl.winone += 2;
                    pl.gangWin[msg.card + "|" + p.uid] = 2;
                    //this.GLog( "huyan:pl.gangWin3" + pl.gangWin[msg.card+"|"+p.uid] );
                }
            }
            if (canEatGang && p != pl) {
                //this.GLog("huyan:canEatGang1" )
                var hType = gThis.GetHuType(tData, p, msg.card); //开杠测试
                if (hType > 0 && gThis.GetSkipHu(tData, p, 2) > p.skipHu) //开杠胡
                {
                    if (p.skipHu > 0) //遇到了番数更高的胡,通知客户端skipHu可以解锁
                    {
                        p.skipHu = 0;
                        p.notify("skipHu", { skipHu: true });
                        //this.GLog("skipHu false");

                    }
                    if (tData.canEatHu) {
                        if (msg.gang != 3 || hType == 13) {
                            p.mjState = TableState.waitEat;
                            p.eatFlag = 8;
                            eatGangOK = true;
                            //this.GLog("huyan:MJGang2" )
                        } else {
                            //this.GLog("huyan:MJGang3" )
                        }
                    } else {
                        if (msg.gang != 3 || hType == 13) {
                            p.mjState = TableState.waitEat;
                            p.eatFlag = 8;
                            eatGangOK = true;
                            //this.GLog("huyan:MJGang4" )
                        } else {
                            //this.GLog("huyan:MJGang5" )
                        }
                    }

                } else {
                    //this.GLog("huyan:canEatGang error" );
                    //this.GLog("huyan:canEatGang hType=" + hType );
                    //this.GLog("huyan:GetSkipHu hType=" + (GetSkipHu(tData,p,2)>p.skipHu) );
                }
            }
        });
        this.GLog("huyan:MJGang6")
        msg.winone = pTable.PlayerPtys(function(p) { return p.winone; });
        msg.eatFlag = pTable.PlayerPtys(function(p) { return p.eatFlag });
        pTable.newNotifyAllWithMsgID('MJGang', msg);
        pTable.mjlog.push('MJGang', msg); //杠
        this.GLog("CGameCodeDoubleCard.js------------>MJGang");
        tData.curPlayer = tData.uids.indexOf(pl.uid);
        tData.tState = TableState.waitEat;
        this.SendNewCard(pTable, "d"); //杠后尝试补牌
    } else {

        if (tData.tState == TableState.waitPut && pl.mjState == TableState.waitPut && tData.uids[tData.curPlayer] == pl.uid) {

        } else {
            this.GLog("huyan:error tData.tState " + tData.tState);
            this.GLog("huyan:error pl.mjState " + pl.mjState);
        }
        //console.error(tData.tState+" "+pl.mjState+" "+tData.uids[tData.curPlayer]+" "+pl.uid);
    }
}


/**
 * 过(什么都不干) tag fix
 */
CGameCodeDoubleCard.prototype.MJPass = function(pl, msg, session, next, tTable) {
    var tData = tTable.tData;
    var swFlag = pl.eatFlag;
    if (tData.tState == TableState.waitEat && pl.mjState == TableState.waitEat && pl.winType <= 0) {
        if (tData.cardNext == tTable.cards.length) {
            var compare = pl.eatFlag & 4;
            if (compare == 4) {
                pl.eatFlag = pl.eatFlag - 4;
            }
        }
        this.GLog("pl.eatFlag" + pl.eatFlag);
        if (pl.eatFlag == msg.eatFlag && tTable.CheckPlayerCount(function(p) {
                if (p != pl) {
                    var pe = p.eatFlag;
                    if (pe >= 8) pe = 8;
                    else if (pe >= 4) pe = 4;
                    else if (pe >= 2) pe = 2;
                    var me = msg.eatFlag;
                    if (me >= 8) me = 8;
                    else if (me >= 4) me = 4;
                    else if (me >= 2) me = 2;
                    if (pe > me) return true;
                }
                return false;
            }) == 0) {
            this.GLog("this.MJPass");
            tTable.InitAutoState(pl) //add by wcx 
            tTable.mjlog.push("MJPass", { uid: pl.uid, eatFlag: msg.eatFlag }); //发牌
            this.GLog("CGameCodeDoubleCard.js------------>MJPass");
            pl.mjState = TableState.waitCard;
            if (pl.eatFlag >= 8) {
                pl.skipHu = this.GetSkipHu(tData, pl, tData.putType > 0 ? 2 : 1);
            }
            pl.eatFlag = 0;
            /*
             **判断是否有其他玩家胡
             */
            if ((!tData.noBigWin || tData.with3) && pl.skipHu > 0 && swFlag >= 8) {
                this.GLog("this.MJHu1");
                var clickNum = -1;
                var huNum = -2;
                huNum = tTable.CheckPlayerCount(function(p) { return p.eatFlag >= 8 });
                clickNum = tTable.CheckPlayerCount(function(p) {
                    if (p.eatFlag >= 8) {
                        return p.huclick;
                    }

                });
                this.GLog("this.huNum" + huNum);
                this.GLog("this.clickNum" + clickNum);
                if (huNum == clickNum && huNum > 0 && clickNum > 0) {
                    this.GLog("this.MJHu2"); {
                        for (var i = tData.maxPlayers - 1; i > 0; i--) {
                            var cur = tData.curPlayer + i;
                            if (cur >= tData.maxPlayers) {
                                cur = cur - tData.maxPlayers;
                            }
                            var pd = tTable.getPlayer(tData.uids[cur]);
                            this.GLog("Dingo: FuncName:MjPass  " + "i : " + i.toString() + " orgCur: " + (tData.curPlayer + i).toString() +
                                " cur : " + cur + "  uidsGet: " + tData.uids[cur] + "  uids: " + tData.uids.toString() +
                                "   huLastPlayer : " + tData.huLastPlayer);
                            if (pd.winType > 0 && pd.skipHu <= 0 && pd.huclick == true) {
                                tData.huLastPlayer = cur;
                                this.GLog("Dingo :  huLastPlayer   : " + tData.huLastPlayer);
                                break;
                            }
                        }
                    }
                    var mjMsg = {};
                    this.MJHu(pl, mjMsg, 1, 1, true, tTable);
                    this.GLog("this.MJHu3");
                    tTable.AllPlayerRun(function(p) { p.huclick = false });
                    return;
                }

            }
            if (tData.cardNext < tTable.cards.length) {
                if (!this.SendNewCard(tTable, "c")) //过后尝试发牌
                    pl.notifyWithMsgID("MJPass", { mjState: pl.mjState });
            } else {
                this.EndGame(tTable, null, false);
            }


        }
    } else if (tData.tState == TableState.roundFinish && pl.mjState == TableState.roundFinish) {
        pl.mjState = TableState.isReady;
        tTable.NotifyAll('onlinePlayer', { uid: pl.uid, onLine: true, mjState: pl.mjState });
        pl.eatFlag = 0;
        tTable.startGame();
    }

}


/**
 * 碰牌
 */
CGameCodeDoubleCard.prototype.MJPeng = function(pl, msg, session, next, tTable) {
        var isAutoPut = true;
        if (next) {
            next(null, null); //if(this.GamePause()) return;
            isAutoPut = false;
        }
        var tData = tTable.tData;

        //不可以碰缺的牌
        if (!tData.noBigWin && this.majiang.cardType(tData.lastPut) == pl.mjMiss) return;



        if (tData.tState == TableState.waitEat &&
            pl.mjState == TableState.waitEat &&
            tData.uids[tData.curPlayer] != pl.uid
        ) {
            //此处必须保证没有其他玩家想胡牌
            if (tTable.AllPlayerCheck(function(p) { if (p == pl) return true; return p.eatFlag < 8; })) {


                if (!isAutoPut) {
                    this.GLog("------------>MJPeng call InitAutoState");
                    tTable.InitAutoState(pl);
                }

                var hand = pl.mjhand;
                var matchnum = 0;
                for (var i = 0; i < hand.length; i++) {
                    if (hand[i] == tData.lastPut) {
                        matchnum++;
                    }
                }
                if (matchnum >= 2) {
                    hand.splice(hand.indexOf(tData.lastPut), 1);
                    hand.splice(hand.indexOf(tData.lastPut), 1);
                    pl.mjpeng.push(tData.lastPut);
                    pl.pengFlag = true;
                    pl.isNew = false;
                    pl.getNum++;
                    if (matchnum == 3) pl.mjpeng4.push(tData.lastPut);
                    var lastPlayer = tData.curPlayer;
                    var pPut = tTable.getPlayer(tData.uids[lastPlayer]);
                    pPut.mjput.length = pPut.mjput.length - 1;
                    tData.curPlayer = tData.uids.indexOf(pl.uid);
                    tTable.AllPlayerRun(function(p) {
                        if (p.mjState != TableState.roundFinish) p.mjState = TableState.waitPut;
                        p.eatFlag = 0;
                    });
                    tData.tState = TableState.waitPut;
                    pl.firstPick = pl.firstPick + 2;
                    tTable.newNotifyAllWithMsgID('MJPeng', { tData: tData, from: lastPlayer });
                    tTable.mjlog.push('MJPeng', { tData: this.app.CopyPtys(tData), from: lastPlayer }); //碰
                    this.GLog("CGameCodeDoubleCard.js------------>MJPeng");
                } else {
                    //console.error("peng num error");
                }
            } else {
                //console.error("peng state error");
            }
        } else {
            //console.error(tData.tState+" "+pl.mjState+" "+tData.uids[tData.curPlayer]+" "+pl.uid);
        }

    }
    /**
     * 请求胡牌
     */
CGameCodeDoubleCard.prototype.MJHu = function(pl, msg, session, next, isFromPass, tTable) {
    var tData = tTable.tData;

    var canEnd = false;

    if (!tData.noBigWin && this.majiang.cardTypeNum(pl.mjhand, pl.mjMiss) > 0) {
        return;
    }
    //已经胡
    if (pl.winType > 0) {
        return;
    }
    var mjHuMsg = { wins: {} };
    var huPl = [];
    //自摸胡
    if (
        tData.tState == TableState.waitPut && pl.mjState == TableState.waitPut && pl.isNew &&
        tData.uids[tData.curPlayer] == pl.uid && this.GetHuType(tData, pl) > 0 //自摸测试
    ) {
        //补摸
        if (tData.putType > 0 && tData.putType < 4) //  1 吃明杠 2  自摸明杠 3  暗杠
        {
            if (tData.putType == 1) //点明杠后他又自摸
            {
                pl.winType = WinType.pickGang1;
                this.GLog("pl.winType=WinType.pickGang1");
            } else //自摸杠在补摸
            {
                pl.winType = WinType.pickGang23;
                this.GLog("pl.winType=WinType.pickGang23");
            }
        } else //自摸
        {
            pl.winType = WinType.pickNormal;
        }

        //如果是明杠杠上花胡牌
        /* if (pl.winType == WinType.pickGang1) {
             //杠上花 点炮
             if (tData.gshdianpao) {
                 this.GLog("g!shdianpao zimodianpap1");
                 if (pl.lastGangPlayer >= 0) {
                     var fp = tTable.getPlayer(tData.uids[pl.lastGangPlayer]);
                     fp.mjdesc.push("点 炮");
                 }
             }
         }*/

        huPl.push(pl);
        canEnd = true;

    }
    //点炮胡 抢杠胡 
    else if (
        pl.skipHu == 0 &&
        tData.tState == TableState.waitEat && pl.mjState == TableState.waitEat && tData.uids[tData.curPlayer] != pl.uid && pl.eatFlag >= 8
        //&&(tData.putType>0||tData.canEatHu)
        //&&!HighPlayerHu(this,pl) 邵阳麻将可以多家胡
    ) {

        if (tData.tState == TableState.waitEat) {
            var fp = tTable.getPlayer(tData.uids[tData.curPlayer]);
            var winType = null;
            var mjput = null;
            if (tData.putType == 0) {
                winType = WinType.eatPut;
                mjput = fp.mjput;
                fp.mjdesc.push("点炮");

                mjHuMsg.from = tData.curPlayer; //记录点炮玩家
            } else if (tData.putType == 4) {
                winType = WinType.eatGangPut;
                mjput = fp.mjput;
                fp.mjdesc.push("点炮");

                //杠上炮 退回所有杠
                // ReturnGangWin(this,fp,fp.lastGang,false,pl);
                this.ReturnGangWinWithGangShangPao(tTable, fp, fp.lastGang, false, pl);
                this.GLog("huyan:fp.lastGang" + JSON.stringify(fp.lastGang));

                mjHuMsg.from = tData.curPlayer;
            } else //抢杠 退回所有杠
            {
                winType = WinType.eatGang;
                this.ReturnQiangGangWin(tTable, fp, fp.lastGang, true);
                //if(tData.putType==3) mjput=fp.mjgang1;
                //else mjput=fp.mjgang0;

            }
            this.GLog("huyan:ReturnGangWin tData.putType" + tData.putType);

            if (mjput && mjput.length > 0 && mjput[mjput.length - 1] == tData.lastPut) {
                mjput.length = mjput.length - 1;
            }
            //else return;
            //mjHuMsg.from=tData.curPlayer;
            //一炮多响
            //一炮多响玩家分别操作
            this.GLog("MJHu1");

            if ((!tData.noBigWin) || tData.with3 || tData.doubleCarHouse) {
                this.GLog("MJHu2");
                pl.huclick = true;
                var clickNum = -1;
                var huNum = -2;
                this.GLog("MJHu3");
                huNum = tTable.CheckPlayerCount(function(p) { return p.eatFlag >= 8 });
                this.GLog("huNum" + huNum);
                clickNum = tTable.CheckPlayerCount(function(p) {
                    if (p.eatFlag >= 8) {
                        return p.huclick;
                    }

                });
                pl.winType = winType;
                this.GLog("clickNum" + clickNum);
                if (pl.mjState == TableState.waitEat && pl.eatFlag >= 8 && pl.huclick == true) {
                    // pl.mjhand.push(tData.lastPut);
                    // p.winType = winType;
                    pl.lastCard = tData.lastPut;
                    // huPl.push(pl);
                }
                if (huNum == clickNum && huNum > 0 && clickNum > 0) {
                    tTable.AllPlayerRun(function(p) {
                        if (p.mjState == TableState.waitEat && p.eatFlag >= 8) {
                            p.mjhand.push(tData.lastPut);
                            huPl.push(p);
                        }
                    });
                    if (tData.huLastPlayer <= 0) {
                        for (var i = tData.maxPlayers - 1; i > 0; i--) {
                            var cur = tData.curPlayer + i;
                            if (cur >= tData.maxPlayers) {
                                cur = cur - tData.maxPlayers;
                            }
                            var tuid = tData.uids[cur];
                            //var wuid = tData.wuid.indexOf( tuid );
                            //if( wuid >= 0 )continue;
                            var pd = tTable.getPlayer(tData.uids[cur]);
                            this.GLog("Dingo: FuncName: MjHu  " + "i : " + i.toString() + " orgCur: " + (tData.curPlayer + i).toString() +
                                " cur : " + cur + "  uidsGet: " + tData.uids[cur] + "  uids: " + tData.uids.toString() +
                                "   huLastPlayer : " + tData.huLastPlayer + "  wuid : " + tData.wuid.toString() +
                                "  huclient: " + pd.huclick);
                            if (pd.winType > 0 && pd.skipHu <= 0 && pd.huclick == true) {
                                tData.huLastPlayer = cur;
                                this.GLog("Dingo : MjHu : huLastPlayer   : " + tData.huLastPlayer);
                                break;
                            }
                        }
                    }
                    tTable.AllPlayerRun(function(p) { p.huclick = false });
                    canEnd = true;
                }

            } else if (tData.noBigWin) {

                tTable.AllPlayerRun(function(p) {
                    if (p.mjState == TableState.waitEat && p.eatFlag >= 8) {
                        p.mjhand.push(tData.lastPut);
                        p.winType = winType;
                        huPl.push(p);
                    }
                });
                canEnd = true;
            }

        }
    }
    if (isFromPass) {
        tTable.AllPlayerRun(function(p) {
            if (p.mjState == TableState.waitEat && p.eatFlag >= 8) {
                p.mjhand.push(tData.lastPut);
                huPl.push(p);
            }
        });
    }
    if (canEnd || isFromPass) {
        if (tData.winner == -1) {
            if (huPl.length == 1) {
                tData.winner = tData.uids.indexOf(huPl[0].uid);
            } else {
                tData.winner = tData.curPlayer;
                this.GLog("tData.winner = " + tData.winner);
            }
        }
        //计算番
        for (var i = 0; i < huPl.length; i++) {
            var pi = huPl[i];
            tData.wuid.push(pi.uid);
            pi.lastCard = pi.mjhand[pi.mjhand.length - 1];
            mjHuMsg.wins[pi.uid] = { lastCard: pi.lastCard, winType: pi.winType };
            if (pi.winType < WinType.eatGang) //只要是有人点炮了,那就记录 from---20170208 add by wcx---一炮多响 一家点过出现空牌
            {
                mjHuMsg.from = tData.curPlayer; //记录点炮玩家
            }

            var baseWin = 1;
            var genArr = [];
            if (!tData.noBigWin) {

                baseWin = this.majiang.computeBaseWin(pi, true, tData, false, genArr);


                var firstWin = pi.winType == WinType.pickNormal && pi.getNum == 1 && tData.cardNext == (tData.maxPlayers * 13 + 1);
                //天胡
                var secondWin = pi.winType == WinType.pickNormal && pi.getNum == 1 && tData.cardNext != (tData.maxPlayers * 13 + 1); //地胡

                if (tData.tiandihu) //天地胡 4番
                {
                    if (firstWin) {
                        baseWin *= 16;
                        pi.mjdesc.push("天胡");
                    }
                    if (secondWin) {
                        baseWin *= 16;
                        pi.mjdesc.push("地胡");
                    }
                } else {

                }

                if (pi.winType >= WinType.pickNormal) {
                    if (pi.winType != WinType.pickNormal) {
                        baseWin *= 2;
                        pi.mjdesc.push("杠上花");
                        if (tData.gshdianpao && pi.winType == WinType.pickGang1) {
                            //自摸加番---add by wcx 20170120
                            if (tData.zimofan) {
                                baseWin *= 2;
                            }
                        } else {
                            pi.mjdesc.push("自摸");
                            //自摸加番
                            if (tData.zimofan) {
                                baseWin *= 2;
                            }
                        }
                    } else {
                        pi.mjdesc.push("自摸");
                        //自摸加番
                        if (tData.zimofan) {
                            baseWin *= 2;
                        }
                    }

                    if (tData.cardNext == tTable.cards.length) {
                        baseWin *= 2;
                        pi.mjdesc.push("扫底胡");
                    }

                } else {
                    if (tData.cardNext == tTable.cards.length) {
                        baseWin *= 2;
                        pi.mjdesc.push("海底炮");
                    }

                }
                if (pi.winType == WinType.eatGangPut) {
                    baseWin *= 2;
                    pi.mjdesc.push("杠上炮");
                }
                if (pi.winType == WinType.eatGang) {
                    baseWin *= 2;
                    pi.mjdesc.push("抢杠");
                }

                if (baseWin > tData.maxWin) {
                    baseWin = tData.maxWin;
                }

            }
            if (baseWin == 1) {
                pi.mjdesc.push("平胡");
            } else if (genArr.length > 0) { //
                var realBaseWin = baseWin;
                for (var ii = 0; ii < genArr.length; ii++) {
                    realBaseWin = realBaseWin / 2;
                }
                if (realBaseWin == 1) {
                    pi.mjdesc.push("平胡");
                }
            }
            //自摸
            if (baseWin == 1) {
                if (tData.noBigWin) //转转
                {
                    if (pi.winType >= WinType.pickNormal) {
                        baseWin *= 2;
                    }
                }
            }
            pi.baseWin = baseWin;
        }
        if (
            tTable.CheckPlayerCount(function(pj) {
                if (pj.winType <= 0) {
                    for (var i = 0; i < huPl.length; i++) {
                        var pi = huPl[i];
                        var roundWin = 1;
                        //点炮一家输
                        // 		
                        // 
                        //   eatPut:1,     //普通出牌点炮 
                        //   eatGangPut:2, //开杠打牌点炮
                        //   eatGang:3,    //抢杠
                        //   pickNormal:4, //普通自摸
                        //   pickGang1:5,  //吃牌开明杠后补牌自摸(点杠者包3家)
                        //   pickGang23:6  //摸牌开杠补牌自摸
                        // 

                        if (tData.gshdianpao) {
                            if (pi.winType == WinType.pickGang1) {
                                if (pi.lastGangPlayer >= 0 && pj.uid == tData.uids[pi.lastGangPlayer]) {
                                    // pi.winone += (roundWin * pi.baseWin); //del by wcx 20170120
                                    // pj.winone -= (roundWin * pi.baseWin);
                                    pi.winone += (roundWin * pi.baseWin + ((!tData.noBigWin && (!tData.zimofan)) ? 1 : 0));
                                    pj.winone -= (roundWin * pi.baseWin + ((!tData.noBigWin && (!tData.zimofan)) ? 1 : 0));
                                }
                            } else if (pi.winType > WinType.eatGang || pj.uid == tData.uids[tData.curPlayer]) {
                                pi.winone += (roundWin * pi.baseWin + ((pi.winType > WinType.eatGang && !tData.noBigWin && (!tData.zimofan)) ? 1 : 0));
                                pj.winone -= (roundWin * pi.baseWin + ((pi.winType > WinType.eatGang && !tData.noBigWin && (!tData.zimofan)) ? 1 : 0));
                            }
                        } else {
                            if (pi.winType > WinType.eatGang || pj.uid == tData.uids[tData.curPlayer]) {
                                pi.winone += (roundWin * pi.baseWin + ((pi.winType > WinType.eatGang && !tData.noBigWin && (!tData.zimofan)) ? 1 : 0));
                                pj.winone -= (roundWin * pi.baseWin + ((pi.winType > WinType.eatGang && !tData.noBigWin && (!tData.zimofan)) ? 1 : 0));
                            }
                        }

                    }
                    if (!tData.noBigWin) {
                        pj.mjState = TableState.waitCard;
                    }

                    return true;
                } else {
                    if (!tData.noBigWin) {
                        pj.mjState = TableState.roundFinish;
                    }

                    return false;
                }
            }) <= 1 || tData.noBigWin
        ) {
            mjHuMsg.winone = tTable.PlayerPtys(function(p) { return p.winone; });
            tTable.mjlog.push("MJHu", mjHuMsg);
            this.GLog("CGameCodeDoubleCard.js------------>MJHu 1");
            this.EndGame(tTable, pl);
        } else {
            mjHuMsg.winone = tTable.PlayerPtys(function(p) { return p.winone; });
            tTable.newNotifyAllWithMsgID("MJHu", mjHuMsg);
            tTable.mjlog.push("MJHu", mjHuMsg);
            this.GLog("CGameCodeDoubleCard.js------------>MJHu 2");
            tData.putType = 0;
            tData.curPlayer = tData.uids.indexOf(pl.uid);
            this.SendNewCard(tTable, "e");
        }
    } else {
        if (!this.app.huError) this.app.huError = [];
        this.app.FileWork(this.app.huError, this.app.serverId + "huError.txt",
            tData.tState + " " + pl.mjState + " " + pl.isNew + " " + tData.uids[tData.curPlayer] + " " + pl.uid + " " + pl.huType
        );
        this.GLog("huError");
    }
}


/**
 * 血流成河胡牌
 */

module.exports = CGameCodeDoubleCard;