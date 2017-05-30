var nodemailer = require('nodemailer');

var CoinRoomType = [
    { Type: 1, cost: 250, win: 500, min: 2000, max: 150000 }, //初级场
    { Type: 2, cost: 1500, win: 1000, min: 20000, max: 750000 }, //中级场
    { Type: 3, cost: 3000, win: 1000, min: 20000, max: 0 }, //高级场
    { Type: 4, cost: 9500, win: 1000, min: 20000, max: 0 }, //专家场
    { Type: 5, cost: 20000, win: 1000, min: 20000, max: 0 }, //大师场
    { Type: 6, cost: 72000, win: 1000, min: 20000, max: 0 } //宗师场
]

module.exports = function(app, login, LoginData) {
    //init or repair data
    if (!login.idplayers) {
        login.idplayers = {};
    } else {}
    if (!login.mailplayers) {
        login.mailplayers = {};
    } else {}

    //�¼ܹ�, �û� ���� ������  �ͻ���˫����
    if (!login.viptable) {
        login.viptable = {};
    }

    if (!login.vipserver) {
        login.vipserver = {};
    }

    if (app.serverType == "login" && app.getMaster().redis) {
        delete require.cache[require.resolve("./RedisClient")];
        require("./RedisClient")(app, login, LoginData);
    }


    var idplayers = login.idplayers;
    var mailplayers = login.mailplayers;
    console.log("idplayers:" + idplayers + "|| mailplayers" + mailplayers);
    var regMail = app.regEx.mail;
    var reguid = app.regEx.uid;

    delete require.cache[require.resolve('../Result.js')];
    var Result = require('../Result.js');

    //database layer
    var dapi = {
        AddNewPlayer: function(newPlayer, next) {
            //var insert="insert into cgbuser set ? ";  app.dbclient.query(insert,[newPlayer],next);
            if (!newPlayer.uid) {
                newPlayer._id = login.newUID();
                newPlayer.uid = newPlayer._id;
            }

            if (isMasterLogin && loginServers.length == 1) {
                idplayers[newPlayer.uid] = newPlayer;
                if (newPlayer.email) mailplayers[newPlayer.email] = newPlayer;
            }

            app.mdb.insert('cgbuser', newPlayer, function(er, ret) {
                next(null, { insertId: newPlayer._id });
            });

        },
        LoadPlayerByMail: function(mail, cb) {
            //app.dbclient.query("select * from cgbuser where email=?",[mail],cb);
            if (login.redisClient) {
                login.redisClient.hget(app.serverId, mail, function(er, doc) {
                    if (doc) {
                        doc = JSON.parse(doc);
                        cb(null, doc);
                    } else {
                        app.mdb.findOne('cgbuser', { email: mail }, function(er, doc) {
                            if (doc) {
                                login.redisClient.hset(app.serverId, mail, JSON.stringify(doc));
                            }
                            cb(er, doc);
                        });
                    }
                });
            } else app.mdb.findOne('cgbuser', { email: mail }, cb);
        },
        LoadPlayerById: function(uid, cb) {
            //app.dbclient.query("select * from cgbuser where uid=?",[uid],cb);
            app.mdb.findOne('cgbuser', { _id: uid }, cb);
        },
        Update: function(pl, val, op) {
            if (!op) op = '$set';
            //if(!pl._dirty) pl._dirty={};
            app.mdb.upMemObj(pl, val, op);
            app.mdb.update('cgbuser', { _id: pl.uid }, val, op);
            //console.error(op+" update "+pl.uid+" "+JSON.stringify(val));
        }
    }


    var fromMail = 'auth-email@coolgamebox.com';
    var mailTrans = nodemailer.createTransport({ service: 'QQ', auth: { user: fromMail, pass: '8*1!1!0)2@5%' } });

    function NotifyManager(title, msg) {
        mailTrans.sendMail({ from: fromMail, to: 'chh@game-yes.com', subject: title, text: msg },
            function(err, info) {});
    }

    function SendMailCode(uid, msg, code) {
        //if( mail.substr( mail.indexOf('@')+1 )=="coolgamebox.com" ) return;
        var mails = require('./mailSample');

        var self = this;
        mailTrans.sendMail({
                from: fromMail,
                to: msg.mail,
                subject: msg.lang == 'zh' ? '��֤��-ʹ�ô���֤���¼coolgamebox����Ϸ' : 'verify code-use to login games from coolgamebox',
                text: code,
                html: '<b>' + code + '</b>'
            },
            function(err, info) {
                dapi.LoadPlayerById(uid, function(er, pinfo) {
                    dapi.Update(pinfo, {
                        mailSend: err ? err : info,
                        mailError: err ? true : false
                    });
                });
            });
    }

    //private function
    function randomFace() { return 'avata:' + (Math.floor(Math.random() * 10000) % 115); }

    function randomName(string_length) {
        var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
        if (!string_length) string_length = 8;
        var randomstring = '';
        for (var i = 0; i < string_length; i++) {
            var rnum = Math.floor(Math.random() * chars.length);
            randomstring += chars.substring(rnum, rnum + 1);
        }
        return randomstring;
    }

    function NewPlayer() {
        return {
            loginCode: randomName(6),
            face: randomFace(),
            members: {},
            sendTime: new Date(),
            name: randomName()
        }
    }

    //trace dirty field and save to db
    function PlayerWrap(pinfo) {
        var rtn = { pinfo: pinfo }

        return rtn;
    }

    function LoadPlayerByMail(mail, next) {
        //try memory
        var pdata = mailplayers[mail];
        if (pdata) next(null, pdata);
        else dapi.LoadPlayerByMail(mail, function(er, doc) {
            if (!doc) //not in database try memory again
            {
                pdata = mailplayers[mail];
                if (pdata) next(null, pdata);
                else next(er, null);
            } else //found in database but need try memory again
            {
                var pdata = idplayers[doc.uid];
                if (pdata) //already load to memory
                {
                    if (pdata.email == mail) {
                        next(null, pdata);
                    } else next(null, null);
                } else {
                    var pinfo = doc;
                    idplayers[pinfo.uid] = pinfo; //load by mail
                    mailplayers[pinfo.email] = pinfo; //load by mail
                    next(null, pinfo);
                }
            }
        });
    }

    function LoadPlayerById(uid, next) {
        //try memory
        var pdata = idplayers[uid];
        if (pdata) next(null, pdata);
        else dapi.LoadPlayerById(uid, function(er, doc) {
            if (!doc) {
                //try memory again
                var pdata = idplayers[uid];
                if (pdata) next(null, pdata);
                else next(null, null);
            } else {
                //try memory again
                var pdata = idplayers[uid];
                if (pdata) next(null, pdata);
                else {
                    var pinfo = doc;
                    idplayers[uid] = pinfo; //load by id
                    if (pinfo.email && pinfo.email.length > 0) {
                        mailplayers[pinfo.email] = pdata; //load by id
                    }
                    next(null, pinfo);

                    //console.error("player by id "+pdata.uid);
                }
            }
        });
    }
    LoginData.prototype.mongodbReady = function() {
            console.info("--loginCode--LoginData.prototype.mongodbReady");

            app.mdb.max("cgbuser", "_id", 100000, function(er, maxuid) {
                var svrid = app.serverId;
                svrid = parseInt(svrid.substr(svrid.indexOf('_') + 1));
                //maxuid=Math.floor(maxuid/1000);	login.newUID=function(){return ((++maxuid)*1000)+svrid;}
                login.newUID = function() { return ++maxuid; };
                console.error("maxuid " + maxuid);
            });

            function loadPlayer(skp, lmt) {
                var loadNum = 0;
                app.mdb.db.collection("cgbuser").find().skip(skp).limit(lmt).each(function(er, doc) {
                    if (doc) {
                        loadNum++;
                        if (doc.email && doc.openid && doc.unionid) {
                            doc.email = doc.unionid + "@weixin";

                            if (doc.lType == 'fb') {
                                doc.email = doc.unionid + "@facebook";
                            }

                            if (loginServers.length > 1 && app.stringHash) {
                                if (loginServers[app.stringHash(doc.unionid) % (loginServers.length - 1) + 1].id != app.serverId) {
                                    return;
                                }
                            }
                        }
                        //idplayers[doc.uid]=doc;
                        if (doc.email && !mailplayers[doc.email]) {
                            mailplayers[doc.email] = doc;
                            idplayers[doc.uid] = doc;
                        }
                    } else {
                        if (loadNum >= lmt) {
                            setTimeout(function() { loadPlayer(skp + lmt, lmt); }, Math.floor(1000 * Math.random()));
                        }
                    }
                });
            }
            //����mogodb����,��redis���
            if ((loginServers.length == 1 || !isMasterLogin) && !app.getMaster().redis)
                loadPlayer(0, 2000);

        }
        //server rpc

    /*

     {"is_logged_in":true,
     "user_id":"10152969132389865",
     "access_token":"CAAWZBYaOMse4BAK1xCGFB5apJ1ycb0HghQwgjc2f9nVscrzZBu5UvY9d5ijujFFY8VkD46mZBCTmt9rffhJEi7oyuJb9Y6joX0hwyGT9SIG4ZAFZCYCgC9yPskPM3mrUFASBciLgYQ0P3ekBliy7Itl4IDXuPlO2wvsflEejYkWT7QRjUAC7df9sehRJ6xYCZBLZAv4XjUnEj4VMboUOfGL","access_token_expires_at":"1/1/0001 12:00:00 AM"}

     */
    var loginServers = app.GetCfgServers("login");
    var isMasterLogin = loginServers[0].id == app.serverId;
    //if(app.serverType=="login"&&!login.accountServer&&app.getMaster().accountServer&&isMasterLogin)
    //修改为所有login都开启accountServer，为了微信平台使用
    if (app.serverType == "login" && !login.accountServer) {
        if (isMasterLogin) {
            //masterlogin开启的端口是master配置的accountServer
            if (app.getMaster().accountServer) {
                login.accountServer = require("./account/accountServer.js")(app, app.getMaster().accountServer, loginServers[0].host);
            } else if (loginServers.length == 1) { //如果只有一个login，需要开启外部使用的端口
                login.accountServer = require("./account/accountServer.js")(app, loginServers[0].host + 1000, loginServers[0].host);
            }
        } else {
            //其他开启的端口是根据login.port计算的  3010 - ...
            var ls = app.getCurServer();
            login.accountServer = require("./account/accountServer.js")(app, ls.port + 1000, ls.host);
        }
    }

    LoginData.prototype.CheckPlayer = function(unionId, type, next) {
        var email;

        switch (type) {
            case 'wx':
                email = unionId + '@weixin';
                break;
            case 'fb': //facebook
                email = unionId + "@facebook";
                break;
            default:
                next(1, null)
                return;
        }

        LoadPlayerByMail(email, function(er, pl) {
            if (pl) {
                next(null, pl);
            } else {
                next(1, null);
            }
        });
    }

    LoginData.prototype.verifyPlayer = function(msg, next) {
            console.info("--loginCode--LoginData.prototype.verifyPlayer" + JSON.stringify(msg));

            //΢�ŵ�¼
            if (msg.lType == "wx" || msg.lType == 'fb') {
                var email = msg.unionid + "@weixin";

                if (msg.lType == 'fb') {
                    email = msg.unionid + "@facebook";
                }

                LoadPlayerByMail(email, function(er, pl) {
                    if (pl) //mail player exist
                    {
                        //console.info("find old facebook player "+email);
                        pl.nickname = msg.nickname;
                        pl.headimgurl = msg.headimgurl;
                        pl.resVersion = msg.resVersion;
                        next(null, [pl]);
                    } else if (!er && isMasterLogin) {
                        //console.info("new facebook player "+email);
                        var master = app.getMaster();
                        //��Ҫ������������ע���û�
                        if (master && master.accountClient) {
                            if (!login.accountClient) {
                                login.accountClient = require("./account/accountClient.js")(app);
                            }
                            login.accountClient.NewPlayer(msg, function(er, newp) {
                                if (!er && newp && newp.length > 0) {
                                    var newPlayer = newp[0];
                                    //mailplayers[email]=newPlayer;//lock
                                    dapi.AddNewPlayer(newPlayer, function(err, result) {
                                        if (err) next(null, []);
                                        else {
                                            next(null, [newPlayer]);
                                        }
                                    });
                                } else next(null, []);
                            });
                        } else {
                            var newPlayer = NewPlayer();
                            newPlayer.email = email;
                            //mailplayers[email]=newPlayer;//lock

                            //删除可能引起错误的字段
                            delete msg.uid;
                            delete msg._id;
                            delete msg.money;
                            delete msg.coin;

                            for (var pty in msg) newPlayer[pty] = msg[pty];
                            dapi.AddNewPlayer(newPlayer, function(err, result) {

                                console.log("----LoginData.prototype.verifyPlayer--add new player, info is:" + JSON.stringify(
                                    newPlayer));
                                if (err) {
                                    next(null, []);
                                } else {
                                    next(null, [newPlayer]);
                                }
                            });
                        }
                    } else next(null, []);
                });
            }
            /*else if(msg.lType=='fb')//facebook
             {
             var email=msg.mail.user_id+"@facebook";
             LoadPlayerByMail(email,function(er,pl)
             {
             if(pl)//mail player exist
             {
             //console.info("find old facebook player "+email);
             next(null,[pl]);
             }
             else
             {
             //console.info("new facebook player "+email);
             var newPlayer=NewPlayer();
             newPlayer.email=email;
             newPlayer.name="newPlayer";
             //mailplayers[email]=newPlayer;//lock
             dapi.AddNewPlayer(newPlayer,function(err,result){
             if(err) next(null,[]);
             else next(null,[newPlayer]);
             });
             }
             });
             }*/
            else if (regMail.test(msg.mail)) {
                LoadPlayerByMail(msg.mail, function(er, pl) {
                    if (pl && pl.loginCode == msg.code) {
                        if (!pl.mailValid) dapi.Update(pl, { mailValid: true });
                        next(null, [pl]);
                    } else {
                        next(null, []);
                    }
                });
            } else if (reguid.test(msg.mail)) {
                //console.info("login by id "+msg.mail);
                LoadPlayerById(parseInt(msg.mail), function(er, pl) {
                    if (pl && pl.loginCode == msg.code) {
                        next(null, [pl]);
                    } else {
                        next(null, []);
                    }
                });
            } else {
                console.info("idtest fail " + JSON.stringify(msg));
                next(null, []);
            }
        }
        //client rpc
    LoginData.prototype.reqGuestID = function(msg, session, next) {
            console.info("--loginCode--LoginData.prototype.reqGuestID" + JSON.stringify(msg));

            //this.logger.info(dump(msg));
            var master = app.getMaster();
            //��Ҫ������������ע���û�
            if (master && master.accountClient) {
                if (!login.accountClient) {
                    login.accountClient = require("./account/accountClient.js")(app);
                }
                login.accountClient.reqGuestID(msg, function(er, rtn) {
                    if (!er && rtn) {
                        var newPlayer = rtn;
                        dapi.AddNewPlayer(newPlayer, function(err, result) {
                            if (err) next(null, []);
                            else next(null, [newPlayer]);
                        });
                    } else next(null, { result: Result.Fail });
                });
            } else {
                var newPlayer = NewPlayer();
                dapi.AddNewPlayer(newPlayer, function(err, result) {
                    if (err) next(null, { result: Result.Fail, err: err });
                    else if (msg.fromHttp) next(null, newPlayer);
                    else next(null, { result: Result.Success, mail: result.insertId + '', code: newPlayer.loginCode });
                });
            }
        }
        //for register new player, bind mail for old player , recommend new player by old player
    LoginData.prototype.sendLoginCode = function(msg, session, next) {
        console.info("--loginCode--LoginData.prototype.sendLoginCode" + JSON.stringify(msg));

        var self = this;
        LoadPlayerByMail(msg.mail, function(er, pinfo) {
            if (pinfo) //mail player exist
            {
                if (msg.bindMail || msg.isRecommend) //mailUsed and can not bind or recommend
                    next(null, { result: Result.emailUsed });
                else //resend
                {
                    if (pinfo.mailValid) {
                        dapi.Update(pinfo, { loginCode: randomName(6) });
                    }
                    SendMailCode(pinfo.uid, msg, pinfo.loginCode);
                    next(null, { result: Result.Success, from: fromMail });
                }

            } else //email can bu used,do lock
            {
                if (msg.bindMail) {
                    pinfo = session;
                    if (pinfo.mailValid) dapi.Update(pinfo, { loginCode: randomName(6) });
                    dapi.Update(pinfo, { email: msg.mail });
                    mailplayers[msg.mail] = pinfo; //lock
                    SendMailCode(pinfo.uid, msg, pinfo.loginCode);
                    next(null, { result: Result.Success, from: fromMail });
                } else {

                    var newPlayer = NewPlayer();
                    newPlayer.email = msg.mail;
                    newPlayer.name = msg.mail.substr(0, msg.mail.indexOf('@'));

                    if (msg.isRecommend) {
                        pinfo = session;
                        newPlayer.recommendBy = pinfo.uid;
                    }
                    //mailplayers[msg.mail]=newPlayer;//lock
                    dapi.AddNewPlayer(newPlayer, function(err, result) {
                        if (err) {
                            next(null, { result: Result.Fail });
                            delete mailplayers[msg.mail];
                        } else {
                            SendMailCode(result.insertId, msg, newPlayer.loginCode);
                            newPlayer.uid = result.insertId;
                            next(null, { result: Result.Success, from: fromMail });
                        }
                    });
                }
            }
        });
    };
    LoginData.prototype.recommendPlayer = function(msg, session, next) {
        console.info("--loginCode--LoginData.prototype.recommendPlayer" + JSON.stringify(msg));

        LoadPlayerById(session.uid, function(er, pinfo) {
            if (!pinfo) { next(null, { result: Result.playerNotFound }); return; } else if (!pinfo.mailValid) //guest player
            { next(null, { result: Result.guestCanNotRecommend }); return; }
            msg.isRecommend = true;
            msg.byuid = pinfo.uid;
            msg.byEmail = pinfo.email;
            login.sendLoginCode(msg, pinfo, next);
        });
    }

    //online
    LoginData.prototype.bindMail = function(msg, session, next) {
        console.info("--loginCode--LoginData.prototype.bindMail" + JSON.stringify(msg));

        LoadPlayerById(session.uid, function(er, pinfo) {
            if (!pinfo) { next(null, { result: Result.playerNotFound }); return; } else if (pinfo.mailValid) //already bind
            { next(null, { result: Result.emailValid }); return; }

            if (!regMail.test(msg.mail)) //format error
            { next(null, { result: Result.invalidMail }); return; } else {
                msg.bindMail = true;
                login.sendLoginCode(msg, pinfo, next);
            }
        });
    };
    LoginData.prototype.changeName = function(msg, session, next) {
        console.info("--loginCode--LoginData.prototype.changeName" + JSON.stringify(msg));

        var self = this;
        var rtn = {};
        do {
            var pinfo = self.online[session.uid];
            if (!pinfo) { rtn.result = ZJHCode.playerNotFound; break; }
            rtn.result = ZJHCode.Success;
            dapi.Update(pinfo, { name: msg.name });
        } while (false);
        next(null, rtn);
    }
    LoginData.prototype.changeHead = function(msg, session, next) {
        console.info("--loginCode--LoginData.prototype.changeHead" + JSON.stringify(msg));

        var self = this;
        var rtn = {};
        do {
            var pinfo = auth.SessionPlayer(session);
            if (!pinfo) { rtn.result = 1; break; }
            rtn.face = randomFace();
            rtn.result = ZJHCode.Success;
            dapi.Update(pinfo, { face: rtn.face });
        } while (false);
        next(null, rtn);
    }

    LoginData.prototype.addFriend = function(msg, session, next) {
        console.info("--loginCode--LoginData.prototype.addFriend" + JSON.stringify(msg));

        var self = this;
        var rtn = {};
        LoadPlayerById(session.uid, function(er, pinfo) {
            if (!pinfo ||
                !pinfo.mailValid ||
                !regMail.test(msg.email)) {
                //console.error("here "+pinfo.mailValid);
                rtn.result = 1;
                next(null, rtn);
                return;
            }

            if (pinfo.email != msg.email) {
                //console.dir(pinfo.members);
                LoadPlayerByMail(msg.email, function(er, pl) {

                    if (!pl || pinfo.members[pl.uid]) {
                        rtn.result = 1;
                        next(null, rtn);
                    } else {
                        var upPara = {};
                        upPara["members." + pl.uid] = pl.email;
                        dapi.Update(pinfo, upPara);
                        rtn.result = 0;
                        rtn.uid = pl.uid;
                        next(null, rtn);
                    }

                });
            }

        });
    }

    LoginData.prototype.removeFriend = function(msg, session, next) {
        console.info("--loginCode--LoginData.prototype.removeFriend" + JSON.stringify(msg));

        var self = this;
        var rtn = {};
        LoadPlayerById(session.uid, function(er, pinfo) {
            if (!pinfo) {
                rtn.result = 1;
                next(null, rtn);
                return;
            }
            var unset = {};
            for (var i = 0; i < msg.uids.length; i++) {
                delete pinfo.members[msg.uids[i]];
                unset["members." + msg.uids[i]] = 1;
            }
            dapi.Update(pinfo, unset, '$unset');
            rtn.result = 0;
            next(null, rtn);
        });
    }

    LoginData.prototype.LoginReward = function(msg, next) {}

    LoginData.prototype.ReqCoinRoomCfg = function(msg, next) {
        console.info("--loginCode--LoginData.prototype.ReqCoinRoomCfg" + JSON.stringify(msg));

        var RewardType = [];
        if (login.redisClient) {
            login.redisClient.hget(app.serverId, 'CoinRoomCfg', function(er, doc) {
                if (!er) {
                    RewardType = doc;
                } else {
                    console.info("--loginCode--LoginData.prototype.ReqCoinRoomCfg  read error");
                }
            });
        }

        if (RewardType.length <= 0) {
            RewardType = CoinRoomType;
        }

        next(null, JSON.stringify(RewardType));
    }

}