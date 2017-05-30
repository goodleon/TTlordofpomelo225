module.exports = function(app, server, serverClass) {

    delete require.cache[require.resolve('../Result')];
    var Result = require('../Result');

    if (app.serverType == "pkcon" && !server.httpServer) {
        //delete require.cache[require.resolve('./http/httpServer.js')];	
        server.httpServer = new require("./http/httpServer.js")(app, server);
    }

    var tempInfo = {}; //-
    var loginServers = app.GetCfgServers('login');
    //todo find gameServerType by msg.appid 
    serverClass.prototype.doLogin = function(msg, session, next, routePara) {
        console.info("--pkconCode--serverClass.prototype.doLogin" + JSON.stringify(msg));

        var isHttp = !session.frontendId;
        //console.info(isHttp+" doLogin "+JSON.stringify(session));
        if (!routePara) routePara = null;
        app.rpc.login.Rpc.verifyPlayer(routePara, msg, function(er, rtn) {
            if (!er) {
                if (rtn.length == 0) {
                    if (routePara != null) {
                        next(null, { result: Result.playerNotFound });
                    } else process.nextTick(function() {
                        server.doLogin(msg, session, next, loginServers[0].id);
                    });
                } else {
                    var gameServerType = 'pkplayer';
                    var pinfo = rtn[0];
                    var sinfo = app.GetServerBuyUid(gameServerType, pinfo.uid);
                    pinfo.fid = session.frontendId;
                    pinfo.sid = session.id;
                    session.frontendIP = sinfo.host;
                    if (!isHttp) {
                        session.set(gameServerType, sinfo.id);
                    } else {
                        session[gameServerType] = sinfo.id;
                        session.get = function(key) { return this[key] };
                    }
                    //if(!msg.remoteIP&&session.__session__)
                    if (session.__session__) {
                        msg.remoteIP = session.__session__.__socket__.remoteAddress.ip;
                    }
                    app.rpc[gameServerType].Rpc.doLogin(session, msg, pinfo,
                        function(e, r) {
                            //bind session
                            if (r && r.result == Result.Success) {
                                if (!isHttp) {
                                    session.bind(pinfo.uid);
                                    session.push(gameServerType);
                                }
                                next(e, r);
                            } else if (r && r.result == Result.ban) {
                                next(null, r);
                            } else {
                                next(null, { result: Result.verifyPlayerFail });
                            }
                        });

                }
                //console.info("sinfo&pinfo:" + JSON.stringify(sinfo) + ":" + JSON.stringify(pinfo));

            } else {
                //console.log("i'm herr 222222222222222222222222");
                next(null, { result: Result.verifyPlayerFail })
            }

        });

    };
    serverClass.prototype.logout = function(msg, session, next) {
        console.info("--pkconCode--serverClass.prototype.logout" + JSON.stringify(msg));

        app.logout(session, true, next);
        session.unbind(session.uid, function(err) {

        });
    };
    serverClass.prototype.tickServer = function(msg, session, next) {
        next(null, { serverRecvAt: Date.now() });
    }

    serverClass.prototype.getSymjLog = function(msg, session, next) {
        if (session.uid == 0) {
            next(null, { result: 1 });
            return;
        }
        var uid = msg.uid || session.uid;
        if (msg.logid && msg.now.length >= 10) {
            app.mdb.findOne(msg.now.substr(0, 10), { logid: msg.logid },
                function(er, rtn) {
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

}