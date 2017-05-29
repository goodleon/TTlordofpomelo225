/**
 * 导出js
 */
module.exports = function(app, server, gameid, Player, Table, TableGroup, TableManager, Game) {
    //系统文件
    var fs = require('fs');
    var os = require('os');
    var http = require("http"); //add by wcx 20170123
    var freeGameTypes = {}; //add by wcx 20170123
    var existCheck = {};
    var publicIp = null;
    var g_TableId = null;

    //战绩的publicip不要记了   改成serverID
    var serverId_index01 = app.serverId.lastIndexOf("pkroom");
    serverID = app.serverId.substring((serverId_index01 + 6), app.serverId.length);
    if (serverID.length < 2) { serverID = "00"; } else { serverID = serverID.substring(0, 2); }
    console.error('-----------------' + serverID);
    publicIp = serverID;

    /**
     * 取数据地址
     * @returns 一个ip地址
     */
    function getPublicIp() {
        return publicIp;
    }

    getPublicIp();
    var gameLog = [];
    var GLog = function(log) {
        //线上ip自动屏蔽GLOG
        if (os.hostname().substr(0, 9) == "localhost") {
            if (null != app.FileWork && typeof(app.FileWork) != "undefined") {
                app.FileWork(gameLog, __dirname + "/log.txt", __dirname + " " + gameid + " tableid " + g_TableId + " " + log)
            }
        }
    }


    console.error(app.serverId + " reload game code " + gameid);
    var logid = Date.now();
    GLog("reload Game Code" + gameid);
    /**
     * 更新
     */
    // delete require.cache[require.resolve("./majiang.js")];
    // var majiang=require("./majiang.js");
    /***********************服务端热更新处理所有类指针*********************************/
    delete require.cache[require.resolve("./CMajiangBase.js")];
    var CMajingBase_exp = require("./CMajiangBase.js");

    delete require.cache[require.resolve("./CGameCodeFightEnd.js")]
    var CGameCodeFightEnd_exp = require("./CGameCodeFightEnd.js");

    delete require.cache[require.resolve("./CMajiangDoubleCard.js")];
    var CMajingDoubleCard_exp = require("./CMajiangDoubleCard.js");

    delete require.cache[require.resolve("./CMajiangDeYang.js")];
    var CMajingDeYang_exp = require("./CMajiangDeYang.js");

    delete require.cache[require.resolve("./CGameCodeDoubleCard.js")];
    var CGameCodeDoubleCard_exp = require("./CGameCodeDoubleCard.js");

    delete require.cache[require.resolve("./CMajinagBloodRiver.js")];
    var CMajinagBloodRiver_exp = require("./CMajinagBloodRiver.js");

    delete require.cache[require.resolve("./CGameCodeBloodRiver.js")];
    var CGameCodeBloodRiver_exp = require("./CGameCodeBloodRiver.js");

    delete require.cache[require.resolve("./CGameCodeFallDown.js")];
    var CGameCodeFallDown_exp = require("./CGameCodeFallDown.js");

    delete require.cache[require.resolve("./CGameCodeFight3p.js")];
    var CGameCodeFight3p_exp = require("./CGameCodeFight3p.js");

    delete require.cache[require.resolve("./CGameCodeDeYang.js")];
    var CGameCodeDeYang_exp = require("./CGameCodeDeYang.js");

    delete require.cache[require.resolve("./CGameCodeFight2p.js")];
    var CGameCodeFight2p_exp = require("./CGameCodeFight2p.js");

    delete require.cache[require.resolve("./CMajiangFight2pDoubleCard.js")];
    var CMajiangFight2pDoubleCard_exp = require("./CMajiangFight2pDoubleCard.js");

    delete require.cache[require.resolve("./CGameFight2pDoubleCard.js")];
    var CGameFight2pDoubleCard_exp = require("./CGameFight2pDoubleCard.js");

    delete require.cache[require.resolve("./CGameCodeWanZhou.js")];
    var CGameCodeWanZhou_exp = require("./CGameCodeWanZhou.js");

    delete require.cache[require.resolve("./CMajingWanzhou.js")];
    var CMajingWanzhou_exp = require("./CMajingWanzhou.js");

    delete require.cache[require.resolve("./CGameFight3pWith3.js")];
    var CGameFight3pWith3_exp = require("./CGameFight3pWith3.js");

    //
    delete require.cache[require.resolve("./CMajiangFight3pWith3.js")];
    var CMajiangFight3pWith3_exp = require("./CMajiangFight3pWith3.js");

    delete require.cache[require.resolve("./CMajiangFight3p.js")];
    var CMajiangFight3p_exp = require("./CMajiangFight3p.js");

    if (typeof(server.gamecodeInstanceArray) == "undefined") {
        server.gamecodeInstanceArray = new Array();
    }
    //哈希表缓存对象
    server.gamecodeInstanceArray[gameid] = {
        pCGameCodeFight3p: new CGameCodeFight3p_exp(new CMajiangFight3p_exp(), GLog, app, null, logid, gameid, getPublicIp()),
        pCGameCodeDoubleCard: new CGameCodeDoubleCard_exp(new CMajingDoubleCard_exp(), GLog, app, null, logid, gameid, getPublicIp()),
        pCGameCodeBloodRiver: new CGameCodeBloodRiver_exp(new CMajinagBloodRiver_exp(), GLog, app, null, logid, gameid, getPublicIp()),
        pCGameCodeFallDown: new CGameCodeFallDown_exp(new CMajingBase_exp(), GLog, app, null, logid, gameid, getPublicIp()),
        pCGameCodeFightEnd: new CGameCodeFightEnd_exp(new CMajingBase_exp(), GLog, app, null, logid, gameid, getPublicIp()),
        pCGameCodeDeYang: new CGameCodeDeYang_exp(new CMajingDeYang_exp(), GLog, app, null, logid, gameid, getPublicIp()),
        pCGameCodeFight2p: new CGameCodeFight2p_exp(new CMajingBase_exp(), GLog, app, null, logid, gameid, getPublicIp()),
        pCGameFight2pDoubleCard: new CGameFight2pDoubleCard_exp(new CMajiangFight2pDoubleCard_exp(), GLog, app, null, logid, gameid, getPublicIp()),
        pCGameCodeWanZhou: new CGameCodeWanZhou_exp(new CMajingWanzhou_exp(), GLog, app, null, logid, gameid, getPublicIp()),
        pCGameFight3pWith3: new CGameFight3pWith3_exp(new CMajiangFight3pWith3_exp(), GLog, app, null, logid, gameid, getPublicIp())
    };
    GLog("server.gamecodeInstanceArray update " + gameid);
    /******************************************************************************/
    //克隆对象---这是一个递归函数
    function clone(obj) {
        var o;
        if (typeof obj == "object") //typeof 初级类型判定
        {
            if (obj === null) {
                o = null;
            } else {
                if (obj instanceof Array) //instanceof 高级 类型 判定
                {
                    o = [];
                    for (var i = 0, len = obj.length; i < len; i++) { //数组 下标
                        o.push(clone(obj[i]));
                    }
                } else //哈希表 key:value
                {
                    o = {};
                    for (var j in obj) {
                        o[j] = clone(obj[j]);
                    }
                }
            }
        } else {
            o = obj;
        }
        return o;
    }
    /**
     * 牌桌状态
     */
    var TableState = {
            waitJoin: 1,
            waitReady: 2,
            waitPut: 3, //发牌
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
        eatGangPut: 2, //开杠打牌点炮(杠后炮)
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

    //默认4个人
    var maxPlayers = 4;
    /**
     * 胡牌状态
     */


    //2. 后端(根据服务器需求， 开个计时器每个一段时间请求一次数据， 拿到数据后， 逻辑自行处理)
    function getGamefreeData() {
        setInterval(function() {
            //GLog("getGamefreeData 1");

            var iUrl = null;
            if (os.hostname().substr(0, 9) == "localhost") {
                iUrl = "http://114.55.254.218:800/scmj/gamefree.json";
            } else {
                iUrl = "http://sources4.happyplaygame.net/scmj/gamefree.json";
            }
            http.get(iUrl, function(res) {
                var resData = "";
                res.on("data", function(data) {
                    //GLog("getGamefreeData data");
                    resData += data;
                });
                res.on("end", function() {
                    //GLog("getGamefreeData end");

                    if (resData != "" && resData.length >= 40) {
                        //GLog("服务器当前时间:" + new Date().Format("yyyy-MM-dd hh:mm:ss"));

                        var FreeActivityData = null;
                        try {
                            FreeActivityData = JSON.parse(resData);
                        } catch (error) {
                            //GLog("服务器当前时间: 故意搞错");
                            freeGameTypes = {};
                            return;
                        }

                        if (FreeActivityData) {
                            freeGameTypes = {};
                            for (var item in FreeActivityData) {
                                var gameStartTime = new Date(FreeActivityData[item + ""].gameStartTime + "").getTime();
                                var gameEndTime = new Date(FreeActivityData[item + ""].gameEndTime + "").getTime();
                                var serverNowTime = new Date().getTime();
                                //GLog("服务器当前时间:" + new Date().Format("yyyy-MM-dd hh:mm:ss"));
                                if (gameStartTime && gameEndTime && gameStartTime <= serverNowTime && gameEndTime >= serverNowTime) {
                                    for (var i = 0; i < FreeActivityData[item + ""].gameType.length; i++) {
                                        switch (FreeActivityData[item + ""].gameType[i]) {
                                            case 1:
                                                freeGameTypes.yesBigWin = true;
                                                break;
                                            case 2:
                                                freeGameTypes.blood = true;
                                                break;
                                            case 3:
                                                freeGameTypes.noBigWin = true;
                                                break;
                                            case 4:
                                                freeGameTypes.doubleCarHouse = true;
                                                break;
                                            case 5:
                                                freeGameTypes.fight3p = true;
                                                break;
                                            case 6:
                                                freeGameTypes.fight3pWith3 = true;
                                                break;
                                            case 7:
                                                freeGameTypes.fight2pDoubleCard = true;
                                                break;
                                            case 8:
                                                freeGameTypes.fight2p = true;
                                                break;
                                            case 9:
                                                freeGameTypes.wanZhou = true;
                                                break;
                                            case 10:
                                                freeGameTypes.deyangType = true;
                                                break;

                                            default:
                                                break;
                                        }
                                    }

                                }
                            }
                        }
                    } else {
                        //GLog("获取不到数据！！！");
                    }
                    //GLog("freeGameTypes = " + JSON.stringify(freeGameTypes));
                });
            });
        }, 1000 * 60 * 5); // * 5
    }

    getGamefreeData();



    Table.prototype.initTable = function() {

            var table = this;
            var rcfg = this.roomCfg();
            table.uid2did = {};
            //服务器私有
            table.cards = [];
            //回放记录
            table.mjlog = [];
            //公开
            table.tData = {
                tState: TableState.waitJoin,
                initCoin: 1000, //积分显示
                roundNum: -1,
                roundAll: 0,
                uids: [],
                wuid: [],
                owner: -1, //uid
                cardNext: 0,
                winner: -1, //0-3
                curPlayer: -1, //0-3
                zhuang: -1, //0-3
                lastPutPlayer: -1, //0-3上次出牌玩家
                putType: 0, //0 普通出牌  1 2 3开杠的牌  4开杠后打出的牌   
                lastPut: -1, //上次出的牌
                tableid: this.tableid,
                endTime: 1, //牌局结束时间
                canEatHu: false,
                delEnd: 0, //
                firstDel: 0, //
                huResult: [] //用于血流成河的最后结算统计。
            };
            //牌桌消息序列:从10000开始计算
            table.sequenceAll = -9999;
            g_TableId = this.tableid;
            GLog("initTable!!!!!!!!!!!!");
            //初始化实例
            this.pGameCode = server.gamecodeInstanceArray[gameid].pCGameCodeFightEnd;
            this.pGameCode.GLog = GLog;
            this.pGameCode.tTable = this;
            GLog("test begin" + gameid);
            this.pGameCode.testUpDate();
            GLog("test end" + gameid);
            //table.heartbeatTime = {}; // 心跳包计时器
        }
        //新定义的通知： msg中添加消息序列


    Table.prototype.isFree = function(tb) {
        var tData = tb.tData;
        if (tData.yesBigWin) {
            GLog("isFree=yesBigWin=" + freeGameTypes.yesBigWin);
            if (freeGameTypes.yesBigWin) {
                GLog("isFree=yesBigWin=" + freeGameTypes.yesBigWin);
                return true;
            } else {
                return false;
            }
        } else if (tData.blood) {
            GLog("isFree=blood=" + freeGameTypes.blood);
            if (freeGameTypes.blood) {
                GLog("isFree=blood=" + freeGameTypes.blood);
                return true;
            } else {
                return false;
            }
        } else if (tData.noBigWin) {
            GLog("isFree=blood=" + freeGameTypes.blood);
            if (freeGameTypes.noBigWin) {
                GLog("isFree=blood=" + freeGameTypes.blood);
                return true;
            } else {
                return false;
            }
        } else if (tData.doubleCarHouse && !tData.fight3p && !tData.fight2pDoubleCard) {
            GLog("isFree=doubleCarHouse=" + freeGameTypes.doubleCarHouse);
            if (freeGameTypes.doubleCarHouse) {
                GLog("isFree=doubleCarHouse=" + freeGameTypes.doubleCarHouse);
                return true;
            } else {
                return false;
            }
        } else if (tData.fight3p && !tData.fight3pWith3) {
            GLog("isFree=fight3p=" + freeGameTypes.fight3p);
            if (freeGameTypes.fight3p) {
                GLog("isFree=fight3p=" + freeGameTypes.fight3p);
                return true;
            } else {
                return false;
            }
        } else if (tData.fight3pWith3) {
            GLog("isFree=fight3pWith3=" + freeGameTypes.fight3pWith3);
            if (freeGameTypes.fight3pWith3) {
                GLog("isFree=fight3pWith3=" + freeGameTypes.fight3pWith3);
                return true;
            } else {
                return false;
            }
        } else if (tData.fight2pDoubleCard) {
            GLog("isFree=fight2pDoubleCard=" + freeGameTypes.fight2pDoubleCard);
            if (freeGameTypes.fight2pDoubleCard) {
                GLog("isFree=fight2pDoubleCard=" + freeGameTypes.fight2pDoubleCard);
                return true;
            } else {
                return false;
            }
        } else if (tData.fight2p) {
            GLog("isFree=fight2p=" + freeGameTypes.fight2p);
            if (freeGameTypes.fight2p) {
                GLog("isFree=fight2p=" + freeGameTypes.fight2p);
                return true;
            } else {
                return false;
            }
        } else if (tData.wanZhou) {
            GLog("isFree=wanZhou=" + freeGameTypes.wanZhou);
            if (freeGameTypes.wanZhou) {
                GLog("isFree=wanZhou=" + freeGameTypes.wanZhou);
                return true;
            } else {
                return false;
            }
        } else if (tData.deyangType) {
            GLog("isFree=deyangType=" + freeGameTypes.deyangType);
            if (freeGameTypes.deyangType) {
                GLog("isFree=deyangType=" + freeGameTypes.deyangType);
                return true;
            } else {
                return false;
            }
        }


        return false;
    }

    Table.prototype.newNotifyAllWithMsgID = function(msgStrName, msgData) {
        //GLog("---------------------------------------------- notify all begin");
        if (msgStrName == "roundEnd") {
            GLog("roundEnd=" + JSON.stringify(msgData));
        }
        //GLog("--- sequenceAll 01="+this.sequenceAll);
        if (typeof(msgData.sequenceAll) != "undefined") {
            //GLog("--- msgStrName="+msgStrName);
            GLog("--- msgData.sequenceAll=" + msgData.sequenceAll);
        }
        if (this.sequenceAll == -9999) {
            this.sequenceAll = 10000;
            //GLog("--- sequenceAll 02="+this.sequenceAll);
        } else {
            this.sequenceAll += 1;
            //GLog("--- sequenceAll 03="+this.sequenceAll);
        }

        var msg = {}; //不包含 msgStrName
        msg.sequenceAll = this.sequenceAll;

        if (typeof msgData == "object") { //{key:value}
            //msgData.sequenceAll=this.sequenceAll;
            msg.seqData = msgData;
        } else {
            GLog("Error: sequenceAll04");
        }
        //this.NotifyAll(msg.strName,msg.data);
        //if(msgStrName=="roundEnd"){
        //	GLog("roundEnd="+JSON.stringify(msgData));
        //}
        //GLog("--- NotifyAll msgStrName="+msgStrName);
        //GLog("---------------------------------------------- notify all end");
        this.NotifyAll(msgStrName, msg);
    };
    //断线重连
    Table.prototype.Disconnect = function(pl, msg) {
        pl.onLine = false;
        this.channel.leave(pl.uid, pl.fid);
        pl.fid = null;
        this.NotifyAll('onlinePlayer', { uid: pl.uid, onLine: false, mjState: pl.mjState });
        this.kickPlayerNoReady(pl);
        //this.heartbeatTime[pl.uid] = 0;//重置心跳数据
        //console.info("Disconnect "+pl.uid+" "+pl.fid+" "+pl.sid);
    }
    Table.prototype.Reconnect = function(pl, plData, msg, sinfo) {
            pl.onLine = true;
            this.clearTimeoutFun(pl);
            //console.info("Reconnect "+pl.uid+" "+pl.fid+" "+pl.sid);
            this.channel.leave(pl.uid, pl.fid);
            pl.sid = sinfo.sid;
            pl.fid = sinfo.fid;
            pl.did = sinfo.did;
            if (pl.mjState == TableState.roundFinish &&
                this.tData.tState == TableState.roundFinish) {
                if (this.tData.coinRoomCreate && !this.tData.isVIPTable) {
                    pl.mjState = TableState.waitReady;
                } else {
                    pl.mjState = TableState.isReady;
                }
            }

            this.NotifyAll('onlinePlayer', { uid: pl.uid, onLine: true, mjState: pl.mjState });
            this.channel.add(pl.uid, pl.fid);
            pl.notify("initSceneData", this.initSceneData(pl));

            //console.info("initSceneData "+pl.uid+" "+pl.fid+" "+pl.sid);
            this.startGame();
            //this.heartbeatTime[pl.uid] = Date.now();//重新初始化心跳数据
        }
        /**
         *是否可以添加玩家 
         */
    Table.prototype.CanAddPlayer = function(pl) {
            GLog("wcx9_CanAddPlayer -s");

            var uids = this.tData.uids;
            if (this.tData.roundNum > -2) {
                if (uids.indexOf(pl.uid) < 0) {
                    if (uids.length == this.tData.maxPlayers && uids.indexOf(0) < 0) {
                        if (os.hostname().substr(0, 9) == "localhost") {

                            //add by wcx 
                            if (!app.playlog11) {
                                app.playlog11 = [];
                            }
                            var str11 = __dirname + " [1]= " + gameid + " tableid " + g_TableId + " pl.uid=" + pl.uid + " uids=" + JSON.stringify(uids) + " this.tData.roundNum=" + this.tData.roundNum;
                            app.FileWork(app.playlog11, "/root/logxx.txt", str11);

                            GLog("wcx9_CanAddPlayer -return false  str11=" + str11);
                        }


                        return false;
                    }
                    return true;
                } else {
                    return true;
                }
            }

            if (os.hostname().substr(0, 9) == "localhost") {
                if (!app.playlog11) {
                    app.playlog11 = [];
                }
                var str11 = __dirname + " [2]= " + gameid + " tableid " + g_TableId + " pl.uid=" + pl.uid + " uids=" + JSON.stringify(uids) + " this.tData.roundNum=" + this.tData.roundNum;
                app.FileWork(app.playlog11, "/root/logxx.txt", str11);
                GLog("wcx9_CanAddPlayer -return false 2  str11=" + str11);
            }

            GLog("wcx9_CanAddPlayer -return false 2 ");
            return false;

        }
        /**
         * 是否可离开游戏
         */
    Table.prototype.CanLeaveGame = function(pl) {
            var tData = this.tData;
            if (tData.coinRoomCreate) { //add by wcx 20170226 金币场离开房间  tData.roundNum == -2 是什么鬼???
                if (tData.tState == TableState.waitJoin || tData.tState == TableState.waitReady || tData.roundNum == -2) {
                    return true; //add by zhengwei
                }
            } else {
                if ((tData.tState == TableState.waitJoin && pl.uid != tData.owner) || tData.roundNum == -2) {
                    return true;
                }
            }

            return false;
        }
        /**
         * 创建玩家
         */
    Table.prototype.initAddPlayer = function(pl, msg) {
        //公开
        pl.winall = 0; //累计赢
        pl.winCoinAll = 0; //累计 金币 赢 
        pl.mjState = TableState.isReady;
        pl.mjpeng = []; //碰
        pl.mjgang0 = []; //明杠
        pl.mjgang1 = []; //暗杠
        pl.mjchi = []; //吃
        pl.mjMiss = -1; //选缺: 0 条 1万  2筒 
        pl.mjChange = -1; //是否换过三张
        pl.mjhu = []; //记录胡过的牌
        //私有
        pl.mjhand = []; //手牌
        pl.eatFlag = 0; //胡8 杠4 碰2 吃1
        pl.delRoom = 0;
        pl.onLine = true;
        pl.sequenceSelf = -9999; //个人的消息序列：10000--99999
        pl.lastGangPlayer = -1; //记录上一次点杠的玩家
        pl.trusteeNum = 0; //add by wcx 托管倒计时
        pl.isMaiPai = false;
        this.uid2did[pl.uid] = pl.did; //记录数据服务器id

        pl.notifyWithMsgID = function(msgStrName, msgData) {
            //GLog("---------------------------- notify self start");
            //GLog("--- sequenceSelf 01="+pl.sequenceSelf);
            if (pl.sequenceSelf == -9999) {
                pl.sequenceSelf = 10000;
                //GLog("--- sequenceSelf 02="+pl.sequenceSelf);
            } else {
                pl.sequenceSelf += 1;
                //GLog("--- sequenceSelf 03="+pl.sequenceSelf);
            }

            var msg = {}; //不包含 msgStrName
            msg.sequenceSelf = this.sequenceSelf;

            //** data的数据必须是对象格式: {key:value} 不是这个格式的都要改
            if (typeof msgData == "object") {
                //pl.notify("MJPass",{mjState:pl.mjState});
                msg.seqData = msgData;
            } else {
                //if(pl.onLine)pl.notify("newCard",newCard);
                GLog("Error: sequenceSelf 04");
            }
            //GLog("--- self msgStrName="+msgStrName);
            //GLog("---------------------------- notify self end");
            pl.notify(msgStrName, msg);
        };

        var tData = this.tData;

        //GLog("dingo:  createPara: : " + JSON.stringify( this.createPara ) );
        if (tData.roundNum == -1) {
            tData.roundAll = this.createPara.round; //总
            tData.roundNum = this.createPara.round; //剩余
            tData.noBigWin = this.createPara.noBigWin; //是血战到底
            tData.canEatHu = this.createPara.canEatHu; //是否可以点炮
            tData.with3 = this.createPara.with3;
            tData.blood = this.createPara.blood; //血流成河
            tData.doubleCarHouse = this.createPara.doubleCarHouse //两牌房
            tData.coinRoomCreate = this.createPara.coinRoomCreate;
            tData.isTrust = parseFloat(this.createPara.isTrust); //是否开启托管模式
            tData.isVIPTable = parseInt(this.createPara.isVIPTable); //是否是VIP房
            if (isNaN(tData.isVIPTable)) { //判断是否为nan
                tData.isVIPTable = 0;
            }

            if (tData.coinRoomCreate) { //add by wcx 20170214 金币场自动支持托管
                tData.coinType = this.createPara.coinType;
                tData.CoinPara = this.createPara.CoinPara;
                GLog("tData.coinType_123=" + this.createPara.coinType + " tData.CoinPara=" + JSON.stringify(tData.CoinPara));
                if (isNaN(tData.isTrust)) {
                    if (tData.isVIPTable) {
                        tData.isTrust = 0;
                    } else {
                        tData.isTrust = 10;
                    }
                }
            } else {
                if (isNaN(tData.isTrust)) {
                    tData.isTrust = 0;
                }
            }


            GLog("tData.isTrust a=" + tData.isTrust);



            tData.deyangType = this.createPara.deyangType; //德阳麻将
            tData.huLastPlayer = -1;
            tData.fight3p = this.createPara.fight3p; //三人血战
            tData.menqing = this.createPara.menqing; //门清中张
            tData.gshdianpao = this.createPara.gshdianpao; //杠上花点跑
            tData.gshzimo = this.createPara.gshzimo; //杠上花自摸
            tData.fight2p = this.createPara.fight2p; //二人麻将
            tData.xiaohu = this.createPara.xiaohu;
            tData.fight2pDoubleCard = this.createPara.fight2pDoubleCard;
            tData.wanZhou = this.createPara.wanZhou;
            tData.fight3pWith3 = this.createPara.fight3pWith3;
            tData.jiaxinwu = this.createPara.jiaxinwu;
            tData.yitiaolong = this.createPara.yitiaolong;
            tData.xuezhandd = this.createPara.xuezhandd; //万州麻将中血战选项
            tData.yaojidai = this.createPara.yaojidai; //万州麻将中幺九代选项
            tData.zhuanGen = this.createPara.zhuanGen; //呼叫转移是否转根

            tData.maxWin = 8;
            tData.yesBigWin = this.createPara.yesBigWin;
            maxPlayers = 4;
            tData.maxPlayers = maxPlayers; //默认4人  
            if (this.createPara.maxWin) {
                tData.maxWin = this.createPara.maxWin;
            }
            tData.withWind = false;
            tData.canEat = false;

            tData.zimofan = this.createPara.zimofan;
            tData.yaojiu = this.createPara.yaojiu;
            tData.tiandihu = this.createPara.tiandihu;
            if (tData.noBigWin) //推倒胡
            {
                tData.zimofan = false;
                tData.yaojiu = false;
            } else //血战到底
            {
                tData.canEatHu = true; //血战到底可以点炮
                tData.zhuanyu = this.createPara.zhuanyu;
                tData.zhuanGen = this.createPara.zhuanGen; //呼叫转移是否转根
            }
            if (tData.blood) //血流
            {
                tData.noBigWin = false;
                tData.canEatHu = true; //血战到底可以点炮
                tData.zhuanyu = false;
                tData.with3 = false;
                tData.xiaohu = false;
            } else if (tData.doubleCarHouse) //内江麻将
            {
                tData.noBigWin = false;
                tData.canEatHu = true; //血战到底可以点炮
                tData.zhuanyu = false;
                //tData.with3      =  false; //del by wcx 内江 换三张
                tData.xiaohu = false;
            } else if (tData.deyangType) //德阳麻将
            {
                tData.noBigWin = false;
                tData.zhuanyu = false;
                tData.with3 = false;
                tData.menqing = false;
                tData.tiandihu = true;
                tData.xiaohu = false;
            } else if (tData.fight3p) //三人内江麻将
            {
                tData.noBigWin = false;
                tData.canEatHu = true; //血战到底可以点炮
                tData.zhuanyu = false;
                tData.with3 = false;
                tData.doubleCarHouse = true; //三人麻将和两牌房玩法基本一致
                maxPlayers = 3;
                tData.xiaohu = this.createPara.xiaohu;
            } else if (tData.fight3pWith3) {
                tData.noBigWin = false;
                tData.canEatHu = true; //血战到底可以点炮
                tData.zhuanyu = false;
                tData.with3 = false;
                tData.doubleCarHouse = false; //三人麻将和两牌房玩法基本一致
                maxPlayers = 3;
                tData.fight3p = true //默认三人配置
            } else if (tData.fight2p) {
                tData.canEatHu = true;
                tData.noBigWin = false;
                tData.with3 = false;
                maxPlayers = 2;
                tData.xiaohu = false;
            } else if (tData.fight2pDoubleCard) //二人内江
            {
                tData.fight2p = true; //默认figh2p是true
                tData.doubleCarHouse = true; //默认内江true
                tData.noBigWin = false;
                tData.canEatHu = true; //血战到底可以点炮
                tData.zhuanyu = false;
                tData.with3 = false;
                maxPlayers = 2;
                tData.xiaohu = this.createPara.xiaohu;
            } else if (tData.wanZhou) {
                //tData.canEatHu	 =	true;//血战到底可以点炮
                //tData.zhuanyu 	 =	this.createPara.zhuanyu;
                tData.zimofan = false;
                tData.zimodi = false;
                tData.yaojiu = false;
            }

            tData.maxPlayers = maxPlayers; //缓存玩家数量
        }


        if (tData.owner == -1) tData.owner = pl.uid;
        var uids = tData.uids;
        if (uids.indexOf(pl.uid) < 0) {
            if (uids.length < tData.maxPlayers) {
                uids.push(pl.uid);
            } else {
                for (var i = 0; i < uids.length; i++) {
                    if (uids[i] == 0) {
                        uids[i] = pl.uid;
                        break;
                    }
                }
            }
        }
        GLog("tData. = " + JSON.stringify(tData));


        if (tData.coinRoomCreate && !tData.isVIPTable) { //add by wcx 20170225 为金币场 准备功能
            GLog("wcx99_waitReady 0");
            pl.mjState = TableState.waitReady;
        }
        GLog("wcx99_waitReady 1");

        this.NotifyAll('addPlayer', { player: { info: pl.info, onLine: true, mjState: pl.mjState, winall: pl.winall, winCoinAll: pl.winCoinAll }, tData: tData });
        g_TableId = this.tableid;

        var iGthis = this;
        //add by wcx 20170411 检查是否有已经离线的玩家
        // this.AllPlayerRun(function(pl) {
        //     GLog("initAddPlayer call kickPlayerNoReady ");
        //     iGthis.kickPlayerNoReady(pl);
        // });

        startTrusteeTimer(this, this);
        this.checkPlayerReady(); //add by wcx 20170226 ---新加的用户要 赶紧 准备
        GLog("add player tableid__________" + g_TableId);
    }

    /********************************重构类测试************************* */
    function inherit(superType, subType) {
        var _prototype = Object.create(superType.prototype);
        _prototype.constructor = subType;
        subType.prototype = _prototype;
    }

    /***************************************************************/
    //客户端收到initSceneData  session中的pkroom还没有设定好
    /**
     * 拍桌数据
     */
    Table.prototype.initSceneData = function(pl) {
            //公共
            GLog("initSceneData!!!")
            GLog("os.hostname()" + os.hostname());

            var msg = {
                players: this.collectPlayer('info',
                    'mjState',
                    'autoState',
                    'mjpeng',
                    'mjgang0',
                    'mjgang1',
                    'mjchi',
                    'mjput',
                    'onLine',
                    'delRoom',
                    'isNew',
                    'winone',
                    'winall',
                    'winCoinOne',
                    'winCoinAll',
                    'mjChange',
                    'eatFlag',
                    'pengFlag',
                    "isMaiPai",
                    this.tData.tState != TableState.waitMiss ? 'mjMiss' : 'mjState',
                    'winType', 'lastCard', 'mjhu', 'firstPick', 'mjting'),
                tData: this.tData,
                serverNow: Date.now()
            };
            //私有
            msg.players[pl.uid].mjhand = pl.mjhand;
            msg.players[pl.uid].mjpeng4 = pl.mjpeng4;
            msg.players[pl.uid].skipHu = pl.skipHu;
            msg.players[pl.uid].mjMiss = pl.mjMiss;

            return msg;
        }
        /**
         * 销毁
         */
    function DestroyTable(tb) {

        if (tb.PlayerCount() == 0 && tb.tData.roundNum == -2) {

            var tData = tb.tData;
            tData.isTrust = -1.1;
            tb.clearTimeout4Table123(tData);
            tb.clearAllPlayersTrustee();

            tb.tData.roundNum = -3;
            tb.Destroy();
        }
    }
    /**
     * 清理玩家
     */
    Table.prototype.cleanRemovePlayer = function(pl) {
            //console.info("cleanRemovePlayer "+pl.uid+" "+this.tData.roundNum);
            var tData = this.tData;
            if (tData.tState == TableState.waitJoin) {
                var idx = tData.uids.indexOf(pl.uid);
                if (idx >= 0) {
                    tData.uids[idx] = 0;
                    this.NotifyAll("removePlayer", { uid: pl.uid, tData: tData });
                }
            }
            DestroyTable(this);

        }
        /**
         * 开始游戏 发牌
         */
    Table.prototype.startGame = function() {
            GLog("startGame!!!!!!!! playerCount roundNum = " + this.PlayerCount() + " " + this.tData.roundNum);
            //检测所以玩家是否已经准备状态
            if (this.tData.roundNum > 0 &&
                this.PlayerCount() == this.tData.maxPlayers &&
                this.AllPlayerCheck(function(pl) {
                    GLog("TableState.isReady !!!!!!!");
                    return pl.mjState == TableState.isReady
                })) {


                //初始化全局消息序列
                this.sequenceAll = -9999;
                //初始化个人消息序列---并清理所有的 timeOut(add by wcx 20170411)
                var igthis = this;
                this.AllPlayerRun(function(pl) {
                    pl.sequenceSelf = -9999;
                    GLog("startGame call clearTimeoutFun ");
                    igthis.clearTimeoutFun(pl);
                });

                var tData = this.tData;
                //三人三房
                if (tData.fight3pWith3) {
                    GLog("CGameCodeFight3p_exp!!");
                    this.pGameCode = server.gamecodeInstanceArray[gameid].pCGameFight3pWith3;
                }
                //3p麻将
                else if (tData.fight3p) {
                    GLog("CGameCodeFight3p_exp!!");
                    this.pGameCode = server.gamecodeInstanceArray[gameid].pCGameCodeFight3p;
                }
                //二人 内江  
                else if (tData.fight2pDoubleCard) {
                    GLog("fight2pDoubleCard!!");
                    this.pGameCode = server.gamecodeInstanceArray[gameid].pCGameFight2pDoubleCard;
                }
                //内江麻将 
                else if (tData.doubleCarHouse) {
                    GLog("CGameCodeDoubleCard_exp!!");
                    this.pGameCode = server.gamecodeInstanceArray[gameid].pCGameCodeDoubleCard;
                }
                //血流
                else if (tData.blood) {
                    GLog("CGameCodeBloodRiver_exp!!");
                    this.pGameCode = server.gamecodeInstanceArray[gameid].pCGameCodeBloodRiver;
                }
                //倒倒湖
                else if (tData.noBigWin) {
                    GLog("CGameCodeFallDown_exp!!");
                    this.pGameCode = server.gamecodeInstanceArray[gameid].pCGameCodeFallDown;
                } else if (tData.deyangType) {
                    GLog("pCGameCodeDeYang!!");
                    this.pGameCode = server.gamecodeInstanceArray[gameid].pCGameCodeDeYang;
                } else if (tData.fight2p) {
                    GLog("pCGameCodeFight2p!!");
                    this.pGameCode = server.gamecodeInstanceArray[gameid].pCGameCodeFight2p;
                } else if (tData.wanZhou) {
                    GLog("pCGameCodeFight2p!!");
                    this.pGameCode = server.gamecodeInstanceArray[gameid].pCGameCodeWanZhou;
                } else {
                    GLog("CGameCodeFightEnd_exp!!");
                    this.pGameCode = server.gamecodeInstanceArray[gameid].pCGameCodeFightEnd;
                }

                //pCGameCodeDeYang : new CGameCodeDeYang_exp( new CMajingDeYang_exp(), GLog, app, null, logid, gameid, getPublicIp() )
                this.pGameCode.tTable = this;
                //替换GLog
                this.pGameCode.GLog = GLog;
                this.pGameCode.app = app;
                this.pGameCode.logid = logid;
                this.pGameCode.gameid = gameid;

                //开始洗牌
                if (app.testCards && app.testCards[tData.owner]) {
                    this.cards = app.testCards[tData.owner];
                } else {
                    GLog("random");
                    this.cards = this.pGameCode.getMajiang().randomCards(this.tData.withWind);
                }
                GLog("cards!!!!!!!!! =" + JSON.stringify(this.cards));

                this.pGameCode.getMajiang().GLog = GLog;

                if (tData.zhuang == -1) //第一局
                {
                    tData.zhuang = tData.curPlayer = 0;
                    tData.startTime = new Date();
                } else if (tData.winner == -1) //荒庄
                {
                    tData.curPlayer = tData.zhuang = (tData.zhuang + 1) % tData.maxPlayers;
                } else //有赢家
                {
                    tData.zhuang = tData.curPlayer = tData.winner;
                }
                GLog("startGame step1");
                GLog("tData.curPlayer = " + tData.curPlayer);
                GLog("tData.winner = " + tData.winner);
                GLog("tData.zhuang = " + tData.zhuang);
                tData.cardNext = 0;
                tData.tState = TableState.waitCard;
                tData.winner = -1; //记录赢家
                tData.huLastPlayer = -1; //记录上次胡牌玩家
                tData.wuid = [];
                tData.winGameWinArray = []; //缓存杠win数组

                if (!tData.startTimes) {
                    tData.startTimes = [];
                }


                var startTime = new Date();
                var nowStr = startTime.Format("yyyy-MM-dd hh:mm:ss");
                tData.startTimes.push(nowStr);

                var cards = this.cards;
                GLog("startGame step2___nowStr=" + nowStr);

                //初始化maxPlayers个玩家
                for (var i = 0; i < tData.maxPlayers; i++) {
                    var pl = this.players[tData.uids[(i + tData.zhuang) % tData.maxPlayers]];
                    pl.mjState = TableState.waitCard;
                    pl.eatFlag = 0;
                    pl.winone = 0; //当前局赢多少
                    pl.historyMaxBaseWin = 0; //用来保存 该局所赢得的最大可能番数,是可以超过 tData.maxWin的
                    pl.baseWin = 0; //番数
                    pl.mjpeng = []; //碰
                    pl.pengFlag = false;
                    pl.mjgang0 = []; //明杠
                    pl.gang0uid = {};
                    pl.gangWin = {}; //记录杠钱,用来反还
                    pl.mjgang1 = []; //暗杠
                    pl.mjchi = []; //吃
                    pl.mjput = []; //打出的牌
                    pl.winType = 0; //胡牌类型
                    pl.mjMiss = -1; //选缺: 0 条 1万  2筒 
                    pl.isNew = false; //是否通过发牌获取的,不是碰 吃
                    //麻将听牌
                    pl.mjting = false; //听初始化
                    pl.firstPick = 0; //出牌第次数
                    pl.huclick = false;
                    pl.isMaiPai = false;

                    pl.mjhu = []; //用于记录胡过的牌
                    //私有
                    pl.skipHu = 0;
                    pl.getNum = 0;
                    pl.mjhand = []; //手牌
                    pl.mjdesc = [];
                    pl.mjpeng4 = []; //碰的时候还有一张牌
                    pl.mjChange = -1;
                    pl.arry = [];
                    pl.arry1 = [];

                    pl.zhuanyuTo = {}; //add by wcx 2016.11.15---用来控制转不转根
                    pl.zhuanyuFrom = {}; //add by wcx 2016.11.15

                    if (tData.coinRoomCreate) {
                        pl.winCoinOne = 0; //当前局 金币 赢多少
                        if (this.KickPLId) {
                            clearTimeout(this.KickPLId); //.
                            this.KickPLId = null;
                            GLog("clearTimeout(this.KickPLId);");
                        }
                    }

                    if (tData.isTrust > 1) {
                        pl.autoState = AutoState.autoReady; //个人托管状态
                    }

                    for (var j = 0; j < 13; j++) {
                        GLog("startGame step player loop7");
                        pl.mjhand.push(cards[tData.cardNext++]);
                    }

                    if (pl.onLine) {
                        GLog("send player card " + JSON.stringify(pl.mjhand));
                        pl.notifyWithMsgID("mjhand", { mjhand: pl.mjhand, tData: tData });
                        //新开始初始化skipHu
                        pl.notifyWithMsgID("skipHu", { skipHu: false });
                    } else {
                        GLog("not send player card");
                    }
                }
                GLog("startGame step3");
                var mjlog = this.mjlog;
                if (mjlog.length == 0) {
                    mjlog.push("players", this.PlayerPtys(function(p) {
                        return {
                            info: { uid: p.info.uid, nickname: p.info.nickname, headimgurl: p.info.headimgurl, remoteIP: p.info.remoteIP }
                        }

                    })); //玩家
                }
                tData.putType = 0;
                tData.curPlayer = (tData.curPlayer + (tData.maxPlayers - 1)) % tData.maxPlayers;
                mjlog.push("mjhand", this.cards, app.CopyPtys(tData)); //开始
                SendNewCard(this, "a"); //开始后第一张发牌

                if (this.tData.coinRoomCreate) {
                    //获得每局消耗
                    var icost = this.getCoinConfig(CoinData.cost);
                    var msg = { coin: icost };
                    this.AllPlayerRun(function(p) {
                        var idlt = icost;
                        if (p.info.coin < icost) {
                            idlt = p.info.coin;
                        }
                        GLog("startGame call httpUpdatePlayer 1 ");
                        igthis.httpUpdatePlayer(p.uid, { $inc: { coin: -idlt } }, app.serverId, function(er, rtn1) {
                            p.info.coin = rtn1.coin;
                            GLog("startGame call httpUpdatePlayer callback er=" + JSON.stringify(er) + " rtn1=" + JSON.stringify(rtn1) +
                                "p.info.coin=" + p.info.coin + " p.uid=" + p.uid);

                        });
                        GLog("startGame call httpUpdatePlayer end  --------p.info.coin=" + p.info.coin + " p.uid=" + p.uid);
                    });
                    this.NotifyAll("MJCoinRoomCost", msg); //add by wcx 提示
                }

                startTrusteeTimer(this, this);
            }
        }
        /**
         * 游戏结束 （结算）
         * @tb
         * @pl
         * @byEndRooom
         */
    function EndGame(tb, pl, byEndRoom) {
        tb.pGameCode.EndGame(tb, pl, byEndRoom);
    }

    Table.prototype.MJTick = function(pl, msg, session, next) {
        next(null, null);
        var rtn = { serverNow: Date.now() };
        pl.mjTickAt = rtn.serverNow;
        pl.tickType = msg.tickType;
        rtn.players = this.PlayerPtys(function(p) { return { mjTickAt: p.mjTickAt, tickType: p.tickType } });
        this.NotifyAll("MJTick", rtn);
    }

    function fRecieveMjPut(pl, msg, session, next, tTable) {
        GLog("GameCode.js-----fRecieveMjPut222");
        tTable.pGameCode.fRecieveMjPut(pl, msg, session, next, tTable)
    }
    /**
     * 玩家出牌（打牌）
     */
    Table.prototype.MJPut = function(pl, msg, session, next) {
            GLog("GameCode.js-----MJPut1111");
            fRecieveMjPut(pl, msg, session, next, this)
        }
        //计算血战最后的分数
    function EndCalBloodWinOne(tb) {
        var tData = tb.tData;
        GLog("EndCalBloodWinOne");
        for (var i = 0; i < tData.huResult.length; i++) {
            var plEnd = tb.players[tData.huResult[i].uid];
        }
        tData.huResult = [];
    }
    //发牌不要求在线
    function SendNewCard(tb, from) {
        GLog("server.gamecodeInstance.SendNewCard");
        tb.pGameCode.SendNewCard(tb, from);
    }
    Table.prototype.TryNewCard = function() { SendNewCard(this, "f"); }
        /**
         * 结束房间
         */
    function EndRoom(tb, msg) {
        GLog("function EndRoom");
        tb.pGameCode.EndRoom(tb, msg);
    }
    /**
     * 暂时没用
     */
    function RoomEnd(tb, msg) {
        if (tb.tData.tState == TableState.waitPut ||
            tb.tData.tState == TableState.waitEat ||
            tb.tData.tState == TableState.waitCard
        ) {
            GLog("RoomEnd1");
            tb.tData.roundNum = 1;
            EndGame(tb, null, true);
        } else {
            GLog("RoomEnd2");
            EndRoom(tb, msg);
        }
    }
    //change
    /**
     * 换牌
     */
    Table.prototype.MJChange = function(pl, msg, session, next) {
            GLog("MJChange");
            next(null, null);
            this.pGameCode.MJChange(pl, msg, session, next, this);
        }
        /**
         * 选缺 打掉所有不需要的牌才能胡
         */
    Table.prototype.MJMiss = function(pl, msg, session, next) {
            // GLog("MJMiss");
            this.pGameCode.MJMiss(pl, msg, session, next, this);
        }
        /**
         * 过(什么都不干) tag fix
         */
    Table.prototype.MJPass = function(pl, msg, session, next) {
            GLog("MJPass");
            next(null, null); //if(this.GamePause()) return;
            this.pGameCode.MJPass(pl, msg, session, next, this);

        }
        /**
         * 缓存杠输赢钱数
         * @winPlayer 赢的玩家
         * @lostPlayer 输钱的玩家
         * @num	钱数
         * @array 缓存数组
         */
    function cartchGameWin(winPlayerUid, lostPlayerUid, num, tData) {
        GLog("huyan:cartchGameWin winPlayerUid " + winPlayerUid);
        GLog("huyan:cartchGameWin lostPlayerUid " + lostPlayerUid);
        var tempWinData = {};

        tempWinData.winPlayerUid = winPlayerUid;
        tempWinData.lostPlayerUId = lostPlayerUid;
        tempWinData.money = num;

        tData.winGameWinArray.push(tempWinData);
        GLog("huyan:cartchGameWin end");
    }
    /**
     * 撤销缓冲数据
     * @array 缓冲数组
     */
    function cancelCarchGameWin(tData, tb, chaUid) {
        GLog("huyan:cancelCarchGameWin begin");
        for (var value in tData.winGameWinArray) {
            var winPlayerUid = tData.winGameWinArray[value].winPlayerUid;
            var lostPlayerUId = tData.winGameWinArray[value].lostPlayerUId;
            var money = tData.winGameWinArray[value].money;
            if (chaUid == lostPlayerUId) {
                tb.getPlayer(winPlayerUid).winone -= money;
                tb.getPlayer(lostPlayerUId).winone += money;
            }
        }
        //tData.winGameWinArray = [];
        GLog("huyan:cancelCarchGameWin end " + JSON.stringify(tData.winGameWinArray));
    }
    /**
     * 吃牌
     */
    Table.prototype.MJChi = function(pl, msg, session, next) {
            next(null, null); //if(this.GamePause()) return;
            this.pGameCode.MJChi(pl, msg, session, next, this);
        }
        /**
         * 碰牌
         */
    Table.prototype.MJPeng = function(pl, msg, session, next) {
            GLog("Table.prototype.MJPeng!!!----0");
            this.pGameCode.MJPeng(pl, msg, session, next, this)
        }
        /**
         * 杠 
         */
    Table.prototype.MJGang = function(pl, msg, session, next) {
            GLog("Table.prototype.MJGang!!!----0");
            this.pGameCode.MJGang(pl, msg, session, next, this);
        }
        /**
         * 结胡
         */
    function HighPlayerHu(tb, pl) //此处必须保证没有其他玩家想胡牌,
    {
        var tData = tb.tData;
        var uids = tData.uids;
        for (var i = (tData.curPlayer + 1) % tData.maxPlayers; uids[i] != pl.uid; i = (i + 1) % tData.maxPlayers) {
            if (tb.players[uids[i]].eatFlag >= 8) return true;
        }
        return false;
    }
    /**
     * 解散房间
     */
    Table.prototype.EndTable = function() {
            EndRoom(this, { reason: 0 });
        }
        /**
         * 请求胡牌
         */
    Table.prototype.MJHu = function(pl, msg, session, next, isFromPass) {
        if (typeof(isFromPass) == "undefined") {
            isFromPass = false;
        }

        GLog("Table.prototype.MJHu!!!----0");
        //此处必须保证胡牌顺序
        if (!isFromPass && next) {
            GLog("Table.prototype.MJHu!!!----1");
            next(null, null);
        }
        GLog("Table.prototype.MJHu!!!-----2");

        this.pGameCode.MJHu(pl, msg, session, next, isFromPass, this);
    }

    /**
     * 人数走完了 就删除房间
     */
    Table.prototype.DelRoom = function(pl, msg, session, next) {
        next(null, null);
        var table = this;
        var tData = this.tData;
        GLog(" DelRoom begin");
        if (pl.delRoom == 0) {
            var yesuid = [];
            var nouid = [];
            GLog("del step0");
            if (msg.yes) {
                if (this.PlayerCount() < tData.maxPlayers) {
                    GLog("del step1");
                    RoomEnd(this, { reason: 0 });
                    return; //人数不足
                }
                pl.delRoom = 1;
                if (tData.delEnd == 0) {
                    GLog("del step2");
                    tData.delEnd = Date.now() + 5 * 60000;
                    tData.firstDel = pl.uid;
                    this.SetTimer(
                        5 * 60000,
                        function() {
                            if (tData.delEnd != 0) RoomEnd(table, { reason: 1 }); //超时
                        }
                    );
                }
                //包括发起人3个以上同意结束房间
                else if (this.CheckPlayerCount(function(p) { if (p.delRoom > 0) { yesuid.push(p.uid); return true; } return false; }) >= tData.maxPlayers - 1) {
                    GLog("del step3");
                    RoomEnd(this, { reason: 2, yesuid: yesuid });
                    return; //同意
                }
            } else {
                GLog("del step4");
                pl.delRoom = -1;
                //2个以上不同意结束房间
                if (this.CheckPlayerCount(function(p) { if (p.delRoom < 0) { nouid.push(p.uid); return true; } return false; }) >= 1) {
                    tData.delEnd = 0;
                    tData.firstDel = -1;
                    this.SetTimer();
                    this.AllPlayerRun(function(p) { p.delRoom = 0; });
                }
            }
            GLog("DelRoom");
            this.NotifyAll("DelRoom", { players: this.collectPlayer("delRoom"), tData: tData, nouid: nouid });

        }
    }

    /*获得 金币场的数据 配置*/
    Table.prototype.getCoinConfig = function(iCoinData) {

        GLog("getCoinConfig ----------------------------------s iCoinData=" + iCoinData);
        var tData = this.tData;
        var iCoinPara = (tData.CoinPara); //1初级场2中级场3高级场4专家场5大师场6宗师场
        var iRet = iCoinPara.type;

        if (iCoinData == CoinData.type) {
            iRet = iCoinPara.type;
        } else if (iCoinData == CoinData.cost) {
            iRet = iCoinPara.cost;
        } else if (iCoinData == CoinData.win) {
            iRet = iCoinPara.win;
        } else if (iCoinData == CoinData.min) {
            iRet = iCoinPara.min;
        } else if (iCoinData == CoinData.max) {
            iRet = iCoinPara.max;
        }

        return iRet;
    }

    /*
    牌局结束计算用户最后的金币
    返回值:返回 true表示, 有玩家破产
    */
    Table.prototype.calculateCoin = function() {
            GLog("calculateCoin ----------------------------------s");
            var iRet = false;
            var tData = this.tData;
            if (!tData.coinRoomCreate) { return; }

            //获得低分
            var iDiFen = this.getCoinConfig(CoinData.win);

            //获得每局消耗
            var icost = 0; //this.getCoinConfig(CoinData.cost);

            var iWinAllCoin = 0;
            var iFailAllCoinPool = 0;

            //先计算总分
            this.AllPlayerRun(function(p) {
                p.info.coin -= icost; //扣除用户的 房间费
                GLog("calculateCoin p.info coin=" + p.info.coin + " iDiFen=" + iDiFen);

                GLog("calculateCoin p.uid=" + p.uid + " p.winCoinOne=" + p.winCoinOne + " p.winCoinAll=" + p.winCoinAll);

                if (typeof(p.winCoinOne) == "undefined") {
                    p.winCoinOne = 0;
                }
                if (typeof(p.winCoinAll) == "undefined") {
                    p.winCoinAll = 0;
                }


                if (p.winone > 0) {
                    iWinAllCoin += p.winone;
                } else if (p.winone < 0) { //计算所有输 玩家的分数
                    var iNeed = -1 * (p.winone * iDiFen);

                    if (p.info.coin >= iNeed) {
                        GLog("calculateCoin iNeed > = " + iNeed + " p.info. coin=" + p.info.coin);
                        iFailAllCoinPool -= iNeed;
                        p.winCoinOne -= iNeed;
                        p.winCoinOne -= icost; //扣除房间费 
                        p.winCoinAll += p.winCoinOne;
                        p.info.$inc = { coin: p.winCoinOne };
                    } else {
                        GLog("calculateCoin iNeed < = " + iNeed + " p.info. coin=" + p.info.coin);
                        iFailAllCoinPool -= p.info.coin;
                        p.winCoinOne -= p.info.coin;
                        p.winCoinOne -= icost; //扣除房间费 
                        p.winCoinAll += p.winCoinOne;
                        p.info.$inc = { coin: p.winCoinOne };
                        iRet = true;
                    }
                } else { //原来不输不赢的玩家
                    p.winCoinOne -= icost; //扣除房间费 
                    p.winCoinAll += p.winCoinOne;
                    p.info.$inc = { coin: p.winCoinOne };
                }

                GLog("calculateCoin --22 p.uid=" + p.uid + " p.winCoinOne=" + p.winCoinOne + " p.winCoinAll=" + p.winCoinAll);
            });

            if (iFailAllCoinPool < 0) {
                iFailAllCoinPool *= -1;
            }


            var iWinAllCoinPool = 0;
            var iFirstWinPlay = null;
            //只处理 赢钱的人的分数
            this.AllPlayerRun(function(p) {
                if (p.winone > 0) {

                    var iWin = 0;
                    if (iWinAllCoin > 0) {
                        iWin = parseInt((p.winone / iWinAllCoin) * iFailAllCoinPool);
                    }

                    p.winCoinOne += iWin;
                    iWinAllCoinPool += iWin;
                    p.winCoinOne -= icost; //扣除房间费 
                    p.winCoinAll += p.winCoinOne;
                    p.info.$inc = { coin: p.winCoinOne };

                    if (!iFirstWinPlay && p.winCoinOne % 10 != 0) {
                        iFirstWinPlay = p;
                    }
                }
                GLog("calculateCoin --33 p.uid=" + p.uid + " p.winCoinOne=" + p.winCoinOne + " p.winCoinAll=" + p.winCoinAll);
            });

            //修正算分差1的问题
            if (iFailAllCoinPool > iWinAllCoinPool && iFirstWinPlay) {
                var idlt = iFailAllCoinPool - iWinAllCoinPool;
                GLog("calculateCoin idlt=" + idlt);
                iFirstWinPlay.winCoinOne += idlt;
                iFirstWinPlay.winCoinAll += idlt;
                iFirstWinPlay.info.$inc = { coin: iFirstWinPlay.winCoinOne };
            }


            /* if (tData.isVIPTable && !iRet) { //VIP房间,每局都更新金币 VIP房间,并且没有破产的玩家
                 this.AllPlayerRun(function(p) {
                     p.info.coin += p.winCoinOne;
                     if (p.info.coin < 0) {
                         p.info.coin = 0;
                     }
                 });
             }*/

            GLog("calculateCoin ----------------------------------end");
            return iRet;

        }
        // this.AllPlayerRun(function(p) { p.delRoom = 0; });



    /*
      玩家已经准备了
      */
    Table.prototype.MJPlayReady = function(pl, msg, session, next) {
        next(null, null);
        var tData = this.tData;


        GLog("wcx99_MJPlayReady this.tData.isTrust  " + this.tData.isTrust);

        if (!this.tData.coinRoomCreate || this.tData.isVIPTable) { //非金币场 不可以 准备
            return;
        }

        var res = {};
        res.uid = pl.uid;

        if (pl.mjState == TableState.waitReady) {
            pl.mjState = TableState.isReady;
            GLog("wcx99_MJPlayReady 0");
        } else {
            GLog("wcx99_MJPlayReady return pl.uid" + pl.uid + "pl.mjState=" + pl.mjState);
            pl.mjState = TableState.isReady;
            //return;
        }
        // var tData = this.tData;
        // var autoPl = this.players[tData.uids[tData.curPlayer]];
        this.NotifyAll("MJPlayReadyOK", res);
        this.checkPlayerReady();
    }

    /*
       检查用户是否 已经准备了
        */
    Table.prototype.checkPlayerReady = function() {
        var tData = this.tData;
        if (!this.tData.coinRoomCreate || this.tData.isVIPTable) {
            return;
        }
        var num = 0;
        var mres = {};
        this.AllPlayerCheck(function(pl) {
            GLog("TableState.isReady !!!!!!!");
            if (pl.mjState == TableState.isReady) {
                num++;
            } else {
                mres.uid = pl.uid;
            }
            return true;
        });
        var iThis = this;

        if (num == this.tData.maxPlayers) {
            this.startGame();
        } else if (num == this.tData.maxPlayers - 1) {
            if (this.KickPLId) {
                clearTimeout(this.KickPLId); //.
                this.KickPLId = null;
                GLog("clearTimeout(this.KickPLId);");
            }

            this.NotifyAll("MJkickoutPlayer", mres);
            var iWait = 11 * 1000;
            var timerId = setTimeout(function() {
                    var inum = 0;
                    iThis.AllPlayerCheck(function(pl) {
                        if (pl.mjState == TableState.waitReady) {
                            inum += 1;
                        }
                        return true;
                    });

                    if (inum > 0) {
                        GLog("wcx9 TableState.isReady !!!!!!! LeaveGame -s");
                        iThis.NotifyAll("MJkickoutPlayerOk", mres); //可以踢人了
                        iThis.LeaveGame(mres.uid, function(err, data) {
                            GLog("wcx9 TableState.isReady !!!!!!! LeaveGame data=" + JSON.stringify(data));
                            if (data.result == 0) {
                                var msg = data.msg; //KickLeaveGame 
                                var uid = data.uid;
                                if (data.uid) {
                                    GLog("wcx9 TableState.isReady !!!!!!! LeaveGame -m");
                                }
                            }
                        });
                        GLog("wcx9 TableState.isReady !!!!!!! LeaveGame -e");
                    }
                },
                iWait);

            this.KickPLId = timerId;
        }
    }


    Table.prototype.clearTimeoutFun = function(pl) {
        var iThis = this;
        // if (this.tData.isTrust <= 0) { //del by wcx 感觉不需要这块代码
        //     return;
        // }

        if ("undefined" == typeof(pl)) {
            return;
        }

        GLog("wcx9 clearTimeoutFun 0");
        if (iThis.KickPLIdArr) {
            if ("undefined" != typeof(iThis.KickPLIdArr["" + pl.uid])) {
                GLog("wcx9 clearTimeoutFun 2");
                clearTimeout(this.KickPLIdArr["" + pl.uid]);
                this.KickPLIdArr["" + pl.uid] = null;
            }
        }
    }

    /*
     */
    Table.prototype.kickPlayerNoReady = function(pl) {
        var tData = this.tData;
        var iThis = this;
        var mres = {};
        mres.uid = pl.uid;
        var iWait = 10 * 1000; //用户离线 准备没开局,10秒后就踢人

        GLog("wcx9 kickPlayerNoReady 0");

        if (!this.tData.coinRoomCreate || this.tData.isVIPTable > 0) {
            return;
        }

        if ("undefined" == typeof(this.KickPLIdArr)) {
            GLog("wcx9 kickPlayerNoReady ");
            this.KickPLIdArr = {};
        }

        GLog("wcx9 kickPlayerNoReady 3 onLine=" + pl.onLine + " mjState=" + pl.mjState + " uid=" + pl.uid);

        if (pl.onLine) {
            GLog("wcx9 kickPlayerNoReady 3 ");
            this.clearTimeoutFun(pl);
            return;
        }

        if (pl.mjState > TableState.waitReady && pl.onLine) { //用户已经准备了
            this.clearTimeoutFun(pl);
            return;
        }

        this.clearTimeoutFun(pl);
        GLog("wcx9 kickPlayerNoReady 4");

        var timerId = setTimeout(function() {
                var isCanReturn = false;
                if (pl.onLine) {
                    isCanReturn = true;
                }

                if (pl.mjState > TableState.waitReady && pl.onLine) {
                    isCanReturn = true;
                }

                if (isCanReturn) {
                    iThis.KickPLIdArr["" + pl.uid] = null;
                    return;
                }


                GLog("wcx9 TableState.kickPlayerNoReady 5");
                iThis.NotifyAll("MJkickoutPlayerOk", mres); //可以踢人了
                iThis.LeaveGame(mres.uid, function(err, data) {
                    GLog("wcx9 kickPlayerNoReady LeaveGame data=" + JSON.stringify(data));
                    if (data.result == 0) {
                        var msg = data.msg; //KickLeaveGame 
                        var uid = data.uid;
                        if (data.uid) {
                            GLog("wcx9 kickPlayerNoReady LeaveGame -m");
                        }
                    }
                });
                GLog("wcx9 kickPlayerNoReady LeaveGame -e");
            },
            iWait);
        this.KickPLIdArr["" + pl.uid] = timerId;
    }


    /**
     *  新托管 -----------------------------------------------------------------------
     */

    /*
    初始化用户的 托管状态
    */
    Table.prototype.InitAutoState = function(pl) {
        GLog("InitAutoState--->s ");
        var tData = this.tData;
        if (tData.isTrust > 1) {
            pl.autoState == AutoState.autoReady;
            pl.trusteeNum = 0;
        }
        GLog("InitAutoState---> end");
    }

    /*
    玩家取消托管
     */
    Table.prototype.MJCancelAuto = function(pl, msg, session, next) {
        next(null, null);
        if (pl.autoState == AutoState.autoYes) {
            pl.trusteeNum = 0;

            var res = {};
            res.uid = pl.uid;
            pl.autoState = AutoState.autoReady;
            res.autoState = pl.autoState;
            this.NotifyAll("MJAuto", res);
        }
    }

    /*牌局结束---清理定时器
     */
    Table.prototype.clearTimeout4Table123 = function(table) {
        if (table.timerId) { //add by wcx 
            clearTimeout(table.timerId);
            table.timerId = null;
        }
    }

    /*牌局结束---清理每个玩家的 托管状态
     */
    Table.prototype.clearAllPlayersTrustee = function() {
        this.AllPlayerRun(function(pl) {
            pl.autoState == AutoState.autoReady;
            pl.trusteeNum = 0;
        });
    }


    /*
    检查该player是否可以 托管,
    如果已经处在托管态就不做任何处理
    */
    function isPlayerCanTrue(tb, pl) {
        if (pl.autoState == AutoState.autoReady) {
            pl.autoState = AutoState.autoYes;

            var msg = {};
            msg.uid = pl.uid;
            msg.autoState = pl.autoState;
            tb.NotifyAll("MJAuto", msg);
        }
    }


    const CHECK_INTERVAL = 1000; //1.0秒检测一次
    /*
     */
    function startTrusteeTimer(table, gamecode) {
        var iGLog = GLog;
        gamecode.clearTimeout4Table123(table);
        table.timerId = setTimeout(function do_it() {
            (function checkState(table, gamecode) {
                iGLog("----startTrusteeTimer---- callback");
                checkNeedTrustee(table, gamecode);

                var tData = table.tData;


                var callLog = function(aIndex) {
                    iGLog("callLog=" + aIndex + "  tState=" + tData.tState + " isTrust b=" + tData.isTrust);
                }

                if (tData.roundNum == -1) { //房间   
                    callLog(1);
                    startTrusteeTimer(table, gamecode);
                } //牌局结束就不再重启生成timer了
                else if (tData.tState != TableState.roundFinish && tData.isTrust > 1) {
                    callLog(2);
                    //重新生成一个 timeout
                    startTrusteeTimer(table, gamecode);
                } else {
                    callLog(3);
                }
            })(table, gamecode);
        }, CHECK_INTERVAL);
    }


    //托管状态监测，控制
    function checkNeedTrustee(table, gamecode) {
        var iGLog = GLog;
        var iDelayNum = 0;
        if (!table || !table.tData.hasOwnProperty("uids") || table.tData.uids.length == 0) {
            return;
        }
        var tData = table.tData;
        var uids = tData.uids;


        if (tData.isTrust <= 1) {
            iGLog("---------function checkNeedTrustee() ---tState=" +
                table.tData.tState + " isTrust c =" + tData.isTrust);
            return;
        } else {
            iDelayNum = tData.isTrust - 1;
            iGLog("---------function checkNeedTrustee() ---tState=" +
                table.tData.tState + " isTrust c =" + tData.isTrust + " iDelayNum=" + iDelayNum);
        }


        switch (table.tData.tState) {
            case TableState.waitMiss:
                {
                    iGLog("-----checkNeedTrustee() waitMiss s");

                    for (var i = 0; i < uids.length; ++i) {
                        var player = table.players[uids[i]];
                        if (!player) { continue; }
                        if (player.mjState == TableState.waitMiss ||
                            player.mjState == TableState.isReady /*用户状态居然是 7 ,改一版本*/ ) { //超过10秒选缺，默认为托管
                            player.trusteeNum += 1;
                            iGLog("-----checkNeedTrustee() waitMiss player.trusteeNum=" + player.trusteeNum);

                            if (player.trusteeNum >= iDelayNum) {
                                iGLog("-----checkNeedTrustee() waitMiss player.uid: " + player.uid)
                                isPlayerCanTrue(table, player);
                                TrusteePlayer(table, gamecode, player);
                            }
                        } else {
                            iGLog("-----checkNeedTrustee() waitMiss player.mjState=" + player.mjState +
                                " player.uid=" + player.uid);
                        }
                    }
                }
                break;
            case TableState.waitEat:
                {
                    var iMaxPlayer;
                    iGLog("-----checkNeedTrustee() waitEat 1");
                    for (var i = 0; i < uids.length; ++i) { //取出eatFlag最大的玩家
                        var player = table.players[uids[i]];
                        if (!player) { continue; }
                        if ("undefined" == typeof(iMaxPlayer)) {
                            iMaxPlayer = player;
                        } else {
                            if (player.eatFlag > iMaxPlayer.eatFlag) {
                                iMaxPlayer = player;
                            }
                        }
                    }

                    if (iMaxPlayer && iMaxPlayer.eatFlag >= 2) {
                        iMaxPlayer.trusteeNum += 1;
                        if (iMaxPlayer.trusteeNum >= iDelayNum) {
                            iGLog("-----checkNeedTrustee() waitEat iMaxPlayer.uid: " + iMaxPlayer.uid)
                            isPlayerCanTrue(table, iMaxPlayer);
                            TrusteePlayer(table, gamecode, iMaxPlayer);
                        }
                    }
                }
                break;
            case TableState.waitChange:
                {
                    iGLog("-----checkNeedTrustee() waitChange s");
                    for (var i = 0; i < uids.length; ++i) {
                        var player = table.players[uids[i]];
                        if (!player) { continue; }
                        if (player.mjState == TableState.waitChange) { //超过10秒 换牌，默认为托管
                            player.trusteeNum += 1;
                            if (player.trusteeNum >= iDelayNum) {
                                iGLog("-----checkNeedTrustee() waitChange player.uid: " + player.uid)
                                isPlayerCanTrue(table, player);
                                TrusteePlayer(table, gamecode, player);
                            }
                        }
                    }
                }
                break;
            case TableState.waitPut:
                {
                    iGLog("-----checkNeedTrustee() waitPut s");
                    for (var i = 0; i < uids.length; ++i) {
                        var player = table.players[uids[i]];
                        if (!player) { continue; }
                        if (player.uid == uids[tData.curPlayer]) { //超过10秒没出牌，默认为托管
                            player.trusteeNum += 1;
                            if (player.trusteeNum >= iDelayNum) {
                                iGLog("-----checkNeedTrustee() waitPut player.uid: " + player.uid)
                                isPlayerCanTrue(table, player);
                                TrusteePlayer(table, gamecode, player);
                            }
                            break; //每次只执行一个玩家的托管，等此玩家出过牌再走其他玩家，否则可能一下有很多家出牌
                        }
                    }
                }
                break;

            default:
                break;
        }
    }

    //托管流程
    function TrusteePlayer(table, gamecode, player) {
        var iGLog = GLog;

        if (table) {
            var tData = table.tData;
            var uids = tData.uids;
            if (!player) {
                return;
            }

            iGLog("---playerID:" + player.uid + "---启动托管程序---");
            iGLog("---tData.curPlayer:" + tData.curPlayer + "---tData.tState: " + tData.tState +
                "---player.uid: " + player.uid + "---tData.uids[tData.curPlayer]: " + tData.uids[tData.curPlayer] + "---");

            switch (tData.tState) {
                case TableState.waitChange:
                    {
                        iGLog("--- tData.tState == TableState.waitChange -----");
                        table.pGameCode.TrusteeMJChange(table, player);
                    }
                    break;
                case TableState.waitMiss:
                    {
                        iGLog("--- tData.tState == TableState.waitMiss -----");
                        table.pGameCode.TrusteeMJMiss(table, player);
                    }
                    break;
                case TableState.waitPut:
                    {
                        if (player.uid != tData.uids[tData.curPlayer]) { //只有curPlayer 才可以发牌
                            return;
                        }

                        // if (tData.lastPutPlayer == tData.curPlayer) {
                        //     var cards = 1;
                        //     iGLog("--waitPut- get cards:" + cards + "-----");
                        // } else {
                        //     iGLog("--waitPut- tData.lastPutPlayer != tData.curPlayer -----");
                        // }
                        if (1) {
                            var eatFlag = table.pGameCode.getSelfEatFlag(table, player, tData);
                            if (eatFlag <= pl.eatFlag) {
                                eatFlag = pl.eatFlag;
                            }

                            var iEatGangCard = table.pGameCode.getSelfCanGang(pl, table);
                            if (iEatGangCard != -100) { //-100是故意写的一个默认值
                                if (eatFlag < 4) {
                                    eatFlag = 4;
                                }
                            }

                            var isCanEat = false;
                            var isPass = false;
                            if (eatFlag >= 8) {
                                iGLog("AutoMJHu--->111");
                                table.pGameCode.TrusteeMJHu(table, player, eatFlag);
                            } else if (eatFlag >= 4) {
                                iGLog("AutoMJGang--->111");
                                if (iEatGangCard != -100) {
                                    table.pGameCode.TrusteeMJGang(table, player, eatFlag, iEatGangCard);
                                } else {
                                    table.pGameCode.TrusteeMJGang(table, player, eatFlag);
                                }
                            } else if (eatFlag >= 2) {
                                iGLog("AutoMJPeng--->111");
                                table.pGameCode.TrusteeMJPeng(table, player, eatFlag);
                            } else {
                                iGLog("AutoMJPut--->111");
                                table.pGameCode.TrusteeMJPut(table, player);
                            }
                        }
                    }
                    break;
                case TableState.waitEat:
                    {
                        var eatFlag = player.eatFlag;
                        iGLog("--- eatFlag =" + eatFlag + "---player.uid: " +
                            player.uid + " Next=" + tData.cardNext + " L=" + table.cards.length);

                        var isLast = (tData.cardNext == table.cards.length);

                        if (eatFlag >= 8) {
                            iGLog("TrusteeMJHu--->1");
                            table.pGameCode.TrusteeMJHu(table, player, eatFlag);
                        } else if (eatFlag >= 4) {
                            iGLog("TrusteeMJGang--->1");
                            if (isLast) { //是最后一张牌了
                                table.pGameCode.TrusteeMJPeng(table, player, eatFlag);
                            } else {
                                table.pGameCode.TrusteeMJGang(table, player, eatFlag);
                            }
                        } else if (eatFlag >= 2) {
                            iGLog("TrusteeMJPeng--->1");
                            table.pGameCode.TrusteeMJPeng(table, player, eatFlag);
                        }

                        // if (tData.lastPutPlayer == tData.curPlayer) {
                        //     var cards = 1;
                        //     iGLog("--waitEat- get cards:" + cards + "-----");
                        // } else {
                        //     iGLog("--waitEat- tData.lastPutPlayer != tData.curPlayer -----");
                        // }
                    }
                    break;

                case TableState.roundFinish:
                    {
                        iGLog("--- tData.tState == TableState.roundFinish -----");
                    }
                    break;

                default:
                    break;
            }
        }
    }


    /**
     * 
     * 
     * 
     * 
     * 
     * /
    /*重新获取玩家的手牌*/
    Table.prototype.MJPlayUpdateHand = function(pl, msg, session, next) {
        next(null, null);

        if (pl.mjState != TableState.waitPut) {
            GLog("wcx99_MJPlayUpdateHand 0");
            return;
        }

        var res = {};
        res.uid = pl.uid;
        res.mjhand = pl.mjhand;
        pl.notify("MJPlayUpdateHandOK", res);
    }
}