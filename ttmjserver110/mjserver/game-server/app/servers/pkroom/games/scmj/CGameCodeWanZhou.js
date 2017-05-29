//**************************************
//玩法-万州----CGameCodeWanZhou
//create by huyan
//特殊标志
//xuezhandd  血战   yaojidai 幺九代 wcx4
/**
 * 牌桌状态
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

function CGameCodeWanZhou(majiang, _GLOG, _app, tTable, logid, gameid, publicIp) {
    this.majiang = majiang;
    this.GLog = _GLOG;
    this.app = _app;
    //this.GLog("wcx4:CGameCodeWanZhou");
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

g_Inherit(require("./CGameCodeFightEnd.js"), CGameCodeWanZhou)

/*
 * 返回玩家, 增加一番后的 番数值,
 * 前不修改pl的baseWin
 * 万州的番算法
 * */
CGameCodeWanZhou.prototype.addOneFan = function(tData, pl) {
        //这里0番2分，1番12分，2番24分，3番48分，4番96分
        var iRealMaxWin = 2;
        var aMaxWin = pl.baseWin;
        if (aMaxWin < 12) //0番---变1
        {
            iRealMaxWin = 12;
        } else if (aMaxWin == 12) //1番--变 2
        {
            iRealMaxWin = 24;
        } else if (aMaxWin == 24) //2番--变3
        {
            iRealMaxWin = 48;
        } else if (aMaxWin == 48) //3番--变4
        {
            iRealMaxWin = 96;
        } else if (aMaxWin >= 96) //4番---维持4
        {
            iRealMaxWin = 96;
        }

        var iClientMaxWin = this.getMaxWin(tData.maxWin);
        if (iRealMaxWin > iClientMaxWin) {
            iRealMaxWin = iClientMaxWin;
        }
        //this.GLog("wcx4: addOneFan---- pl.uid=" + pl.uid + " pl.baseWin=" + pl.baseWin + " iRealMaxWin=" + iRealMaxWin);
        return iRealMaxWin;
    }
    /*
     * 获得万州的 最大番数
     * 这里0番2分，1番12分，2番24分，3番48分，4番96分
     * @aMaxWin 的 2,4,8,16 为了兼容 前端的番数
     * */
CGameCodeWanZhou.prototype.getMaxWin = function(aMaxWin) {
    //这里0番2分，1番12分，2番24分，3番48分，4番96分
    var iRealMaxWin = 2;
    if (aMaxWin <= 0) //0番
    {
        iRealMaxWin = 0;
    } else if (aMaxWin == 1) //0番
    {
        iRealMaxWin = 2;
    } else if (aMaxWin == 2) //1番
    {
        iRealMaxWin = 12;
    } else if (aMaxWin == 4) //2番
    {
        iRealMaxWin = 24;
    } else if (aMaxWin == 8) //3番
    {
        iRealMaxWin = 48;
    } else if (aMaxWin >= 16) //4番
    {
        iRealMaxWin = 96;
    }

    return iRealMaxWin;

}


/*
 *返回值大于 0 就是 可以胡牌了
 * 警告!!!!!!
 * 这个函数不能随便调用,会覆盖原来pl.huType!!!!!!!!!!!!!!!!
 * */
CGameCodeWanZhou.prototype.GetHuType = function(td, pl, cd) {
    //this.GLog("wcx4:GetHuType ___begin " + " pl.uid=" + pl.uid);
    //四川麻将7对可以胡?
    var huType = this.majiang.canHu(td.noBigWin, pl.mjhand, cd, td);

    pl.huType = huType;
    //this.GLog("wcx4:GetHuType ___end " + pl.huType +" pl.uid=" + pl.uid);
    return huType;
}




/**
 * 过胡
 */
CGameCodeWanZhou.prototype.GetSkipHu = function(td, pl, sc) {
    if (!sc) {
        sc = 1;
    }
    //四川麻将7对可以胡?
    pl.mjhand.push(td.lastPut);
    var skipHu = this.computeBaseWin(pl, false, td, false, []);
    pl.mjhand.length = pl.mjhand.length - 1;

    var iRet = skipHu * sc;

    //this.GLog("wcx4:GetSkipHu iRet=" + iRet);

    return skipHu * sc;
}






//发牌不要求在线
CGameCodeWanZhou.prototype.SendNewCard = function(tb, from) {
    var tData = tb.tData;
    var cards = tb.cards;

    if (tb.AllPlayerCheck(function(pl) {
            return pl.mjState == TableState.waitCard || (!tData.noBigWin && pl.mjState == TableState.roundFinish)
        })) {
        //this.GLog("wcx4:SendNewCard------------>2");
        //this.GLog("wcx4:tData.cardNext = " + tData.cardNext );
        //this.GLog("wcx4:tData.cardNext = " + cards.length );
        if (tData.cardNext < cards.length) {
            //this.GLog("wcx4:SendNewCard------------>3 curPlayer: " + tData.curPlayer );
            var newCard = cards[tData.cardNext++];
            //this.GLog("wcx4:SendNewCard------------>newCard=" + newCard );
            if (tData.putType == 0 || tData.putType == 4) {
                if (from == "guoShouGang") {
                    //过手不计算杠分，所以tData.putType=0,
                } else {
                    tData.curPlayer = (tData.curPlayer + 1) % tData.maxPlayers;
                }
                //this.GLog("wcx4:SendNewCard------------>3  __ 1 curPlayer: " + tData.curPlayer );
            }
            if (!tData.noBigWin) //跳过已经胡的玩家
            {
                //this.GLog("wcx4:SendNewCard------------>4 maxPlayers: " + tData.maxPlayers + "  Uids: " + JSON.stringify( tData.uids ) );
                for (var i = 0; i < tData.maxPlayers; i++) {
                    //this.GLog("wcx4:SendNewCard------------>4__1__ i: " + i );
                    var uid = tData.uids[(tData.curPlayer + i) % tData.maxPlayers];
                    var pi = tb.getPlayer(uid);
                    //this.GLog("wcx4:SendNewCard------------>4__2__ uid: " + uid );
                    if (pi.winType <= 0 || tData.blood) {
                        tData.curPlayer = (tData.curPlayer + i) % tData.maxPlayers;
                        //this.GLog("wcx4:SendNewCard------------>4__3__ curPlayer: " + tData.curPlayer );
                        break;

                    }
                }
            }
            //this.GLog("wcx4:SendNewCard------------>4 end");
            if (tData.huLastPlayer >= 0) {
                var getCurPlayer = -1;
                for (var i = 1; i < tData.maxPlayers; i++) {
                    var huPlayer = (tData.huLastPlayer + i) % tData.maxPlayers;
                    var uid = tData.uids[huPlayer];
                    var pi = tb.getPlayer(uid);
                    if (pi.winType <= 0 || tData.blood) {
                        getCurPlayer = huPlayer;
                        break;
                    }
                }
                tData.curPlayer = getCurPlayer;
                tData.huLastPlayer = -1;
                //this.GLog("wcx4:Dingo:  curPlayer : " + tData.curPlayer );
            }
            //this.GLog("wcx4:SendNewCard------------>5");
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
                //this.GLog("wcx4:SendNewCard------------>6");
            }
            if (!tData.noBigWin && tData.cardNext == (13 * tData.maxPlayers + 1)) //首次发牌 选缺
            {
                //如果两牌房去掉定缺和换牌
                /*if( tData.doubleCarHouse )
                {

                }
                else*/
                {
                    if (tData.with3) {
                        tData.tState = TableState.waitChange;
                        tb.AllPlayerRun(function(p) { p.mjState = TableState.waitChange; });
                    }
                    //else //del by wcx 万州没有选缺
                    //{
                    //    tData.tState=TableState.waitMiss;
                    //    tb.AllPlayerRun(function(p){ p.mjState=TableState.waitMiss; });
                    //}
                }
            }

            tb.newNotifyAllWithMsgID("waitPut", tData);
            //this.GLog("wcx4:SendNewCard- NotifyAll -'waitPut'---------->tData=" + JSON.stringify(tData));
            tb.AllPlayerRun(function(p) { p.eatFlag = 0; });
            tb.mjlog.push("newCard", this.app.CopyPtys(tData)); //发牌
            //this.GLog("wcx4:SendNewCard------------>8");

            //this.GLog("wcx4:CGameCodeFightEnd--mjlog  newCard");
            return true;
        } else //没有牌了
        {
            /*if(tData.blood){ //del by wcx 20161216 万州里面一定不会走这个分支
                this.EndCalBloodWinOne(tb);
            }*/
            //this.GLog("wcx4:SendNewCard call EndGame ");
            this.EndGame(tb, null);
        }
    }
    //this.GLog("wcx4:SendNewCard--------------->end");
    return false;
}

/**
 * 过(什么都不干) tag fix
 */
