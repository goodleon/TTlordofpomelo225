module.exports = function(app, server, serverClass) {
    //var gameLog=[];function GLog(log){ app.FileWork(gameLog,__dirname+"/log.txt",log)}
    var gameLog = [];

    function GLog(log) {
        app.FileWork(gameLog, "/root/mjserver/log.txt", log)
    }

    var MsgType = {

        gameInvite: 1,
        systemMsg: 2
    }

    var wxpayCfg = {
        "com.happy.scmj15": { type: 1, num: 15, fee: 3000 },
        "com.happy.scmj60": { type: 1, num: 60, fee: 11800 },
        "com.happy.scmj150": { type: 1, num: 150, fee: 28800 },
        "com.happy.scmj320": { type: 1, num: 320, fee: 58800 },
        "com.happy.scmj72000": { type: 2, num: 72000, fee: 600 },
        "com.happy.scmj220000": { type: 2, num: 220000, fee: 1800 },
        "com.happy.scmj380000": { type: 2, num: 380000, fee: 3000 },
        "com.happy.scmj900000": { type: 2, num: 900000, fee: 6800 },
        "com.happy.scmj1750000": { type: 2, num: 1750000, fee: 12800 },
        "com.happy.scmj4150000": { type: 2, num: 4150000, fee: 28800 },
        "com.happy.hnyymj.wxdimond1": { type: 1, num: 1, fee: 100 }, //1元买1钻
        "com.happy.hnyymj.wxdimond2": { type: 1, num: 6, fee: 600 }, //6元买6钻
        "com.happy.hnyymj.wxdimond3": { type: 1, num: 30, fee: 3000 }, //30元买30钻
        "com.happy.hnyymj.wxdimond4": { type: 1, num: 50, fee: 5000 }, //50元买50钻
        "com.happy.hnyymj.wxdimond5": { type: 1, num: 100, fee: 10000 } //100元买100钻
    }

    var iosiapCfg = {
        "com.happy.scmj15": { type: 1, num: 15, fee: 3000 },
        "com.happy.scmj60": { type: 1, num: 60, fee: 11800 },
        "com.happy.scmj150": { type: 1, num: 150, fee: 28800 },
        "com.happy.scmj320": { type: 1, num: 320, fee: 58800 },
        "com.happy.scmj72000": { type: 2, num: 72000, fee: 600 },
        "com.happy.scmj220000": { type: 2, num: 220000, fee: 1800 },
        "com.happy.scmj380000": { type: 2, num: 380000, fee: 3000 },
        "com.happy.scmj900000": { type: 2, num: 900000, fee: 6800 },
        "com.happy.scmj1750000": { type: 2, num: 1750000, fee: 12800 },
        "com.happy.scmj4150000": { type: 2, num: 4150000, fee: 28800 }
    }



    var lastLoginLogDay = 0;
    var CoinRoomCfg = [];
    var coinCfgCount = 2500;
    var coinCfgLimit = 2000;
    var signinRewardType = 2;
    var signinRewardValue = 2000;
    var signinReward = [];
    var itemTable = app.item;
    var crypto = require('crypto');
    var passKey = "Am36p0RaxcZxNuPtHzUtPCL9";
    var xml2js = require('xml2js');
    var parser = new xml2js.Parser({ trim: true, explicitArray: false, explicitRoot: false });
    //var builder = new xml2js.Builder()

    function doLoginLog(pl, type) {
        var loginLog = {};
        var day = new Date();
        day = (day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate()) + "";

        loginLog.uid = pl.pinfo.uid;
        loginLog.type = type; //login, logout, logoutForce
        loginLog.ip = pl.pinfo.remoteIP;
        loginLog.time = Date.now();
        app.mdb.insert('loginLog' + day, loginLog, function() {
            if (day != lastLoginLogDay) {
                lastLoginLogDay = day;
                app.mdb.db.collection('loginLog' + day).createIndex({ "uid": 1 }, { "background": 1 });
                app.mdb.db.collection('loginLog' + day).createIndex({ "type": 1 }, { "background": 1 });
            }
        });
    }

    var freeAct = {};
    var tran_id_set = {};

    function checkFreeAct() {
        if (!freeAct.beginDay) {
            return false;
        }

        var day = new Date();
        var hm = day.getHours() * 100 + day.getMinutes();
        day = day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate();

        if (day < freeAct.beginDay || day > freeAct.endDay) {
            return false;
        }

        if (hm < freeAct.beginHm || hm > freeAct.endHm) {
            return false;
        }

        return true;
    }

    if (app.serverType == "pkplayer" && !server.httpServer) {
        //delete require.cache[require.resolve('./http/httpServer.js')];
        server.httpServer = new require("./http/httpServer.js")(app, server);
    }

    if (app.serverType == "pkplayer" && app.getMaster().redis) {
        delete require.cache[require.resolve("./RedisClient")];
        require("./RedisClient")(app, server, serverClass);

        //循环取值
        setInterval(function() {
            if (server.redisClient) {
                server.redisClient.get('GetCoinCount', function(err, res) {
                    if (!err) {
                        var para = JSON.parse(res);
                        coinCfgCount = parseInt(para["count"]);
                        coinCfgLimit = parseInt(para["limit"]);
                    }
                });

                server.redisClient.lrange('SigninCfg', 0, -1, function(err, res) {
                    if (!err) {
                        signinReward = eval("([" + res + "])");
                    }
                });

                server.redisClient.lrange('CoinRoomCfg', 0, -1, function(err, res) {
                    if (!err) {
                        CoinRoomCfg = eval("([" + res + "])");
                    }
                });

                server.redisClient.get('wxpay', function(err, res) {
                    if (!err) {
                        wxpayCfg = JSON.parse(res);
                    }
                });

                server.redisClient.get('iosiap', function(err, res) {
                    if (!err) {
                        iosiapCfg = JSON.parse(res);
                    }
                });
            }
        }, 30000);
    }

    server.webFunc = {
        EndVipTable: function(req, res) {
            var msg = req.body;
            var data = {};

            if (!msg.uids || !msg.tableid) {
                res.json(1);
                return;
            }
            //console.log("end vip table http : " + JSON.stringify(msg));
            if (msg.roomtype) { // 金币场需要，如果roomtype为1 说明是金币场结束
                data.roomtype = msg.roomtype;
            }
            data.uids = msg.uids;
            data.tableid = msg.tableid;

            server.endVipTable(data, function(er, rtn) {
                if (er) {
                    res.json('EndVipTable error');
                } else if (!rtn) {
                    res.json('EndVipTable success');
                } else {
                    res.json(rtn);
                }
            });
        },
        SetFreeAct: function(req, res) {
            var msg = req.body;
            var type = msg.type;

            if (type == 'del') {
                freeAct = {};
                res.json(0);
                return;
            }

            if (type == 'set') {
                freeAct.beginDay = msg.beginDay;
                freeAct.endDay = msg.endDay;
                freeAct.beginHm = msg.beginHm;
                freeAct.endHm = msg.endHm;
                res.json(0);
                return;
            }

            res.json(1);
        },
        RecommendAdd: function(req, res) {
            var uid = req.body.byId;
            var addId = req.body.uid;
            var playNum = req.body.playNum;
            var head = req.body.headimgurl;
            var name = req.body.nickname;
            var serverId = app.GetServerBuyUid("pkplayer", uid);

            if (serverId) {
                serverId = serverId.id;

                if (serverId != app.serverId) {
                    res.json({ er: 'error serverId' });
                    return;
                }

                RecommendAdd('majiang', uid, addId, playNum, head, name, function(rtn) {
                    //res.json(rtn);
                });

                return;
            }
            res.json({ er: 'error byId' });
        },
        UpdatePlayer: function(req, res) {
            var msg = req.body;
            var uid = msg.uid;
            var update = msg.update;
            var serverId = app.GetServerBuyUid("pkplayer", uid);
            if (serverId) {
                serverId = serverId.id;
                if (serverId == app.serverId) {
                    UpdatePlayer("majiang", uid, update, function(er, rtn) {
                        res.json(rtn);
                    });
                    return;
                } else {
                    //console.info(serverId+ " != "+app.serverId);
                }
            }
            res.end();
        },
        ReloadCode: function(req, res) {
            if (server.ReloadCode) {
                server.ReloadCode();
                res.json("reload ok");
            } else res.json("reload fail");
        },
        ReloadAdmin: function(req, res) {
            var moduleId = "zjhadmin";
            var cso = app.isMaster() ? app.components['__master__'].master.masterConsole :
                app.components['__monitor__'].monitor.monitorConsole;
            delete require.cache[require.resolve('../../admin/zjhAdmin')];
            cso.disable(moduleId);
            cso.register(moduleId, require('../../admin/zjhAdmin')({ app: app }));
            cso.enable(moduleId);
            res.json("ReloadAdmin ok");
        },
        GetAudit: function(req, res) //审计
            {
                var report = { id: app.serverId, online: 0, vipTable: 0 };
                var vipTable = server.vipTable;
                if (vipTable) report.vipTable = Object.keys(vipTable).length;
                var online = server.online;
                if (online)
                    for (var uid in online) {
                        var pl = online[uid];

                        if (pl.fid) {
                            report.online++;

                            var resVersion = pl.pinfo.resVersion;

                            if (!resVersion) resVersion = '0.0';

                            if (!report[resVersion]) {
                                report[resVersion] = 1;
                            } else {
                                report[resVersion]++;
                            }
                        }
                    }
                res.json(report);
            },
        forceLogout: function(req, res) {
            var uid = req.body.uid;
            if (uid) {
                doLogoutForce(uid);
                res.json("forceLogout ok");
            } else res.json("forceLogout fail");
        },


        //added by hexy
        Enroll: function(req, res) //报名
            {},

        //兑换
        Exchange: function(req, res) {},

        //领奖
        LoginReward: function(req, res) {},

        //领金币：
        GetCoin: function(req, res) {},

        WxPay: function(req, res) {
            var msg = req.body;
            var uid = msg.uid;

            var serverId = app.GetServerBuyUid("pkplayer", uid);
            if (serverId) {
                serverId = serverId.id;
                app.rpc.pkplayer.Rpc.WxinPay(serverId, msg, function(er, rtn) {
                    if (er) {
                        res.json('error');
                    } else {
                        res.json('success');
                    }
                });
            }
        }
    }


    //load game content
    var fs = require('fs');
    var gameInfo = {};
    if (!server.games) {
        server.games = {};
    }
    var games = server.games;
    (function() {
        //var gamesPath=__dirname+"/games/";
        var gamesPath = __dirname + "/../pkroom/games/";

        var lst = fs.readdirSync(gamesPath);
        for (var i = 0; i < lst.length; i++) {
            if (fs.statSync(gamesPath + lst[i]).isDirectory()) {
                var gameid = lst[i];
                delete require.cache[require.resolve("../pkroom/games/" + gameid + "/GameCfg")];
                var gameCfg = require("../pkroom/games/" + gameid + "/GameCfg")(app, server, gameid);
                games[gameid] = gameCfg;
                gameInfo[gameid] = gameCfg.info;
            }
        }
    })();
    serverClass.prototype.GameRpc = function(gameid, cmd, msg, next) {
        console.info("--pkplayerCode--serverClass.prototype.GameRpc" + JSON.stringify(msg));

        var game = games[gameid];
        if (game && game[cmd]) {
            game[cmd](msg);
        }
        next(null, null);
    }


    serverClass.prototype.afterStartServer = function() {
        console.info("--pkplayerCode--serverClass.prototype.afterStartServer");

        if (app.serverType == "pkplayer")
            for (gid in games) {
                var game = games[gid];
                if (game.afterStartServer) game.afterStartServer();
            }

        if (server.redisClient) {
            server.redisClient.get('GetCoinCount', function(err, res) {
                if (!err) {
                    var para = JSON.parse(res);
                    coinCfgCount = parseInt(para["count"]);
                    coinCfgLimit = parseInt(para["limit"]);
                }
            });

            server.redisClient.lrange('SigninCfg', 0, -1, function(err, res) {
                if (!err) {
                    signinReward = eval("([" + res + "])");
                }
            });

            server.redisClient.lrange('CoinRoomCfg', 0, -1, function(err, res) {
                if (!err) {
                    CoinRoomCfg = eval("([" + res + "])");
                }
            });
        }


    }


    serverClass.prototype.GetGameRooms = function(msg, session, next) {
        var game = games[msg.gameid];
        if (game) {
            next(null, { result: Result.Success, rooms: game.rooms });
            return;
        }
        next(null, { result: Result.Fail });
    }

    serverClass.prototype.GetGameItems = function(msg, session, next) {
        var game = games[msg.gameid];
        if (game) {
            next(null, { result: Result.Success, items: game.items });
            return;
        }
        next(null, { result: Result.Fail });
    }
    serverClass.prototype.GetGameRoles = function(msg, session, next) {
        var game = games[msg.gameid];
        if (game) {
            next(null, { result: Result.Success, roles: game.roles });
            return;
        }
        next(null, { result: Result.Fail });
    }
    serverClass.prototype.GameCfgField = function(msg, session, next) {
        var game = games[msg.gameid];
        if (game) {
            var rtn = { result: Result.Success };
            for (var i = 0; i < msg.fields.length; i++) {
                var fd = msg.fields[i];
                rtn[fd] = game[fd];
            }
            next(null, rtn);
            return;
        }
        next(null, { result: Result.Fail });
    }



    var https = require('https');

    function HttpsReq(options, data, ondata, onerror) {
        var req = https.request(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', ondata);
            res.on('error', onerror);
        });
        req.write(data);
        req.end();
    }

    //verify and save result to db
    var iosHis = {};

    function VerifyIosIap(msg, iosiap) {
        var receiptEnvelope = { "receipt-data": msg.transactionReceipt };
        var receiptEnvelopeStr = JSON.stringify(receiptEnvelope);
        var options = {
            host: "buy.itunes.apple.com",
            port: 443,
            path: '/verifyReceipt',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(receiptEnvelopeStr)
            }
        };
        var isSandBox = false;
        var ferr = function(err) // https error
            {
                SetTimeout(function() {
                    VerifyIosIap(msg, iosiap);
                }, 10000);
            }
        var fdata = function(data) {
            var rtn = JSON.parse(data);
            if (rtn.status == 21007) //test environment sent to production environment
            {
                isSandBox = true;
                options.host = "sandbox.itunes.apple.com";
                HttpsReq(options, receiptEnvelopeStr, fdata, ferr);
            } else if (rtn.status == 0) {
                var isTest = !(options.host == "buy.itunes.apple.com");
                // 1 dpk1 bjk1 => 1
                var in_app = rtn.receipt.in_app;
                if (in_app.length > 0) {
                    var iap = in_app[0];
                    var proid = iap.product_id;
                    var tid = iap.transaction_id;
                    if (!iosHis[tid]) {
                        var amount = iosiap[proid].num;
                        var type = iosiap[proid].type;
                        if (amount > 0) {
                            iosHis[tid] = in_app;
                            in_app.uid = msg.uid;
                            in_app.amount = amount;
                            in_app.addTime = Date.now();
                            //add ios iap log to db

                            //end ios iap log

                            var day = new Date();
                            day = (day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate()) + "";
                            var moneyLog = {};
                            moneyLog.uid = msg.uid;
                            moneyLog.buyNum = amount;
                            moneyLog.buyMoney = iosiap[proid].fee;
                            moneyLog.buyNote = '苹果充值';
                            moneyLog.buyType = 0;
                            moneyLog.byMid = iap.transaction_id;
                            moneyLog.byName = iap.product_id;
                            moneyLog.adminLevel = 0;
                            moneyLog.money = 0;
                            moneyLog.buyTime = new Date();

                            if (type == 1) {
                                app.mdb.insert('userMoney' + day, moneyLog, function() {});

                                UpdatePlayer("majiang", msg.uid, { $inc: { money: amount } }, function() {});
                            } else if (type == 2) {
                                app.mdb.insert('userCoin' + day, moneyLog, function() {});

                                UpdatePlayer("majiang", msg.uid, { $inc: { coin: amount } }, function() {});
                            }
                        }
                    }
                    var pl = online[msg.uid];
                    if (pl) pl.notify("iosiapFinish", { transaction_id: tid, product_id: proid });
                }
                //case 0: success
            } else {
                //case 21005: The receipt server is not currently available.
                //case 21000: The App Store could not read the JSON object you provided
                //case 21002: The data in the receipt-data property was malformed or missing
                //case 21003: The receipt could not be authenticated
                //case 21004: The shared secret you provided does not match the shared secret on file for your account
                //case 21006: This receipt is valid but the subscription has expired.
                //case 21008: production environment sent to the test environment
            }
        }
        HttpsReq(options, receiptEnvelopeStr, fdata, ferr);
    }

    //only save to db
    serverClass.prototype.iosiap = function(msg, session, next) {
        var pl = SessionPlayer(session);

        if (!pl) {
            next(null, { result: Result.playerNotFound });
            return
        }

        pl.run("iosiap", function() {
            next = pl.nextWrap(next);
            //var appEnd = pl.appEnd;
            //var cfg = games[appEnd];
            msg.uid = pl.uid;
            if (iosiapCfg) {
                VerifyIosIap(msg, iosiapCfg);
            }
            next(null, { result: Result.Success });
        });

    }

    //微信支付
    serverClass.prototype.WxinPay = function(msg, next) {
        console.log("serverClass.prototype.WxinPay  begin  msg uid =" + msg.uid + ", msg =" + JSON.stringify(msg));
        //console.log(Object.keys(online));
        if (typeof next != 'function') {
            return;
        }
        var pl = online[msg.uid];
        if (!pl) {
            next(1, { result: Result.playerNotFound });
            return;
        }

        //var appEnd = pl.appEnd;
        //var cfg = games[appEnd];
        if (wxpayCfg) {
            var transaction_id = msg.transactionid;
            if (!tran_id_set[transaction_id]) {
                var prodid = msg.produtid;
                var amount = wxpayCfg[prodid].num;
                var type = wxpayCfg[prodid].type;

                console.log("WxinPay  amount = " + amount + ", type =" + type);
                if (amount > 0) {
                    var day = new Date();
                    day = (day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate()) + "";
                    var moneyLog = {};
                    moneyLog.uid = msg.uid;
                    moneyLog.buyNum = amount;
                    moneyLog.buyMoney = wxpayCfg[prodid].fee;
                    moneyLog.buyNote = '微信充值';
                    moneyLog.buyType = 0;
                    moneyLog.byName = prodid;
                    moneyLog.transaction_id = transaction_id;
                    moneyLog.buyTime = new Date();

                    if (type == 1) {
                        app.mdb.insert('userMoney' + day, moneyLog, function() {});

                        UpdatePlayer("majiang", parseInt(msg.uid), { $inc: { money: amount } }, function(err, rtn) {});
                    } else if (type == 2) {
                        app.mdb.insert('userCoin' + day, moneyLog, function() {});

                        UpdatePlayer("majiang", parseInt(msg.uid), { $inc: { coin: amount } }, function(err, rtn) {});
                    }

                    AddItem(msg.uid, amount);

                    tran_id_set[transaction_id] = true;
                }
                pl.notify("wxpayfinish", { transaction_id: transaction_id, product_id: prodid });
                console.log("wxpay ok  uid =" + msg.uid + ",tran id =" + transaction_id);
                next(null, { result: Result.Success });
                return;
            } else {
                console.log("WxinPay already payed  tranid = " + transaction_id + ",uid = " + msg.uid);
                next(null, { result: Result.OrderAlreadyUsed });
                return;
            }
        }

        console.log("serverClass.prototype.WxinPay  error para  msg uid =" + msg.uid + ", tranid =" + msg.transactionid);
        next(1, { result: Result.paraError });
    }

    //only save to db
    serverClass.prototype.googleplayiap = function(msg, session, next) {
        var pl = SessionPlayer(session);
        if (!pl) {
            next(null, { result: Result.playerNotFound });
            return;
        }


        pl.run("gip", function() {
            next = pl.nextWrap(next);

            function CheckOrder(orders) {
                var tokens = [];
                var totalAdd = 0;
                for (var i = 0; i < orders.length; i++) {
                    var odr = orders[i];
                    var addMoney = appCfgs.iap.google[odr.productId];
                    if (addMoney) {
                        totalAdd += addMoney;
                    }
                    tokens.push(odr.purchaseToken);
                }
                var inc = { money: totalAdd };

                var buyMoneyTotal = pl.pinfo.task.buyMoneyTotal || 0;
                if (buyMoneyTotal == 0) {
                    inc["task.buyMoneyFirst"] = totalAdd;
                }
                inc["task.buyMoneyTotal"] = totalAdd;

                dapi.Update(pl.pinfo, inc, "$inc");
                pl.notify("$inc", inc);
                pl.notify("iapConsume", { ids: tokens });
            }

            //already buy
            if (msg.INAPP_PURCHASE_DATA_LIST) {
                var idList = msg.INAPP_PURCHASE_ITEM_LIST;
                var oList = msg.INAPP_PURCHASE_DATA_LIST;
                var sList = msg.INAPP_DATA_SIGNATURE_LIST;
                for (var i = 0; i < idList.length; i++) {
                    var order = oList[i];
                    var sig = sList[i];
                    order.signature = sig;
                }
                CheckOrder(oList);
            }
            //new buy
            else if (msg.INAPP_PURCHASE_DATA) {
                var order = msg.INAPP_PURCHASE_DATA;
                order.signature = msg.INAPP_DATA_SIGNATURE;
                CheckOrder([order]);
            }


            next(null, null);
        });

    }


    //玩家根据uid散列到不同的pkplayer
    //tableid在不同的pkserver生成不冲突,tableid散列到roomserver
    //玩家根据相同的tableid到同一个roomserver
    function GetRoomServer(pl, game, gameid, roomid, tableid) {
        var roomServers = app.GetCfgServers('pkroom');
        var rs = roomServers[tableid % roomServers.length];

        if (rs) {
            return rs.id;
        } else {
            return false;
        }
    }

    if (!server.vipTable) {
        server.vipTable = {};
        server.createParas = {}; //短暂存储
    }
    server.vipIdx = -1;

    function NewVipTable(pl, roundCfg, msg, isHttp) //不同pkplayer的vipTableid不能冲突
    {
        delete msg.__route__;

        var pkservers = app.GetCfgServers(app.serverType);
        if (server.vipIdx < 0) {
            var idx = 0;
            for (idx = 0; idx < pkservers.length; idx++)
                if (pkservers[idx].id == app.serverId) break;
            server.vipIdx = idx;
        }
        var tableid7 = app.getMaster().tableid7;
        var tryNum = 3;

        while (tryNum > 0) {
            tryNum--;

            var vipid, strId, id1, id2, id3;
            if (tableid7) {
                vipid = 1000000 + Math.floor(8999999 * Math.random());
                vipid = vipid - (vipid % pkservers.length) + server.vipIdx;
                strId = vipid + "";

                id1 = strId.substr(0, 2);
                id2 = strId.substr(2, 3);
                id3 = strId.substr(5, 2);
                strId = id1 + id3 + id2;
                vipid = parseInt(strId);
            } else {
                vipid = 100000 + Math.floor(899999 * Math.random());
                vipid = vipid - (vipid % pkservers.length) + server.vipIdx;
                strId = vipid + "";
                id1 = strId.substr(0, 1);
                id2 = strId.substr(1, 3);
                id3 = strId.substr(4, 2);
                strId = id1 + id3 + id2;
                vipid = parseInt(strId);
            }

            if (!server.vipTable[vipid]) {
                msg.round = roundCfg.round;
                msg.owner = pl.uid; //房主

                if (checkFreeAct()) {
                    msg.money = 0;
                } else {
                    msg.money = roundCfg.money;
                }

                msg.vipTable = vipid;
                server.vipTable[vipid] = msg;

                server.vipTable[vipid].createtime = new Date().getTime();

                if (isHttp) {
                    var rmServer = app.GetServerBuyUid("pkroom", vipid);
                    if (rmServer.httpPort && rmServer.httpHost) //客户端之间连到房间服务器,高防不方便配置
                    {
                        msg.host = rmServer.httpHost;
                        msg.clientPort = rmServer.httpPort;
                    } else msg.pkroom = rmServer.id; //客户端通过pkcon连接到房间服务器
                }

                console.log("" + app.serverId + "new tableid  id = " + vipid + ",uid = " + pl.uid + "viptable:" + JSON.stringify(server.vipTable[vipid]));
                return vipid;
            }
        }
        return 0;
    }


    if (!server.online) server.online = {};
    else {
        for (var uid in server.online) {
            var pl = server.online[uid];
            if (pl.ingame.gameid == null) pl.vipTable = 0;
        }
    }
    var online = server.online;
    var Result = require('../Result');

    //info from login server, info from game server , current front server , current room server , dirty field to save, state
    function PlayerOnline(msg, //client login para
        pinfo, //from login server
        pdata) //from game server
    {
        online[pinfo.uid] = this;
        for (var pty in pinfo) //merge to pdata
        {
            if (pty != 'fid' && pty != 'sid') pdata[pty] = pinfo[pty];
        }
        var appid = msg.app.appid;
        var appEnd = appid.substr(appid.lastIndexOf(".") + 1);
        this.appid = appid;
        this.appEnd = pdata.appEnd = appEnd;
        var gameCfg = games[appEnd];
        if (!pdata.appid) //appid 和 gameid 对应
        {
            if (gameCfg) {
                var initData = gameCfg.initData;
                var upPara = {};
                for (var field in initData) {
                    upPara[field] = app.DeapClone(initData[field]);
                }
                upPara.appid = appid;
                dapi.Update(pdata, upPara);
            } else console.info(appEnd + " is not gameid");
        }

        //database info
        this.pinfo = pdata;
        this.uid = pinfo.uid;

        //online info
        this.fid = null;
        this.sid = null;
        this.ingame = {
                /*
                 gameid:"",
                 roomid:"",
                 server:""
                 */
            },
            this.action = [];
        this.actionName = [];
        this.vipTable = 0;
        this.dirty = {};

    }

    PlayerOnline.prototype = {
        canJoinGame: function() {
            return true;
            //return !this.ingame.roomid;
        },
        canLeaveGame: function() {
            return !!this.ingame.gameid;
        },
        notify: function(route, msg) {
            if (this.fid) app.channelService.pushMessageByUids(route, msg, [{ uid: this.uid, sid: this.fid }]);
        },
        run: function(name, act) {
            if (this.action.length == 3) {
                app.syserr("runAction", this.uid + " " + this.actionName);
                var uid = this.uid;
                setTimeout(function() {
                    doLogoutForce(uid);
                }, 1000);
            }

            this.actionName.push(name);
            this.action.push(act); //console.log(this.uid+" action "+this.action.length);
            if (this.action.length == 1) {
                act();
            }
        },
        nextWrap: function(next) {
            var ol = this;
            var action = ol.action;
            var actionName = ol.actionName;
            return function(er, rtn) {
                next(er, rtn);
                action.splice(0, 1);
                actionName.splice(0, 1);
                if (action.length > 0) action[0]();
                else if (ol.canRemove()) {
                    delete online[ol.uid];
                }
            }
        },
        Update: function(val, op) {
            dapi.Update(this.pinfo, val, op)
        },
        canRemove: function() {
            return false;
            return this.fid == null //不在线
                &&
                this.vipTable == 0 //没有房间
                &&
                (!this.ingame.gameid) //没有在游戏中
                &&
                Object.keys(this.dirty).length == 0; //数据已经保存
        }

    }

    function SessionPlayer(session) {
        var pl = online[session.uid];
        if (pl && pl.fid == session.frontendId && pl.sid == session.id) return pl;
        return null;
    }

    var dapi = {
        loadPlayerOnline: function(loginPara, loginInfo, next) {
            var uid = loginInfo.uid;
            //var appid= loginPara.app.appid;
            //var appEnd=appid.substr(appid.lastIndexOf(".")+1);
            //var gameCfg=games[appEnd];
            //try memory
            if (!uid || typeof uid != 'number') {
                //防止用户直接pkplayer.doLogin()呼叫
                next(null, null);
                return;
            }
            var pdata = online[uid];
            if (pdata) {
                next(null, pdata);
                return;
            }
            //else if(!gameCfg) {next(null,null);return;}

            app.mdb.findOrCreate("majiang", { _id: uid }, { _id: uid, uid: uid }, null,
                function(er, row) {
                    pdata = online[uid];
                    if (pdata) next(null, pdata); //try memory again
                    else if (row) {
                        next(null, new PlayerOnline(loginPara, loginInfo, row));
                    } else {
                        next(null, null);
                        //console.info(er+" "+row);
                    }
                });
        },

        Update: function(pl, val, op) {
            if (!op) op = '$set';
            app.mdb.upMemObj(pl, val, op);
            app.mdb.update("majiang", { _id: pl.uid }, val, op);
        }
    }

    var appCfgs = {
        games: {
            snake: ["snake"],
            matchbattle: ["matchbattle"]
        },
        iap: {
            google: {
                "android.test.purchased": 100
            },
            ios: {
                "snake1": 200

            }
        }
    }


    function RecommendAdd(appEnd, uid, addId, playNum, head, name, next) {
        var masterCfg = app.getMaster();
        var actCfg = masterCfg.actServer;
        //console.info('RecommendAdd serverClass  ' + JSON.stringify({uid:uid, addId:addId, playNum:playNum, head:head, name:name}));
        if (!actCfg) {
            next({ result: Result.Fail, er: 'activity not open' });
            return;
        }

        var loginPara = { app: { appid: "." + appEnd } };
        var loginInfo = { uid: uid };

        dapi.loadPlayerOnline(loginPara, loginInfo, function(er, pl) {
            if (!pl) {
                next({ result: Result.Fail, er: 'can not find player : ' + uid });
                return;
            }

            if (!pl.pinfo.recommendData) {
                pl.pinfo.recommendData = {};
                pl.pinfo.recommendData.players = {};
                pl.pinfo.recommendData.rewards = [];
            }

            if (pl.pinfo.recommendData.players[addId]) {
                next({ result: Result.Fail, er: addId + ' already in list' });
                return;
            }

            var host = masterCfg.host;
            var port = actCfg.port;

            if (actCfg.num && actCfg.num > 1) {
                port += uid % actCfg.num;
            }

            var para = {};
            para.count = Object.keys(pl.pinfo.recommendData.players).length;
            para.playNum = playNum;

            //console.info('connect to actServer ' + host + ':' + port);
            app.httpClient.postJson('recommend/addRecommend', para, port, host, function(er, data) {
                if (er) {
                    next({ result: Result.Fail, er: er });
                    return;
                }

                if (data.er) {
                    next({ result: Result.Fail, er: data.er });
                    return;
                }

                var maxNum = data.maxNum; //添加时需要再次验证，避免同时发送的请求造成超过上限

                if (Object.keys(pl.pinfo.recommendData.players).length >= maxNum) {
                    next({ result: Result.Fail, er: 'gt maxNum' });
                    return;
                }

                pl.pinfo.recommendData.players[addId] = {};
                pl.pinfo.recommendData.players[addId].headimgurl = head;
                pl.pinfo.recommendData.players[addId].nickname = name;

                pl.run("UpdatePlayer", function() {
                    next = pl.nextWrap(next);
                    var updateInfo = { recommendData: pl.pinfo.recommendData };
                    dapi.Update(pl.pinfo, updateInfo, '$set');

                    pl.notify("updateInfo", updateInfo);
                    next({ result: Result.Success });
                });
            });
        });
    }


    function UpdatePlayer(appEnd, uid, batch, next) {
        //console.info("--pkplayerCode--serverClass.prototype.UpdatePlayer" + JSON.stringify(uid));

        var loginPara = { app: { appid: "." + appEnd } };
        var loginInfo = { uid: uid };
        dapi.loadPlayerOnline(loginPara, loginInfo, function(er, pl) {
            if (!pl) {
                next(Result.paraError, { result: "User null" });
            } else {
                pl.run("UpdatePlayer", function() {
                    next = pl.nextWrap(next);
                    var updateInfo = {};
                    for (var op in batch) {
                        var ptys = batch[op];
                        dapi.Update(pl.pinfo, ptys, op);
                        for (var pty in ptys) {
                            updateInfo[pty] = pl.pinfo[pty];
                        }
                    }
                    pl.notify("updateInfo", updateInfo);
                    next(null, pl.pinfo);
                });
            }
        });
    }

    serverClass.prototype.doLogin = function(msg, pinfo /*info from login server*/ , next) {
        dapi.loadPlayerOnline(msg, pinfo, function(er, pOnline) {
            if (!pOnline) {
                next(null, { result: Result.Fail });
            } else {
                pOnline.run("doLogin", function() {
                    next = pOnline.nextWrap(next);
                    //kick old
                    if (pOnline.sid != null && pOnline.fid != null) {
                        app.backendSessionService.kickBySid(pOnline.fid, pOnline.sid, function() {});
                        //console.error("kick  "+pOnline.sid+"@"+pOnline.fid+" "+pOnline.uid+" by "+pinfo.sid+"@"+pinfo.fid);
                    }

                    if ("banStartTime" in pOnline.pinfo && "banEndTime" in pOnline.pinfo) {
                        var banTime = pOnline.pinfo.banEndTime - new Date().getTime();
                        if (banTime > 0 || (pOnline.pinfo.banStartTime && !pOnline.pinfo.banEndTime)) {
                            next(null, { result: Result.ban, data: banTime });
                            return;
                        }
                    }


                    pOnline.sid = pinfo.sid;
                    pOnline.fid = pinfo.fid;

                    var canPlay = {};
                    var appid = msg.app.appid;
                    appid = appid.substr(appid.lastIndexOf(".") + 1);
                    var ids = appCfgs.games[appid];
                    if (ids)
                        for (var i = 0; i < ids.length; i++) {
                            canPlay[ids[i]] = gameInfo[ids[i]];
                        }
                    else canPlay = gameInfo;

                    pOnline.pinfo.nickname = msg.nickname;
                    pOnline.pinfo.headimgurl = msg.headimgurl;
                    pOnline.pinfo.resVersion = msg.resVersion;
                    pOnline.pinfo.remoteIP = msg.remoteIP;
                    pOnline.pinfo.geogData = msg.geogData;
                    pOnline.appEnd = appid;
                    pOnline.pinfo.appEnd = appid;

                    if (!pOnline.pinfo.ukey) {
                        var ukey = generateUserKey(pOnline);
                        pOnline.pinfo.ukey = ukey;
                    }

                    var rtn = {
                        result: Result.Success,
                        pinfo: pOnline.pinfo,
                        gameInfo: canPlay,
                        vipTable: pOnline.vipTable,
                        time: Math.floor(new Date().getTime() / 1000)
                    };

                    var gameCfg = games[pOnline.appEnd];
                    if (gameCfg && gameCfg.onPlayerLogin) {
                        gameCfg.onPlayerLogin(pOnline);
                    }

                    if (ids && ids.length == 1) {
                        rtn.rooms = {}
                        rtn.rooms[ids[0]] = games[ids[0]].rooms;
                    }

                    if (pOnline.ingame.gameid) {
                        rtn.ingame = pOnline.ingame;
                        if (rtn.ingame.roomid) rtn.roomInfo = games[rtn.ingame.gameid].rooms[rtn.ingame.roomid];
                    }

                    doLoginLog(pOnline, 'doLogin');

                    next(null, rtn);

                    /*

                     var roomServers=app.getServersByType("pkroom");
                     for(var i=0;i<roomServers.length;i++)
                     {
                     var uid=pOnline.uid; var on={}; on[uid]=true;
                     app.rpc.pkroom.Rpc.offinePlayers(roomServers[i].id,on,{},function(){});
                     }
                     */

                });


            }
        });
    };

    serverClass.prototype.JoinVipTable = function(msg, next) {
        //console.info("--pkplayerCode--serverClass.prototype.JoinVipTable" + JSON.stringify(msg));

        if (typeof next != 'function') {
            //直接通过pkplayer.JoinVipTable呼叫，直接失败
            return;
        }

        var loginPara = { app: { appid: "." + msg.gameid } };
        var loginInfo = { uid: msg.uid };
        dapi.loadPlayerOnline(loginPara, loginInfo, function(er, pl) {
            if (!pl) next(null, { result: Result.playerNotFound });
            else {
                if (pl.vipTable == 0) {
                    pl.vipTable = msg.tableid;
                } else if (msg.tableid == 0) {
                    if (pl.vipTable > 0) {
                        var tb = server.vipTable[pl.vipTable];
                        if (tb && tb.owner == msg.uid) {
                            var delid = pl.vipTable;
                            setTimeout(function() {
                                delete server.vipTable[delid];
                                //console.info("http del "+delid);
                            }, 60000);
                        }
                    }
                    pl.vipTable = msg.tableid;
                }
                next(null, {
                    result: pl.vipTable > 0 ? Result.Success : Result.Fail,
                    vipTable: pl.vipTable,
                    money: pl.pinfo.money
                });
            }
        });
    }

    serverClass.prototype.FindVipTable = function(msg, next) {
        //console.info("--pkplayerCode--serverClass.prototype.FindVipTable" + JSON.stringify(msg));

        if (typeof next != 'function') {
            //防止报错
            return;
        }

        var rtn = server.vipTable[msg.vipTable];
        next(null, rtn);
    }

    serverClass.prototype.CreateVipTable = function(msg, session, next) {


            //停止创建房间
            //next(null,{result:1}); return;
            //console.info(JSON.stringify(msg));

            if (session.isHttp) {
                //console.info(app.serverId+" CreateVipTable "+JSON.stringify([msg,session]));
                var loginPara = { app: { appid: "." + msg.gameid } };
                var loginInfo = { uid: msg.uid };
                dapi.loadPlayerOnline(loginPara, loginInfo, function(er, pl) {
                    if (!pl) next(null, { result: Result.playerNotFound });
                    else {
                        if (!msg.gameid) msg.gameid = pl.appEnd;
                        var game = games[msg.gameid];
                        var viptable = game.viptable;
                        var roundCfg = viptable[msg.round];
                        if (!roundCfg || (!checkFreeAct() && pl.vipTable == 0 && pl.pinfo.money < roundCfg.money)) {
                            next(null, { result: Result.Fail });
                            return;
                        }

                        if (pl.vipTable == 0) {
                            pl.vipTable = NewVipTable(pl, roundCfg, msg, true);
                            //console.log("Create Vip Tb ok  tb id = " + pl.vipTable + ",uid = " + pl.uid);
                        }
                        next(null, { result: pl.vipTable > 0 ? Result.Success : Result.Fail, vipTable: pl.vipTable });
                    }
                });
            } else {
                var pl = SessionPlayer(session);
                if (!pl) {
                    next(null, { result: Result.playerNotFound });
                    return;
                }
                console.info("--pkplayerCode--serverClass.prototype.CreateVipTable" + JSON.stringify(msg) + ", uid = " + pl.uid);
                if (!msg.gameid) msg.gameid = pl.appEnd;
                var game = games[msg.gameid];

                if (!game) {
                    next(null, { result: Result.Fail });
                    return;
                }

                if (game.minVersion && versionCompare(game.minVersion, pl.pinfo.resVersion)) {
                    next(null, { result: Result.minVersion, version: pl.pinfo.resVersion, minVersion: game.minVersion });
                } else {
                    pl.run("CreateVipTable", function() {
                        next = pl.nextWrap(next);
                        var viptable = game.viptable;
                        var roundCfg = viptable[msg.round];
                        if (!roundCfg || (!checkFreeAct() && pl.vipTable == 0 && pl.pinfo.money < roundCfg.money)) {
                            next(null, { result: Result.Fail });
                            return;
                        }



                        if (pl.vipTable == 0) {
                            //金币场逻辑， 匹配用户
                            if (msg.coinRoomCreate) {

                                var coinCategory = "1:1";
                                //playType 是玩法， coinType 是房间类型（初级场、中级场）
                                if (msg.coinType && msg.playType) {
                                    coinCategory = "" + msg.playType + ':' + msg.coinType;
                                }
                                pl.coinCategory = coinCategory;
                                msg.CoinPara = CoinRoomCfg[msg.coinType - 1];
                                msg.round = roundCfg.round;
                                msg.owner = pl.uid; //金币场谁是owner无所谓
                                msg.full = game.full4create(msg);
                                msg.coinCategory = coinCategory;
                                msg.money = roundCfg.money;
                                var ret = CheckCoinRoom(pl, msg);
                                if (ret != 0) {
                                    next(null, { result: ret, vipTable: 0 });
                                    return;
                                }

                                var isVIPTable = 0;
                                if (msg.isVIPTable && msg.isVIPTable > 0) {
                                    isVIPTable = msg.isVIPTable;
                                }
                                //金币数量
                                var coin = pl.pinfo.coin ? pl.pinfo.coin : 0;
                                //to do 获取胜率信息 0-100
                                var winRate = 100;
                                var newMsg = {
                                    isVIPTable: isVIPTable,
                                    gameid: msg.gameid,
                                    uid: pl.uid,
                                    ip: pl.pinfo.remoteIP,
                                    coinCategory: pl.coinCategory,
                                    coin: coin,
                                    winRate: winRate,
                                    full: msg.full
                                };

                                var matcherServers = app.getServersByType("matcher");
                                var rs = matcherServers[pl.uid % matcherServers.length];
                                app.rpc.matcher.Rpc.FindCoinTable(rs.id, newMsg, function(er, ret) {
                                    if (ret && ret.result == 0) {
                                        pl.vipTable = ret.vipTable;
                                        msg.vipTable = ret.vipTable;
                                        //拿到new table id 的相当于owner
                                        if (ret.newTable) {
                                            server.vipTable[pl.vipTable] = msg;
                                            server.vipTable[pl.vipTable].createtime = new Date().getTime();
                                        }
                                        server.createParas[ret.vipTable] = msg;

                                        console.log(app.serverId + "create coin vip tb id = " + pl.vipTable + ",uid = " + pl.uid);
                                        next(null, { result: Result.Success, vipTable: pl.vipTable });
                                        return;
                                    } else {
                                        pl.vipTable = 0;
                                        next(null, { result: Result.Fail, vipTable: 0 });
                                        return;
                                    }

                                    return;
                                });

                            } else {
                                pl.vipTable = NewVipTable(pl, roundCfg, msg);
                                next(null, { result: pl.vipTable > 0 ? Result.Success : Result.Fail, vipTable: pl.vipTable });
                            }

                            //console.log("Create Vip Tb ok  tb id = " + pl.vipTable + ",uid = " + pl.uid);
                        } else {
                            next(null, { result: pl.vipTable > 0 ? Result.Success : Result.Fail, vipTable: pl.vipTable });
                        }
                    });
                }
            }

        }
        //join game
    serverClass.prototype.JoinGame = function(msg, session, next) {

        var pl = SessionPlayer(session);

        if (!pl) {
            next(null, { result: Result.playerNotFound });
            return;
        }
        console.info("--pkplayerCode--serverClass.prototype.JoinGame" + JSON.stringify(msg) + "uid :" + pl.uid);
        if (!msg.gameid) msg.gameid = pl.appEnd;
        var game = games[msg.gameid];

        if (!game) {
            next(null, { result: Result.Fail });
            return;
        }

        if (game.minVersion && versionCompare(game.minVersion, pl.pinfo.resVersion)) {
            next(null, { result: Result.minVersion, version: pl.pinfo.resVersion, minVersion: game.minVersion });
        } else pl.run("JoinGame", function() {
            next = pl.nextWrap(next);
            if (pl.canJoinGame()) {
                if (game && (!game.info.joinRoom || msg.roomid)) {

                    var pinfo = pl.pinfo;
                    var roomInfo = game.rooms[msg.roomid];

                    if (!msg.tableid && roomInfo.vip) {
                        next(null, { result: Result.Fail });
                        return;
                    } else {
                        var createPara = server.vipTable[msg.tableid];

                        msg.canCreate = createPara && createPara.owner == pl.uid;
                        if (msg.canCreate) {
                            msg.createPara = createPara;
                        } else {
                            //金币场逻辑，所有人都可以创建房间
                            var createParaCoin = server.createParas[msg.tableid];

                            msg.canCreate = createParaCoin && createParaCoin.coinRoomCreate;
                            if (msg.canCreate) {
                                msg.createPara = createParaCoin;
                            }
                        }

                        msg.tableid = msg.tableid + "";
                    }

                    var roomServer = GetRoomServer(pl, game, msg.gameid, msg.roomid, msg.tableid);

                    if (!roomServer) { //错误的房间号会返回false，不再报错
                        next(null, { result: Result.Fail });
                        return;
                    }

                    session.set('pkroom', roomServer);
                    session.push('pkroom', function() {
                        var joinPara = pinfo;

                        app.rpc.pkroom.Rpc.JoinGame(roomServer, joinPara, msg, {
                            sid: pl.sid,
                            fid: pl.fid,
                            did: app.serverId
                        }, function(er, ret) {

                            if (ret && ret.result == 0) {
                                pl.ingame.gameid = msg.gameid;
                                if (msg.tableid && pl.vipTable == 0) pl.vipTable = parseInt(msg.tableid);
                                if (msg.roomid) pl.ingame.roomid = msg.roomid;
                                pl.ingame.server = roomServer;
                                var createParaCoin = server.createParas[msg.tableid];
                                if (createParaCoin && createParaCoin.playType) {
                                    pl.ingame.playType = createParaCoin.playType; // 玩法
                                }

                                next(null, { result: Result.Success });
                            } else {
                                //GLog("  join failed error uid = " + pl.uid);

                                var retMsg = { result: ret ? ret.result : Result.Fail };
                                //如果是金币场加入失败直接给vipTable设置为0，否则可能换不了桌
                                var createParaCoin = server.createParas[msg.tableid];
                                if (createParaCoin && createParaCoin.coinRoomCreate) {
                                    pl.vipTable = 0;
                                    console.log("coin room join game failed " + pl.uid + " " + msg.tableid + " ret : " + JSON.stringify(retMsg));
                                    //此时需要修正一下数据
                                }
                                next(null, retMsg);
                                if (retMsg.result == Result.roomNotFound) {
                                    pl.vipTable = 0;
                                }
                            }

                            //清除临时存储
                            delete server.createParas[msg.tableid];

                        });
                    });

                    return;
                }
            }
            next(null, { result: Result.Fail });
        });
    }

    serverClass.prototype.LoginReward = function(msg, session, next) {
        console.info("--pkplayerCode--serverClass.prototype.LoginReward" + JSON.stringify(msg));

        var pl = SessionPlayer(session);
        if (!pl) {
            next(null, { result: Result.playerNotFound });
            return;
        }

        var nCfgLength = signinReward.length;

        if (nCfgLength <= 0) {
            next(null, { result: Result.Fail });
            return;
        }

        var loginRewardData = pl.pinfo.loginRewardData;
        if (!loginRewardData) {
            loginRewardData = {};
            loginRewardData.lastLoginDay = 0;
            loginRewardData.continuousLoginDay = 0;
        }

        var lastLoginDay = loginRewardData.lastLoginDay;
        var day = new Date();
        var timeZone = 28800000;
        var nDay = Math.floor((day.getTime() + timeZone - 60000) / (1000 * 3600 * 24));
        var nType = 0;

        if (nDay - lastLoginDay > 1) //超过一天没登录
        {
            loginRewardData.continuousLoginDay = 1;
        } else if (nDay == lastLoginDay) {
            next(null, { result: Result.signinAlready });
            return;
        } else {
            ++loginRewardData.continuousLoginDay;
            nType = (loginRewardData.continuousLoginDay - 1) % nCfgLength;
        }

        signinRewardType = signinReward[nType].type;
        signinRewardValue = signinReward[nType].value;

        loginRewardData.lastLoginDay = nDay;

        console.log("LoginReward: uid =" + pl.uid + ",signin day = " + loginRewardData.lastLoginDay + ", continuousLoginDay = " + loginRewardData.continuousLoginDay + ",value=" + signinRewardValue + ',signinRewardType =' + signinRewardType);
        //发奖
        if (signinRewardType == 1) {
            UpdatePlayer("majiang", session.uid, { $inc: { money: signinRewardValue } }, function(err, rtn) {});
        } else if (signinRewardType == 2) {
            UpdatePlayer("majiang", session.uid, { $inc: { coin: signinRewardValue } }, function(err, rtn) {});
        }

        UpdatePlayer("majiang", session.uid, { $set: { loginRewardData: loginRewardData } }, function(err, rtn) {});

        next(null, { result: Result.Success });
    }

    //赠送金币
    serverClass.prototype.GetCoin = function(msg, session, next) {

        console.info("--pkplayerCode--serverClass.prototype.GetCoin + " + JSON.stringify(msg));

        var pl = SessionPlayer(session);
        if (!pl) {
            next(null, { result: Result.playerNotFound });
            return;
        }

        var day = new Date();
        var timeZone = 28800000;
        var nDay = Math.floor((day.getTime() + timeZone - 60000) / (1000 * 3600 * 24));

        var getCoinData = pl.pinfo.getCoinData;
        if (!getCoinData) {
            getCoinData = {};
            getCoinData.lastGetCoinTime = 0;
            getCoinData.getCoinCount = 0;
        }
        var lastGetCoinTime = getCoinData.lastGetCoinTime;

        if (pl.pinfo.coin >= coinCfgLimit) {
            next(null, { result: Result.coinGetLimit });
            return;
        }

        if (nDay != getCoinData.lastGetCoinTime) {
            getCoinData.getCoinCount = 0;
        }

        if (getCoinData.getCoinCount >= 2) {
            next(null, { result: Result.coinGetMax, coin: 0, remain: 0 });
            return;
        }

        ++getCoinData.getCoinCount;
        getCoinData.lastGetCoinTime = nDay;

        console.log('==============>get coin ok day = ' + nDay + ',lastGetCoinTime = ' + getCoinData.lastGetCoinTime + ',count = ' + coinCfgCount + ', limit = ' + coinCfgLimit + ', remain = ' + getCoinData.getCoinCount + ',now coin = ' + pl.pinfo.coin);

        UpdatePlayer("majiang", session.uid, {
            $set: { getCoinData: getCoinData },
            $inc: { coin: coinCfgCount }
        }, function(err, rtn) {});

        next(null, { result: Result.Success, coin: coinCfgCount, remain: 2 - getCoinData.getCoinCount });
    }

    function GetAllPlayerUid(obj) {
        var rtn = [];
        if (obj) {
            for (var uid in obj.players) {
                rtn.push(uid);
            }
        }
        return rtn;
    }

    serverClass.prototype.LeaveCoin = function(uid, next) {
        console.log("enter  serverClass.prototype.LeaveCoin uid =" + uid)
        var pl = online[uid];
        if (!pl) {
            next(Result.playerNotFound, null);
            return Result.playerNotFound;
        }

        LeaveGame(pl, {}, false, next);
        return;
    }


    function LeaveGame(pl, msg, isDisconnect, next) {
        msg.isDisconnect = isDisconnect;

        var vipTable = server.vipTable[pl.vipTable];
        var lastTbId = pl.vipTable;

        app.rpc.pkroom.Rpc.LeaveGame(pl.ingame.server, pl.uid, msg, function(er, ret) {
            //console.info(pl.uid+" leave game\n"+JSON.stringify(ret));
            console.log("" + app.serverId + "leave game uid " + pl.uid + ", pl vipTb = " + pl.vipTable + "ret : ");

            var inc = {};
            var set = {};
            if (er) {
                console.log('app.rpc.pkroom.Rpc.LeaveGame  err, uid = ' + pl.uid + ',err =' + er);
                next(null, { result: Result.Success, inc: inc, set: set });
                return;
            } else if (ret.result == 0) {

                var roomid = pl.ingame.roomid;
                var gameid = pl.ingame.gameid;

                var gameCfg = games[gameid];
                if (gameCfg.afterLeaveGame) {
                    gameCfg.afterLeaveGame(pl, ret);
                }
                pl.ingame.gameid = null;
                pl.ingame.roomid = null;
                pl.ingame.server = null;
                if (pl.ingame.playType)
                    pl.ingame.playType = null;
                pl.vipTable = 0;
                inc = ret.pinfo.$inc;
                set = ret.pinfo.$set;
                var updateInfo = {};

                //server.vipTable[parseInt(msg.tableid)].member.push(pl.uid);

                if (inc && Object.keys(inc).length > 0) {
                    dapi.Update(pl.pinfo, inc, "$inc");
                    for (var pty in inc) {
                        updateInfo[pty] = pl.pinfo[pty];
                    }

                    //add by lhq playNum recommendBy check
                    var masterCfg = app.getMaster();
                    var actCfg = masterCfg.actServer;
                    //console.info('LeaveGame ' + JSON.stringify({actCfg:actCfg, inc:inc}));
                    if (actCfg && inc.playNum && pl.pinfo.recommendBy) {
                        var pkServer = app.GetServerBuyUid("pkplayer", pl.pinfo.recommendBy);
                        //console.info('LeaveGame ' + JSON.stringify({port:pkServer.port + 1000, host:pkServer.host}));
                        if (pkServer.serverId == app.serverId) {
                            RecommendAdd("majiang", pl.pinfo.recommendBy, pl.pinfo.uid, pl.pinfo.playNum, pl.pinfo.headimgurl, pl.pinfo.nickname, function() {});
                        } else {
                            app.httpClient.postJson("RecommendAdd", {
                                    byId: pl.pinfo.recommendBy,
                                    uid: pl.pinfo.uid,
                                    playNum: pl.pinfo.playNum,
                                    headimgurl: pl.pinfo.headimgurl,
                                    nickname: pl.pinfo.nickname
                                },
                                pkServer.port + 1000, pkServer.host,
                                function() {});
                        }
                    }
                }
                if (set && Object.keys(set).length > 0) {
                    dapi.Update(pl.pinfo, set, "$set");
                    for (var pty in set) {
                        updateInfo[pty] = pl.pinfo[pty];
                    }
                }
                if (Object.keys(updateInfo).length > 0) {
                    pl.notify("updateInfo", updateInfo);
                }
                //金币场逻辑， 离开需要通知匹配服务
                if (ret.coinRoomCreate) {
                    var matcherServers = app.getServersByType("matcher");
                    var rs = matcherServers[pl.uid % matcherServers.length];
                    app.rpc.matcher.Rpc.LeaveCoinTable(rs.id, { gameid: gameid, uid: pl.uid, coinCategory: pl.coinCategory, tid: lastTbId }, function(er, ret) {
                        next(null, { result: Result.Success, inc: inc, set: set });
                        return;
                    });
                } else {
                    next(null, { result: Result.Success, inc: inc, set: set });
                    return;
                }


            } else if (ret.result == Result.keepInGame) {
                pl.ingame.roomid = null;
                next(null, { result: Result.Success, inc: inc, set: set });
                return;
            } else if (ret.result == Result.roomInPlay) {
                next(null, { result: Result.roomInPlay, inc: inc, set: set });
                return;
            } else {
                next(null, { result: Result.Success, inc: inc, set: set });
                return;
            }
        });
    }

    serverClass.prototype.LeaveGame = function(msg, session, next) {
        console.info("--pkplayerCode--serverClass.prototype.LeaveGame" + JSON.stringify(msg));

        var pl = SessionPlayer(session);
        if (!pl) {
            next(null, { result: Result.playerNotFound });
            return;
        }
        pl.run("LeaveGame", function() {
            next = pl.nextWrap(next);
            if (pl.canLeaveGame()) LeaveGame(pl, msg, false, next); //主动离开
            else next(null, { result: Result.Success, msg: "alreadyLeave" });
        });

    }

    function doLogoutForce(uid) {
        //console.info("--pkplayerCode--serverClass.prototype.doLogoutForce" + JSON.stringify(uid));

        //console.error("doLogout "+uid+" "+sid+" "+fid);
        var pOL = online[uid];
        if (pOL) {
            if (pOL.fid) app.backendSessionService.kickBySid(pOL.fid, pOL.sid, function() {});
            delete online[uid];

            doLoginLog(pOL, 'doLogoutForce');
        }
    }

    //rpc from con
    serverClass.prototype.doLogout = function(uid, sid, fid, settings, isActive, next) {
        console.info("--pkplayerCode--serverClass.prototype.doLogout" + JSON.stringify(uid));

        //console.error("doLogout "+uid+" "+sid+" "+fid);
        var pOL = online[uid];
        if (pOL) {
            pOL.run("doLogout", function() {
                next = pOL.nextWrap(next);

                if (pOL.fid == fid && pOL.sid == sid) {
                    //notify room server
                    pOL.fid = null;
                    pOL.sid = null;
                    if (pOL.canLeaveGame()) LeaveGame(pOL, {}, true, next); //断线离开
                    else next(null, { result: Result.Success });

                    doLoginLog(pOL, 'doLogout');

                    /*
                     var roomServers=app.getServersByType("pkroom");
                     for(var i=0;i<roomServers.length;i++)
                     {
                     var off={}; off[pOL.uid]=pOL.pinfo;
                     app.rpc.pkroom.Rpc.offinePlayers(roomServers[i].id,{},off,function(){});
                     }
                     */

                } else next(null, { result: Result.playerNotFound });
            });
        } else next(null, { result: Result.playerNotFound });

    }



    serverClass.prototype.endVipTable = function(msg, next) {
        if (typeof next != 'function') {
            //如果是外部传入的第二个参数是session，判断防止报错
            return;
        }
        console.info("--pkplayerCode--serverClass.prototype.endVipTable " + app.serverId + " " + JSON.stringify(msg));
        next(null, null);

        var vipTable = server.vipTable[msg.tableid];
        if (vipTable) {
            server.vipTable[msg.tableid].owner = 0;
            delete server.vipTable[msg.tableid].owner; //不能再创建了
            /*if(msg.roomtype && msg.roomtype == 1){ //金币场先清一次
                delete server.vipTable[msg.tableid];
            }*/
            setTimeout(function() {
                delete server.vipTable[msg.tableid];
            }, 30000);
            //金币场逻辑， 结束桌子需要通知匹配服务
            if (vipTable.coinRoomCreate) {
                var matcherServers = app.getServersByType("matcher");
                if (msg.uids.length > 0) {
                    var rs = matcherServers[msg.uids[0] % matcherServers.length];
                    app.rpc.matcher.Rpc.EndCoinTable(rs.id, {
                        gameid: msg.gameid,
                        coinCategory: vipTable.coinCategory,
                        tid: msg.tableid
                    }, function(er, ret) {});

                }
            }

        }

        function endPl(pl) {
            pl.run("endVipTable", function() {
                var pnext = pl.nextWrap(function() {});
                var needNext = true;
                if (msg.tableid == pl.vipTable) {
                    if (pl.canLeaveGame()) {
                        LeaveGame(pl, {}, false, pnext); //代理离开
                        needNext = false;
                    }
                    pl.vipTable = 0;
                    //更新胜率信息（金币场使用）
                    if (msg.winner && msg.winner.length > 0 && pl.ingame.playType) { //目前金币场设置了playType（玩法）
                        var gameid = pl.ingame.gameid;
                        var win_key = "" + pl.ingame.gameid + "_" + pl.ingame.playType + "_win";
                        var total_key = "" + pl.ingame.gameid + "_" + pl.ingame.playType + "_total";
                        if (!pl.winRate)
                            pl.winRate = {};
                        if (!pl.winRate[total_key]) {
                            pl.winRate[total_key] = 0;
                            pl.winRate[win_key] = 0;
                        }
                        pl.winRate[total_key]++;
                        var index = msg.winner.indexOf(pl.uid);
                        if (index != -1) {
                            pl.winRate[win_key]++;
                        }
                    }
                }
                if (needNext) pnext(null, null);
            });
        }

        for (var i = 0; i < msg.uids.length; i++) {
            var pl = online[msg.uids[i]];
            if (pl) {
                endPl(pl);
            }
        }
    }

    serverClass.prototype.getSymjLog = function(msg, session, next) {
        if (session.uid == 0) {
            next(null, { result: 1 });
            return;
        }
        var uid = msg.uid || session.uid;
        if (msg.logid && msg.now.length >= 10) {
            app.mdb.findOne(msg.now.substr(0, 10), { logid: msg.logid }, function(er, rtn) {
                if (rtn) {
                    next(null, { result: 0, data: rtn });
                } else next(null, { result: 1 });
            });
        } else {
            app.mdb.findOrCreate("majiangLog", { _id: uid }, { _id: uid, uid: uid, logs: [] },
                null,
                function(err, row) {
                    var rtn = { result: 1 };
                    if (!err && row) {
                        rtn.result = 0;
                        rtn.playLog = row;
                    }
                    next(null, rtn);
                });
        }


    }


    serverClass.prototype.doActivity = function(msg, session, next) {
        var masterCfg = app.getMaster();
        var actCfg = masterCfg.actServer;

        if (!actCfg) {
            next(null, { result: Result.Fail, er: 'activity not open' });
            return;
        }

        var pl = SessionPlayer(session);

        if (!pl) {
            next(null, { result: Result.playerNotFound });
            return;
        }

        var actId = msg.actId;
        var actType = msg.actType;

        if (!actId || typeof(actId) != 'number' || actId < 1) {
            next(null, { result: Result.Fail, er: 'actId type error' });
            return;
        }

        if (!actType || typeof(actType) != 'number' || actType < 1) {
            next(null, { result: Result.Fail, er: 'actType type error' });
            return;
        }

        var para1;

        var action;
        var para = {};
        para.actId = actId;

        function checkRequest() {
            function getDayZero(time) {
                var oneDayMsec = 86400000;
                var timeZone = 28800000;
                time = time || Date.now();
                return Math.floor((time + timeZone) / oneDayMsec) * oneDayMsec - timeZone; //凌晨8点减去8个小时
            }

            if (!pl.pinfo.actData) {
                pl.pinfo.actData = {};
            }

            switch (actType) {
                case 1: //转盘
                    action = 'turntable/doTurntable';

                    var freeTimes, payTimes, lastTime;

                    if (!pl.pinfo.actData[actId]) {
                        freeTimes = 0;
                        payTimes = 0;
                        lastTime = 0;
                    } else {
                        if (typeof(pl.pinfo.actData[actId]) != 'object') {
                            next(null, { result: Result.Fail, er: 'error actType' });
                            return;
                        }

                        if (typeof(pl.pinfo.actData[actId].freeTimes) != 'number') {
                            next(null, { result: Result.Fail, er: 'error actType' });
                            return;
                        }

                        freeTimes = pl.pinfo.actData[actId].freeTimes;
                        payTimes = pl.pinfo.actData[actId].payTimes;
                        lastTime = pl.pinfo.actData[actId].lastTime;
                    }

                    if (lastTime && getDayZero(lastTime) != getDayZero()) {
                        //跨天了
                        pl.pinfo.actData[actId].freeTimes = 0;
                        pl.pinfo.actData[actId].payTimes = 0;
                        pl.pinfo.actData[actId].lastTime = 0;

                        freeTimes = 0;
                        payTimes = 0;
                        lastTime = 0;
                    }

                    para.freeTimes = freeTimes;
                    para.payTimes = payTimes;
                    break;
                case 2: //补偿
                    action = 'compensate/getReward';

                    if (pl.pinfo.actData[actId]) {
                        next(null, { result: Result.Fail, er: 'reward got' });
                        return;
                    }
                    break;
                case 3: //新手礼包，数据保存到majiang里面
                    action = 'newbie/getReward';
                    para1 = msg.uid;
                    para.createTime = pl.pinfo.sendTime;

                    if (!para1 || typeof(para1) != 'number' || para1 < 100000) {
                        next(null, { result: Result.Fail, er: 'uid type error' });
                        return;
                    }

                    if (pl.pinfo.recommendBy || para1 == pl.pinfo.uid) {
                        next(null, { result: Result.Fail, er: pl.pinfo.recommendBy ? pl.pinfo.recommendBy : para1 });
                        return;
                    }

                    app.mdb.findOne("majiang", { _id: para1 }, function(er, doc) {
                        if (doc) {
                            sendRequest();
                        } else {
                            next(null, { result: Result.Fail, er: 'pl can not found' });
                        }
                    });
                    return; //需要验证后返回再呼叫sendRequest()
                case 4: //推荐礼包
                    action = 'recommend/getReward';
                    para1 = msg.rewIndex;

                    if (typeof(para1) != 'number' || para1 < 0) {
                        next(null, { result: Result.Fail, er: 'rewIndex type error' });
                        return;
                    }

                    if (!pl.pinfo.recommendData) {
                        next(null, { result: Result.Fail, er: 'can not find recommendData' });
                        return;
                    }

                    for (var i = 0, len = pl.pinfo.recommendData.rewards.length; i < len; i++) {
                        if (para1 == pl.pinfo.recommendData.rewards[i]) {
                            next(null, { result: Result.Fail, er: 'error reward got' });
                            return;
                        }
                    }

                    para.count = Object.keys(pl.pinfo.recommendData.players).length;
                    para.index = para1;
                    break;
                default:
                    next(null, { result: Result.Fail, er: 'error actType' });
                    return;
            }

            sendRequest();
        }

        checkRequest();

        function httpResult(er, data) {
            if (er) {
                next(null, { result: Result.Fail, er: er });
                return;
            }

            if (data.er) {
                if (data.er == 1) {
                    //找不到活动，避免恶意刷玩家数据没有活动后delete
                    delete pl.pinfo.actData[actId];
                }

                next(null, { result: Result.Fail, er: data.er });
                return;
            }

            var rtn = {};
            var update = {};
            var moneyLog = {};

            function setUpdate(op, key, val) {
                if (!update[op]) {
                    update[op] = {};
                    update[op][key] = val;
                } else if (op == '$inc' && update[op][key]) { //set就直接覆盖
                    update[op][key] += val;
                } else {
                    update[op][key] = val;
                }
            }

            if (data.payCost) { //统一消耗钻石
                if (pl.pinfo.money < data.payCost) {
                    next(null, { result: Result.lessMoney });
                    return;
                }

                setUpdate('$inc', 'money', -data.payCost);
            }

            switch (actType) {
                case 1: //转盘
                    if (!pl.pinfo.actData[actId]) {
                        pl.pinfo.actData[actId] = {};
                        pl.pinfo.actData[actId].freeTimes = 0;
                        pl.pinfo.actData[actId].payTimes = 0;
                        pl.pinfo.actData[actId].lastTime = 0;
                    }

                    if (data.payCost) {
                        pl.pinfo.actData[actId].payTimes++;
                    } else {
                        pl.pinfo.actData[actId].freeTimes++;
                    }

                    pl.pinfo.actData[actId].lastTime = Date.now();
                    setUpdate('$set', 'actData', pl.pinfo.actData);
                    break;
                case 2: //维护补偿
                    pl.pinfo.actData[actId] = Date.now();
                    break;
                case 3: //新手礼包
                    pl.pinfo.recommendBy = para1;
                    setUpdate('$set', 'recommendBy', para1);
                    //fix me，增加局数验证
                    if (pl.pinfo.playNum && pl.pinfo.playNum > 0) {
                        var pkServer = app.GetServerBuyUid("pkplayer", para1);
                        //console.info('httpResult ' + JSON.stringify({port: pkServer.port + 1000, host: pkServer.host}));
                        if (pkServer.serverId == app.serverId) {
                            RecommendAdd('majiang', para1, pl.pinfo.uid, pl.pinfo.playNum, pl.pinfo.headimgurl, pl.pinfo.nickname, function(rtn) {});
                        } else {
                            app.httpClient.postJson("RecommendAdd", {
                                    byId: para1,
                                    uid: pl.pinfo.uid,
                                    playNum: pl.pinfo.playNum,
                                    headimgurl: pl.pinfo.headimgurl,
                                    nickname: pl.pinfo.nickname
                                },
                                pkServer.port + 1000, pkServer.host,
                                function() {});
                        }
                    }
                    break;
                case 4: //推荐礼包
                    pl.pinfo.recommendData.rewards.push(para1);
                    setUpdate('$set', 'recommendData', pl.pinfo.recommendData);
                    break;
                default:
                    break;
            }

            if (data.reward) {
                rtn.reward = data.reward;

                if (typeof(data.index) != 'undefined') {
                    rtn.index = data.index;
                }
                //多个奖励。。。。fix me
                switch (data.reward[0]) {
                    case 1: //money
                        setUpdate('$inc', 'money', data.reward[1]);

                        moneyLog.uid = pl.pinfo.uid;
                        moneyLog.buyNum = data.reward[1];
                        moneyLog.buyMoney = 0;
                        moneyLog.buyNote = '活动奖励';
                        moneyLog.buyType = 0;
                        moneyLog.byMid = actId;
                        moneyLog.byName = actType + '';
                        moneyLog.adminLevel = 0;
                        moneyLog.money = 0;
                        moneyLog.buyTime = new Date();
                        break;
                    default:
                        break;
                }
            }

            UpdatePlayer('majiang', pl.pinfo.uid, update, function(er, r) {
                rtn.result = Result.Success;
                next(null, rtn);
                var day = new Date();
                day = (day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate()) + "";

                if (moneyLog.uid) {
                    moneyLog.userMoney = r.money;
                    app.mdb.insert('userMoney' + day, moneyLog, function() {});
                }

                var actLog = {};
                actLog.actId = actId;
                actLog.actType = actType;
                actLog.uid = pl.pinfo.uid;
                actLog.actTime = new Date();
                actLog.payCost = data.payCost;
                actLog.reward = data.reward;
                actLog.rewIndex = data.index;
                actLog.actNote = pl.pinfo.actData[actId];
                app.mdb.insert('actLog' + day, actLog, function() {});
            });
        }

        function sendRequest() {
            var host = masterCfg.host;
            var port = actCfg.port;

            if (actCfg.num && actCfg.num > 1) {
                port += pl.pinfo.uid % actCfg.num;
            }

            //console.info('connect to actServer ' + host + ':' + port);
            app.httpClient.postJson(action, para, port, host, httpResult);
        }
    }

    serverClass.prototype.CanSignIn = function(msg, session, next) {

        console.info("--pkplayerCode--serverClass.prototype.CanSignIn + " + JSON.stringify(msg));

        var pl = SessionPlayer(session);
        if (!pl) {
            next(null, { result: Result.playerNotFound, count: 0 });
            return;
        }


        var day = new Date();
        var timeZone = 28800000;
        var nDay = Math.floor((day.getTime() + timeZone - 60000) / (1000 * 3600 * 24));
        var loginRewardData = pl.pinfo.loginRewardData;

        if (!loginRewardData) {
            next(null, { result: 0, count: 0 });
            return;
        }

        var isCanSignIn = Result.signinAlready;
        if (nDay - loginRewardData.lastLoginDay > 1) {
            loginRewardData.continuousLoginDay = 0;
            isCanSignIn = 0;
        }

        if (nDay - loginRewardData.lastLoginDay == 1) {
            isCanSignIn = 0;
        }

        if (nDay - loginRewardData.lastLoginDay == 1 && loginRewardData.continuousLoginDay >= 7) {
            loginRewardData.continuousLoginDay = 0;
        }

        //console.info("==================>pkplayerCode CanSignIn  reset Ok, uid = "+ pl.uid + " signin = "+ isCanSignIn+ ', continuousLoginDay = '+loginRewardData.continuousLoginDay + ",now = "+
        //	nDay + ",lastLoginDay = " + loginRewardData.lastLoginDay);

        UpdatePlayer('majiang', pl.pinfo.uid, { $set: { loginRewardData: loginRewardData } }, function(er, r) {});

        next(null, { result: isCanSignIn, count: loginRewardData.continuousLoginDay });
    }

    serverClass.prototype.GetRoomCfg = function(msg, session, next) {
        console.info("--pkplayerCode--serverClass.prototype.GetRoomCfg + " + JSON.stringify(msg));
        if (CoinRoomCfg.length == 0) {
            next(null, Result.Fail);
            return;
        }
        var res = [];
        //原来就这么定的格式。。。。，
        for (var i = 0; i < CoinRoomCfg.length; i++) {
            res.push(JSON.stringify(CoinRoomCfg[i]));
        }
        next(null, res);

    }

    //佩戴酒
    serverClass.prototype.drinkChoose = function(msg, session, next) {
        var pl = SessionPlayer(session);
        if (!pl) {
            next(null, { result: Result.playerNotFound });
            return;
        }

        var itemId = msg.itemid;
        if (!pl.pinfo.item) {
            pl.pinfo.item = [];
        }

        for (var i = 0; i < pl.pinfo.item.length; i++) {
            var item = pl.pinfo.item[i];
            //GLog("drinkChoose uid ="+pl.uid +", item id ="+item.id +",req item ="+itemId);
            if (item.id == itemId) {
                if (item.time < Math.floor(new Date().getTime() / 1000)) {
                    next(null, { result: Result.itemExpire });
                    return;
                }


                pl.pinfo.useitem = itemId;
                UpdatePlayer("majiang", pl.uid, { $set: { useitem: pl.pinfo.useitem } }, function(err, res) {});
                //GLog("find same item id ="+itemId);
                next(null, { result: Result.Success });
                return;
            }
        }

        next(null, { result: Result.itemNotFind });
    }

    serverClass.prototype.GetSigninCfg = function(msg, session, next) {

        console.info("--pkplayerCode--serverClass.prototype.GetSigninCfg + " + JSON.stringify(msg));
        if (signinReward.length == 0) {
            next(null, Result.Fail);
            return;
        }
        var res = [];
        //原来就这么定的格式。。。。，
        for (var i = 0; i < signinReward.length; i++) {
            res.push(JSON.stringify(signinReward[i]));
        }
        next(null, res);
    }

    function GetDateStr(AddDayCount) {
        var dd = new Date();
        dd.setHours(dd.getHours() + AddDayCount); //获取AddDayCount天后的日期
        var y = dd.getFullYear();
        var month = dd.getMonth() + 1; //获取当前月份的日期
        var strDate = dd.getDate();
        var H = dd.getHours();  //获取当前小时数(0-23)
        var M = dd.getMinutes();  //获取当前分钟数(0-59)
        var S = dd.getSeconds();  //获取当前秒数(0-59)

        if (month >= 1 && month <= 9) { month = "0" + month; }
        if (strDate >= 0 && strDate <= 9) { strDate = "0" + strDate; }
        if (H >= 0 && H <= 9) { H = "0" + H; }
        if (M >= 0 && M <= 9) { M = "0" + M; }
        if (S >= 0 && S <= 9) { S = "0" + S; }
        return y + "" + month + strDate + H + M + S;
    }

    var getSignMD5 = function(a_WXp) {
        var stringA = "appid=" + a_WXp.i_appid +
            "&attach=" + a_WXp.i_attach +
            "&body=" + a_WXp.i_body +
            "&mch_id=" + a_WXp.i_mch_id +
            "&nonce_str=" + a_WXp.i_nonce_str +
            "&notify_url=" + a_WXp.i_notify_url +
            "&out_trade_no=" + a_WXp.i_out_trade_no +
            "&spbill_create_ip=" + a_WXp.i_spbill_create_ip +
            "&time_expire=" + a_WXp.i_time_expire +
            "&time_start=" + a_WXp.i_time_start +
            "&total_fee=" + a_WXp.i_total_fee +
            "&trade_type=" + a_WXp.i_trade_type;

        var pay_key = app.getMaster().wxpay_key;
        stringA = stringA + "&key=" + pay_key;
        var md5 = crypto.createHash('md5');
        return md5.update(stringA, 'utf-8').digest('hex').toUpperCase();
    }

    function SendWxinOrder(sendMsg, para, next) {
        var options = {
            host: 'api.mch.weixin.qq.com',
            port: 443,
            path: '/pay/unifiedorder',
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=UTF-8',
                'Content-Length': Buffer.byteLength(sendMsg)
            }
        };

        var isSandBox = false;

        var ferr = function(err) // https error
            {
                SetTimeout(function() {
                    SendWxinOrder(sendMsg);
                }, 10000);
            }
        var fdata = function(data) {
            parser.parseString(data, function(err, result) {
                console.log("parseString  result=" + JSON.stringify(result) + ",return_code = " + result.return_code);

                if (result.return_code == "SUCCESS") {
                    next(null, { result: Result.Success, nonce_str: para.i_nonce_str, prepay_id: result.prepay_id });
                    return;
                } else {
                    next(null, { result: Result.OrderSendError });
                    return;
                }
            });
        }
        HttpsReq(options, sendMsg, fdata, ferr);
    }

    serverClass.prototype.SendWxOrder = function(msg, session, next) {
        console.log("serverClass.prototype.SendWxOrder uid = " + msg.a_uid + ", iap =" + msg.a_IAP + ",price =" + msg.a_price);
        var bFind = false;
        if (wxpayCfg) {
            var price = parseInt(msg.a_price);
            if (wxpayCfg[msg.a_IAP] && wxpayCfg[msg.a_IAP].fee == price) {
                bFind = true;
            }
        }

        if (!bFind) {
            console.error("SendWxOrder  find price err uid =" + msg.a_uid + ", proid =" + msg.a_IAP);
            next(null, { result: Result.paraError });
            return;
        }

        var md5 = crypto.createHash('md5');

        var para = {};
        para.i_appid = app.getMaster().wxpay_appid;
        para.i_mch_id = app.getMaster().wxpay_mchid;
        para.i_body = msg.a_body;
        para.i_device_info = msg.a_OS;
        para.i_attach = msg.a_uid + "&" + msg.a_IAP + "&" + msg.a_price;

        var sis = "" + Math.floor(Math.random() * 10000);
        para.i_nonce_str = md5.update(sis).digest('hex').toUpperCase();

        var currentTime = parseInt(Date.now() / 1000);
        para.i_spbill_create_ip = msg.a_remoteIP;
        para.i_total_fee = msg.a_price;
        para.i_time_start = currentTime;
        para.i_trade_type = "APP";
        para.i_notify_url = app.getMaster().wxpay_url;
        para.i_time_start = GetDateStr(0); //开始时间
        para.i_time_expire = GetDateStr(1); //结束时间
        para.i_out_trade_no = "" + msg.a_uid + currentTime + msg.a_price;

        para.sign = getSignMD5(para).toUpperCase();

        var sendMsg = '<xml><appid><![CDATA[' + para.i_appid + ']]></appid>' +
            '<attach><![CDATA[' + para.i_attach + ']]></attach>' +
            '<body><![CDATA[' + para.i_body + ']]></body>' +
            '<mch_id><![CDATA[' + para.i_mch_id + ']]></mch_id>' +
            '<nonce_str><![CDATA[' + para.i_nonce_str + ']]></nonce_str>' +
            '<notify_url><![CDATA[' + para.i_notify_url + ']]></notify_url>' +
            '<out_trade_no><![CDATA[' + para.i_out_trade_no + ']]></out_trade_no>' +
            '<sign><![CDATA[' + para.sign + ']]></sign>' +
            '<spbill_create_ip><![CDATA[' + para.i_spbill_create_ip + ']]></spbill_create_ip>' +
            '<time_expire><![CDATA[' + para.i_time_expire + ']]></time_expire>' +
            '<time_start><![CDATA[' + para.i_time_start + ']]></time_start>' +
            '<total_fee><![CDATA[' + para.i_total_fee + ']]></total_fee>' +
            '<trade_type><![CDATA[' + para.i_trade_type + ']]></trade_type></xml>';

        console.log("WechatPay  para = " + sendMsg + ", len = " + sendMsg.length);

        SendWxinOrder(sendMsg, para, next);
    }

    function AddItem(uid, itemId) {
        //GLog("--pkplayerCode--serverClass.prototype.add item begin  id = " + itemId + ',uid = ' + uid);
        //GLog("enter  add item  uid =" + uid);
        var pl = online[uid];
        if (!pl) {
            return Result.playerNotFound;
        }

        /*var ItemPara = {};
        for (var item in itemTable) {
            if (item.id == itemId) {
                ItemPara = item;
            }
        }

        if (ItemPara.length <= 0) {
            return Result.itemErrPara;
        }*/

        var ItemData = {};
        var day = new Date();
        ItemData.time = Math.floor(day.getTime() / 1000) + 3600 * 24;
        ItemData.id = itemId;
        if (!pl.pinfo.item) {
            pl.pinfo.item = [];
        }

        for (var i = 0; i < pl.pinfo.item.length; i++) {
            var item = pl.pinfo.item[i];
            if (item.id == itemId) {
                if (item.time < Math.floor(day.getTime() / 1000)) {
                    item.time = Math.floor(day.getTime() / 1000) + 3600 * 24;
                } else {
                    item.time = item.time + 3600 * 24;
                }

                //GLog("find same item ="+ itemId+",time =" + item.time);
                UpdatePlayer("majiang", pl.uid, { $set: { item: pl.pinfo.item } }, function(err, res) {});

                return true;
            }
        }

        pl.pinfo.item.push(ItemData);
        UpdatePlayer("majiang", pl.uid, { $set: { item: pl.pinfo.item } }, function(err, res) {});

        //GLog("add item ok uid ="+uid+", id =" +itemId);
        return 0;
    }

    //检测是否可以加入金币场
    function CheckCoinRoom(pl, msg) {

        //GLog('=============>CheckCoinRoom  msg.coinType = ' + msg.coinType);

        var nType = msg.coinType;
        if (CoinRoomCfg.length <= 0) {
            return Result.Fail;
        }
        if (!msg.coinType || msg.coinType <= 0 || msg.coinType > CoinRoomCfg.length) {
            return Result.paraError;
        }
        return 0;

        var para = CoinRoomCfg[nType - 1];
        if (!para) {
            return Result.paraError;
        }
        if (!pl) {
            return Result.paraError;
        }

        if (pl.pinfo.coin < para.min) {
            return Result.coinRoomMin;
        }
        if (para.max != -1 && pl.pinfo.coin > para.max) {
            return Result.coinRoomMax;
        }

        return 0;
    }


    function generateUserKey(pl) {
        var key = {};
        key.uid = pl.uid;
        key.salt = Math.floor(Math.random() * 100000000);
        key.time = Math.floor(new Date().getTime() / 1000);
        var cipher = crypto.createCipher("aes192", passKey);
        var ciph = cipher.update(JSON.stringify(key), 'utf8', 'hex');
        ciph += cipher.final('hex');

        //GLog("generateUserKey = "+ciph +",pl uid = " + pl.uid);
        return ciph;
    }

    function versionCompare(serverVersion, clientVersion) {
        serverVersion = serverVersion + "";
        clientVersion = clientVersion + "";

        var sData = serverVersion.split('.');
        var cData = clientVersion.split('.');

        var sLen = sData.length;
        var cLen = cData.length;

        var len = sLen > cLen ? cLen : sLen;

        function toInt(val) {
            var v = parseInt(val);

            if (!v) return val;

            return v;
        }

        function compare(i) {
            if (i >= len) {
                return sLen > cLen;
            }

            if (toInt(sData[i]) > toInt(cData[i])) {
                return true;
            } else if (toInt(sData[i]) < toInt(cData[i])) {
                return false;
            } else {
                return compare(++i);
            }
        }

        return compare(0);
    }

    serverClass.prototype.OnceMoreSendNotify = function(uid, msg, next) {
        //console.info("enter OnceMoreSendNotify  notify uid =" +uid);
        var obj = online[uid];
        if (obj) {
            console.info("serverClass.prototype.SendNotify  notify uid =" + uid + ",msg =" + JSON.stringify(msg));
            obj.notify("oncemore", msg);
        }

        next(null, null);
    }

    serverClass.prototype.OnceMore = function(msg, session, next) {
        console.info("serverClass.prototype.OnceMore uid =" + msg.uid);

        var pl = SessionPlayer(session);
        if (!pl) {
            next(null, { result: Result.playerNotFound });
            return;
        }

        var vipTable = server.vipTable[pl.vipTable];
        if (!vipTable) {
            next(null, { result: Result.Fail });
            return;
        }

        var uids = msg.uid;
        //var sendMsg = {table:pl.vipTable,name: pl.pinfo.nickname};
        var sendMsg = {};
        sendMsg.table = pl.vipTable;
        sendMsg.name = msg.name;
        sendMsg.GameId = msg.gameId;
        sendMsg.desc = msg.desc;
        //GLog("name = " + sendMsg.name);
        for (var i = 0; i < uids.length; ++i) {
            var pkplayer = app.GetServerBuyUid("pkplayer", uids[i]).id;
            app.rpc.pkplayer.Rpc.OnceMoreSendNotify(pkplayer, uids[i], sendMsg,
                function(er, res) {});
        }

        next(null, { result: Result.Success });
    }


    serverClass.prototype.ConsumeCoupon = function(msg, session, next) {
        console.info("--pkplayerCode--serverClass.prototype.ConsumeCoupon + " + JSON.stringify(msg));
        var pl = SessionPlayer(session);
        if (!pl) {
            next(null, { result: Result.playerNotFound });
            return;
        }

        if (!msg.coupon_id) {
            next(null, { result: Result.paraError });
            return;
        }

        var sign = function(objInput, $key) {
            arrInput = Object.keys(objInput);
            arrInput.sort();
            var strInput = "";
            for (var i = 0; i < arrInput.length; i++) {
                strInput += '&' + arrInput[i] + "=" + objInput[arrInput[i]];
            }

            //trim '&'
            strInput = strInput.replace(/(\&*$)/g, "").replace(/(^&*)/g, "");
            strInput = encodeURIComponent(strInput)

            var genSign = crypto.createHmac('sha1', $key).update(strInput).digest("hex");
            return genSign;
        }

        var signKey = "LsFWib3HLx0Ry71qMGne";
        var signStr = sign({ "consumer_id": pl.uid, "coupon_id": msg.coupon_id }, signKey);
        app.httpClient.postJson('internal/consumeCoupon', { "consumer_id": pl.uid, "coupon_id": msg.coupon_id, sign: signStr },
            80, app.getMaster().host,
            function(er, data) {
                if (er) {
                    console.log("internal consumeCoupon request error");
                    next({ result: Result.Fail });
                    return;
                }
                console.log("internal/consumeCoupon return :", JSON.stringify(data));
                next(null, { result: data.errno });
                return;
            })

    }

}