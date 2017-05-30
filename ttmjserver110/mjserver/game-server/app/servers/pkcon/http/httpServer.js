module.exports = function(gapp, gserver) {

    //console.info(gapp.serverId+" "+hport);

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
        doLogin: function(req, res) {
            //console.info("http doLogin "+JSON.stringify(req.body));

            gserver.doLogin(req.body, {}, function(er, rtn) {
                if (er) {
                    //console.info("http doLogin 403");
                    res.sendStatus(403);
                } else {
                    //console.info("http doLogin "+JSON.stringify(rtn));
                    res.json(rtn);
                }
            });
        },
        reqGuestID: function(req, res) {
            //console.info("http reqGuestID "+JSON.stringify(req.body));
            var loginServers = gapp.GetCfgServers('login');
            gapp.rpc.login.Rpc.reqGuestID(loginServers[0].id, req.body, {}, function(er, rtn) {
                if (er) {
                    //console.info("http reqGuestID 403");
                    res.sendStatus(403);
                } else {
                    //console.info("http reqGuestID "+JSON.stringify(rtn));
                    res.json(rtn);
                }
            });
        },
        CreateVipTable: function(req, res) {
            var uid = req.body.uid;
            var pkplayer = gapp.GetServerBuyUid("pkplayer", uid).id;
            var fakeSession = { pkplayer: pkplayer };
            fakeSession.get = function(key) { return this[key] };

            //console.info("http CreateVipTable "+JSON.stringify(req.body)+" "+pkplayer);


            gapp.rpc.pkplayer.Rpc.CreateVipTable(fakeSession, req.body, { isHttp: true }, function(er, rtn) {

                res.json(rtn);
            });
        },
        JoinVipTable: function(req, res) {
            //console.info("http JoinVipTable "+JSON.stringify(req.body));

            var joinPara = req.body;
            var plServer = gapp.GetServerBuyUid("pkplayer", joinPara.uid).id;
            var fakeSession = { pkplayer: plServer };
            fakeSession.get = function(key) { return this[key] };
            gapp.rpc.pkplayer.Rpc.JoinVipTable(fakeSession, req.body, function(er, rtn) {
                if (rtn && rtn.result == 0) {
                    fakeSession.pkplayer = gapp.GetServerBuyUid("pkplayer", rtn.vipTable).id
                    gapp.rpc.pkplayer.Rpc.FindVipTable(fakeSession, rtn, function(fe, frt) {
                        if (frt && frt.owner > 0) {
                            frt.result = 0;
                            res.json(frt);
                        } else //找不到房间
                        {
                            gapp.rpc.pkplayer.Rpc.JoinVipTable(fakeSession, { tableid: 0 }, function(je, jr) {
                                res.json(jr);
                            });
                        }
                    });
                } else res.json(rtn);
            });
        },
        getSymjLog: function(req, res) {
            //console.info("http getSymjLog "+JSON.stringify(req.body));
            var joinPara = req.body;
            var plServer = gapp.GetServerBuyUid("pkplayer", joinPara.uid).id;
            var fakeSession = { pkplayer: plServer };
            fakeSession.get = function(key) { return this[key] };
            gapp.rpc.pkplayer.Rpc.getSymjLog(fakeSession, req.body, { uid: joinPara.uid }, function(er, rtn) {
                res.json(rtn);
            });
        }
    });
    //在给定的主机和端口上监听请求，这个和node的文档http.Server#listen()是一致的
    app.listen(gapp.getCurServer().clientPort + 1000);
    this.close = function() {

    }
    return aServer;

}