CGameCodeWanZhou.prototype.MJPass = function(pl, msg, session, next, tTable) {

    //this.GLog("wcx4:MJPass_______________begin pl.uid=" + pl.uid);
    //this.GLog("wcx4:MJPass->msg=" + JSON.stringify(msg));
    //this.GLog("zhengwei_MJPass_______________begin pl.eatFlag=" + pl.eatFlag);
    //this.GLog("zhengwei_MJPass_______________begin pl.mjState=" + pl.mjState);
    //this.GLog("zhengwei_MJPass_______________begin pl.winType=" + pl.winType);

    var tData = tTable.tData;
    var swFlag = pl.eatFlag;
    //this.GLog("zhengwei_MJPass_______________begin tData.tState=" + tData.tState);
    if (tData.tState == TableState.waitEat && pl.mjState == TableState.waitEat && pl.winType <= 0) {
        if (tData.cardNext == tTable.cards.length) {
            var compare = pl.eatFlag & 4;
            if (compare == 4) {
                pl.eatFlag = pl.eatFlag - 4;
            }
        }
        //this.GLog("wcx4: MJPass pl.eatFlag="+pl.eatFlag );

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
            tTable.InitAutoState(pl) //add by wcx 

            //this.GLog("wcx4:this.MJPass");
            tTable.mjlog.push("MJPass", { uid: pl.uid, eatFlag: msg.eatFlag }); //发牌
            //this.GLog("wcx4:CGameCodeFightEnd--mjlog  MJPass");
            pl.mjState = TableState.waitCard;
            if (pl.eatFlag >= 8) {
                pl.skipHu = this.GetSkipHu(tData, pl, tData.putType > 0 ? 2 : 1);
            }
            pl.eatFlag = 0;
            /*
             **判断是否有其他玩家胡
             */
            if (pl.skipHu > 0 && swFlag >= 8) {
                //this.GLog("wcx4:this.MJHu1");
                var clickNum = -1;
                var huNum = -2;
                huNum = tTable.CheckPlayerCount(function(p) { return p.eatFlag >= 8 });
                clickNum = tTable.CheckPlayerCount(function(p) {
                    if (p.eatFlag >= 8) {
                        return p.huclick;
                    }

                });
                //this.GLog("wcx4:this.huNum"+huNum);
                //this.GLog("wcx4:this.clickNum"+clickNum);
                if (huNum == clickNum && huNum > 0 && clickNum > 0) {
                    //this.GLog("wcx4:this.MJHu2");

                    for (var i = tData.maxPlayers - 1; i > 0; i--) {
                        var cur = tData.curPlayer + i;
                        if (cur >= tData.maxPlayers) {
                            cur = cur - tData.maxPlayers;
                        }
                        var pd = tTable.getPlayer(tData.uids[cur]);
                        //this.GLog("Dingo: FuncName:MjPass  "  + "i : " + i.toString() + " orgCur: " + (tData.curPlayer + i).toString() + " cur : " + cur + "  uidsGet: " + tData.uids[cur] + "  uids: " + tData.uids.toString() + "   huLastPlayer : " + tData.huLastPlayer );
                        if (pd.winType > 0 && pd.skipHu <= 0 && pd.huclick == true) {
                            tData.huLastPlayer = cur;
                            //this.GLog("Dingo :  huLastPlayer   : " + tData.huLastPlayer );
                            break;
                        }
                    }
                    var mjMsg = {};
                    this.MJHu(pl, mjMsg, 1, 1, true, tTable);
                    //this.GLog("wcx4:this.MJHu3");
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
    } else if (tData.tState == TableState.waitPut && pl.mjState == TableState.waitPut && pl.winType <= 0 && pl.eatFlag == msg.eatFlag) {
        //this.GLog("zhengwei_MJPass_______________into11 ");
        tTable.CheckPlayerCount(function(p) {
            if (p == pl) {
                tTable.mjlog.push("MJPass", { uid: pl.uid, eatFlag: msg.eatFlag }); //添加自摸过牌记录
                //  pl.eatFlag=0;
                return true;
            }
            return false;
        })

    } else if (tData.tState == TableState.roundFinish && pl.mjState == TableState.roundFinish) {
        pl.mjState = TableState.isReady;
        //this.GLog("wcx4:MJPass- NotifyAll -'onlinePlayer'");
        tTable.NotifyAll('onlinePlayer', { uid: pl.uid, onLine: true, mjState: pl.mjState });
        pl.eatFlag = 0;
        tTable.startGame();
    }

    //this.GLog("wcx4:MJPass_______________end all");
}

/**
 * 请求胡牌
 * @pl--------胡牌的玩家
 * @msg, msg={"cmd":"MJHu","__route__":"pkroom.handler.tableMsg"}"
 * @session,
 * @next,
 * @isFromPass,
 * @tTable
 */
CGameCodeWanZhou.prototype.MJHu = function(pl, msg, session, next, isFromPass, tTable) {
    //this.GLog("wcx4:zhengwei_MJHu1");
    var tData = tTable.tData;

    this.showAllPlayerInfo(tTable, "CGameCodeFightEnd.prototype.MJHu begin");
    //this.GLog("wcx4:zhengwei_MJHu2");
    var iGLog = this.GLog;
    var gThis = this;
    //this.GLog("wcx4:MJHu");
    //this.GLog("wcx4:MJHu");
    //this.GLog("wcx4:MJHu_______________________________________________________begin");
    //this.GLog("wcx4:MJHu msg="+JSON.stringify(msg)  +  " pl.uid="+pl.uid  + " pl.winType="+ pl.winType + " isFromPass=" + isFromPass);
    //this.GLog("wcx4:MJHu pl.mjhand="+JSON.stringify(pl.mjhand) );

    // if(tData.blood){
    // 	this.MJHuBlood(pl,msg,session,next);
    // 	return;
    // }
    // var uids=this.tData.uids;
    var canEnd = false;

    /* del by wcx 万州无缺
    if(!tData.noBigWin //倒倒胡 没有选缺的功能
        &&this.majiang.cardTypeNum(pl.mjhand,pl.mjMiss)>0) //判断手里的牌是否还有 缺类型的牌--有就不能胡
    {
        //this.GLog("wcx4:zhengwei_MJHu3:  "+this.majiang.cardTypeNum(pl.mjhand,pl.mjMiss));
        return;
    }*/


    //已经胡
    if (pl.winType > 0) //该玩家已经胡了,那就直接 return
    {
        //this.GLog("wcx4:zhengwei_MJHu4:  "+pl.winType);
        return;
    }


    var mjHuMsg = { wins: {} }; //要发送给客户端
    var huPl = []; //可以胡的玩家

    //this.GLog("wcx4:MJHu ______________________自摸_______________________begin________________" );
    //this.GLog("wcx4:MJHu tData.tState="+ tData.tState );
    //this.GLog("wcx4:MJHu pl.mjState="+ pl.mjState );
    //this.GLog("wcx4:MJHu pl.isNew="+ pl.isNew );
    //this.GLog("wcx4:MJHu pl.uid ="+ pl.uid );
    //this.GLog("wcx4:MJHu tData.uids[tData.curPlayer] ="+ tData.uids[tData.curPlayer] );
    //this.GLog("wcx4:MJHu pl.skipHu ="+ pl.skipHu );
    //this.GLog("wcx4:MJHu pl.eatFlag ="+ pl.eatFlag );
    //this.GLog("wcx4:MJHu ______________________自摸_____________________________end__________" );

    //this.GLog("wcx4:zhengwei_MJHu5:  ");
    //自摸胡---//自摸测试
    if (tData.tState == TableState.waitPut &&
        pl.mjState == TableState.waitPut &&
        pl.isNew //这是什么 鬼????
        &&
        tData.uids[tData.curPlayer] == pl.uid //胡的玩家 与  放炮的玩家是同一个
        &&
        this.GetHuType(tData, pl) > 0) //胡牌类型 > 0 就是可以胡了
    {
        //this.GLog("wcx4:zhengwei_MJHu6:  ");
        //补摸
        if (tData.putType > 0 && tData.putType < 4) //  1 吃明杠 2  自摸明杠 3  暗杠[1,3]
        {
            if (tData.putType == 1) //点明杠后他又自摸----pickGang1:5,  //吃牌开明杠后补牌自摸(点杠者包3家)
            {
                pl.winType = WinType.pickGang1;
                //this.GLog("wcx4:pl.winType=WinType.pickGang1");
            } else //自摸杠在补摸---//摸牌开杠,补牌自摸
            {
                pl.winType = WinType.pickGang23;
                //this.GLog("wcx4:pl.winType=WinType.pickGang23");
            }
        } else //自摸---没有扛过, 那就是普通自摸
        {
            pl.winType = WinType.pickNormal;
        }

        //如果是明杠杠上花胡牌----开杠不是还要摸一张牌吗。恰好你摸得那张牌正好是你要糊的那张牌，那就是杠上花拉。
        /*if (pl.winType == WinType.pickGang1) {
            //杠上花 点炮
            //客户端选的 "点杠花(点炮) 或则 点扛花(自摸) "
            if (tData.gshdianpao) {
                //this.GLog("wcx4:g!shdianpao zimodianpap1");
                //上家点 扛玩家---那此时变成 点炮了
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
    else if (pl.skipHu == 0 &&
        tData.tState == TableState.waitEat &&
        pl.mjState == TableState.waitEat &&
        tData.uids[tData.curPlayer] != pl.uid &&
        pl.eatFlag >= 8) //pl.eatFlag 0:无 1:吃 2:碰 4:杠 8:胡 16:过
    {
        //this.GLog("wcx4:zhengwei_MJHu7:  ");
        //this.GLog("wcx4:MJHu pl.skipHu=" + pl.skipHu+ " pl.eatFlag=" + pl.eatFlag+ " pl.uid="+ pl.uid+ " tData.curPlayer=" + tData.curPlayer + " tData.uids[tData.curPlayer]=" + tData.uids[tData.curPlayer]);

        if (tData.tState == TableState.waitEat) {
            //this.GLog("wcx4:zhengwei_MJHu8:  ");
            //获取放炮的玩家....
            var fp = tTable.getPlayer(tData.uids[tData.curPlayer]);
            var winType = null;
            var mjput = null;
            //this.GLog("wcx4:MJHu  重要标志 tData.putType=" + tData.putType);

            if (tData.putType == 0) // 0:就是普通发牌吧  1 吃明杠 2  自摸明杠 3  暗杠
            {
                //this.GLog("wcx4:zhengwei_MJHu9:  ");
                winType = WinType.eatPut; //普通出牌点炮
                mjput = fp.mjput;
                fp.mjdesc.push("点炮");
                if (fp.mjting) {
                    pl.fangPaoUid = fp.uid;
                }
                mjHuMsg.from = tData.curPlayer; //记录点炮玩家
            } else if (tData.putType == 4) {
                winType = WinType.eatGangPut; //开杠打牌点炮
                mjput = fp.mjput;
                fp.mjdesc.push("点炮");
                if (fp.mjting) {
                    pl.fangPaoUid = fp.uid;
                }
                //this.GLog("wcx4:zhengwei_MJHu10:  ");
                //this.GLog("wcx4:MJHu 点炮玩家 fp.uid=" + fp.uid + " fp.lastGang="+fp.lastGang);

                //杠上炮 退回所有杠
                // ReturnGangWin(this,fp,fp.lastGang,false,pl);
                this.ReturnGangWinWithGangShangPao(tTable, fp, fp.lastGang, false, pl);
                mjHuMsg.from = tData.curPlayer; //记录点炮玩家
            } else //抢杠 退回所有杠
            {
                winType = WinType.eatGang; //抢杠
                if (fp.mjting) {
                    pl.fangPaoUid = fp.uid;
                }
                this.ReturnQiangGangWin(tTable, fp, fp.lastGang, true);
            }
            //this.GLog("wcx4:zhengwei_MJHu11:  tData.lastPut=" + tData.lastPut);
            //this.GLog("wcx4:MJHu  mjput=" + JSON.stringify(mjput));

            if (mjput &&
                mjput.length > 0 &&
                mjput[mjput.length - 1] == tData.lastPut) {
                mjput.length = mjput.length - 1;
                //this.GLog("wcx4:MJHu  应该删除一张牌");
            }

            //this.GLog("wcx4:MJHu  fp.mjput=" + JSON.stringify(fp.mjput));
            //else return;
            //mjHuMsg.from=tData.curPlayer; //记录点炮玩家
            //一炮多响
            //一炮多响玩家分别操作
            //this.GLog("wcx4:MJHu1");

            if (tData.xuezhandd) // 血战
            {
                //this.GLog("wcx4:zhengwei_MJHu12:  ");
                //this.GLog("wcx4:MJHu2");
                pl.huclick = true;
                var clickNum = -1; //已经有几个玩家点了 胡的按钮
                var huNum = -2;
                //this.GLog("wcx4:MJHu3");
                huNum = tTable.CheckPlayerCount(function(p) {
                    //iGLog("wcx4:p.uid=" + p.uid + "_eatFlag=" + p.eatFlag);
                    return p.eatFlag >= 8
                });
                //this.GLog("wcx4:huNum="+huNum); //胡牌玩家个数
                clickNum = tTable.CheckPlayerCount(function(p) {
                    if (p.eatFlag >= 8) {
                        return p.huclick;
                    }

                });
                pl.winType = winType;
                if (pl.mjState == TableState.waitEat && pl.eatFlag >= 8 && pl.huclick == true) {
                    // pl.mjhand.push(tData.lastPut);
                    // p.winType = winType;
                    pl.lastCard = tData.lastPut;
                    // huPl.push(pl);
                }

                //this.GLog("wcx4:clickNum"+clickNum);
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
                            //this.GLog("Dingo: FuncName: MjHu  "  + "i : " + i.toString() + " orgCur: " + (tData.curPlayer + i).toString() + " cur : " + cur + "  uidsGet: " + tData.uids[cur] + "  uids: " + tData.uids.toString() + "   huLastPlayer : " + tData.huLastPlayer + "  wuid : " + tData.wuid.toString() + "  huclient: " + pd.huclick );
                            if (pd.winType > 0 && pd.skipHu <= 0 && pd.huclick == true) {
                                tData.huLastPlayer = cur;
                                //this.GLog("Dingo : MjHu : huLastPlayer   : " + tData.huLastPlayer );
                                break;
                            }
                        }
                    }
                    tTable.AllPlayerRun(function(p) { p.huclick = false });
                    canEnd = true;
                    //this.GLog("wcx4:zhengwei_MJHu13:  ");
                }

            } else if (tData.wanZhou) //万州麻将----胡一家 本局结束
            {
                //this.GLog("wcx4:zhengwei_MJHu14:  ");
                tTable.AllPlayerRun(function(p) {
                    if (p.mjState == TableState.waitEat && p.eatFlag >= 8) {
                        //iGLog("wcx4:万州麻将 }else if (tData.wanZhou) tData.lastPut=" + tData.lastPut + " winType=" + winType + " p.uid=" + p.uid + " p.eatFlag=" + p.eatFlag);
                        p.mjhand.push(tData.lastPut);
                        p.winType = winType;
                        huPl.push(p);
                        //iGLog("wcx4:zhengwei_MJHu15:  ");
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

    //this.GLog("wcx4:MJHu canEnd=" + canEnd  );
    //this.GLog("wcx4:MJHu isFromPass=" + isFromPass  );
    if (canEnd || isFromPass) {
        if (tData.winner == -1) {
            if (huPl.length == 1) {
                tData.winner = tData.uids.indexOf(huPl[0].uid);
            } else {
                //结束判断坐庄者
                tData.winner = tData.curPlayer;
                //this.GLog("tData.winner = " + tData.winner );
            }
        }

        var iNeedAddFanWin = {}; //需要加一番的 win
        //计算番
        this.computeFan(huPl, tTable, mjHuMsg); //add by wcx 剥离算番的逻辑成 独立函数
        { //add by wcx----
            for (var i = 0; i < huPl.length; i++) {
                var pi = huPl[i];
                if (pi.winType < WinType.eatGang) //只要是有人点炮了,那就记录 from
                {
                    mjHuMsg.from = tData.curPlayer; //记录点炮玩家
                }
                if (pi.winType < WinType.pickNormal && pi.fangPaoUid) //如果是被点炮的玩家----点炮时
                {
                    var fp = tTable.getPlayer(pi.fangPaoUid);
                    if (fp.mjting) //如果用户 听牌了
                    {
                        var ioldFan = pi.baseWin;
                        //this.GLog("wcx4:call addOneFan pi.uid= " + pi.uid + " fp.uid=" + fp.uid );
                        var inewFan = this.addOneFan(tData, pi);
                        var iDlt = inewFan - ioldFan;
                        //1: 胡牌玩家 加一番
                        if (iDlt > 0) {
                            pi.winone += iDlt;
                            fp.winone -= iDlt;
                        }
                        fp.mjdesc.push("听牌");
                        iNeedAddFanWin[pi.uid] = inewFan;
                    }

                    pi.fangPaoUid = null;
                }
            }
        }


        var iCheckPlayerCount0 = tTable.CheckPlayerCount(function(pj) {
            if (pj.winType <= 0) {
                for (var i = 0; i < huPl.length; i++) {
                    var pi = huPl[i];
                    var roundWin = 1;

                    if (tData.gshdianpao) {
                        if (pi.winType == WinType.pickGang1) {
                            if (pi.lastGangPlayer >= 0 && pj.uid == tData.uids[pi.lastGangPlayer]) {
                                pi.winone += (roundWin * pi.baseWin);
                                pj.winone -= (roundWin * pi.baseWin);
                            }
                        } else if (pi.winType > WinType.eatGang || pj.uid == tData.uids[tData.curPlayer]) {
                            var iDltNum = 0;
                            if (pi.winType == WinType.pickNormal && pi.baseWin == 0) //自摸屁胡
                            {
                                iDltNum = 2;
                            }
                            if (pi.winType > WinType.eatGang && pj.mjting) //如果用户 听牌了---自摸
                            {
                                var ioldFan = pi.baseWin;
                                var inewFan = gThis.addOneFan(tData, pi);
                                var iDlt = inewFan - ioldFan;
                                //1: 胡牌玩家 加一番
                                if (iDlt > 0) {
                                    pi.winone += iDlt;
                                    pj.winone -= iDlt;
                                }
                                pj.mjdesc.push("听牌");
                                iNeedAddFanWin[pi.uid] = inewFan;
                            }


                            pi.winone += roundWin * pi.baseWin + iDltNum;
                            pj.winone -= roundWin * pi.baseWin + iDltNum;

                            //iGLog("wcx4: tData.g!shdianpao is true pi.uid=" + pi.uid + " pi.winone=" + pi.winone + "pj.uid=" + pj.uid + " pj.winone=" + pj.winone  );
                        }
                    } else {
                        if (pi.winType > WinType.eatGang || pj.uid == tData.uids[tData.curPlayer]) {
                            var iDltNum = 0;
                            if (pi.winType == WinType.pickNormal && pi.baseWin == 0) //自摸屁胡
                            {
                                iDltNum = 2;
                            }

                            if (pi.winType > WinType.eatGang && pj.mjting) //如果用户 听牌了---自摸
                            {
                                var ioldFan = pi.baseWin;
                                //iGLog("wcx4:call addOneFan 22222 pi.uid= " + pi.uid );
                                var inewFan = gThis.addOneFan(tData, pi);
                                var iDlt = inewFan - ioldFan;
                                //1: 胡牌玩家 加一番
                                if (iDlt > 0) {
                                    pi.winone += iDlt;
                                    pj.winone -= iDlt;
                                }
                                pj.mjdesc.push("听牌");
                                iNeedAddFanWin[pi.uid] = inewFan;
                            }

                            pi.winone += roundWin * pi.baseWin + iDltNum;
                            pj.winone -= roundWin * pi.baseWin + iDltNum;

                            //iGLog("wcx4: pi.uid=" + pi.uid + " pi.winone=" + pi.winone + "pj.uid=" + pj.uid + " pj.winone=" + pj.winone  );
                        }
                    }

                }
                if (!tData.noBigWin) {
                    pj.mjState = TableState.waitCard;
                }

                //iGLog("wcx4:MJHu -----------------------------------------------end---true");
                return true;
            } else {
                if (!tData.noBigWin) {
                    pj.mjState = TableState.roundFinish;
                }

                //iGLog("wcx4:MJHu -----------------------------------------------end---false");
                return false;
            }
        });

        { //胡牌玩家,加番 add by wcx 20161210
            for (var key in iNeedAddFanWin) {
                //this.GLog("wcx4:MJHu key=" + key + " iNeedAddFanWin[key]=" + iNeedAddFanWin[key]);
                var win = tTable.getPlayer(key);
                if (win) {
                    win.baseWin = iNeedAddFanWin[key];
                }
            }
        }


        //iNeedAddFanWin.push(pi.uid);
        //var fp=tTable.getPlayer(pi.fangPaoUid);
        //var inewFan = gThis.addOneFan(tData,pi);

        //this.GLog("wcx4:MJHu tData.xuezhandd=" + tData.xuezhandd  + " iCheckPlayerCount0=" + iCheckPlayerCount0);//tData.xuezhandd == true 是血战
        if (iCheckPlayerCount0 <= 1 || !(tData.xuezhandd)) {
            mjHuMsg.winone = tTable.PlayerPtys(function(p) { return p.winone; });
            tTable.mjlog.push("MJHu", mjHuMsg);
            //this.GLog("wcx4:MJHu call EndGame");
            //this.EndGame(tTable,pl);//del by wcx pl传入后会导致 不进行查大叫
            this.EndGame(tTable, null);
        } else {
            mjHuMsg.winone = tTable.PlayerPtys(function(p) { return p.winone; });
            tTable.newNotifyAllWithMsgID("MJHu", mjHuMsg);
            tTable.mjlog.push("MJHu", mjHuMsg);
            //this.GLog("wcx4:CGameCodeFightEnd--mjlog  NotifyAll  MJHu 2");
            tData.putType = 0;
            tData.curPlayer = tData.uids.indexOf(pl.uid);
            this.SendNewCard(tTable, "e");
        }
    } else {
        if (!this.app.huError) this.app.huError = [];
        this.app.FileWork(this.app.huError, this.app.serverId + "huError.txt",
            tData.tState + " " + pl.mjState + " " + pl.isNew + " " + tData.uids[tData.curPlayer] + " " + pl.uid + " " + pl.huType
        );
        //this.GLog("wcx4:huError!!!!!!!!!!!!!!!!!!!!!!!!!!error!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    }

    this.showAllPlayerInfo(tTable, "CGameCodeFightEnd_MJHu_end");

    //this.GLog("wcx4:MJHu____________________________________________end");
    //this.GLog("wcx4:MJHu");
    //this.GLog("wcx4:MJHu");
}

/*
 * 换三张 万州 允许换3张不同的牌
 * */
CGameCodeWanZhou.prototype.MJChange = function(pl, msg, session, next, tTable) {
    //this.GLog("wcx4:MJChange____________________begin");
    var tData = tTable.tData;

    if (tData.tState == TableState.waitChange && pl.mjChange < 0) {
        //if (Math.floor(msg.cd0/10) == Math.floor(msg.cd1/10) && Math.floor(msg.cd0/10) ==Math.floor(msg.cd2/10))
        {
            //add by wcx 20161205 是否是换三张 true 是换三张 （换三张:是必须选择手上3张相同花色的牌；）
            var iIsHuan3Zhang = (Math.floor(msg.cd0 / 10) == Math.floor(msg.cd1 / 10) && Math.floor(msg.cd0 / 10) == Math.floor(msg.cd2 / 10));

            pl.mjChange = 1;
            pl.mjState = TableState.waitPut;

            pl.arry = [];
            pl.arry1 = [];

            pl.arry.push(msg.cd0);
            pl.arry.push(msg.cd1);
            pl.arry.push(msg.cd2);

            pl.iIsHuan3Zhang = iIsHuan3Zhang;
            pl.isMaiPai = !iIsHuan3Zhang; //是买牌
            var iGLog = this.GLog;
            var iRetVal = tTable.AllPlayerCheck(function(p) { return p.mjChange == 1 });
            this.GLog("wcx4:MJChange pl.uid=" + pl.uid + " iIsHuan3Zhang=" + iIsHuan3Zhang + " iRetVal=" + iRetVal + " pl.iIsMaiPai=" + pl.isMaiPai);
            if (iRetVal) {
                tData.tState = TableState.waitPut;
                //对家交换
                var plThree = tTable.getPlayer(tData.uids[(tData.uids.indexOf(pl.uid) + 2) % tData.maxPlayers]);
                var plTwo = tTable.getPlayer(tData.uids[(tData.uids.indexOf(pl.uid) + 1) % tData.maxPlayers]);
                var plFour = tTable.getPlayer(tData.uids[(tData.uids.indexOf(pl.uid) + 3) % tData.maxPlayers]);

                var radomIn = Math.floor(Math.random() * 2.9);
                if (plThree && plThree.arry && plTwo && plTwo.arry && plFour && plFour.arry) {
                    switch (radomIn) {
                        case 0: //对家交换
                            //this.GLog("wcx4:MJChange 对家换 plThree.uid=" + plThree.uid );
                            pl.arry1 = plThree.arry.slice(0);
                            if (!plThree.iIsHuan3Zhang) { plThree.ChangeWith = pl.uid; }

                            plThree.arry1 = pl.arry.slice(0);
                            if (!pl.iIsHuan3Zhang) { pl.ChangeWith = plThree.uid; }

                            plFour.arry1 = plTwo.arry.slice(0);
                            if (!plTwo.iIsHuan3Zhang) { plTwo.ChangeWith = plFour.uid; }

                            plTwo.arry1 = plFour.arry.slice(0);
                            if (!plFour.iIsHuan3Zhang) { plFour.ChangeWith = plTwo.uid; }

                            break;
                        case 1: //逆时针交换
                            //this.GLog("wcx4:MJChange 逆时针交换 plTwo.uid=" + plTwo.uid );
                            pl.arry1 = plFour.arry.slice(0);
                            if (!plFour.iIsHuan3Zhang) { plFour.ChangeWith = pl.uid; }

                            plFour.arry1 = plThree.arry.slice(0);
                            if (!plThree.iIsHuan3Zhang) { plThree.ChangeWith = plFour.uid; }

                            plThree.arry1 = plTwo.arry.slice(0);
                            if (!plTwo.iIsHuan3Zhang) { plTwo.ChangeWith = plThree.uid; }

                            plTwo.arry1 = pl.arry.slice(0);
                            if (!pl.iIsHuan3Zhang) { pl.ChangeWith = plTwo.uid; }
                            break;
                        default: //顺时针交换
                            //this.GLog("wcx4:MJChange default 顺时针交换 plFour.uid=" + plFour.uid );
                            pl.arry1 = plTwo.arry.slice(0);
                            if (!plTwo.iIsHuan3Zhang) { plTwo.ChangeWith = pl.uid; }

                            plTwo.arry1 = plThree.arry.slice(0);
                            if (!plThree.iIsHuan3Zhang) { plThree.ChangeWith = plTwo.uid; }

                            plThree.arry1 = plFour.arry.slice(0);
                            if (!plFour.iIsHuan3Zhang) { plFour.ChangeWith = plThree.uid; }

                            plFour.arry1 = pl.arry.slice(0);
                            if (!pl.iIsHuan3Zhang) { pl.ChangeWith = plFour.uid; }
                            break;
                    }

                    tTable.AllPlayerRun(function(p) {
                        for (var i = 0; i < 3; i++) {
                            var cdIdx = p.mjhand.indexOf(p.arry[i]);
                            p.mjhand.splice(cdIdx, 1);
                        }
                        for (var i = 0; i < 3; i++) {
                            p.mjhand.push(p.arry1[i]);
                        }
                        p.notify("MJChangeHand", { mjhand: p.mjhand, change3: p.arry1 });


                        if (!p.iIsHuan3Zhang) {

                            //iGLog("wcx4: puid= " + p.uid + " p.iIsHuan3Zhang=" + p.iIsHuan3Zhang + " p.ChangeWith=" + p.ChangeWith);

                            tTable.AllPlayerRun(function(pp) {
                                //iGLog("wcx4: pp uid= " + pp.uid + " p.iIsHuan3Zhang=" + p.iIsHuan3Zhang);
                                if (pp.uid != p.uid) {
                                    //iGLog("wcx4: -----------------if(pp.uid != p.uid) ");
                                    if (p.ChangeWith == pp.uid) {
                                        //iGLog("wcx4:----------------- if(p.ChangeWith == pp.uid ){ ");
                                        pp.winone += 4;
                                        p.winone -= 4;
                                    } else {
                                        //iGLog("wcx4:----------------- else { ");
                                        pp.winone += 2;
                                        p.winone -= 2;
                                    }
                                }
                            });
                        }
                    });

                    if (tData.with3) {
                        tTable.AllPlayerRun(function(pl) {
                            if (pl.winone >= 0) {
                                pl.mjdesc.push("买牌+" + pl.winone + "分");
                            } else {
                                pl.mjdesc.push("买牌" + pl.winone + "分");
                            }
                        });
                    }
                    tTable.AllPlayerRun(function(p) {
                        p.ChangeWith = null;
                        p.iIsHuan3Zhang = null;
                    });

                    var pl_0 = tTable.getPlayer(tData.uids[0]);
                    var pl_1 = tTable.getPlayer(tData.uids[1]);
                    var pl_2 = tTable.getPlayer(tData.uids[2]);
                    var pl_3 = tTable.getPlayer(tData.uids[3]);
                    tTable.mjlog.push("MJChangeHand", [
                        pl_0.mjhand.slice(0),
                        pl_1.mjhand.slice(0),
                        pl_2.mjhand.slice(0),
                        pl_3.mjhand.slice(0)
                    ]);
                }
                //this.GLog("wcx4:MJChange- NotifyAll -'1111'");
                tTable.newNotifyAllWithMsgID("MJChange", { uid: pl.uid, mjState: pl.mjState, mjChange: pl.mjChange, isMaiPai: pl.isMaiPai, tState: TableState.waitPut, tMode: radomIn })
            } else {
                //this.GLog("wcx4:MJChange- NotifyAll -'2222'");
                tTable.newNotifyAllWithMsgID("MJChange", { uid: pl.uid, mjState: pl.mjState, mjChange: pl.mjChange, isMaiPai: pl.isMaiPai });
            }
        }
    }

    this.showAllPlayerInfo(tTable, "MJChange查看买牌的分数");
    //this.GLog("wcx4:MJChange____________________end");
}

/**
 * 碰牌
 */
CGameCodeWanZhou.prototype.MJPeng = function(pl, msg, session, next, tTable) {
    //this.GLog("wcx4:zhengwei_MJPeng1");
    var isAutoPut = true;
    if (next) {
        next(null, null); //if(this.GamePause()) return;
        isAutoPut = false;
    }

    var tData = tTable.tData;

    //不可以碰缺的牌
    /*del by wcx 万州无缺
    if(!tData.noBigWin&&this.majiang.cardType(tData.lastPut)==pl.mjMiss) return; */
    //this.GLog("wcx4:zhengwei_MJPeng2");


    if (tData.tState == TableState.waitEat &&
        pl.mjState == TableState.waitEat &&
        tData.uids[tData.curPlayer] != pl.uid) {
        //this.GLog("wcx4:zhengwei_MJPeng3");
        //此处必须保证没有其他玩家想胡牌
        if (tTable.AllPlayerCheck(function(p) { if (p == pl) return true; return p.eatFlag < 8; })) {

            if (!isAutoPut) {
                this.GLog("------------>MJPeng call InitAutoState");
                tTable.InitAutoState(pl);
            }

            //this.GLog("wcx4:zhengwei_MJPeng4");
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

                //this.GLog("wcx4:MJPeng- NotifyAll -'MJPeng'");
                tTable.newNotifyAllWithMsgID('MJPeng', { tData: tData, from: lastPlayer });
                tTable.mjlog.push('MJPeng', { tData: this.app.CopyPtys(tData), from: lastPlayer }); //碰
                //this.GLog("wcx4:zhengwei_MJPeng5");
                //this.GLog("wcx4:CGameCodeFightEnd--mjlog  MJPeng");
            }
        }
    }
}


/**
 * 杠
 * @pl
 * @msg={"cmd":"MJGang","card":4,"__route__":"pkroom.handler.tableMsg"}"
 * @session
 * @next---有时会是 undefined
 * @pTable----pTable.tData:   tData
 *
 * @return 无返回值;
 */
CGameCodeWanZhou.prototype.MJGang = function(pl, msg, session, next, pTable) {
    //this.GLog("wcx4:CGameCodeFightEnd MJGang----------------------------begin" );
    var isAutoPut = true;
    if (next) {
        next(null, null); //if(this.GamePause()) return;
        isAutoPut = false;
    }

    var tData = pTable.tData;

    //this.GLog("wcx4:CGameCodeWanZhou tData=" + JSON.stringify(tData) );
    //this.GLog("wcx4:Table.prototype.MJGang pTable.cards=" + JSON.stringify(pTable.cards) );
    //this.GLog("wcx4:Table.prototype.MJGang tData.cardNext < pTable.cards.length=" + tData.cardNext + "|" +pTable.cards.length);
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

        //this.GLog("wcx4:Table.prototype.MJGang pl.uid=" + pl.uid);
        //this.GLog("wcx4:Table.prototype.MJGang pl.mjhand=" + JSON.stringify(pl.mjhand) );
        var handNum = 0; //统计  用户手里的牌有几张  msg.card
        for (var i = 0; i < hand.length; i++) {
            if (hand[i] == msg.card) {
                handNum++;
            }
        }

        if (!isAutoPut) {
            pTable.InitAutoState(pl);
        }

        //如果 牌桌 是 waitEat 态, 并且 手里有3张这种牌 并且 tData.lastPut == msg.card
        if (tData.tState == TableState.waitEat && handNum == 3 && tData.lastPut == msg.card) {
            //获得  curPlayer
            var fp = pTable.getPlayer(tData.uids[tData.curPlayer]);
            //this.GLog("wcx4:Table.prototype.MJGang curPlayer=>fp.uid=" + fp.uid + " fp.mjput=" + JSON.stringify(fp.mjput));

            var mjput = fp.mjput;
            if (mjput.length > 0 && mjput[mjput.length - 1] == msg.card) {
                mjput.length = mjput.length - 1; //打出的牌 减1

                //this.GLog("wcx4:Table.prototype.MJGang curPlayer  mjput.length=mjput.length-1");
            } else {
                return;
            }
            fp.mjdesc.push("点杠");
            pl.mjgang0.push(msg.card); //吃明杠
            pl.gang0uid[msg.card] = tData.curPlayer;
            pl.lastGangPlayer = tData.curPlayer; //记录点明杠的玩家 目前只记录明杠
            hand.splice(hand.indexOf(msg.card), 1); //移除hand 里的3张杠牌
            hand.splice(hand.indexOf(msg.card), 1);
            hand.splice(hand.indexOf(msg.card), 1);
            msg.gang = 1; //明杠
            msg.from = tData.curPlayer; //点杠 的 玩家
            pl.isNew = false;
            pl.getNum++;

        } else if (tData.tState == TableState.waitPut && handNum == 4) {
            pl.mjgang1.push(msg.card); //暗杠
            hand.splice(hand.indexOf(msg.card), 1); //移除hand 里的4张杠牌
            hand.splice(hand.indexOf(msg.card), 1);
            hand.splice(hand.indexOf(msg.card), 1);
            hand.splice(hand.indexOf(msg.card), 1);
            msg.gang = 3; //暗杠
        } else if (tData.tState == TableState.waitPut && handNum == 1 && pl.mjpeng.indexOf(msg.card) >= 0 /* && pl.mjpeng4.indexOf(msg.card) < 0 */ ) {
            pl.mjgang0.push(msg.card); //自摸明杠
            hand.splice(hand.indexOf(msg.card), 1);
            pl.mjpeng.splice(pl.mjpeng.indexOf(msg.card), 1);
            msg.gang = 2; //自摸明杠
        } else {
            return;
        }

        var tagFrom = "d";
        pl.lastGang = msg.card;
        tData.putType = msg.gang; //  1 吃明杠 2  自摸明杠 3  暗杠
        //过手明杠啥都不是
        if (pl.mjpeng4.indexOf(msg.card) >= 0) {
            tData.putType = 0;
            tagFrom = "guoShouGang";
        }

        tData.lastPut = msg.card;
        msg.uid = pl.uid;
        var canEatGang = msg.gang == 2 && tData.canEatHu; //血战和倒倒胡只有自摸明杠可以抢----这里是"抢杠胡"
        var eatGangOK = false;
        var gThis = this;
        var iGLog = this.GLog;
        pTable.AllPlayerRun(function(p) {

            if (p.mjState != TableState.roundFinish) p.mjState = TableState.waitCard;
            p.eatFlag = 0;

            //开杠马上结算---结算!!!!
            if (p != pl && p.mjState != TableState.roundFinish) {
                if (msg.gang == 1) //明杠---点杠玩家减
                {
                    if (p.uid == tData.uids[tData.curPlayer]) {
                        if (gThis.majiang.isQian4(pTable) || gThis.majiang.isHou4(pTable)) {
                            p.winone -= 4;
                            pl.winone += 4;
                            pl.gangWin[msg.card + "|" + p.uid] = 4;
                            //iGLog("wcx4:pl.gangWin1 前4/后4=" + pl.gangWin[msg.card+"|"+p.uid] );
                        } else {
                            p.winone -= 2;
                            pl.winone += 2;
                            pl.gangWin[msg.card + "|" + p.uid] = 2;
                            //iGLog("wcx4:pl.gangWin1=" + pl.gangWin[msg.card+"|"+p.uid] );
                        }
                    }
                } else if (msg.gang == 2) //自摸明杠 所有未胡玩家都扣
                {
                    if (pl.mjpeng4.indexOf(msg.card) < 0) {
                        if (gThis.majiang.isQian4(pTable) || gThis.majiang.isHou4(pTable)) {
                            p.winone -= 2;
                            pl.winone += 2;
                            pl.gangWin[msg.card + "|" + p.uid] = 2;
                            //iGLog("wcx4:pl.gangWin2 前4/后4 =" + pl.gangWin[msg.card+"|"+p.uid] );
                        } else {
                            p.winone--;
                            pl.winone++;
                            pl.gangWin[msg.card + "|" + p.uid] = 1;
                            //iGLog("wcx4:pl.gangWin2=" + pl.gangWin[msg.card+"|"+p.uid] );
                        }
                    }
                } else if (msg.gang == 3) //暗杠 所有未胡玩家都扣
                {
                    if (gThis.majiang.isQian4(pTable) || gThis.majiang.isHou4(pTable)) {
                        p.winone -= 4;
                        pl.winone += 4;
                        pl.gangWin[msg.card + "|" + p.uid] = 4;
                        //iGLog("wcx4:p.uid="  + p.uid + " p.winone=" + p.winone );
                        //iGLog("wcx4:pl.gangWin3=" + pl.gangWin[msg.card+"|"+p.uid] );
                    } else {
                        p.winone -= 2;
                        pl.winone += 2;
                        pl.gangWin[msg.card + "|" + p.uid] = 2;
                        //iGLog("wcx4:p.uid="  + p.uid + " p.winone=" + p.winone );
                        //iGLog("wcx4:pl.gangWin3=" + pl.gangWin[msg.card+"|"+p.uid] );
                    }
                }
            }

            if (canEatGang && p != pl) //可以抢杠---抢扛胡的逻辑!!
            {
                //iGLog("wcx4:canEatGang1" );
                var hType = gThis.GetHuType(tData, p, msg.card); //开杠测试
                if (hType > 0 && gThis.GetSkipHu(tData, p, 2) > p.skipHu) //开杠胡
                {
                    if (p.skipHu > 0) //遇到了番数更高的胡,通知客户端skipHu可以解锁
                    {
                        p.skipHu = 0;
                        p.notify("skipHu", { skipHu: true });
                        //iGLog("wcx4:skipHu false");

                    }
                    if (tData.canEatHu) {
                        if (msg.gang != 3 || hType == 13) {
                            p.mjState = TableState.waitEat;
                            p.eatFlag = 8;

                            eatGangOK = true;
                            //iGLog("wcx4:MJGang2" );
                        } else {
                            //iGLog("wcx4:MJGang3" );
                        }
                    } else {
                        if (msg.gang != 3 || hType == 13) {
                            p.mjState = TableState.waitEat;
                            p.eatFlag = 8;
                            eatGangOK = true;
                            //iGLog("wcx4:MJGang4" );
                        } else {
                            //iGLog("wcx4:MJGang5" );
                        }
                    }

                } else {
                    //iGLog("wcx4:canEatGang error" );
                    //iGLog("wcx4:canEatGang hType=" + hType );
                }
            }
        });

        msg.winone = pTable.PlayerPtys(function(p) { return p.winone; });
        msg.eatFlag = pTable.PlayerPtys(function(p) { return p.eatFlag });

        //this.GLog("wcx4:CGameCodeWanZhou MJGang msg=" + JSON.stringify(msg) );

        //this.GLog("wcx4:MJGang- NotifyAll -'MJGang'");
        pTable.newNotifyAllWithMsgID('MJGang', msg); //广播 杠的信息
        pTable.mjlog.push('MJGang', msg); //杠

        tData.curPlayer = tData.uids.indexOf(pl.uid); //curPlayer 转换
        tData.tState = TableState.waitEat; //table State 转换
        this.SendNewCard(pTable, tagFrom); //杠后尝试补牌
    } else {
        //this.GLog("wcx4:error.MJGang !!!!!!!!!!!!!!!!!!!!!!error !!!!!!!!!!" );

        if (tData.tState == TableState.waitPut && pl.mjState == TableState.waitPut && tData.uids[tData.curPlayer] == pl.uid) {

        } else {
            //this.GLog("huyan:error tData.tState " + tData.tState );
            //this.GLog("huyan:error pl.mjState " + pl.mjState );
        }
        //console.error(tData.tState+" "+pl.mjState+" "+tData.uids[tData.curPlayer]+" "+pl.uid);
    }

    this.showAllPlayerInfo(pTable, "CGameCodeWanZhou:MJGang end");

    //wcx4:CGameCodeFightEnd MJGang pl.gangWin={\"28|100342\":2}" ---28:8桶 100342:打出8桶的玩家uid  2:赢的2分
    //this.GLog("wcx4:CGameCodeWanZhou MJGang gang pl.uid=" + pl.uid + " pl.lastGang=" + pl.lastGang);
    //this.GLog("wcx4:CGameCodeWanZhou MJGang pl.gangWin=" + JSON.stringify(pl.gangWin) +" gang pl.uid=" + pl.uid);
    //this.GLog("wcx4:CGameCodeWanZhou MJGang----------------------------end" );
}



/**
 * 计算番
 * @pi 调去该函数玩家
 */
CGameCodeWanZhou.prototype.computeFan = function(huPl, pTable, mjHuMsg) {
    var tData = pTable.tData;
    for (var i = 0; i < huPl.length; i++) {
        var pi = huPl[i];
        tData.wuid.push(pi.uid);
        pi.lastCard = pi.mjhand[pi.mjhand.length - 1];
        mjHuMsg.wins[pi.uid] = { lastCard: pi.lastCard, winType: pi.winType };

        var baseWin = 1; //万州麻将 0番是2, 但这里依然写1 ,等到所有分数算完后,进行一个普通算法与万州的转换
        var genArr = []; //跟的个数
        //if(!tData.noBigWin) //del by wcx 不要啦
        {
            //this.GLog("wcx4:computeFan call = this.computeBaseWin"  );
            baseWin = this.computeBaseWin(pi, true, tData, false, genArr);

            //天胡
            var firstWin = pi.winType == WinType.pickNormal && pi.getNum == 1 && tData.cardNext == (tData.maxPlayers * 13 + 1);

            //地胡
            var secondWin = pi.winType == WinType.pickNormal && pi.getNum == 1 && tData.cardNext != (tData.maxPlayers * 13 + 1);

            if (pi.winType >= WinType.pickNormal) //pickNormal:4, //普通自摸
            {
                if (pi.winType != WinType.pickNormal) //不是自摸
                {
                    baseWin *= 2;
                    pi.mjdesc.push("杠上花");
                    if (tData.gshdianpao && pi.winType == WinType.pickGang1) {

                    } else {
                        pi.mjdesc.push("自摸");
                        //自摸加番 del by wcx 20161128 万州   12. 没有自摸加番或自摸加底的玩法,也就是说胡的方式是自摸的前提下，分数不会多加+1，也不会有加番。
                        /*
                        if (tData.zimofan)
                        {
                            baseWin*=2;
                        }
                        */
                    }
                } else {
                    pi.mjdesc.push("自摸");
                    //自摸加番

                    /*del by wcx 20161128 万州   12. 没有自摸加番或自摸加底的玩法,也就是说胡的方式是自摸的前提下，分数不会多加+1，也不会有加番。
                    if (tData.zimofan)
                    {
                        baseWin*=2;
                    }*/
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

            //add by wcx 报叫：+1番
            //this.GLog("wcx4:computeFan pi.mjting=" + pi.mjting + " pi.uid=" + pi.uid  );
            if (pi.mjting) {
                baseWin *= 2;
                pi.mjdesc.push("报叫");
            }

            if (this.majiang.isQian4(pTable)) {
                baseWin *= 2;
                pi.mjdesc.push("前四");
            } else if (this.majiang.isHou4(pTable)) {
                baseWin *= 2;
                pi.mjdesc.push("后四");
            }

            if (baseWin > tData.maxWin) {
                baseWin = tData.maxWin;
            }
        }

        //算 根的逻辑-
        if (baseWin == 1) {
            pi.mjdesc.push("屁胡");
        }

        var iClientMaxWin = this.getMaxWin(tData.maxWin);

        //this.GLog("wcx4:computeFan tData.maxWin=" + tData.maxWin + " baseWin 1 =" + baseWin   );

        baseWin = this.getMaxWin(baseWin); //原算分逻辑 换算成 万州的

        //this.GLog("wcx4:computeFan  " + " baseWin 计算后 =" + baseWin   );

        if (baseWin > iClientMaxWin) {
            baseWin = iClientMaxWin;
        }

        pi.baseWin = baseWin;
    }
}


/**
 * @pi 调去该函数玩家
 * @withDesc 带不带描述
 * @tData 牌桌数据　
 * @isCha 是否大叫
 * @genArr 跟的数组
 * @return
 */
CGameCodeWanZhou.prototype.computeBaseWin = function(pi, withDesc, tData, isCha, genArr) {
    //this.GLog("wcx4:CGameCodeWanZhou_computeBaseWin-------------------------------begin");
    //this.GLog("wcx4:CGameCodeWanZhou_computeBaseWin pi.uid=" + pi.uid + "isCha=" + isCha + " withDesc=" + JSON.stringify(withDesc));

    var baseWin = 1; //这里0番2分

    //是否7小队胡法
    var num2 = pi.huType == 7 ? 1 : 0;
    //是否大对碰
    var num3 = 0;
    //if(tData.yaojidai && this.majiang.hasCardNum(pi.mjhand ,this.majiang.getYaoJi())){
    if (tData.yaojidai) {
        //是否龙7对
        if (num2 == 1 && (this.majiang.canGang1([], pi.mjhand, []).length > 0 || this.majiang.canPengForQiDui(pi.mjhand).length > 0)) {
            num2 = 2;
            //this.GLog("wcx4:CGameCodeWanZhou_computeBaseWin 条件2 成立 num2=2");
        } else {
            //this.GLog("wcx4:CGameCodeWanZhou_computeBaseWin 条件2 未成立");
        }

        num3 = num2 > 0 ? 0 : this.majiang.All3New(pi);
    } else {
        //this.GLog("wcx4:CGameCodeWanZhou_computeBaseWin num2=" + num2 + "  pi.huType=" +  pi.huType );
        //是否龙7对
        if (num2 == 1 && this.majiang.canGang1([], pi.mjhand).length > 0) {
            //this.GLog("wcx4:CGameCodeWanZhou_computeBaseWin 条件1 成立 num2=2");
            num2 = 2;
        } else {
            //this.GLog("wcx4:CGameCodeWanZhou_computeBaseWin 条件1 未成立");
        }
        num3 = num2 > 0 ? 0 : this.majiang.All3(pi);
    }
    //清一色的标志
    var sameColor = this.majiang.SameColor(pi, tData);
    //所有牌是否带19
    var all19 = this.majiang.all19(pi);

    //this.GLog("wcx4:CGameCodeWanZhou_computeBaseWin-  pi.huType=" +  pi.huType + " num2=" + num2 + " num3=" + num3 + " sameColor="+sameColor + " all19=" + all19);


    //是否是 "三搭"
    var iIs3Da = this.majiang.is3Da(pi);
    //是否是"对对胡"
    var iIsDuiDuiHu = (num3 == 1);

    //是否是 "清三搭"
    var iIsQing3Da = (sameColor && iIs3Da);
    //金钩钓
    var iIsJinGouDiao = ((pi.mjhand.length == 2 && (!isCha)) || (pi.mjhand.length == 1 && (!isCha)));
    var iIsQingJinGou = (iIsQing3Da && iIsJinGouDiao); //是否是 "清金钩"

    //this.GLog("wcx4:computeBaseWin-  iIs3Da=" +  iIs3Da + " iIsDuiDuiHu=" + iIsDuiDuiHu +  " iIsQing3Da=" + iIsQing3Da);
    //this.GLog("wcx4:computeBaseWin-  iIsJinGouDiao="+iIsJinGouDiao + " iIsQingJinGou=" + iIsQingJinGou + " tData.yaojiu=" + tData.yaojiu);

    if (iIsQingJinGou) {
        baseWin *= 16;
        if (withDesc) {
            pi.mjdesc.push("清金钩");
        }
        //this.GLog("wcx4:CGameCodeWanZhou_computeBaseWin 清金钩 iIsQingJinGou=" + iIsQingJinGou);
    } else {
        if (iIsQing3Da) {
            baseWin *= 4;
            if (withDesc) {
                pi.mjdesc.push("清三搭");
            }
            //this.GLog("wcx4:CGameCodeWanZhou_computeBaseWin 清三搭");
        }


        if (iIsJinGouDiao) ////血流成河，最后一张牌没有放到mjhand
        {
            baseWin *= 4;
            if (withDesc) {
                pi.mjdesc.push("金钩钓");
            }
            //this.GLog("wcx4:CGameCodeWanZhou_computeBaseWin 金钩钓");
        }
    }


    if (iIsDuiDuiHu) {
        if (sameColor && !iIsQing3Da) //清对 不能与 "清三搭" 同时出现
        {
            baseWin *= 4;
            if (withDesc) {
                pi.mjdesc.push("清对"); //11.清对：即清一色+对对胡，24分----2番（24分）
            }
            //this.GLog("wcx4:CGameCodeWanZhou_computeBaseWin 清对");
        } else if (!iIsQingJinGou && !iIsJinGouDiao) //"大对子"是"清金勾"的特殊情况
        {
            baseWin *= 2;
            if (withDesc) {
                pi.mjdesc.push("大对子");
            }
            //this.GLog("wcx4:CGameCodeWanZhou_computeBaseWin 大对子");
        }
    } else if (num3 == 2 && (!tData.yaojiu) && !iIsQingJinGou && !iIsJinGouDiao) {
        baseWin *= 2;
        if (withDesc) {
            pi.mjdesc.push("大对子");
        }
        //this.GLog("wcx4:CGameCodeWanZhou_computeBaseWin 大对子2");
    }

    //7对
    if (num2 > 0) {
        //龙7对
        if (num2 > 1) {
            if (sameColor) {
                baseWin *= 8;
                if (withDesc) {
                    pi.mjdesc.push("清龙七对");
                }
                //this.GLog("wcx4:CGameCodeWanZhou_computeBaseWin 清龙七对");
            } else {
                baseWin *= 4;
                var longNum = this.majiang.canGang1([], pi.mjhand).length;
                if (withDesc) {
                    if (longNum == 1) {
                        pi.mjdesc.push("龙七对");
                    }
                    if (longNum == 2) {
                        baseWin *= 2;
                        pi.mjdesc.push("双龙七对");
                    } else if (longNum >= 3) {
                        baseWin *= 4;
                        if (longNum == 3) {
                            pi.mjdesc.push("三龙七对");
                        } else {
                            pi.mjdesc.push("四龙七对");
                        }
                    }
                }
                //this.GLog("wcx4:CGameCodeWanZhou_computeBaseWin 龙七对");
            }
        } //7对
        else {
            if (sameColor) {
                baseWin *= 4;
                if (withDesc) {
                    pi.mjdesc.push("清七对");
                }
                //this.GLog("wcx4:CGameCodeWanZhou_computeBaseWin 清七对");
            } else {
                baseWin *= 2;
                if (withDesc) {
                    pi.mjdesc.push("暗七对");
                }
                //this.GLog("wcx4:CGameCodeWanZhou_computeBaseWin 七巧对");
            }
        }
    } else if (sameColor && !iIsDuiDuiHu && !iIsQing3Da && !iIsJinGouDiao) //清一色的前提是 不能是 "对对胡", "清三搭", "清金钓"
    {
        baseWin *= 2;
        if (withDesc) {
            pi.mjdesc.push("清一色");
        }
        //this.GLog("wcx4:CGameCodeWanZhou_computeBaseWin 清一色");
    }
    //this.GLog("wcx4:CGameCodeWanZhou_computeBaseWin-------------------------------end baseWin=" + baseWin);
    return baseWin;
}

/**
 * 玩家出牌（打牌）
 * @pl---出牌(打牌)的玩家 pl.uid=100342
 * @msg--{"cmd":"MJPut","card":28,"__route__":"pkroom.handler.tableMsg"}"
 * @session
 * @next
 * @tTable
 */
CGameCodeWanZhou.prototype.fRecieveMjPut = function(pl, msg, session, next, tTable) {
    var isAutoPut = true;
    if (next) {
        next(null, null); //if(this.GamePause()) return;
        isAutoPut = false;
    }

    var tData = tTable.tData;
    if (tData.tState == TableState.waitPut && pl.uid == tData.uids[tData.curPlayer]) //只有当前玩家 才可以发牌
    {
        //this.GLog("wcx4:fRecieveMjPut------------------------begin");
        //this.GLog("wcx4:msg=" + JSON.stringify(msg));
        //this.GLog("wcx4:Table.prototype.MJPut2");
        var cdIdx = pl.mjhand.indexOf(msg.card);
        //this.GLog("wcx4:fRecieveMjPut---pl.uid=" + pl.uid + " pl.mjhand.indexOf(msg.card)=" + cdIdx);

        if (cdIdx >= 0) {
            if (!isAutoPut) {
                tTable.InitAutoState(pl);
            }
            //add by mrhu
            var Qian4 = this.majiang.isQian4(tTable);

            pl.mjhand.splice(cdIdx, 1); //手里的牌 --删除这一张
            pl.mjput.push(msg.card); //打出的牌 加一张
            pl.skipHu = 0; //.....
            msg.uid = pl.uid; //准备要广播的 数据!
            tData.lastPut = msg.card; //记录最后张牌
            tData.lastPutPlayer = tData.curPlayer; //记录最后 发牌的玩家
            tData.tState = TableState.waitEat; //更新牌桌状态 为, waitEat
            pl.mjState = TableState.waitCard; //更新 用户状态为 waitCard
            pl.eatFlag = 0; //自己不能吃----------
            //如果message是1认为客户端点了报听
            //this.GLog("wcx4:Table.prototype.MJPut5");
            if (msg.ting == 1) //如果用户 处于ting 态???? 看样子这代码不会被执行啊...
            {
                //this.GLog("huyan:" + JSON.stringify( pl.mjhand ) );
                var maxWin = this.majiang.checkMJTing(pl, tTable);
                //gThis.majiang.isQian4(pTable)
                if (maxWin > 0 && Qian4) {
                    //this.GLog("wcx4:recieve MJPut9 pl.mjting=true pl.uid=" + pl.uid);
                    pl.mjting = true;
                    msg.mjting = true;
                    msg.firstPick = pl.firstPick;
                }
            }
            //this.GLog("wcx4:Table.prototype.MJPut6 tData.putType=" + tData.putType);
            if (tData.putType > 0 && tData.putType < 4) //1,2,3
            {
                tData.putType = 4;
            } else {
                tData.putType = 0;
            }

            //this.GLog("wcx4:Table.prototype.MJPut7   tData.putType=" + tData.putType);
            var iGLog = this.GLog;
            var pThis = this;
            tTable.AllPlayerRun(function(p) {
                if (p != pl) //非打牌玩家
                {
                    if (p.mjState != TableState.roundFinish && p.winType == 0) //玩家 没有 roundFinish, winType==0
                    {
                        p.eatFlag = pThis.GetEatFlag(p, tData);

                        if (p.eatFlag != 0) {
                            if (p.huType == WinType.eatPut) {
                                var baseWin = 1; //万州麻将 0番是2, 但这里依然写1 ,等到所有分数算完后,进行一个普通算法与万州的转换
                                var genArr = []; //跟的个数
                                var iOldHandCount = p.mjhand.length;
                                p.mjhand.push(tData.lastPut);
                                baseWin = pThis.computeBaseWin(p, false, tData, false, genArr); //返回的是未转换之前的 分数, 因为底金是1 所有 1就是没有番---屁胡
                                if (p.mjting) { //报听也要加一番.add by wcx 20161202
                                    baseWin *= 2;
                                }
                                if (p.mjhand.length > iOldHandCount) {
                                    p.mjhand.length = p.mjhand.length - 1;
                                    //iGLog("wcx4: iOldHandCount=" + iOldHandCount  );
                                }

                                if (baseWin <= 1 && (tData.putType < 1)) //如果是屁胡 ---- tData.putType 1:吃明杠 2:自摸明杠 3:暗杠 4:转与
                                {
                                    if (pThis.majiang.isQian4(tTable) || pThis.majiang.isHou4(tTable)) {
                                        p.mjState = TableState.waitEat; //可以吃牌了
                                        //iGLog("wcx4: 前4后4可以吃牌了1  p.uid=" + p.uid  );
                                    } else {
                                        //iGLog("wcx4: 非前4后4 等待发牌 1  p.uid=" + p.uid  + " tData.putType=" + tData.putType + " p.eatFlag=" + p.eatFlag);
                                        if (p.eatFlag >= 8) {
                                            p.eatFlag -= 8; //add by wcx 20161126 防止闪胡
                                        }

                                        if (p.eatFlag > 0) {
                                            p.mjState = TableState.waitEat; //可以吃牌了
                                        } else {
                                            p.mjState = TableState.waitCard; //等待发牌
                                        }
                                    }
                                } else //非屁胡 可以直接吃牌
                                {
                                    p.mjState = TableState.waitEat; //可以吃牌了
                                    //iGLog("wcx4: 非屁胡->可以吃牌了1  p.uid=" + p.uid  );
                                }
                            } else {
                                p.mjState = TableState.waitEat; //可以吃牌了
                                //iGLog("wcx4: 可以吃牌了2  p.uid=" + p.uid  );
                            }
                        } else {
                            p.mjState = TableState.waitCard; //等待发牌
                            //iGLog("wcx4: 等待发牌 2  p.uid=" + p.uid  );
                        }
                    }
                }
            });
            //this.GLog("wcx4:Table.prototype.MJPut8");

            var cmd = msg.cmd;
            msg.putType = tData.putType;
            msg.eatFlag = tTable.PlayerPtys(function(p) { return p.eatFlag });

            //this.GLog("wcx4:NotifyAll-----msg=" +  JSON.stringify(msg));
            //this.GLog("wcx4:MJGang- NotifyAll -'cmd='" + cmd + " msg=" + msg);
            tTable.newNotifyAllWithMsgID(cmd, msg);
            tTable.mjlog.push(cmd, msg); //打牌
            this.SendNewCard(tTable, "b"); //打牌后尝试发牌
        }
        this.showAllPlayerInfo(tTable, "CGameCodeFightEnd_fRecieveMjPut_end");
        //this.GLog("wcx4:fRecieveMjPut___________________end");
    }
}

/*
 * 查大叫
 * */
CGameCodeWanZhou.prototype.ChaDaJiao = function(tb, pl, byEndRoom) {
    var tData = tb.tData;
    var gThis = this;
    var iGLog = this.GLog;


    var fakeWin = [];
    var fakeLose = [];

    tb.AllPlayerRun(function(p) {
        //iGLog("wcx4:  p.uid=" +  p.uid + " p.baseWin=" +  p.baseWin + "__________________开始_____________");
        p.mjState = TableState.roundFinish;
        if (!pl && !byEndRoom) {
            if (p.winType == 0) {
                if (tData.xuezhandd) //血战模式下才有查大叫
                {
                    //检测是否听牌 停牌的为赢家
                    //iGLog("wcx4: call missHandMax 111 " +  " p.uid=" +  p.uid + " 前p.mjhan=" + p.mjhand);
                    p.baseWin = gThis.missHandMax(p, tData, true);
                    var iClientMaxWin = gThis.getMaxWin(tData.maxWin);
                    //iGLog("wcx4: call missHandMax 111 " +  " p.uid=" +  p.uid + " 后p.mjhan=" + p.mjhand);
                    //iGLog("wcx4:p.baseWin=" +  p.baseWin + " p.uid=" +  p.uid + "missHandMax 计算后的结果" + " p.mjdesc=" + p.mjdesc);
                    if (p.baseWin > 0) {
                        fakeWin.push(p);
                        if (p.baseWin > iClientMaxWin) //番数不能超过最大番数
                        {
                            p.historyMaxBaseWin = p.baseWin;
                            p.baseWin = iClientMaxWin;
                        }
                    } else {
                        fakeLose.push(p);
                    }
                } else {
                    p.baseWin = 0;
                }
            }
        }
        //iGLog("wcx4:  p.uid=" +  p.uid + " p.baseWin=" +  p.baseWin + "__________________结束_____________");
    });

    if (tData.xuezhandd) //血战模式下才有查大叫
    {
        //this.GLog("wcx4:EndGame___________________我是分割线______________________________");
        //修改查大叫的逻辑, 假如 1家胡,另外3个没胡,3家也没有听牌的就不触发查大叫.不然3家都查出0
        if (false) //add by wcx 只有允许转与的时候,才执行下面的代码
        {
            var iNum = 0;
            for (var i = 0; i < fakeWin.length; i++) {
                var pl = fakeWin[i];
                iNum += pl.baseWin;
            }



            if (iNum <= 0) {
                for (var i = 0; i < fakeLose.length; i++) {
                    var pl = fakeLose[i];
                    fakeWin.push(pl);
                }

                fakeLose.splice(0, fakeLose.length); //清空数组
            }
        }

        for (var j = 0; j < fakeWin.length; j++) {
            var pW = fakeWin[j];
            //this.GLog("wcx4: call missHandMax fakeWin 2222 " +  " p.uid=" +  pW.uid + "前p.mjhan=" + pW.mjhand + " p.mjdesc=" + pW.mjdesc);
            this.missHandMax(pW, tData);
            //this.GLog("wcx4: call missHandMax fakeWin 2222 " +  " p.uid=" +  pW.uid + "后p.mjhan=" + pW.mjhand + " p.mjdesc=" + pW.mjdesc);
        }

        for (var i = 0; i < fakeLose.length; i++) {
            var pW = fakeLose[i];
            //this.GLog("wcx4: call missHandMax fakeLose 3333 " +  " p.uid=" +  pW.uid + "前p.mjhan=" + pW.mjhand + " p.mjdesc=" + pW.mjdesc);
            this.missHandMax(pW, tData);
            //this.GLog("wcx4: call missHandMax fakeLose 3333 " +  " p.uid=" +  pW.uid + "后p.mjhan=" + pW.mjhand + " p.mjdesc=" + pW.mjdesc);
        }


        //查大叫
        for (var j = 0; j < fakeWin.length; j++) {
            var pW = fakeWin[j];
            if (tData.wuid.indexOf(pW.uid) < 0) {
                tData.wuid.push(pW.uid);
            }

            if (fakeLose.length == 0) {
                pW.baseWin = 0;
                pW.mjhand.length = pW.mjhand.length - 1;
            }
        }


        //this.GLog("wcx4:EndGame________________fakeLose.length=" + fakeLose.length + " fakeWin.length=" + fakeWin.length);
        for (var i = 0; i < fakeLose.length; i++) {
            var pL = fakeLose[i];
            pL.mjdesc.push("查大叫");

            /* del by wcx 万州查大叫不返还扛钱
             //this.GLog("wcx4:EndGame________________查大叫开始________________pL.uid=" + pL.uid);
             this.showAllPlayerInfo(tb ,"EndGame_查大叫_ 开始" );
             this.ReturnGangWin(tb,pL,false);
             this.showAllPlayerInfo(tb ,"EndGame_查大叫_ ReturnGangWin" );
             */

            if (tData.wuid.indexOf(pL.uid) < 0) {
                tData.wuid.push(pL.uid);
            }
            for (var j = 0; j < fakeWin.length; j++) {
                var pW = fakeWin[j];
                //this.GLog("wcx4:EndGame______fakeWin.uid" + pW.uid + " 被查叫玩家要损失 pW.baseWin=" + pW.baseWin);
                pW.winone += pW.baseWin;
                pL.winone -= pW.baseWin;
            }
            this.showAllPlayerInfo(tb, "EndGame_查大叫_ 计算baseWin 一轮查大叫 结束");
        }

    }
}

CGameCodeWanZhou.prototype.EndGame = function(tb, pl, byEndRoom) {
    //this.GLog("wcx4:EndGame--------------------------------begin");
    var tData = tb.tData;
    this.showAllPlayerInfo(tb, "CGameCodeWanZhou_EndGame_begin");
    var gThis = this;
    var iGLog = this.GLog;
    this.ChaDaJiao(tb, pl, byEndRoom);
    tData.tState = TableState.roundFinish;
    tb.clearTimeout4Table123(tb);
    tb.clearAllPlayersTrustee();
    var owner = tb.players[tData.uids[0]].info;
    if (!byEndRoom && !tb.tData.coinRoomCreate) {
        if (!owner.$inc) {
            if (tb.isFree(tb)) { //add by wcx 万州 玩法免费
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
        gThis.checkCardNum(p);
        // 金币场
        if (tb.tData.coinRoomCreate) {
            var info = p.info;
            if (!info.$inc) {
                info.$inc = { coin: 0 };
            }
        }
        //重置默认
        p.mjting = false;
        p.isMaiPai = false;

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

    //var roundEnd = { players: tb.collectPlayer('mjhand', 'mjdesc', 'winone', 'winall', 'winType', 'baseWin', 'mjhu'), tData: this.app.CopyPtys(tData) };
    tb.mjlog.push("roundEnd", roundEnd); //一局结束
    //this.GLog("wcx4:CGameCodeFightEnd--mjlog  roundEnd");
    var playInfo = null;
    if (tData.roundNum == 0) {
        playInfo = this.EndRoom(tb); //结束
    } else if (tData.coinRoomCreate && !tData.isVIPTable) {
        playInfo = this.EndRoom(tb); //结束
    }
    if (playInfo) {
        roundEnd.playInfo = playInfo;
    }

    //this.GLog("wcx4:roundEnd- NotifyAll -roundEnd=" + roundEnd);
    tb.newNotifyAllWithMsgID("roundEnd", roundEnd);

    //this.GLog("wcx4:EndGame--------------------------------end");
}

/**
 * 查大叫
 * @return 查大叫返的分数
 */
CGameCodeWanZhou.prototype.missHandMax = function(pl, tData, _notdesc) {
    var desc = false;
    if (null == _notdesc || typeof(_notdesc) == "undefined") {
        desc = true;
    }

    if (this.majiang.CardCount(pl) >= 14) //add by wcx 20161219 只有当牌的张数小于14可以执行这个函数
    {
        return pl.baseWin;
    }

    //this.GLog("wcx4:missHandMax  ________ 开始" + "  pl.uid" + pl.uid + " pl.mjhand=" + pl.mjhand + " pl.mjdesc=" + pl.mjdesc );

    var mjhand = pl.mjhand;
    var iYaoJiNum = this.majiang.hasCardNum(mjhand, this.majiang.getYaoJi());

    var tryCard = {};
    for (var i = 0; i < mjhand.length; i++) {
        var cd = mjhand[i];
        for (var j = -1; j <= 1; j++) {
            var cj = cd + j;
            if (cj >= 1 && cj <= 9 || cj >= 11 && cj <= 19 || cj >= 21 && cj <= 29) {
                /*
                 var cNum=cardNum[cj];
                 if(!cNum) cNum=0;
                 if(cNum<4) */

                if (iYaoJiNum > 0 && tData.yaojidai && cj == this.majiang.getYaoJi()) {

                } else {
                    tryCard[cj] = cj;
                }
            }
        }
    }

    //this.GLog("wcx4:missHandMax  ________ tryCard" + "  tryCard=" + JSON.stringify(tryCard)  );

    var maxWin = 0;
    mjhand.push(0);
    var oldBloodDes = pl.mjdesc.slice(0);
    for (var cd in tryCard) {
        var lastCD = mjhand[mjhand.length - 1];
        var cdi = tryCard[cd];
        mjhand[mjhand.length - 1] = cdi;
        var huType = 0;
        huType = this.majiang.canHu(false, mjhand, false, tData);

        //this.GLog("wcx4:missHandMax  ________ mjhand=" + JSON.stringify(mjhand) );
        //console.info("tryCard "+cdi+" "+huType);
        if (huType > 0) {
            var oldDesc = pl.mjdesc;
            pl.mjdesc = [];
            //this.GLog("wcx4:missHandMax  " + " 清空Desc pl.uid" + pl.uid + " oldDesc=" + oldDesc   );
            pl.huType = huType;
            var isCha = tData.blood;
            var winNum = this.computeBaseWin(pl, desc, tData, isCha, []);
            if (pl.mjting) { //报听也要加一番.add by wcx 20161202
                winNum *= 2;
            } { //换算成万州的
                var iClientMaxWin = this.getMaxWin(tData.maxWin);
                //this.GLog("wcx4:missHandMax tData.maxWin=" + tData.maxWin + " winNum 1 =" + winNum   );
                winNum = this.getMaxWin(winNum); //原算分逻辑 换算成 万州的
                //this.GLog("wcx4:missHandMax  " + " winNum 计算后 =" + winNum   );
                if (winNum > iClientMaxWin) {
                    winNum = iClientMaxWin;
                }
            }
            if (winNum > maxWin) {
                maxWin = winNum;
            } else {
                pl.mjdesc = oldDesc;
                mjhand[mjhand.length - 1] = lastCD;
            }
        } else {
            mjhand[mjhand.length - 1] = lastCD;
        }
    }
    //add by mrhu
    pl.mjdesc = oldBloodDes;

    if (maxWin == 0) mjhand.length = mjhand.length - 1;

    //this.GLog("wcx4:missHandMax  ________ 结束" + " pl.uid=" + pl.uid + " mjhand=" + mjhand );

    this.checkCardNum(pl);
    return maxWin;
}

/*
 * 猫屎盖(牌不能多于14张)*/
CGameCodeWanZhou.prototype.checkCardNum = function(pl) {
    if (this.majiang.CardCount(pl) > 14) //add by wcx 20161217 防止多牌
    {
        //this.GLog("wcx4:checkCardNum 出现问题多牌了");
        pl.mjhand.length = pl.mjhand.length - 1;
    }
}

CGameCodeWanZhou.prototype.canTingGang = function(tData, hand, cd) {
    var boolchek = false;
    var tempCard = [];
    for (var t in hand) {
        tempCard[t] = hand[t];
    }
    //this.GLog("wcx4:zhengwei_canTingGang1:   "+tempCard);
    for (var i = 0; i < tempCard.length; i++) {
        if (tempCard[i] == cd) {
            tempCard.splice(i, 3);
            break;
        }
    }

    //this.GLog("wcx4:zhengwei_canTingGang2:   "+hand);
    for (j = 1; j <= 29; j++) {
        if ((j >= 1 && j <= 9) || (j >= 11 && j <= 19) || (j >= 21 && j <= 29)) {
            //this.GLog("wcx4:zhengwei_canTingGangLog:   "+j);
            var hutype = this.majiang.canHu(false, hand, j, tData);
            //this.GLog("wcx4:zhengwei_canTingGangLog2:   "+hutype);
            var hutype2 = this.majiang.canHu(false, tempCard, j, tData);
            //this.GLog("wcx4:zhengwei_canTingGangLog3:   "+hutype2);
            if (hutype > 0) {
                boolchek = false;
                if (hutype2 > 0 && hutype2 != 7) {
                    //this.GLog("wcx4:zhengwei_canTingGangLog4:   "+hutype2);
                    boolchek = true;
                }
            }
        }
    }
    //this.GLog("wcx4:zhengwei_canTingGang4:   "+tempCard);
    //this.GLog("wcx4:zhengwei_canTingGang3:   "+boolchek);
    //this.GLog("wcx4:zhengwei_canTingGang5:   "+hand);
    return boolchek;

}


/**
 * 吃碰杠胡旗标  0 1 2 4 8
 * @pl
 * @tData
 */
CGameCodeWanZhou.prototype.GetEatFlag = function(pl, tData) {
    //this.GLog("wcx4:GetEatFlag_______________________________________begin");
    var cd = tData.lastPut;

    var leftCard = (tData.withWind ? 136 : 108) - tData.cardNext;
    //this.GLog("wcx4:GetEatFlag pl.uid=" + pl.uid + " lastPut=" +cd + " leftCard=" + leftCard);

    //this.GLog("wcx4:GetEatFlag3");
    var eatFlag = 0;
    //this.GLog("wcx4:cardType begin");
    //if(this.majiang.cardType(cd)!=pl.mjMiss) //del by wcx 万州无缺
    {
        var oldSkipHu = pl.skipHu;
        var iPutFlag = false;
        iPutFlag = (tData.putType == 4);

        if ( /*this.majiang.cardTypeNum(pl.mjhand,pl.mjMiss)==0*/
            // &&(tData.canEatHu||tData.putType==4) //del by wcx 原始逻辑, 2016 11 21 ----为了 <<倒倒胡>>选中"自摸胡"里, 期望"杠上炮"不可以胡
            (tData.canEatHu || iPutFlag) &&
            this.GetHuType(tData, pl, cd) > 0 &&
            this.GetSkipHu(tData, pl, tData.putType == 4 ? 2 : 1) > oldSkipHu) {
            if (pl.skipHu > 0) //遇到了番数更高的胡,通知客户端skipHu可以解锁
            {
                pl.notifyWithMsgID("skipHu", { skipHu: false });
            }
            pl.skipHu = 0;

            eatFlag += 8;
            //this.GLog("wcx4:CGameCodeFightEnd.prototype.GetEatFlag   eatFlag+=8; ");
        }


        //this.GLog("wcx4:GetEatFlag  else ");

        if (this.majiang.canGang0(pl.mjhand, cd) && !pl.mjting) {
            eatFlag += 4;
        }
        //this.GLog("wcx4:zhengwei_mjting:  "+pl.mjting );
        //this.GLog("wcx4:zhengwei_canTingGang_mjting:  "+pl.mjting +  "   cd:    "+cd );
        //this.GLog("wcx4:zhengwei_canTingGang_canGang0:  "+this.majiang.canGang0(pl.mjhand,cd)+"   mjhand:    "+pl.mjhand);

        if (this.majiang.canGang0(pl.mjhand, cd) && pl.mjting && this.canTingGang(tData, pl.mjhand, cd)) {
            eatFlag += 4;
        }

        if (this.majiang.canPeng(pl.mjhand, cd) && !pl.mjting) {
            eatFlag += 2;
        }

        if (tData.canEat &&
            tData.uids[(tData.curPlayer + 1) % tData.maxPlayers] == pl.uid && //下家限制
            this.majiang.canChi(pl.mjhand, cd).length > 0 &&
            !pl.mjting) {
            eatFlag += 1;
        }
    }

    //this.GLog("wcx4:GetEatFlag pl.uid=" + pl.uid + " eatFlag=" + eatFlag);
    //this.GLog("wcx4:GetEatFlag-------------------------111------end");
    return eatFlag;
}

module.exports = CGameCodeWanZhou;