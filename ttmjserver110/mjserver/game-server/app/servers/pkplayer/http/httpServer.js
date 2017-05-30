module.exports = function(gapp, gserver) {

    //console.info(gapp.serverId+" "+hport);
    var gameLog = [];

    function GLog(log) {
        gapp.FileWork(gameLog, "/root/mjserver/log.txt", log)
    }

    var express = require('express'); //引入express 核心模块？
    var bodyParser = require('body-parser'); //body解析xml
    var fs = require('fs');

    var app = express(); //用express创建一个新的程序
    app.use(bodyParser.json());

    var aServer = this;

    function AddWebHandler(type, path, js) {
        if (typeof js == 'function') {
            app[type](path, js);
        } else {
            for (var pty in js) {
                AddWebHandler(type, path + "/" + pty, js[pty]);
            }
        }
    }

    AddWebHandler("post", "", {
        EndVipTable: function(req, res) {
            if (gserver.webFunc && gserver.webFunc.EndVipTable) {
                gserver.webFunc.EndVipTable(req, res);
                return;
            }
            res.json("EndVipTable not found");
        },
        SetFreeAct: function(req, res) {
            if (gserver.webFunc && gserver.webFunc.SetFreeAct) {
                gserver.webFunc.SetFreeAct(req, res);
                return;
            }
            res.json("SetFreeAct not found");
        },
        RecommendAdd: function(req, res) {
            if (gserver.webFunc && gserver.webFunc.RecommendAdd) {
                gserver.webFunc.RecommendAdd(req, res);
                return;
            }
            res.json("RecommendAdd not found");
        },
        //这个接口非常不安全
        UpdatePlayer: function(req, res) {
            //console.info('http server before ' + JSON.stringify(req.body));
            if (gserver.webFunc && gserver.webFunc.UpdatePlayer) {
                gserver.webFunc.UpdatePlayer(req, res);
                return;
            }
            var msg = req.body;
            var uid = msg.uid;
            var update = msg.update;
            var serverId = gapp.GetServerBuyUid("pkplayer", uid);
            if (serverId) {
                serverId = serverId.id;
                if (serverId == gapp.serverId) {
                    gapp.pkplayer.UpdatePlayer("majiang", uid, update, function(er, rtn) {
                        //console.info('http server after ' + JSON.stringify(rtn));
                        res.json(rtn);
                    });
                    return;
                } else {
                    //console.info(serverId+ " != "+gapp.serverId);
                }
            }
            res.end();
        },
        ReloadCode: function(req, res) {
            if (gserver.webFunc && gserver.webFunc.ReloadCode) {
                gserver.webFunc.ReloadCode(req, res);
                return;
            }
            if (gserver.ReloadCode) {
                gserver.ReloadCode();
                res.json("reload ok");
            } else res.json("reload fail");
        },
        ReloadAdmin: function(req, res) {
            if (gserver.webFunc && gserver.webFunc.ReloadAdmin) {
                gserver.webFunc.ReloadAdmin(req, res);
                return;
            }
            res.json("ReloadAdmin fail");
        },
        GetAudit: function(req, res) {
            if (gserver.webFunc && gserver.webFunc.GetAudit) {
                gserver.webFunc.GetAudit(req, res);
                return;
            }
            res.json("GetAudit fail");
        },
        forceLogout: function(req, res) {
            if (gserver.webFunc && gserver.webFunc.forceLogout) {
                gserver.webFunc.forceLogout(req, res);
                return;
            }
            res.json("forceLogout fail");
        },
        coinKey: function(req, res) {
            if (gserver.webFunc && gserver.webFunc.coinKey) {
                gserver.webFunc.coinKey(req, res);
                return;
            }
            res.json("coinKey fail");
        },
        LoginReward: function(req, res) {
            if (gserver.webFunc && gserver.webFunc.LoginReward) {
                gserver.webFunc.LoginReward(req, res);
                return;
            }
            res.json("LoginReward fail");
        },
        WxPay: function(req, res) {
            //GLog('http server WxPay uid =' + req.body.uid);
            //GLog("httpserver WxPay here, req =" + req);
            if (gserver.webFunc && gserver.webFunc.WxPay) {
                gserver.webFunc.WxPay(req, res);
                return;
            }
            res.json("WxPay  fail");
        }
    });
    //在给定的主机和端口上监听请求，这个和node的文档http.Server#listen()是一致的
    app.listen(gapp.getCurServer().port + 1000, gapp.getCurServer().host);
    this.close = function() {

    }
    return aServer;

}