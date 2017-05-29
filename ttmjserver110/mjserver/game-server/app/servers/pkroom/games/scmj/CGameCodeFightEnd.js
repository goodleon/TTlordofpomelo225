//**************************************
//血战到底玩法---玩法-血战到底
//create by huyan
//
/**
 * 拍桌状态
 */
var TableState = {
        waitJoin: 1,
        waitReady: 2,
        waitPut: 3, //等待 打(出)牌
        waitEat: 4,
        waitCard: 5, //等待 发新牌
        roundFinish: 6,
        isReady: 7,
        waitMiss: 8, //选缺
        waitChange: 9 //等待换牌
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

var AutoState = {
    autoReady: 0, //进入准备
    autoYes: 1 //进入托管
}


var CoinData = {
    type: 0, //类型
    cost: 1, //获得每局消耗
    win: 2, //获得底分
    min: 3, //获得进入下限
    max: 4 //获得进入上限
}




var fs = require('fs');

function CGameCodeFightEnd(majiang, _GLOG, _app, tTable, logid, gameid, publicIp) {
    this.majiang = majiang;
    this.GLog = _GLOG;
    this.app = _app;
    this.GLog("CGameCodeFightEnd------------构造函数");
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
 * 结算统计，变换成字符存储
 */
CGameCodeFightEnd.prototype.getResultString = function(tData) {
    var res = "";
    if (tData.noBigWin) //推倒胡
    {
        res = "d";
    } else if (tData.doubleCarHouse) //内江麻将
    {
        res = "n"
    }
    //else if( tData.fight3p )//三人麻将
    //{
    //    res = "s"
    //}
    //else if( tData.fight2p ) //二人麻将
    //{
    //    res = "e";
    //}
    //3人2房是 s2  3人3房是s3  2人2房是 e2 2人3房是e3
    else if (tData.fight3pWith3) //3人3房是s3
    {
        res = "s3";
    } else if (tData.fight3p) //3人2房是 s2
    {
        if (tData.isVIPTable) {
            res = "s2V";
        } else if (tData.isTrust && tData.isTrust > 1) { //三人两房, 急速模式
            res = "s2js";
        } else {
            res = "s2";
        }
    } else if (tData.fight2pDoubleCard) //2人2房是 e2
    {
        if (tData.isVIPTable) { //2人2房 vip 房
            res = "e2V";
        } else {
            res = "e2";
        }
    } else if (tData.fight2p) // 2人3房是e3
    {
        res = "e3";
    } else if (tData.blood) //血流成河
    {
        if (tData.coinRoomCreate) {
            if (tData.isVIPTable) {
                res = "bcV";
            } else {
                res = "bc";
            }
        } else {
            res = "b";
        }
    } else if (tData.deyangType) {
        res = "y";
    } else if (tData.wanZhou) {
        res = "wz";
    } else {
        res = "z";
    }
    //res += "_f" + tData.maxWin;	//最大番数
    res += "_j" + tData.roundAll; //总局数
    if (tData.noBigWin) {
        res += "_p" + tData.canEatHu ? "1" : "0";
    } else {
        //res += ("_m" + (tData.z!imofan ? "0" : "1"));	//自摸加底
        //res += ("_h" + (tData.g!shdianpao ? "0" : "1"));	//杠上花
        res += ("_a" + (tData.with3 ? "1" : "0")); //换三张
        //res += ("_y" + (tData.yaojiu ? "1" : "0"));		//带幺九
        //res += ("_b" + (tData.menqing ? "1" : "0")); 	//门清中张
        //res += ("_t" + (tData.tiandihu ? "1" : "0"));	//天地胡
    }
    this.GLog("getResultString: " + res);
    return res;
}

/**
 * 继承方法
 */
function g_Inherit(superType, subType) {
    var _prototype = Object.create(superType.prototype);
    _prototype.constructor = subType;
    subType.prototype = _prototype;
}


CGameCodeFightEnd.prototype.testUpDate111 = function() {
    this.GLog("testUpDate111");
}


CGameCodeFightEnd.prototype.testUpDate = function() {
    this.test1 = 1;
    this.test2 = 1;
    this.GLog("testUpDate测试是否服务器热更成功!!" + this.test1);
    this.GLog("testUpDate测试是否服务器热更成功!!" + this.test2);
}

CGameCodeFightEnd.prototype.getMajiang = function() {
        return this.majiang;
    }
    /*
     *返回值大于 0 就是 可以胡牌了
     * 警告!!!!!!
     * 这个函数不能随便调用,会覆盖原来pl.huType!!!!!!!!!!!!!!!!
     * */
CGameCodeFightEnd.prototype.GetHuType = function(td, pl, cd) {
        //四川麻将7对可以胡?
        var huType = this.majiang.canHu(td.noBigWin, pl.mjhand, cd);
        pl.huType = huType;
        this.GLog("wcx2:GetHuType " + pl.huType + " pl.uid=" + pl.uid);
        return huType;
    }
    /**
     * 过胡
     */
CGameCodeFightEnd.prototype.GetSkipHu = function(td, pl, sc) {
        if (!sc) {
            sc = 1;
        }
        //四川麻将7对可以胡?
        pl.mjhand.push(td.lastPut);
        var skipHu = this.majiang.computeBaseWin(pl, false, td, false, []);
        pl.mjhand.length = pl.mjhand.length - 1;

        return skipHu * sc;
    }
    /**
     * 吃碰杠胡旗标  0 1 2 4 8
     * @pl
     * @tData
     */
CGameCodeFightEnd.prototype.GetEatFlag = function(pl, tData) {
    this.GLog("CGameCodeFightEnd.prototype.GetEatFlag-------------------------------begin");
    var cd = tData.lastPut;

    var leftCard = (tData.withWind ? 136 : 108) - tData.cardNext;
    this.GLog("CGameCodeFightEnd.prototype.GetEatFlag pl.uid=" + pl.uid + " lastPut=" + cd + " leftCard=" + leftCard);
    //两牌房牌数减少
    if (tData.doubleCarHouse) {
        leftCard = (tData.withWind ? 136 : 108) - 36 - tData.cardNext;
    }
    this.GLog("CGameCodeFightEnd.prototype.GetEatFlag3");
    var eatFlag = 0;
    this.GLog("cardType begin");
    //this.GLog("wcx2:CGameCodeFightEnd.prototype.GetEatFlag tData=" + JSON.stringify(tData));
    if (this.majiang.cardType(cd) != pl.mjMiss) {
        var oldSkipHu = pl.skipHu;
        var iPutFlag = false;
        if (tData.noBigWin) //如果是倒倒胡的处理---add by wc 2016/11/21
        {
            if (tData.canEatHu && (tData.putType == 4)) {
                iPutFlag = true;
            }
        } else {
            iPutFlag = (tData.putType == 4);
        }

        if (this.majiang.cardTypeNum(pl.mjhand, pl.mjMiss) == 0
            // &&(tData.canEatHu||tData.putType==4) //del by wcx 原始逻辑, 2016 11 21 ----为了 <<倒倒胡>>选中"自摸胡"里, 期望"杠上炮"不可以胡
            &&
            (tData.canEatHu || iPutFlag) &&
            this.GetHuType(tData, pl, cd) > 0 &&
            this.GetSkipHu(tData, pl, tData.putType == 4 ? 2 : 1) > oldSkipHu) {
            if (pl.skipHu > 0) //遇到了番数更高的胡,通知客户端skipHu可以解锁
            {
                pl.notifyWithMsgID("skipHu", { skipHu: false });
            }
            pl.skipHu = 0;

            eatFlag += 8;
            this.GLog("wcx2:CGameCodeFightEnd.prototype.GetEatFlag   eatFlag+=8; ");
        }
        if (tData.blood) {
            if (pl.mjhu.length > 0) {
                this.GLog("CGameCodeFightEnd.prototype.GetEatFlag eatFlag=" + eatFlag);
                this.GLog("CGameCodeFightEnd.prototype.GetEatFlag-------------------------0000------end");
                return eatFlag;
            }
        }

        if (tData.doubleCarHouse) {
            if (leftCard > 0 && this.majiang.canGang0(pl.mjhand, cd) && !pl.mjting) {
                eatFlag |= 4;
            }
            if (this.majiang.canPeng(pl.mjhand, cd) && !pl.mjting) {
                eatFlag |= 2;
            }

            this.GLog("wcx2:CGameCodeFightEnd.prototype.GetEatFlag if(tData.doubleCarHouse) ");
        } else {

            this.GLog("wcx2:CGameCodeFightEnd.prototype.GetEatFlag  else ");

            if (this.majiang.canGang0(pl.mjhand, cd)) {
                eatFlag += 4;
            }
            if ( //(leftCard>4||tData.noBigWin)&&
                this.majiang.canPeng(pl.mjhand, cd)) {
                eatFlag += 2;
            }
            if ( //(leftCard>4||tData.noBigWin)&&
                tData.canEat &&
                tData.uids[(tData.curPlayer + 1) % tData.maxPlayers] == pl.uid && //下家限制
                this.majiang.canChi(pl.mjhand, cd).length > 0
            ) eatFlag += 1;
        }
    }

    this.GLog("CGameCodeFightEnd.prototype.GetEatFlag pl.uid=" + pl.uid + " eatFlag=" + eatFlag);
    this.GLog("CGameCodeFightEnd.prototype.GetEatFlag-------------------------111------end");
    return eatFlag;
}

//战绩日志函数，自动添加index
var lastLogDay = 0;
CGameCodeFightEnd.prototype.doGameLog = function(para) {
        var day = new Date();
        day = (day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate()) + "";
        var thisApp = this.app;
        if (this.app != null) {
            if (thisApp.mdb != null) {
                thisApp.mdb.insert('gameLog' + day, para, function() {
                    if (lastLogDay != day) {
                        lastLogDay = day;
                        thisApp.mdb.db.collection('gameLog' + day).createIndex({ "uid1": 1 }, { "background": 1 });
                        thisApp.mdb.db.collection('gameLog' + day).createIndex({ "uid2": 1 }, { "background": 1 });
                        thisApp.mdb.db.collection('gameLog' + day).createIndex({ "uid3": 1 }, { "background": 1 });
                        thisApp.mdb.db.collection('gameLog' + day).createIndex({ "uid4": 1 }, { "background": 1 });
                    }
                });
            }
        }

    }
    //end

CGameCodeFightEnd.prototype.EndRoom = function(tb, msg) {
    var playInfo = null;
    this.GLog("CGameCodeFightEnd.prototype.EndRoom roundNum=" + tb.tData.roundNum);
    if (tb.tData.roundNum > -2) {
        if (tb.tData.roundNum != tb.createPara.round) {
            this.logid++;
            var playid = this.app.serverId + "_" + this.logid;
            var endTime = new Date();
            var nowStr = endTime.Format("yyyy-MM-dd hh:mm:ss");
            var startTimeStr = tb.tData.startTime.Format("yyyy-MM-dd hh:mm:ss");
            var tableName = endTime.Format("yyyy-MM-dd");

            this.GLog("wcx9: nowStr=" + nowStr + "startTimeStr=" + startTimeStr);

            var tData = tb.tData;
            //playInfo={ip:getPublicIp(),owner:tData.owner,money:tb.createPara.money,now:nowStr,tableid:tb.tableid,logid:playid,players:[],isShow:!tData.blood};

            //isShow  是否可以播放回放
            var isShow = true;
            /* 开放所有回放
            if( tData.fight2p || tData.fight3pWith3 || tData.wanZhou ){
            	isShow = false;
            }*/
            var gameid = this.gameid;
            //战绩日志
            var logData = {};
            logData.uid1 = tData.owner;
            logData.gameid = gameid;
            logData.start = startTimeStr //开始时间，格式与nowStr相同
            logData.time = nowStr;
            if (!tb.createPara.money) {
                tb.createPara.money = 0;
            }

            logData.money = tb.createPara.money;

            logData.tableid = tb.tableid;
            logData.logid = playid;
            logData.createRound = tb.createPara.round;
            logData.remainRound = tb.tData.roundNum;


            this.GLog("wcx9: logData=" + JSON.stringify(logData));

            var publicIp = this.publicIp;
            playInfo = {
                gameid: gameid,
                url: publicIp,
                owner: tData.owner,
                money: tb.createPara.money,
                now: nowStr,
                tableid: tb.tableid,
                logid: playid,
                players: [],
                isShow: isShow,
                startTimes: tData.startTimes,
                coinRoomCreate: tb.tData.coinRoomCreate //添加 金币场 回放标记
            };

            tData.startTimes = null; //add by wcx

            this.GLog("IsShow" + isShow);
            var logIndex = 1;
            tb.AllPlayerRun(function(p) {
                var pinfo = {};
                pinfo.uid = p.uid;
                pinfo.winall = p.winall;
                pinfo.nickname = p.info.nickname || p.info.name;
                pinfo.money = p.info.money;

                if (tb.tData.coinRoomCreate) {
                    pinfo.winCoinAll = p.winCoinAll; //add by wcx 
                }


                playInfo.players.push(pinfo);
                //战绩日志
                if (logData.uid1 == p.uid) {
                    logData['winall1'] = p.winall;
                    logData['money1'] = p.info.money;
                } else {
                    logIndex++;
                    logData['uid' + logIndex] = p.uid;
                    logData['winall' + logIndex] = p.winall;
                    logData['money' + logIndex] = p.info.money;
                }
            });
            //战绩日志，如果不足4人添加默认值
            if (logIndex < 4) {
                for (var logNum = logIndex + 1; logNum <= 4; logNum++) {
                    logData['uid' + logNum] = 0;
                    logData['winall' + logNum] = 0;
                    logData['money' + logNum] = 0;
                }
            }


            this.GLog("CGameCodeFightEnd.prototype.EndRoom doGameLog logData=" + JSON.stringify(logData));
            this.doGameLog(logData);
            //战绩日志END

            var gThis = this;
            var dayID = parseInt(endTime.Format("yyyyMMdd"));
            tb.AllPlayerRun(function(p) {
                var table = "majiangLog";
                gThis.app.mdb.db.collection("majiangLog").update({ _id: p.uid }, { $push: { logs: { $each: [playInfo], $slice: -50 } }, $set: { lastGameDay: dayID } }, { upsert: true }, function(er, doc) {});
            });
            //统计场数
            if (!this.app.playday) this.app.playday = { dayID: dayID, flushAt: Date.now(), inc: {} };
            var playday = this.app.playday;
            //var incKey=(tData.blood?"l":"z") + tData.maxWin+"_"+tData.roundAll+"_"+(tData.noBigWin?"z":"x")+"_c"+(tData.canEat?1:0)+"_f"+(tData.withWind?1:0)+"_p"+(tData.canEatHu?1:0);
            var incKey = this.getResultString(tData);
            var flushFlag = 0;
            if (dayID == playday.dayID) {
                var oldVal = playday.inc[incKey];
                if (!oldVal) oldVal = 0;
                playday.inc[incKey] = oldVal + 1;
                var dayMoney = playday.inc.dayMoney;
                if (!dayMoney) dayMoney = 0;
                playday.inc.dayMoney = dayMoney + playInfo.money;
                if (Date.now() - playday.flushAt > 10 * 60000) flushFlag = 1;
            } else {
                flushFlag = 2;
            }
            if (flushFlag > 0) {
                if (Object.keys(playday.inc).length > 0)
                    this.app.mdb.db.collection("dayLog").update({ _id: playday.dayID }, { $inc: playday.inc }, { upsert: true }, function(er, doc) {

                    });
                this.app.playday = { dayID: dayID, flushAt: Date.now(), inc: {} };
                if (flushFlag > 1) {
                    this.app.playday.inc[incKey] = 1;
                    this.app.playday.inc.dayMoney = playInfo.money;
                }
            }
            if (!this.existCheck["/playlog/" + tableName]) {
                if (!fs.existsSync("/playlog")) fs.mkdirSync("/playlog");
                if (!fs.existsSync("/playlog/" + tableName)) fs.mkdirSync("/playlog/" + tableName);
                this.existCheck["/playlog/" + tableName] = true;
            }
            if (!this.app.playlog) this.app.playlog = [];
            this.app.FileWork(this.app.playlog, "/playlog/" + tableName + "/" + tData.owner + "_" + tb.tableid + ".json", tb.mjlog);
            //合并回放
            /*
            			if(!app.mjlogs) app.mjlogs={array:[],tableName:tableName};
            			app.mjlogs.array.push({logid:playid, endTime:endTime,mjlog:tb.mjlog});
            			if(app.mjlogs.tableName!=tableName||app.mjlogs.array.length>=1)
            			{
            				app.mdb.db.collection(app.mjlogs.tableName).insertMany(app.mjlogs.array,function(er,doc){});
            				app.mjlogs.array=[]; app.mjlogs.tableName=tableName;
            			}
            */
        }
        this.GLog("CGameCodeFightEnd.prototype.EndRoom begin");
        if (msg) {
            if (playInfo) msg.playInfo = playInfo;
            msg.showEnd = tb.tData.roundNum != tb.createPara.round;
            tb.NotifyAll("endRoom", msg);
            this.GLog("CGameCodeFightEnd.prototype.EndRoom2");
        }
        this.GLog("CGameCodeFightEnd.prototype.EndRoom end");


        tb.SetTimer();
        tb.tData.roundNum = -2;

        this.DestroyTable(tb);
        var uid2did = tb.uid2did;
        var uids = {};
        for (var uid in uid2did) {
            var did = uid2did[uid];
            var ids = uids[did];
            if (!ids) uids[did] = ids = [];
            ids.push(uid);
        }

        var iscoin = 0;
        if (tb.tData.coinRoomCreate) { //add by wcx 20170412 金币
            iscoin = 1;
        }
        tb.endVipTable({ uids: Object.keys(uid2did), tableid: tb.tableid, roomtype: iscoin }, function() {});
    }
    return playInfo;
}

/**
 * 销毁
 */
CGameCodeFightEnd.prototype.DestroyTable = function(tb) {
    if (tb.PlayerCount() == 0 && tb.tData.roundNum == -2) {
        tb.tData.roundNum = -3;
        tb.Destroy();
    }
}

CGameCodeFightEnd.prototype.EndGame = function(tb, pl, byEndRoom) {
    this.GLog("wcx2:EndGame--------------------------------begin");
    var tData = tb.tData;
    this.showAllPlayerInfo(tb, "CGameCodeFightEnd_EndGame_begin");

    var fakeWin = [];
    var fakeLose = [];
    var gThis = this;

    var iGLog = this.GLog;
    tb.AllPlayerRun(function(p) {
        iGLog("wcx2:  p.uid=" + p.uid + " p.baseWin=" + p.baseWin + "__________________开始_____________");
        p.mjState = TableState.roundFinish;
        if (!pl && !byEndRoom) {
            if (p.winType == 0) {
                if (!tData.noBigWin) {
                    //检测是否听牌 停牌的为赢家
                    p.baseWin = gThis.majiang.missHandMax(p, tData, true);
                    iGLog("wcx2:p.baseWin=" + p.baseWin + " p.uid=" + p.uid);
                    if (p.baseWin > 0) {
                        fakeWin.push(p);
                        if (p.baseWin > tData.maxWin) //番数不能超过最大番数
                        {
                            p.historyMaxBaseWin = p.baseWin;
                            p.baseWin = tData.maxWin;
                        }
                    } else {
                        fakeLose.push(p);
                    }
                } else tData.wuid.push(p.uid);
            }
        }
        iGLog("wcx2:  p.uid=" + p.uid + " p.baseWin=" + p.baseWin + "__________________结束_____________");
    });

    this.GLog("wcx2:EndGame___________________我是分割线______________________________");
    //修改查大叫的逻辑, 假如 1家胡,另外3个没胡,3家也没有听牌的就不触发查大叫.不然3家都查出0
    if (false && !tData.noBigWin) //add by wcx 只有允许转与的时候,才执行下面的代码
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


    //处理血站查大叫描述问题
    if (!tData.noBigWin) {
        if (tData.blood) {
            for (var j = 0; j < fakeWin.length; j++) {
                var pW = fakeWin[j];
                //添加查大叫描述
                if (fakeLose.length == 0) {

                } else {
                    this.majiang.missHandMax(pW, tData);
                }

            }
        } else {
            for (var j = 0; j < fakeWin.length; j++) {
                var pW = fakeWin[j];
                this.majiang.missHandMax(pW, tData);
            }
            for (var i = 0; i < fakeLose.length; i++) {
                var pW = fakeLose[i];
                this.majiang.missHandMax(pW, tData);
            }
        }

    }

    if (!tData.noBigWin) {
        //查大叫
        for (var j = 0; j < fakeWin.length; j++) {
            var pW = fakeWin[j];
            if (tData.wuid.indexOf(pW.uid) < 0) {
                tData.wuid.push(pW.uid);
            }

            if (fakeLose.length == 0) {
                pW.baseWin = 0;
                pW.mjhand.length = pW.mjhand.length - 1;
                if (tData.blood) {
                    // pW.mjdesc=[];
                } else {
                    //pW.mjdesc=[];
                }
            }
        }


        this.GLog("wcx2:EndGame________________fakeLose.length=" + fakeLose.length + " fakeWin.length=" + fakeWin.length);
        for (var i = 0; i < fakeLose.length; i++) {
            var pL = fakeLose[i];
            pL.mjdesc.push("查大叫");

            this.GLog("wcx2:EndGame________________查大叫开始________________pL.uid=" + pL.uid);
            this.showAllPlayerInfo(tb, "EndGame_查大叫_ 开始");
            this.ReturnGangWin(tb, pL, false);
            this.showAllPlayerInfo(tb, "EndGame_查大叫_ ReturnGangWin");
            if (tData.wuid.indexOf(pL.uid) < 0) {
                tData.wuid.push(pL.uid);
            }
            for (var j = 0; j < fakeWin.length; j++) {
                var pW = fakeWin[j];
                this.GLog("wcx2:EndGame______fakeWin.uid" + pW.uid + " 被查叫玩家要损失 pW.baseWin=" + pW.baseWin);
                pW.winone += pW.baseWin;
                pL.winone -= pW.baseWin;
            }
            this.showAllPlayerInfo(tb, "EndGame_查大叫_ 计算baseWin 一轮查大叫 结束/n/n/n");
        }

    }
    tData.tState = TableState.roundFinish;
    tb.clearTimeout4Table123(tb);
    tb.clearAllPlayersTrustee();
    var owner = tb.players[tData.uids[0]].info;
    if (!byEndRoom && !tb.tData.coinRoomCreate) {
        if (!owner.$inc) {
            if (tb.isFree(tb)) { //add by wcx 德阳玩法免费
                owner.$inc = { money: 0 };
            } else {
                owner.$inc = { money: -tb.createPara.money };
            }
        }

        tb.AllPlayerRun(function(p) {
            if (!p.info.$inc) {
                p.info.$inc = { playNum: 1 };
            } else if (!p.info.$inc.playNum) {
                p.info.$inc.playNum = 1;
            } else {
                p.info.$inc.playNum += 1;
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
    tb.mjlog.push("roundEnd", roundEnd); //一局结束
    this.GLog("CGameCodeFightEnd--mjlog  roundEnd");
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

    var endTime = new Date();
    tb.tData.endTime = endTime.Format("yyyy-MM-dd hh:mm:ss"); //牌局结束时间
    this.GLog("wcx2:EndGame--------------------------------end");

    //add by wcx 一局结束后,再开启一局新的 会导致winone和上一局的一样,现在在这里清空winone
    tb.AllPlayerRun(function(p) {
        p.winone = 0;
        p.winCoinOne = 0;
        iGLog("wcx2:CGameCodeFightEnd EndGame p.winone=0 |||| p.uid" + p.uid);
    });
}

/**
 * 玩家出牌（打牌）
 * @pl---出牌(打牌)的玩家 pl.uid=100342
 * @msg--{"cmd":"MJPut","card":28,"__route__":"pkroom.handler.tableMsg"}"
 * @session
 * @next
 * @tTable
 */
CGameCodeFightEnd.prototype.fRecieveMjPut = function(pl, msg, session, next, tTable) {
        var isAutoPut = true;
        if (next) {
            next(null, null); //if(this.GamePause()) return;
            isAutoPut = false;
        }

        var tData = tTable.tData;
        var isRealPut = false; //add by wcx 20170214
        if (tData.tState == TableState.waitPut && pl.uid == tData.uids[tData.curPlayer]) //只有当前玩家 才可以发牌
        {
            this.GLog("wcx2:fRecieveMjPut------------------------begin");
            this.GLog("wcx2:msg=" + JSON.stringify(msg));
            this.GLog("Table.prototype.MJPut2");
            var cdIdx = pl.mjhand.indexOf(msg.card);
            this.GLog("wcx2:fRecieveMjPut---pl.uid=" + pl.uid + " pl.mjhand.indexOf(msg.card)=" + cdIdx);
            if (cdIdx >= 0) {
                isRealPut = true; //add by wcx 20170214
                if (!isAutoPut) {
                    tTable.InitAutoState(pl); //
                }

                if (tData.doubleCarHouse) {
                    this.GLog("Table.prototype.MJPut3 -- if( tData.doubleCarHouse ) is true");
                } else {
                    if (!tData.noBigWin &&
                        this.majiang.cardType(msg.card) != pl.mjMiss &&
                        this.majiang.cardTypeNum(pl.mjhand, pl.mjMiss) > 0
                    ) //如果玩家手里还有 选缺的牌,那必须先打选缺的牌
                    {
                        return; //必须打缺的牌
                    }
                }
                this.GLog("wcx2:Table.prototype.MJPut4");

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
                this.GLog("Table.prototype.MJPut5");
                if (msg.ting == 1) //如果用户 处于ting 态???? 看样子这代码不会被执行啊...
                {

                    this.GLog("huyan:" + JSON.stringify(pl.mjhand));
                    var maxWin = this.majiang.checkMJTing(pl, tTable);

                    if (maxWin > 0 && pl.firstPick == 1) {
                        this.GLog("recieve MJPut9");
                        pl.mjting = true;
                        msg.mjting = true;
                        msg.firstPick = pl.firstPick;
                    }
                }
                this.GLog("Table.prototype.MJPut6 tData.putType=" + tData.putType);
                if (tData.putType > 0 && tData.putType < 4) //1,2,3
                {
                    tData.putType = 4;
                } else {
                    tData.putType = 0;
                }

                this.GLog("Table.prototype.MJPut7   tData.putType=" + tData.putType);
                var GLog = this.GLog;
                var pThis = this;
                tTable.AllPlayerRun(function(p) {
                    if (p != pl) //非打牌玩家
                    {
                        if (p.mjState != TableState.roundFinish && p.winType == 0) //玩家 没有 roundFinish, winType==0
                        {
                            p.eatFlag = pThis.GetEatFlag(p, tData);
                            //三人血战小胡不能点炮
                            // if( tData.fight3p )
                            // {
                            // 	this.GLog(" tData.fight3p GetHuType(tData,p,tData.lastPut) = " + this.GetHuType(tData,p,tData.lastPut))
                            // 	if( p.eatFlag & 8 )
                            // 	{
                            // 		this.GLog("小胡不能点跑"); 
                            // 		if( pThis.GetHuType(tData,p,tData.lastPut)>0&&pThis.GetSkipHu(tData,p,tData.putType==4?2:1) == 1 )
                            // 		{
                            // 			p.eatFlag = p.eatFlag ^ 8;
                            // 		}
                            // 	}

                            // }
                            if (p.eatFlag != 0) {
                                p.mjState = TableState.waitEat; //可以吃牌了
                            } else {
                                p.mjState = TableState.waitCard; //等待发牌
                            }
                        }
                    }
                });
                this.GLog("Table.prototype.MJPut8");

                var cmd = msg.cmd;
                msg.putType = tData.putType;
                msg.eatFlag = tTable.PlayerPtys(function(p) { return p.eatFlag });
                msg.autoState = pl.autoState; //add by wcx 20170218 托管---发牌后要把pl的 autoState传到客户端
                this.GLog("wcx2:NotifyAll-----msg=" + JSON.stringify(msg));
                if (cmd != null) {
                    tTable.newNotifyAllWithMsgID(cmd, msg);
                    tTable.mjlog.push(cmd, msg); //打牌
                    this.SendNewCard(tTable, "b"); //打牌后尝试发牌
                }

            }

            this.showAllPlayerInfo(tTable, "CGameCodeFightEnd_fRecieveMjPut_end");

            this.GLog("wcx2:fRecieveMjPut___________________end");
        }
    }
    //发牌不要求在线
CGameCodeFightEnd.prototype.SendNewCard = function(tb, from) {
    var tData = tb.tData;
    var cards = tb.cards;
    //console.info(from+" newCard "+tb.AllPlayerCheck(function(pl){ return pl.mjState==TableState.waitCard||(!tData.noBigWin&&pl.mjState==TableState.roundFinish )  }));
    if (tb.AllPlayerCheck(function(pl) {
            return pl.mjState == TableState.waitCard || (!tData.noBigWin && pl.mjState == TableState.roundFinish)
        })) {
        this.GLog("SendNewCard------------>2");
        this.GLog("tData.cardNext = " + tData.cardNext);
        this.GLog("tData.cardNext = " + cards.length);
        if (tData.cardNext < cards.length) {
            this.GLog("SendNewCard------------>3 curPlayer: " + tData.curPlayer);
            var newCard = cards[tData.cardNext++];
            this.GLog("SendNewCard------------>newCard=" + newCard);
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
                    this.GLog("SendNewCard------------>4__2__ uid: " + uid + " pi.info.coin=" + pi.info.coin);
                    if (pi.winType <= 0 || tData.blood) {
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
                    if (pi.winType <= 0 || tData.blood) {
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
            if (!tData.noBigWin && tData.cardNext == (13 * tData.maxPlayers + 1)) //首次发牌 选缺
            {
                //如果两牌房去掉定缺和换牌
                if (tData.doubleCarHouse) {

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

            this.GLog("CGameCodeFightEnd--mjlog  newCard");
            return true;
        } else //没有牌了 
        {
            if (tData.blood) {
                this.EndCalBloodWinOne(tb);
            }
            this.GLog("gameEnd");
            this.EndGame(tb, null);
        }
    }
    this.GLog("SendNewCard--------------->end");
    return false;
}

CGameCodeFightEnd.prototype.EndCalBloodWinOne = function(tb) {
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

CGameCodeFightEnd.prototype.MJChange = function(pl, msg, session, next, tTable) {
    this.GLog("wcx2:MJChange 1111");
    var tData = tTable.tData;

    if (!tData.noBigWin && tData.tState == TableState.waitChange && pl.mjChange < 0) {
        if (Math.floor(msg.cd0 / 10) == Math.floor(msg.cd1 / 10) && Math.floor(msg.cd0 / 10) == Math.floor(msg.cd2 / 10)) {
            pl.mjChange = 1;
            if (tData.doubleCarHouse) {
                pl.mjState = TableState.waitPut;
            } else {
                pl.mjState = TableState.waitMiss;
            }



            pl.arry = [];
            pl.arry1 = [];

            pl.arry.push(msg.cd0);
            pl.arry.push(msg.cd1);
            pl.arry.push(msg.cd2);

            if (tTable.AllPlayerCheck(function(p) { return p.mjChange == 1 })) {
                if (tData.doubleCarHouse) {
                    tData.tState = TableState.waitPut;
                } else {
                    tData.tState = TableState.waitMiss;
                }

                //对家交换
                var plThree = tTable.getPlayer(tData.uids[(tData.uids.indexOf(pl.uid) + 2) % tData.maxPlayers]);
                var plTwo = tTable.getPlayer(tData.uids[(tData.uids.indexOf(pl.uid) + 1) % tData.maxPlayers]);
                var plFour = tTable.getPlayer(tData.uids[(tData.uids.indexOf(pl.uid) + 3) % tData.maxPlayers]);

                var radomIn = Math.floor(Math.random() * 2.9);
                if (plThree && plThree.arry && plTwo && plTwo.arry && plFour && plFour.arry) {
                    switch (radomIn) {
                        case 0: //对家交换
                            pl.arry1 = plThree.arry.slice(0);
                            plThree.arry1 = pl.arry.slice(0);
                            plFour.arry1 = plTwo.arry.slice(0);
                            plTwo.arry1 = plFour.arry.slice(0);
                            break;
                        case 1: //逆时针交换
                            pl.arry1 = plFour.arry.slice(0);
                            plFour.arry1 = plThree.arry.slice(0);
                            plThree.arry1 = plTwo.arry.slice(0);
                            plTwo.arry1 = pl.arry.slice(0);
                            break;
                        case 2: //顺时针交换
                            pl.arry1 = plTwo.arry.slice(0);
                            plTwo.arry1 = plThree.arry.slice(0);
                            plThree.arry1 = plFour.arry.slice(0);
                            plFour.arry1 = pl.arry.slice(0);
                            break;
                        default: //顺时针交换
                            pl.arry1 = plTwo.arry.slice(0);
                            plTwo.arry1 = plThree.arry.slice(0);
                            plThree.arry1 = plFour.arry.slice(0);
                            plFour.arry1 = pl.arry.slice(0);
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

                if (tData.doubleCarHouse) {
                    tTable.newNotifyAllWithMsgID("MJChange", { uid: pl.uid, mjState: pl.mjState, mjChange: pl.mjChange, tState: TableState.waitPut, tMode: radomIn })
                } else {
                    tTable.newNotifyAllWithMsgID("MJChange", { uid: pl.uid, mjState: pl.mjState, mjChange: pl.mjChange, tState: TableState.waitMiss, tMode: radomIn })
                }

            } else {
                tTable.newNotifyAllWithMsgID("MJChange", { uid: pl.uid, mjState: pl.mjState, mjChange: pl.mjChange });
            }
        }
    }
}




/**
 * 选缺 打掉所有不需要的牌才能胡
 * @pl,
 * @msg,
 * @session,
 * @next,
 * @tTable
 */
CGameCodeFightEnd.prototype.MJMiss = function(pl, msg, session, next, tTable) {
    var isAutoPut = true;
    if (next) {
        next(null, null); //if(this.GamePause()) return;
        isAutoPut = false;
    }

    var tData = tTable.tData;
    var iGThis = this;

    if (!tData.noBigWin &&
        (tData.tState == TableState.waitMiss || pl.mjState == TableState.waitMiss) &&
        pl.mjMiss < 0) {
        this.GLog("wcx2:MJMiss_______________________begin");
        this.GLog("CGameCodeFightEnd-prototype.MJMiss msg=" + JSON.stringify(msg));

        pl.mjMiss = msg.mjMiss;
        pl.mjState = TableState.waitPut;

        //add by wcx 20170214
        pl.isStartMisss = (this.majiang.cardTypeNum(pl.mjhand, pl.mjMiss) <= 0);
        if (!isAutoPut) {
            tTable.InitAutoState(pl); //MJMiss
        }

        if (tTable.AllPlayerCheck(function(p) { return p.mjMiss >= 0 })) {
            var mjMiss = { mjMiss: tTable.PlayerPtys(function(p) { return p.mjMiss }) };
            tTable.newNotifyAllWithMsgID("MJMiss", mjMiss);
            tTable.mjlog.push("MJMiss", mjMiss);

            tData.tState = TableState.waitPut;
            tTable.newNotifyAllWithMsgID("waitPut", tData);
            tTable.AllPlayerRun(function(p) { p.eatFlag = 0; });
        } else {
            tTable.newNotifyAllWithMsgID("MJMiss", { uid: pl.uid, mjState: pl.mjState });
        }

        this.GLog("wcx2:MJMiss_______________________end");
    }


}


/**
 * 过(什么都不干) tag fix
 */
CGameCodeFightEnd.prototype.MJPass = function(pl, msg, session, next, tTable) {
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
            tTable.InitAutoState(pl);

            tTable.mjlog.push("MJPass", { uid: pl.uid, eatFlag: msg.eatFlag }); //发牌
            this.GLog("CGameCodeFightEnd--mjlog  MJPass");
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
                            this.GLog("Dingo: FuncName:MjPass  " + "i : " + i.toString() + " orgCur: " + (tData.curPlayer + i).toString() + " cur : " + cur + "  uidsGet: " + tData.uids[cur] + "  uids: " + tData.uids.toString() + "   huLastPlayer : " + tData.huLastPlayer);
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
        this.GLog("CGameCodeFightEnd .MJPass " + " pl.mjState = TableState.isReady");
        pl.mjState = TableState.isReady;
        tTable.NotifyAll('onlinePlayer', { uid: pl.uid, onLine: true, mjState: pl.mjState });
        pl.eatFlag = 0;
        tTable.startGame();
    }

}


/**
 * 删除一条数据----缓存杠输赢钱数
 * @winPlayerUid 赢的玩家的uid
 * @lostPlayerUid 输钱的玩家的uid
 * @num	钱数
 * @array 缓存数组
 */
CGameCodeFightEnd.prototype.cartchGameWinDeleteOne = function(aWinPlayerUid, aLostPlayerUid, aNum, tData) {
    for (var value in tData.winGameWinArray) {
        var iWinPlayerUid = tData.winGameWinArray[value].winPlayerUid;
        var iLostPlayerUId = tData.winGameWinArray[value].lostPlayerUId;
        var iMoney = tData.winGameWinArray[value].money;

        if (iWinPlayerUid == aWinPlayerUid &&
            iLostPlayerUId == aLostPlayerUid &&
            iMoney == aNum) {
            delete tData.winGameWinArray[value]; //add by wcx 如果已经 处理完了就删除 这条数据
            break;
        }
    }
}


/**
 * 缓存杠输赢钱数-----准备查大叫时,返回扛钱
 * @winPlayerUid 赢的玩家的uid
 * @lostPlayerUid 输钱的玩家的uid
 * @num	钱数
 * @array 缓存数组
 */
CGameCodeFightEnd.prototype.cartchGameWin = function(winPlayerUid, lostPlayerUid, num, tData) {
        this.GLog("wcx2:cartchGameWin winPlayerUid=" + winPlayerUid + " lostPlayerUid=" + lostPlayerUid + " money=" + num);
        var tempWinData = {};

        tempWinData.winPlayerUid = winPlayerUid;
        tempWinData.lostPlayerUId = lostPlayerUid;
        tempWinData.money = num;

        //winGameWinArray 是一个array
        tData.winGameWinArray.push(tempWinData);

        this.GLog("wcx2:cartchGameWin tData.winGameWinArray=" + JSON.stringify(tData.winGameWinArray));

        this.GLog("wcx2:cartchGameWin end");
    }
    /**
     * 撤销缓冲数据
     * @array 缓冲数组
     */
CGameCodeFightEnd.prototype.cancelCarchGameWin = function(tData, tb, chaUid) {
    this.GLog("wcx2:cancelCarchGameWin_撤销缓冲数据___________________begin");
    this.GLog("wcx2:cancelCarchGameWin_撤销缓冲数据_chaUid=" + chaUid);

    this.GLog("wcx2:cancelCarchGameWin_处理前_tData.winGameWinArray=" + JSON.stringify(tData.winGameWinArray));
    for (var value in tData.winGameWinArray) {
        var winPlayerUid = tData.winGameWinArray[value].winPlayerUid;
        var lostPlayerUId = tData.winGameWinArray[value].lostPlayerUId;
        var money = tData.winGameWinArray[value].money;
        if (chaUid == lostPlayerUId) {
            tb.getPlayer(winPlayerUid).winone -= money;
            tb.getPlayer(lostPlayerUId).winone += money;
            delete tData.winGameWinArray[value]; //add by wcx 如果已经 处理完了就删除 这条数据
        }
    }

    //tData.winGameWinArray = [];
    this.GLog("wcx2:cancelCarchGameWin_处理后_tData.winGameWinArray=" + JSON.stringify(tData.winGameWinArray));
    this.GLog("wcx2:cancelCarchGameWin_撤销缓冲数据___________________beginend");
}


/*
 *适用于一炮多响
 * 归还 第一胡家的转与
 *
 * */
CGameCodeFightEnd.prototype.ReturnGangWinWithGangShangPaoMoreHu = function(tb, fp, gcd, aNum) {
    this.GLog("wcx2:ReturnGangWinWithGangShangPaoMoreHu-------------------------------begin");
    this.showAllPlayerInfo(tb, "ReturnGangWinWithGangShangPaoMoreHu_begin");
    var tData = tb.tData;

    this.GLog("wcx2:ReturnGangWinWithGangShangPaoMoreHu-------fp.uid=" + fp.uid + " fp.zhuanyuTo=" + JSON.stringify(fp.zhuanyuTo) + " fp.zhuanyuTo[gcd]=" + fp.zhuanyuTo[gcd]);
    if (fp.zhuanyuTo[gcd]) {
        var hupl_uid = fp.zhuanyuTo[gcd];

        delete fp.zhuanyuTo[gcd];
        var huPlayer = tb.getPlayer(hupl_uid);

        if (!huPlayer) {
            return;
        }

        if (tData.zhuanGen) //允许转根才 退根退番
        {
            //减根 减番
            var iBaseWin0 = huPlayer.baseWin;
            huPlayer.baseWin /= 2;
            var iBaseWin1 = huPlayer.baseWin;

            fp.winone += iBaseWin0 - iBaseWin1;
            huPlayer.winone -= iBaseWin0 - iBaseWin1;
        }


        delete huPlayer.zhuanyuFrom[gcd];

        //归还第一个的转与!!!!!!!!!!!!!!!
        fp.winone += aNum; //归还扛的钱
        huPlayer.winone -= aNum; //拿回扛扣的钱

        //删除缓存
        this.cartchGameWinDeleteOne(huPlayer.uid, fp.uid, aNum, tData); {
            for (var cduid in fp.gangWin) {
                //var num=fp.gangWin[cduid];
                var cuid = cduid.split("|");
                var cd = parseInt(cuid[0]);
                var uid = cuid[1];

                if (gcd == cd) {
                    var otherPlayer = tb.getPlayer(uid);
                    if (otherPlayer) {
                        otherPlayer.winone += aNum; //返还 other的钱给
                        huPlayer.winone -= aNum; //胡牌玩家 返还扛钱
                    }
                }
            }
        }

        //!!!!!!!!!!!!!!!!!!!!!!!!!!
    }

    this.showAllPlayerInfo(tb, "ReturnGangWinWithGangShangPaoMoreHu_end");
    this.GLog("wcx2:ReturnGangWinWithGangShangPaoMoreHu-------------------------------end");
}

//gangWin=
//{
//    "29|100342": 2,
//
//    "23|100316": 2,
//    "23|100317": 2,
//    "23|100342": 2
//}


/**
 * 返回杠赢的钱 (杠上炮)
 * @tb 牌桌
 * @fp 玩家:放炮的玩家
 * @gcd 杠牌数字:fp.lastGang
 * @topeng 把这个扛牌换成碰牌
 * @hupl 应该是 hu(胡) player(会产生转与）
 * @示例:this.thisFunction(tTable,fp,fp.lastGang,false,pl);
 */
CGameCodeFightEnd.prototype.ReturnGangWinWithGangShangPao = function(tb, fp, gcd, toPeng, hupl) {
    var tData = tb.tData;

    this.GLog("wcx2:");
    this.GLog("wcx2:");
    this.GLog("wcx2:ReturnGangWinWithGangShangPao-------------------------------begin");
    this.showAllPlayerInfo(tb, "ReturnGangWinWithGangShangPao_begin");
    this.GLog("wcx2:ReturnGangWinWithGangShangPao 放炮--fp.uid=" + fp.uid + " fp.lastGang=" + fp.lastGang);
    this.GLog("wcx2:ReturnGangWinWithGangShangPao 放炮--fp.gangWin=" + JSON.stringify(fp.gangWin));
    this.GLog("wcx2:ReturnGangWinWithGangShangPao 胡--hupl.uid=" + hupl.uid + " tData.zhuanyu=" + tData.zhuanyu);


    var clickNum = 0; //有几个玩家点了 hu 按钮
    clickNum = tb.CheckPlayerCount(function(p) {
        if (p.eatFlag >= 8) {
            return p.huclick;
        }
    });

    this.GLog("wcx2:ReturnGangWinWithGangShangPao clickNum=" + clickNum);
    var huNum = tb.CheckPlayerCount(function(p) { return p.eatFlag >= 8 }); //是检查 这次胡牌玩家的个数
    //if ( (huNum <= 1 || clickNum == 0 ) && tData.zhuanyu && hupl) //允许----进行"转与"操作----
    if (huNum <= 1 && tData.zhuanyu && hupl) //允许----进行"转与"操作
    {
        fp.zhuanyuTo[fp.lastGang] = hupl.uid;
        hupl.zhuanyuFrom[fp.lastGang] = fp.uid;
    }

    for (var cduid in fp.gangWin) {
        var num = fp.gangWin[cduid];
        var cuid = cduid.split("|"); //前面是杠了哪个牌得数值,后杠到了谁，可能有多个
        var cd = parseInt(cuid[0]);
        var uid = cuid[1];

        this.GLog("wcx2:ReturnGangWinWithGangShangPao cd=" + cd + " gcd=" + gcd);
        if (gcd == cd) {
            this.GLog("wcx2:ReturnGangWinWithGangShangPao num=" + num + " otherPlayer uid=" + uid + " cd=" + cd);
            var otherPlayer = tb.getPlayer(uid);

            if (tData.zhuanyu) //允许----进行"转与"操作
            {
                if (otherPlayer && hupl) //-----------------------------------------------胡的这个人的处理
                {
                    this.GLog("wcx2:ReturnGangWinWithGangShangPao 胡num  这次胡牌玩家的个数 huNum=" + huNum);

                    if (huNum >= 2) //5.杠后炮之后，如果产生了一炮多响：不进行呼叫转移，同时这个杠钱取消不计算
                    {
                        //取消 扛钱 返还扛钱
                        this.GLog("wcx2:ReturnGangWinWithGangShangPao otherPlayer.uid=" + otherPlayer.uid + " zhuanyuFrom=" + JSON.stringify(otherPlayer.zhuanyuFrom) + " mjdesc=" + otherPlayer.mjdesc);

                        if (1) //这个一炮多响,好烦啊
                        { //原始的逻辑
                            otherPlayer.winone += num; //拿回扛扣的钱
                            fp.winone -= num; //归还扛的钱
                            delete fp.gangWin[cduid];
                        } else {

                            if (clickNum == 0) //进行一次转与操作
                            {
                                otherPlayer.winone += num; //拿回扛扣的钱
                                fp.winone -= num; //归还扛的钱

                                if (otherPlayer.uid == hupl.uid) // 胡牌玩家还要 收 点炮玩家的扛钱
                                {
                                    hupl.winone += num;
                                    fp.winone -= num;
                                    //根要 + 1
                                    var iBaseWin0 = hupl.baseWin;
                                    hupl.baseWin *= 2;
                                    var iBaseWin1 = hupl.baseWin;

                                    hupl.mjdesc.push("根X1还在+1番");
                                    fp.winone -= iBaseWin1 - iBaseWin0;
                                    hupl.winone += iBaseWin1 - iBaseWin0;
                                    //加番
                                    this.cartchGameWin(hupl.uid, fp.uid, num, tData);
                                } else {
                                    otherPlayer.winone -= num; //扣other的钱给 hu 牌的玩家
                                    hupl.winone += num; //胡牌玩家 获得扛钱
                                }
                            } else if (clickNum >= 1) //先归还 第一次的"转与" 再变成 一炮多响
                            {
                                //转与状态重置
                                this.ReturnGangWinWithGangShangPaoMoreHu(tb, fp, gcd, num);

                                otherPlayer.winone += num; //拿回扛扣的钱
                                fp.winone -= num; //归还扛的钱
                                delete fp.gangWin[cduid];
                            }

                            this.showAllPlayerInfo(tb, "ReturnGangWinWithGangShangPao_一炮多响结束");


                        }
                    } else {
                        otherPlayer.winone += num; //拿回扛扣的钱
                        fp.winone -= num; //归还扛的钱

                        if (otherPlayer.uid == hupl.uid && huNum <= 1) // 胡牌玩家还要 收 点炮玩家的扛钱
                        {
                            hupl.winone += num;
                            fp.winone -= num;
                            this.GLog("wcx2:ReturnGangWinWithGangShangPao otherPlayer(hu)_winone 2=" + hupl.winone + "放炮 fp.winone 2=" + fp.winone);
                            this.cartchGameWin(hupl.uid, fp.uid, num, tData);
                        } else if (huNum <= 1) {
                            otherPlayer.winone -= num; //扣other的钱给 hu 牌的玩家
                            hupl.winone += num; //胡牌玩家 获得扛钱
                            this.GLog("wcx2:ReturnGangWinWithGangShangPao otherPlayer_winone 2=" + otherPlayer.winone + "放炮 fp.winone 2=" + fp.winone);
                            //this.cartchGameWin( hupl.uid, otherPlayer.uid, num, tData );//del by wcx 2016/11/19 还是需要用 gangWin 来归还查叫
                        }

                        //fp.gangWin[cduid] = 0; //add by wcx 20161116----清空扛钱 //del by wcx 2016/11/19 还是需要用 gangWin 来归还查叫
                    }
                }
            } else { //不进行 转与
                if (otherPlayer) {
                    this.GLog("wcx2:ReturnGangWinWithGangShangPao:不进行转与操作  not zhuangyu");
                    otherPlayer.winone += num;
                    fp.winone -= num;
                }
                //delete fp.gangWin[cduid];  // del by wcx 2016/11/15 ---应 兴泰要求, 非转与---扛上炮 返还扛钱,保留根 //2016/11/16 王传祥打开启这条语句,
                fp.gangWin[cduid] = 0; //add by wcx 20161116, 返还扛钱,保留根
            }
        }
    }


    this.showAllPlayerInfo(tb, "CGameCodeFightEnd:ReturnGangWinWithGangShangPao_end");
    this.GLog("wcx2:ReturnGangWinWithGangShangPao-------------------------------end");
    this.GLog("wcx2:");
    this.GLog("wcx2:");
}



/**
 * 返回杠赢的钱
 * @tb 牌桌
 * @pl 玩家-----被查叫的玩家
 * @gcd 杠牌数字
 * @topeng 是否把这个牌换成碰
 * @hupl 是不是杠上炮 （会产生转与）---this.ReturnGangWin(tb,pL,false);
 */
CGameCodeFightEnd.prototype.ReturnGangWin = function(tb, pl, gcd, toPeng, hupl) {
    this.GLog("wcx2:CGameCodeFightEnd_prototype_ReturnGangWin ---------------------------------------------begin");
    var tData = tb.tData;

    this.GLog("wcx2:ReturnGangWin pl.uid=" + pl.uid + " gcd=" + gcd + " toPeng=" + toPeng);
    this.GLog("wcx2:                            ReturnGangWin pl.gangWin=" + JSON.stringify(pl.gangWin));
    this.GLog("wcx2:                            ReturnGangWin pl.zhuanyuTo=" + JSON.stringify(pl.zhuanyuTo));
    this.GLog("wcx2:                            ReturnGangWin pl.zhuanyuFrom=" + JSON.stringify(pl.zhuanyuFrom));

    /*
     * 减 转与接收玩家的 一个根---返还一番的分数
     *
     * */
    var DeleteZhuanYuWinerGeng = function(tData, fp) {
        if (!tData.zhuanyu) {
            return;
        }

        if (!tData.zhuanGen) {
            return;
        }

        var iZhuanYuPlayer = null;
        for (var cduid in fp.gangWin) {
            var num = fp.gangWin[cduid];
            var cuid = cduid.split("|"); //前面是杠了哪个牌得数职,后杠到了谁，可能有多个
            var uid = cuid[1];
            var cd = parseInt(cuid[0]);

            iZhuanYuPlayer = null;
            if (fp.zhuanyuTo) //add by wcx----减 根
            {
                var iTempUid = fp.zhuanyuTo[cd];
                if (iTempUid) {
                    iZhuanYuPlayer = tb.getPlayer(iTempUid);
                    if (iZhuanYuPlayer) {
                        for (var i = 0; i < iZhuanYuPlayer.mjdesc.length; i++) {
                            var tempVal = iZhuanYuPlayer.mjdesc[i]; //获取数组的元素值
                            var iStr = "根X";
                            var index = tempVal.indexOf(iStr);
                            if (index >= 0) {
                                var iIntVal = tempVal.substring(iStr.length, tempVal.length);
                                var inum = parseInt(iIntVal);
                                if (inum == 1) {
                                    iZhuanYuPlayer.mjdesc.splice(i, 1); //删除 根X1
                                } else if (inum > 1) {
                                    inum -= 1;
                                    iZhuanYuPlayer.mjdesc.splice(i, 1, (iStr + inum));
                                }
                            }
                        }

                        iZhuanYuPlayer.zhuanyuFrom = {};

                        if (iZhuanYuPlayer.historyMaxBaseWin <= tData.maxWin) {
                            var realB = iZhuanYuPlayer.baseWin;
                            iZhuanYuPlayer.baseWin /= 2;
                            var temp = realB - iZhuanYuPlayer.baseWin;
                            if (temp > 0) {
                                iZhuanYuPlayer.winone -= temp;
                                fp.winone += temp;
                            }
                        }



                        delete fp.zhuanyuTo[cd];
                    }
                }
            }
        }
    }


    var iZhuanYuPlayer = null;
    for (var cduid in pl.gangWin) {
        var num = pl.gangWin[cduid];
        var cuid = cduid.split("|"); //前面是杠了哪个牌得数职,后杠到了谁，可能有多个
        var uid = cuid[1];
        var cd = parseInt(cuid[0]);

        this.GLog("wcx2:");
        this.GLog("wcx2:");
        this.GLog("wcx2: uid=" + uid + " cd= " + cd + " gcd=" + gcd);

        iZhuanYuPlayer = null;
        if (tData.zhuanyu && pl.zhuanyuTo) //add by wcx----减 根
        {
            var iTempUid = pl.zhuanyuTo[cd];
            this.GLog("wcx2:ReturnGangWin pl.zhuanyuTo[cd]=" + pl.zhuanyuTo[cd] + " iTempUid=" + iTempUid);
            if (iTempUid) {
                iZhuanYuPlayer = tb.getPlayer(iTempUid);
            }
        }

        //查大叫
        //4.杠后炮之后，杠后炮的人后来被查叫了：不进行呼叫转移，同时这个杠钱取消不计
        //A:退还所有的杠钱
        //B:A转与给B, B也有退还所有转与获得的扛钱
        //B:B转与获得的 根需要归还...
        //B:B的 扛后炮 依然保留着.
        if (!gcd) {
            var otherPlayer = tb.getPlayer(uid);
            if (otherPlayer) {
                this.GLog("wcx2:ReturnGangWin_otherPlayer_zhuanyuFrom=" + JSON.stringify(otherPlayer.zhuanyuFrom));
                otherPlayer.winone += num;

                if (iZhuanYuPlayer) {
                    this.GLog("wcx2:ReturnGangWin_扣ZhuanYu.uid" + iZhuanYuPlayer.uid);
                    iZhuanYuPlayer.winone -= num;
                } else {
                    this.GLog("wcx2:ReturnGangWin_扣pl.uid" + pl.uid);
                    pl.winone -= num;
                }
                this.GLog("wcx2:返回查大叫杠钱num=" + num + "_otherPlayer.uid=" + otherPlayer.uid);
            }
        } else if (gcd == cd) {
            var otherPlayer = tb.getPlayer(uid);
            if (tData.zhuanyu) {
                if (otherPlayer && hupl) {
                    otherPlayer.winone += num;
                    pl.winone -= num; //这个取
                    var huNum = tb.CheckPlayerCount(function(p) { return p.eatFlag >= 8 });
                    //如果是这个人胡
                    if (otherPlayer.uid == hupl.uid && huNum <= 1) {
                        otherPlayer.winone += num;
                        pl.winone -= num;

                        this.GLog("wcx2:ReturnGangWin if (otherPlayer.uid == hupl.uid &&huNum<=1 )  pl.gangWin=" + JSON.stringify(pl.gangWin));
                        this.cartchGameWin(otherPlayer.uid, pl.uid, num, tData);

                    } else if (huNum <= 1) {
                        otherPlayer.winone -= num;
                        hupl.winone += num;

                        this.GLog("wcx2:ReturnGangWin else if(huNum<=1) pl.gangWin=" + JSON.stringify(pl.gangWin));
                        this.cartchGameWin(hupl.uid, otherPlayer.uid, num, tData);
                    }
                }

            } else {
                if (otherPlayer) {
                    this.GLog("huyan:not zhuangyu");
                    otherPlayer.winone += num;
                    pl.winone -= num;
                }
            }
        }

        if (gcd) {
            this.GLog("wcx2:ReturnGangWin");
            delete pl.gangWin[cduid];
        }

    }

    if (!gcd) {
        DeleteZhuanYuWinerGeng(tData, pl);
        pl.gangWin = {};
        pl.zhuanyuTo = {}; //add by wcx
        this.GLog("wcx2:ReturnGangWin_清空_pl_gangWin=" + JSON.stringify(pl.gangWin));
    } else if (toPeng) {
        var idx0 = pl.mjgang0.indexOf(gcd);
        if (idx0 >= 0) {
            pl.mjgang0.splice(idx0, 1);
            pl.mjpeng.push(gcd);

            tb.newNotifyAllWithMsgID("gang2peng", { uid: pl.uid, card: gcd });
        } else {
            var idx1 = pl.mjgang1.indexOf(gcd);
            if (idx1 >= 0) {
                pl.mjgang1.splice(idx1, 1);
                pl.mjpeng.push(gcd);

                tb.newNotifyAllWithMsgID("gang2peng", { uid: pl.uid, card: gcd });
            }
        }
    }

    this.showAllPlayerInfo(tb, "wcx2:CGameCodeFightEnd_prototype_ReturnGangWin 准备清空缓存");
    /*
     * A:被查大叫
     *   1: 有扛:返还扛钱
     *   2: 无扛:转与不再返还A扛钱
     * */
    //查大叫杠转与还杠钱
    if (!gcd) //del by wcx 2016 11 15----符合条件2
    {
        if (tData.zhuanyu) {
            this.cancelCarchGameWin(tData, tb, pl.uid);
        }
    }

    this.GLog("wcx2:CGameCodeFightEnd_prototype_ReturnGangWin ---------------------------------------------end");
}

/*
 *function:抢杠胡
 *@tb,
 * @pl:放炮的玩家
 * @gcd: fp.lastGang 最后一张扛的牌
 * @toPeng, true:扛转换成 碰!!!!,
 * @hupl
 * 示例: this.ReturnQiangGangWin(tTable,fp,fp.lastGang,true);
 * */
CGameCodeFightEnd.prototype.ReturnQiangGangWin = function(tb, pl, gcd, toPeng, hupl) {
    var tData = tb.tData;

    this.GLog("wcx2:ReturnQiangGangWin--------------------begin");
    this.GLog("wcx2:ReturnQiangGangWin pl.uid=" + pl.uid + " pl.lastGang&gcd=" + gcd + " pl.gangWin=" + JSON.stringify(pl.gangWin));

    for (var cduid in pl.gangWin) {
        var num = pl.gangWin[cduid];
        var cuid = cduid.split("|"); //前面是杠了哪个牌得数职,后杠到了谁，可能有多个
        var uid = cuid[1];
        var cd = parseInt(cuid[0]);

        this.GLog("huyan:cd " + cd);


        if (gcd == cd) {
            var otherPlayer = tb.getPlayer(uid);
            /*if (tData.zhuanyu) //del by wcx 20161123
			 {
				if (otherPlayer && hupl) 
				{
					otherPlayer.winone+=num;
                    pl.winone-=num;
					var huNum =tb.CheckPlayerCount(function(p){ return p.eatFlag>=8});
					//如果是这个人胡
					if (otherPlayer.uid == hupl.uid &&huNum<=1 ) 
					{
						otherPlayer.winone+=num; 
						pl.winone-=num;

                        this.GLog("wcx2:ReturnQiangGangWin if (otherPlayer.uid == hupl.uid &&huNum<=1 )  pl.gangWin=" + JSON.stringify(pl.gangWin));
						this.cartchGameWin( otherPlayer.uid, pl.uid, num, tData );		
						
					}else if(huNum<=1)
					{
						otherPlayer.winone-=num;
						hupl.winone+=num;

                        this.GLog("wcx2:ReturnQiangGangWin else if(huNum<=1) pl.gangWin=" + JSON.stringify(pl.gangWin));
						this.cartchGameWin( hupl.uid, otherPlayer.uid, num, tData );
					}
				}
				
			}
			else*/
            {
                if (otherPlayer) {
                    this.GLog("huyan:not zhuangyu");
                    otherPlayer.winone += num;
                    pl.winone -= num;
                }
            }


            if (gcd) // modify by wcx 2016/11/19 抢扛 后 仍要保留未被抢的根
            {
                this.GLog("delete huyan:ReturnGangWin");
                delete pl.gangWin[cduid];
            }

        }
    }

    if (toPeng) {
        this.GLog("wcx2: 处理前pl.mjgang0=" + pl.mjgang0 + " pl.mjgang1=" + pl.mjgang1 + " pl.mjpeng=" + pl.mjpeng);

        var idx0 = pl.mjgang0.indexOf(gcd);
        if (idx0 >= 0) {
            pl.mjgang0.splice(idx0, 1);

            pl.mjpeng.push(gcd);
            tb.newNotifyAllWithMsgID("gang2peng", { uid: pl.uid, card: gcd }); //add by wcx 解决抢扛胡, 被抢玩家的扛牌 显示问题
        } else {
            var idx1 = pl.mjgang1.indexOf(gcd);
            if (idx1 >= 0) {
                pl.mjgang1.splice(idx1, 1);

                pl.mjpeng.push(gcd);
                tb.newNotifyAllWithMsgID("gang2peng", { uid: pl.uid, card: gcd }); //add by wcx 解决抢扛胡, 被抢玩家的扛牌 显示问题
            }
        }
    }

    this.GLog("wcx2: 处理后 pl.mjgang0=" + pl.mjgang0 + " pl.mjgang1=" + pl.mjgang1 + " pl.mjpeng=" + pl.mjpeng);
    this.GLog("wcx2:ReturnQiangGangWin pl.uid=" + pl.uid + " pl.gangWin=" + JSON.stringify(pl.gangWin));

    this.showAllPlayerInfo(tb, "CGameCodeFightEnd_prototype_ReturnQiangGangWin_begin");
    this.GLog("wcx2:ReturnQiangGangWin--------------------end");
}

/**
 * 吃牌
 */
CGameCodeFightEnd.prototype.MJChi = function(pl, msg, session, next, pTable) {
        var tData = this.tData;
        if (
            tData.canEat &&
            tData.tState == TableState.waitEat &&
            pl.mjState == TableState.waitEat &&
            tData.uids[tData.curPlayer] != pl.uid &&
            tData.uids[(tData.curPlayer + 1) % tData.maxPlayers] == pl.uid //下家限制
        ) {
            //此处必须保证没有其他玩家想 胡牌 碰牌 杠牌
            if (pTable.AllPlayerCheck(function(p) { if (p == pl) return true; return p.eatFlag == 0; })) {
                var cd0 = tData.lastPut;
                var cd1 = tData.lastPut;
                if (msg.pos == 0) {
                    cd0 += 1;
                    cd1 += 2;
                } else if (msg.pos == 1) {
                    cd0 -= 1;
                    cd1 += 1;
                } else {
                    cd0 -= 2;
                    cd1 -= 1;
                }
                var hand = pl.mjhand;
                var idx0 = hand.indexOf(cd0);
                var idx1 = hand.indexOf(cd1);
                if (idx0 >= 0 && idx1 >= 0) {
                    hand.splice(idx0, 1);
                    idx1 = hand.indexOf(cd1);
                    hand.splice(idx1, 1);
                    pl.mjchi.push(cd0);
                    pl.mjchi.push(cd1);
                    pl.mjchi.push(tData.lastPut);
                    pl.isNew = false;
                    pl.getNum++;
                    var eatCards = [cd0, cd1, tData.lastPut];
                    var lastPlayer = tData.curPlayer;
                    var pPut = pTable.getPlayer(tData.uids[lastPlayer]);
                    pPut.mjput.length = pPut.mjput.length - 1;

                    tData.curPlayer = tData.uids.indexOf(pl.uid);
                    tData.tState = TableState.waitPut;

                    pTable.AllPlayerRun(function(p) {
                        if (pl.mjState != TableState.roundFinish) p.mjState = TableState.waitPut;
                        p.eatFlag = 0;
                    });

                    var chiMsg = { mjchi: eatCards, tData: this.app.CopyPtys(tData), pos: msg.pos, from: lastPlayer };
                    pTable.newNotifyAllWithMsgID('MJChi', chiMsg);
                    pTable.mjlog.push("MJChi", chiMsg); //吃

                    this.GLog("CGameCodeFightEnd--mjlog  MJChi");
                }
                //else console.error("chi num error");
            } else {
                //console.error("chi state error");
            }
        } else {
            //console.error(tData.tState+" "+pl.mjState+" "+tData.uids[tData.curPlayer]+" "+pl.uid);
        }

    }
    /**
     * 碰牌
     */
CGameCodeFightEnd.prototype.MJPeng = function(pl, msg, session, next, tTable) {
        var isAutoPut = true;
        if (next) {
            next(null, null);
            isAutoPut = false;
        }

        var tData = tTable.tData;
        var gThis = this;

        //不可以碰缺的牌
        if (!tData.noBigWin && this.majiang.cardType(tData.lastPut) == pl.mjMiss) return;



        if (tData.tState == TableState.waitEat &&
            pl.mjState == TableState.waitEat &&
            tData.uids[tData.curPlayer] != pl.uid
        ) {
            //此处必须保证没有其他玩家想胡牌
            if (tTable.AllPlayerCheck(function(p) { if (p == pl) return true; return p.eatFlag < 8; })) {

                if (!isAutoPut) {
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

                    this.GLog("CGameCodeFightEnd--mjlog  MJPeng");
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
     * 杠
     * @pl
     * @msg={"cmd":"MJGang","card":4,"__route__":"pkroom.handler.tableMsg"}"
     * @session
     * @next---有时会是 undefined
     * @pTable----pTable.tData:   tData
     *
     * @return 无返回值;
     */
CGameCodeFightEnd.prototype.MJGang = function(pl, msg, session, next, pTable) {
    this.GLog("wcx2:CGameCodeFightEnd MJGang----------------------------begin");

    this.GLog("CGameCodeFightEnd_prototype_MJGang msg=" + JSON.stringify(msg));
    this.GLog("CGameCodeFightEnd_prototype_MJGang next=" + JSON.stringify(next));

    var isAutoPut = true;
    if (next) {
        next(null, null); //if(this.GamePause()) return;
        isAutoPut = false;
    }

    var tData = pTable.tData;

    this.GLog("CGameCodeFightEnd_prototype_MJGang tData=" + JSON.stringify(tData));

    //不可以杠缺的牌
    if (!tData.noBigWin && this.majiang.cardType(msg.card) == pl.mjMiss) return;
    var isBlood = false;
    if (tData.blood) {
        if (pl.mjhu.length == 0) {
            this.GLog("FightEnd:Table.prototype.MJGang blood2");
            isBlood = true;
        } else if (pl.mjpeng.indexOf(pl.mjhand[pl.mjhand.length - 1]) >= 0) {
            this.GLog("FightEnd:Table.prototype.MJGang blood1");
            isBlood = true;
        }
    } else {
        this.GLog("wcx:Table.prototype.MJGang if(tData.blood) == false");
        isBlood = true;
    }

    if (!isBlood) {
        this.GLog("FightEnd:Table.prototype.MJGang blood return");
        return;
    }

    this.GLog("wcx:Table.prototype.MJGang pTable.cards=" + JSON.stringify(pTable.cards));
    this.GLog("wcx:Table.prototype.MJGang tData.cardNext < pTable.cards.length=" + tData.cardNext + "|" + pTable.cards.length);
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

        this.GLog("wcx:Table.prototype.MJGang pl.uid=" + pl.uid);
        this.GLog("wcx:Table.prototype.MJGang pl.mjhand=" + JSON.stringify(pl.mjhand));
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
            this.GLog("wcx2:Table.prototype.MJGang curPlayer=>fp.uid=" + fp.uid + " fp.mjput=" + JSON.stringify(fp.mjput));

            var mjput = fp.mjput;
            if (mjput.length > 0 && mjput[mjput.length - 1] == msg.card) {
                mjput.length = mjput.length - 1; //打出的牌 减1

                this.GLog("wcx2:Table.prototype.MJGang curPlayer  mjput.length=mjput.length-1");
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
        } else if (tData.tState == TableState.waitPut && handNum == 1 && pl.mjpeng.indexOf(msg.card) >= 0 && pl.mjpeng4.indexOf(msg.card) < 0) {
            pl.mjgang0.push(msg.card); //自摸明杠
            hand.splice(hand.indexOf(msg.card), 1);
            pl.mjpeng.splice(pl.mjpeng.indexOf(msg.card), 1);
            msg.gang = 2; //自摸明杠
        } else {
            return;
        }
        pl.lastGang = msg.card;
        tData.putType = msg.gang; //  1 吃明杠 2  自摸明杠 3  暗杠
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
                        p.winone -= 2;
                        pl.winone += 2;
                        pl.gangWin[msg.card + "|" + p.uid] = 2;
                        //iGLog("wcx2:pl.gangWin1=" + pl.gangWin[msg.card+"|"+p.uid] );
                    }
                } else if (msg.gang == 2) //自摸明杠 所有未胡玩家都扣
                {
                    p.winone--;
                    pl.winone++;
                    pl.gangWin[msg.card + "|" + p.uid] = 1;
                    //iGLog("wcx2:pl.gangWin2=" + pl.gangWin[msg.card+"|"+p.uid] );
                } else if (msg.gang == 3) //暗杠 所有未胡玩家都扣
                {
                    p.winone -= 2;
                    pl.winone += 2;
                    pl.gangWin[msg.card + "|" + p.uid] = 2;

                    //iGLog("wcx2:p.uid="  + p.uid + " p.winone=" + p.winone );
                    //iGLog("wcx2:pl.gangWin3=" + pl.gangWin[msg.card+"|"+p.uid] );
                }
            }
            if (canEatGang && p != pl) //可以抢杠---抢扛胡的逻辑!!
            {
                //iGLog("wcx2:canEatGang1" )
                var hType = gThis.GetHuType(tData, p, msg.card); //开杠测试
                if (hType > 0 && gThis.GetSkipHu(tData, p, 2) > p.skipHu) //开杠胡
                {
                    if (p.skipHu > 0) //遇到了番数更高的胡,通知客户端skipHu可以解锁
                    {
                        p.skipHu = 0;
                        p.notify("skipHu", { skipHu: true });
                        //iGLog("wcx2:skipHu false");

                    }
                    if (tData.canEatHu) {
                        if (msg.gang != 3 || hType == 13) {
                            if (gThis.majiang.cardTypeNum(p.mjhand, p.mjMiss) > 0) {
                                //iGLog("has miss  can  not hu");
                            } else {
                                p.mjState = TableState.waitEat;
                                p.eatFlag = 8;
                            }
                            eatGangOK = true;
                            //iGLog("wcx2:MJGang2" )
                        } else {
                            //iGLog("wcx2:MJGang3" )
                        }
                    } else {
                        if (msg.gang != 3 || hType == 13) {
                            if (gThis.majiang.cardTypeNum(p.mjhand, p.mjMiss) > 0) {
                                //iGLog("has miss  can  not hu");
                            } else {
                                p.mjState = TableState.waitEat;
                                p.eatFlag = 8;
                            }
                            eatGangOK = true;
                            //iGLog("wcx2:MJGang4" )
                        } else {
                            //iGLog("wcx2:MJGang5" )
                        }
                    }

                } else {
                    //iGLog("wcx2:canEatGang error" );
                    //iGLog("wcx2:canEatGang hType=" + hType );
                }
            }
        });

        msg.winone = pTable.PlayerPtys(function(p) { return p.winone; });
        msg.eatFlag = pTable.PlayerPtys(function(p) { return p.eatFlag });


        this.GLog("wcx2:CGameCodeFightEnd MJGang msg=" + JSON.stringify(msg));

        pTable.newNotifyAllWithMsgID('MJGang', msg); //广播 杠的信息
        pTable.mjlog.push('MJGang', msg); //杠

        tData.curPlayer = tData.uids.indexOf(pl.uid); //curPlayer 转换
        tData.tState = TableState.waitEat; //table State 转换
        this.SendNewCard(pTable, "d"); //杠后尝试补牌
    } else {
        this.GLog("wcx2:error.MJGang !!!!!!!!!!!!!!!!!!!!!!error !!!!!!!!!!");

        if (tData.tState == TableState.waitPut && pl.mjState == TableState.waitPut && tData.uids[tData.curPlayer] == pl.uid) {

        } else {
            this.GLog("huyan:error tData.tState " + tData.tState);
            this.GLog("huyan:error pl.mjState " + pl.mjState);
        }
        //console.error(tData.tState+" "+pl.mjState+" "+tData.uids[tData.curPlayer]+" "+pl.uid);
    }

    this.showAllPlayerInfo(pTable, "CGameCodeFightEnd:MJGang end");

    //wcx2:CGameCodeFightEnd MJGang pl.gangWin={\"28|100342\":2}" ---28:8桶 100342:打出8桶的玩家uid  2:赢的2分
    this.GLog("wcx2:CGameCodeFightEnd MJGang gang pl.uid=" + pl.uid + " pl.lastGang=" + pl.lastGang);
    this.GLog("wcx2:CGameCodeFightEnd MJGang pl.gangWin=" + JSON.stringify(pl.gangWin) + " gang pl.uid=" + pl.uid);
    this.GLog("wcx2:CGameCodeFightEnd MJGang----------------------------end");
}

/**
 * 结胡
 */
CGameCodeFightEnd.prototype.HighPlayerHu = function(tb, pl) //此处必须保证没有其他玩家想胡牌,
    {
        var tData = tb.tData;
        var uids = tData.uids;
        for (var i = (tData.curPlayer + 1) % tData.maxPlayers; uids[i] != pl.uid; i = (i + 1) % tData.maxPlayers) {
            if (tb.players[uids[i]].eatFlag >= 8) return true;
        }
        return false;
    }


CGameCodeFightEnd.prototype.showAllPlayerInfo = function(tTable, strFunctionName) {
        var iGLog = this.GLog;
        //iGLog("wcx2:" +strFunctionName + "_______________->begin");

        tTable.AllPlayerRun(function(p) {
            //iGLog("wcx2: p.uid=" + p.uid + " p.mjState == TableState.roundFinish=" + (p.mjState == TableState.roundFinish) + " winone=" + p.winone);
            //iGLog("wcx2:             --------------------------->p.baseWin=" + p.baseWin  );
            //iGLog("wcx2:             --------------------------->p.mjdesc=" + p.mjdesc  );
        });


        //iGLog("wcx2:" +strFunctionName + "_______________->end");
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
CGameCodeFightEnd.prototype.MJHu = function(pl, msg, session, next, isFromPass, tTable) {
    var tData = tTable.tData;

    this.showAllPlayerInfo(tTable, "CGameCodeFightEnd.prototype.MJHu begin");

    var iGLog = this.GLog;
    this.GLog("wcx2:MJHu");
    this.GLog("wcx2:MJHu");
    this.GLog("wcx2:MJHu_______________________________________________________begin");
    this.GLog("wcx2:MJHu msg=" + JSON.stringify(msg) + " pl.uid=" + pl.uid + " pl.mjMiss=" + pl.mjMiss + " pl.winType=" + pl.winType + " isFromPass=" + isFromPass);
    this.GLog("wcx2:MJHu pl.mjhand=" + JSON.stringify(pl.mjhand));

    // if(tData.blood){
    // 	this.MJHuBlood(pl,msg,session,next);
    // 	return;
    // }
    // var uids=this.tData.uids;
    var canEnd = false;

    if (!tData.noBigWin //倒倒胡 没有选缺的功能
        &&
        this.majiang.cardTypeNum(pl.mjhand, pl.mjMiss) > 0) //判断手里的牌是否还有 缺类型的牌--有就不能胡
    {
        return;
    }


    //已经胡
    if (pl.winType > 0) //该玩家已经胡了,那就直接 return
    {
        return;
    }


    var mjHuMsg = { wins: {} }; //要发送给客户端
    var huPl = []; //可以胡的玩家


    //自摸胡---//自摸测试
    if (tData.tState == TableState.waitPut &&
        pl.mjState == TableState.waitPut &&
        pl.isNew //这是什么 鬼????
        &&
        tData.uids[tData.curPlayer] == pl.uid //胡的玩家 与  放炮的玩家是同一个
        &&
        this.GetHuType(tData, pl) > 0) //胡牌类型 > 0 就是可以胡了
    {
        //补摸
        if (tData.putType > 0 && tData.putType < 4) //  1 吃明杠 2  自摸明杠 3  暗杠[1,3]
        {
            if (tData.putType == 1) //点明杠后他又自摸----pickGang1:5,  //吃牌开明杠后补牌自摸(点杠者包3家)
            {
                pl.winType = WinType.pickGang1;
                this.GLog("pl.winType=WinType.pickGang1");
            } else //自摸杠在补摸---//摸牌开杠,补牌自摸
            {
                pl.winType = WinType.pickGang23;
                this.GLog("pl.winType=WinType.pickGang23");
            }
        } else //自摸---没有扛过, 那就是普通自摸
        {
            pl.winType = WinType.pickNormal;
        }

        //如果是明杠杠上花胡牌----开杠不是还要摸一张牌吗。恰好你摸得那张牌正好是你要糊的那张牌，那就是杠上花拉。
        /* if (pl.winType == WinType.pickGang1) {
             //杠上花 点炮
             //客户端选的 "点杠花(点炮) 或则 点扛花(自摸) "
             if (tData.gshdianpao) {
                 this.GLog("g!shdianpao zimodianpap1");
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
        pl.eatFlag >= 8) //pl.eatFlag 的每个值都代表什么????
    {
        this.GLog("wcx2:MJHu pl.skipHu=" + pl.skipHu + " pl.eatFlag=" + pl.eatFlag + " pl.uid=" + pl.uid + " tData.curPlayer=" + tData.curPlayer + " tData.uids[tData.curPlayer]=" + tData.uids[tData.curPlayer]);

        if (tData.tState == TableState.waitEat) //
        {
            //获取放炮的玩家....
            var fp = tTable.getPlayer(tData.uids[tData.curPlayer]);
            var winType = null;
            var mjput = null;
            this.GLog("wcx2:MJHu  重要标志 tData.putType=" + tData.putType);

            if (tData.putType == 0) // 0:是什么鬼?  1 吃明杠 2  自摸明杠 3  暗杠
            {
                winType = WinType.eatPut; //普通出牌点炮
                mjput = fp.mjput;
                fp.mjdesc.push("点炮");
                mjHuMsg.from = tData.curPlayer; //记录点炮玩家
            } else if (tData.putType == 4) //转与
            {
                winType = WinType.eatGangPut; //开杠打牌点炮
                mjput = fp.mjput;
                fp.mjdesc.push("点炮");

                this.GLog("wcx2:MJHu 点炮玩家 fp.uid=" + fp.uid + " fp.lastGang=" + fp.lastGang);

                //杠上炮 退回所有杠
                // ReturnGangWin(this,fp,fp.lastGang,false,pl);
                this.ReturnGangWinWithGangShangPao(tTable, fp, fp.lastGang, false, pl);
                mjHuMsg.from = tData.curPlayer; //记录点炮玩家
            } else //抢杠 退回所有杠
            {
                winType = WinType.eatGang; //抢杠

                this.ReturnQiangGangWin(tTable, fp, fp.lastGang, true);
                //if(tData.putType==3) mjput=fp.mjgang1;
                //else mjput=fp.mjgang0;
            }
            this.GLog("wcx2:MJHu  mjput=" + JSON.stringify(mjput));

            if (mjput &&
                mjput.length > 0 &&
                mjput[mjput.length - 1] == tData.lastPut) {
                mjput.length = mjput.length - 1;
            }
            //else return;
            //mjHuMsg.from=tData.curPlayer; //记录点炮玩家 //del by wcx 尝试解决抢扛胡 压牌的BUG
            //一炮多响
            //一炮多响玩家分别操作
            this.GLog("MJHu1");

            if ((!tData.noBigWin) || tData.with3 || tData.doubleCarHouse) {
                this.GLog("MJHu2");
                pl.huclick = true;
                var clickNum = -1; //已经有几个玩家点了 胡的按钮
                var huNum = -2;
                this.GLog("MJHu3");
                huNum = tTable.CheckPlayerCount(function(p) {
                    //iGLog("wcx2:p.uid=" + p.uid + "_eatFlag=" + p.eatFlag);
                    return p.eatFlag >= 8
                });
                this.GLog("wcx2:huNum=" + huNum); //胡牌玩家个数
                clickNum = tTable.CheckPlayerCount(function(p) {
                    if (p.eatFlag >= 8) {
                        return p.huclick;
                    }

                });
                pl.winType = winType;
                this.GLog("clickNum" + clickNum);
                // tTable.AllPlayerRun(function(p) {
                if (pl.mjState == TableState.waitEat && pl.eatFlag >= 8 && pl.huclick == true) {
                    // pl.mjhand.push(tData.lastPut);
                    // p.winType = winType;
                    pl.lastCard = tData.lastPut;
                    // huPl.push(pl);
                }
                // });
                if (huNum == clickNum && huNum > 0 && clickNum > 0) {
                    // if (pl.mjState == TableState.waitEat && pl.eatFlag >= 8 && pl.huclick == true) {
                    //     pl.mjhand.push(tData.lastPut);
                    //     // p.winType = winType;
                    //     huPl.push(pl);
                    // }
                    tTable.AllPlayerRun(function(p) {
                        if (p.mjState == TableState.waitEat && p.eatFlag >= 8) {
                            p.mjhand.push(tData.lastPut);
                            // p.lastCard = tData.lastPut;
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
                            this.GLog("Dingo: FuncName: MjHu  " + "i : " + i.toString() + " orgCur: " + (tData.curPlayer + i).toString() + " cur : " + cur + "  uidsGet: " + tData.uids[cur] + "  uids: " + tData.uids.toString() + "   huLastPlayer : " + tData.huLastPlayer + "  wuid : " + tData.wuid.toString() + "  huclient: " + pd.huclick);
                            if (pd.winType > 0 && pd.skipHu <= 0 && pd.huclick == true) {
                                tData.huLastPlayer = cur;
                                this.GLog("Dingo : MjHu : huLastPlayer   : " + tData.huLastPlayer);
                                break;
                            }
                        }
                    }
                    tTable.AllPlayerRun(function(p) { p.huclick = false });

                    // this.GLog("zhengwei_huclick" + p.huclick);
                    canEnd = true;

                }

            } else if (tData.noBigWin) //倒倒胡----胡一家 本局结束
            {
                tTable.AllPlayerRun(function(p) {
                    if (p.mjState == TableState.waitEat && p.eatFlag >= 8) {
                        //iGLog("wcx2:倒倒胡 }else if (tData.noBigWin) tData.lastPut=" + tData.lastPut + " winType=" + winType + " p.uid=" + p.uid + " p.eatFlag=" + p.eatFlag);
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

    this.GLog("wcx2:MJHu canEnd=" + canEnd);
    this.GLog("wcx2:MJHu isFromPass=" + isFromPass);
    if (canEnd || isFromPass) {
        if (tData.winner == -1) {
            if (huPl.length == 1) {
                tData.winner = tData.uids.indexOf(huPl[0].uid);
            } else {
                //两牌房结束判断坐庄者
                if (tData.doubleCarHouse) {
                    tData.winner = (tData.curPlayer + 1) % tData.maxPlayers
                } else {
                    tData.winner = tData.curPlayer;
                }
                this.GLog("tData.winner = " + tData.winner);
            }
        }
        //计算番
        for (var i = 0; i < huPl.length; i++) {
            var pi = huPl[i];
            tData.wuid.push(pi.uid);
            pi.lastCard = pi.mjhand[pi.mjhand.length - 1];
            mjHuMsg.wins[pi.uid] = { lastCard: pi.lastCard, winType: pi.winType };
            if (pi.winType < WinType.eatGang) //只要是有人点炮了,那就记录 from
            {
                mjHuMsg.from = tData.curPlayer; //记录点炮玩家
            }



            var baseWin = 1;
            var genArr = [];
            if (!tData.noBigWin) {

                this.GLog("wcx2:MJHu call = this.majiang.computeBaseWin");
                baseWin = this.majiang.computeBaseWin(pi, true, tData, false, genArr);


                var firstWin = pi.winType == WinType.pickNormal && pi.getNum == 1 && tData.cardNext == (tData.maxPlayers * 13 + 1);
                //天胡
                var secondWin = pi.winType == WinType.pickNormal && pi.getNum == 1 && tData.cardNext != (tData.maxPlayers * 13 + 1); //地胡

                //天地胡 4番
                if (tData.tiandihu) {
                    if (firstWin) {
                        baseWin *= 16;
                        pi.mjdesc.push("天胡");
                    }
                    if (secondWin) {
                        baseWin *= 16;
                        pi.mjdesc.push("地胡");
                    }
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
                    pi.historyMaxBaseWin = baseWin;
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
        if (tTable.CheckPlayerCount(function(pj) {
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
                                    // pi.winone += (roundWin * pi.baseWin);
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
            }) <= 1 || tData.noBigWin) {
            mjHuMsg.winone = tTable.PlayerPtys(function(p) { return p.winone; });
            tTable.mjlog.push("MJHu", mjHuMsg);
            this.GLog("CGameCodeFightEnd--mjlog  MJHu 1");
            this.EndGame(tTable, pl);
        } else {
            mjHuMsg.winone = tTable.PlayerPtys(function(p) { return p.winone; });
            tTable.newNotifyAllWithMsgID("MJHu", mjHuMsg);
            tTable.mjlog.push("MJHu", mjHuMsg);
            this.GLog("CGameCodeFightEnd--mjlog  MJHu 2");
            tData.putType = 0;
            tData.curPlayer = tData.uids.indexOf(pl.uid);
            this.SendNewCard(tTable, "e");
        }
    } else {
        if (!this.app.huError) this.app.huError = [];
        this.app.FileWork(this.app.huError, this.app.serverId + "huError.txt",
            tData.tState + " " + pl.mjState + " " + pl.isNew + " " + tData.uids[tData.curPlayer] + " " + pl.uid + " " + pl.huType
        );
        this.GLog("huError!!!!!!!!!!!!!!!!!!!!!!!!!!error!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    }


    this.showAllPlayerInfo(tTable, "CGameCodeFightEnd_MJHu_end");
    this.GLog("wcx2:MJHu____________________________________________end");
}


/*自动换牌*/
CGameCodeFightEnd.prototype.TrusteeMJChange = function(tb, pl) {
    var msg = {};
    msg.cmd = "MJHu";
    msg.eatFlag = eatFlag;
    return tb.MJHu(pl, msg, null, null, false);
}

/*自动出牌*/
CGameCodeFightEnd.prototype.TrusteeMJPut = function(tb, pl) {
    this.GLog("TrusteeMJPut---0 pl.autoState=" + pl.autoState + " pl.uid=" + pl.uid);
    if (pl.autoState == AutoState.autoYes) {
        this.GLog("TrusteeMJPut---->1");
        var tData = this.tData;
        //确定打出的牌
        var msg = {};
        msg.cmd = "MJPut";
        msg.isAuto = true;
        msg.autoState = pl.autoState;
        if (pl.mjting) {
            msg.card = pl.mjhand[pl.mjhand.length - 1];
            this.GLog("TrusteeMJPut---->pl.mjting");
        } else {
            this.GLog("TrusteeMJPut---->true");
            if (this.majiang.cardTypeNum(pl.mjhand, pl.mjMiss) == 0) {
                this.GLog("TrusteeMJPut---->cardTypeNum -s");
                if (pl.mjhu && pl.mjhu.length > 0) {
                    msg.card = pl.mjhand[pl.mjhand.length - 1];
                } else {
                    msg.card = this.majiang.getAutoPutCard(pl.mjhand);
                }

                this.GLog("TrusteeMJPut---->cardTypeNum -e");
            } else {
                for (var i = 0; i < pl.mjhand.length; i++) {
                    if (Math.floor(pl.mjhand[i] / 10) == pl.mjMiss) {
                        msg.card = pl.mjhand[i];
                        break;
                    }
                }
            }
        }
        this.GLog("TrusteeMJPut--->----end");
        tb.MJPut(pl, msg);
    }
    this.GLog("TrusteeMJPut---end");
}


/*自动胡牌*/
CGameCodeFightEnd.prototype.TrusteeMJHu = function(tb, pl, eatFlag) {
    this.GLog("hahah_TrusteeMJHu-----s");
    var msg = {};
    msg.cmd = "MJHu";
    msg.eatFlag = eatFlag;
    return tb.MJHu(pl, msg, null, null, false);
}

/*自动扛*/
CGameCodeFightEnd.prototype.TrusteeMJGang = function(tb, pl, eatFlag, aSelfCd) {
    this.GLog("hahah_TrusteeMJGang-----s");

    var tData = tb.tData;
    //最后一张不能扛了
    var isLast = (tData.cardNext == tb.cards.length);
    if (isLast) {
        return 99;
    }

    var msg = {};
    msg.cmd = "MJGang";
    if (tData.uids[tData.curPlayer] == pl.uid) {
        this.GLog("hahah_TrusteeMJGang-----1");
        if (aSelfCd) {
            msg.card = aSelfCd;
        } else {
            msg.card = pl.mjhand[pl.mjhand.length - 1];
        }
    } else {
        this.GLog("hahah_TrusteeMJGang-----2");
        msg.card = tData.lastPut;
    }
    msg.eatFlag = eatFlag;
    this.GLog("hahah_TrusteeMJGang-----end");
    return tb.MJGang(pl, msg, null, null);
}
CGameCodeFightEnd.prototype.TrusteeMJMiss = function(tb, pl) {
    this.GLog("hahah_TrusteeMJMiss-----s");
    var tData = this.tData;
    var msg = {};
    msg.cmd = "MJMiss";
    var tiao = 0;
    var wan = 0;
    var tong = 0;
    if (pl.mjhand) {
        for (var i = 0; i < pl.mjhand.length; i++) {
            switch (Math.floor(pl.mjhand[i] / 10)) {
                case 0:
                    tiao++;
                    break;
                case 1:
                    wan++;
                    break;
                case 2:
                    tong++;
                    break;
            }
        }
    }
    var temp = Math.min(tiao, wan);
    var min = Math.min(temp, tong);
    if (min == tiao) {
        msg.mjMiss = 0;
    } else if (min == wan) {
        msg.mjMiss = 1;
    } else {
        msg.mjMiss = 2;
    }
    this.GLog("hahah_TrusteeMJMiss:" + msg.mjMiss);
    return tb.MJMiss(pl, msg);
}

/*自动碰*/
CGameCodeFightEnd.prototype.TrusteeMJPeng = function(tb, pl, eatFlag) {
    this.GLog("hahah_TrusteeMJPeng-----s");
    var msg = {};
    msg.cmd = "MJPeng";
    msg.eatFlag = eatFlag;
    return tb.MJPeng(pl, msg, null, null);
}



//2.gang
function isGetEatFlag_Gang(majiang, pl, tData, cd) {
    if (tData.blood) {
        return (!pl.mjting) && (majiang.cardType(cd) != pl.mjMiss); //没有听牌, 也没有缺
    } else if (false) {
        return (!pl.mjting) && (pl.mjpeng4.indexOf(cd) < 0); //没有听, 
    } else {
        return true;
    }

    // if (mjType1) {
    //     return (!pl.mjting);
    // } else if (mjType2) {
    //     return (!pl.mjting) && (majiang.cardType(cd) != pl.mjMiss);
    // } else if (mjType3) {
    //     return (!pl.mjting) && (pl.mjpeng4.indexOf(cd) < 0);
    // } else {
    //     return true;
    // }
}

//3.peng
function isGetEatFlag_Peng(majiang, pl, tData, cd) {
    if (tData.blood) {
        return (!pl.mjting) && (majiang.cardType(cd) != pl.mjMiss);
    } else {
        return true;
    }
}

/*
 */
CGameCodeFightEnd.prototype.getSelfEatFlag = function(tb, pl, tData) {
    var eatFlag = 0;
    if (tData.tState == TableState.waitPut &&
        pl.mjState == TableState.waitPut &&
        pl.isNew &&
        tData.uids[tData.curPlayer] == pl.uid) {
        this.GLog("getSelfEat Flag--->1");
        //不能有缺....
        if (this.GetHuType(tData, pl) > 0 &&
            this.majiang.cardTypeNum(pl.mjhand, pl.mjMiss) == 0) { //这里要注意, 有些玩法是无缺的
            eatFlag += 8;
        }
        this.GLog("getSelfEa tFlag--->2");
        var hand = pl.mjhand;
        var handNum = 0;
        var card = hand[hand.length - 1];
        for (var i = 0; i < hand.length; i++) {
            if (hand[i] == card) {
                handNum++;
            }
        }

        this.GLog("getSelfEat Flag--->3");
        var leftCard = tb.cards.length - tData.cardNext;
        if (leftCard <= 0) {
            this.GLog("getSelfEat Flag--->1 eatFlag=" + eatFlag);
            return eatFlag;
        }

        this.GLog("getSelfEat Flag--->4");
        if (!isGetEatFlag_Gang(this.majiang, pl, tData, card)) {
            this.GLog("getSelfEat Flag--->2 eatFlag=" + eatFlag);
            return eatFlag;
        }

        var isCanGang = false;
        /*
        血流可以扛的 条件
        1:没有胡牌 可以扛牌
        2:胡牌, 碰牌中有与手里牌一样的牌(刚摸的牌),可以扛牌 
        */
        if (tData.blood) { //血流
            if (pl.mjhu.length == 0) { // 1: 
                isCanGang = true;
            } else if (pl.mjpeng.indexOf(pl.mjhand[pl.mjhand.length - 1]) >= 0) { //2
                isCanGang = true;
            }
        } else {
            isCanGang = true;
        }


        if (isCanGang) {
            if (handNum == 4) {
                eatFlag += 4;
                this.GLog("getSelfEat Flag--->a ");
            } else if (handNum == 1 && pl.mjpeng.indexOf(card) >= 0 && pl.mjpeng4.indexOf(card) < 0) {
                this.GLog("getSelfEat Flag--->b ");
                eatFlag += 4;
            }
        }

        this.GLog("getSelfEat Flag--->5 eatFlag=" + eatFlag);
        return eatFlag;
    }
    return eatFlag;
}


/*
判断是否可以扛 手里的牌
rtn 是可以扛的 牌号
*/
CGameCodeFightEnd.prototype.getSelfCanGang = function(pl, pTable) {

    var tData = pTable.tData;
    var isBlood = false;
    var rtn = -100;
    var hand = pl.mjhand;
    var cnum = {};

    for (var i = 0; i < hand.length; i++) {
        var cd = hand[i];
        var num = cnum[cd];
        if (!num) num = 0;
        num++;
        cnum[cd] = num;
        if (num == 4) {
            if (this.majiang.cardType(cd) != pl.mjMiss) { //非缺才可以扛
                // 1: 没有胡牌 可以扛牌
                var iCanGang = false;
                if (pl.mjhu.length == 0) {
                    iCanGang = true;
                }
                //2:胡牌, 碰牌中有与手里牌一样的牌(刚摸的牌),可以扛牌 
                else if (pl.mjpeng.indexOf(cd) >= 0) {
                    iCanGang = true;
                }


                //可以扛牌,并且不是最后一张牌
                if (iCanGang &&
                    tData.cardNext < pTable.cards.length &&
                    tData.tState == TableState.waitPut &&
                    pl.mjState == TableState.waitPut) {
                    rtn = cd;
                    break;
                }
            }
        }
    }
    return rtn;
}


module.exports = CGameCodeFightEnd;