module.exports=function(admin) {
    var tools = require("../tools.js")();
    var postAdmin = require("./admin.js")(admin);
    var postTools = require("./tools.js")(admin);
    var events = require('events');
    var memberStruct = ['mNick', 'mName', 'mAddress'];//, 'mPhone1', 'mPhone2'];
    var escapeList = /[<>()'"${}\[\]:]/;//需要屏蔽的特殊字符

    return {
        addMemberWithSign: function(req, res) {
            //verify sign
            var mAddress = req.body.mAddress;
            var mName = req.body.mName;
            var mNick = req.body.mNick;
            var sign = req.body.sign;
            var acccessId = req.body.access_id;

            if (typeof mAddress != "string" ||
                typeof mName != "string" ||
                typeof mNick != "string" ||
                typeof sign != "string" ||
                typeof acccessId != "string") {
                res.json({er: 2});
                return;
            }

            var objInput = {
                "mAddress" : mAddress,
                "mName" : mName,
                "mNick"  : mNick,
                'access_id' : acccessId
            };

            var genSign = postTools.genGrowthSign(objInput, "/growth/addMemberWithSign");
            if (genSign != sign) {
                res.json({er: 10});
                return;
            }

            var db = admin.mdb;
            var member = admin.getMember(req);
            admin.opLog(member._id, admin.getClientIp(req), 'addMember', req.body);
            if (db) {
                var msg = req.body;

                var data = {};

                if (!msg.mid) {
                    data.mid = Math.floor(Math.random() * 899999) + 100000;
                }

                var mPass = '123456';

                for(var i = 0; i < memberStruct.length; i++) {//注意如果外部的参数变多需要修改全局变量
                    var k = memberStruct[i];

                    if(msg[k]) {
                        var type = typeof(msg[k]);

                        if(k == 'mPhone1' || k == 'mPhone2') {
                            if(type != 'number') {
                                res.end();
                                return;
                            }

                            if(msg[k] < 10000000000 || msg[k] >= 100000000000) {
                                //fix me 11位手机号码
                                res.end();
                                return;
                            }
                        } else {
                            if (type != 'string' || escapeList.test(msg[k]) || msg[k].length > 150) {
                                //fix me，字符串最多150长度，utf8汉字50个。。。
                                res.end();
                                return;
                            }
                        }

                        data[k] = msg[k];
                    }
                }

                data._id       = data.mid;
                data.mAddBy    = member.mName;
                data.mAddByMid = member.mid;

                if(member.adminLevel == 2) {
                    data.byMid  =  member.byMid;
                    data.byName =  member.byName;
                } else {
                    data.byMid  = member.mid;
                    data.byName = member.mName;
                }

                data.buyTotal = 0;
                data.buyReward = 0;
                data.money = 0;
                data.mTime = new Date();
                data.mPass = admin.cryptoMemberPass(mPass);
                data.forcePass = 1;
                data.adminLevel = 0;

                if(admin.jsonCfg.defaultGameId) {
                    data.gameids = admin.jsonCfg.defaultGameId;
                }


                db.collection("members").insertOne(data, function (er, rtn) {
                    if(er) {
                        res.json({er:1, msg:er.errmsg});
                        return;
                    }

                    if(!rtn) {
                        res.json({er:1, msg:"insert err"});
                        return;
                    }

                    var resp = rtn.result;
                    resp.id = data._id;
                    res.json(resp);
                    return;
                });

                return;
            }
        },
        addUserMoneyForGrowth: function(req, res) {
            var uid = req.body.uid;
            var money = req.body.money;
            var sign = req.body.sign;
            var acccessId = req.body.access_id;
            admin.doLog("add user money access:", req.body, "growth.log");

            if (typeof uid != 'number') {
                res.json({er: 2});
                return;
            }

            if (typeof money != 'number') {
                res.json({er: 2});
                return;
            }

            if (typeof acccessId != 'string') {
                res.json({er: 2});
                return;
            }

            //verify sign
            var objInput = {
                "uid"   : uid,
                "money" : money,
                'access_id' : acccessId
            };
            var genSign = postTools.genGrowthSign(objInput, "/growth/addUserMoneyForGrowth");
            if (genSign != sign) {
                res.json({er: 10});
                return;
            }
            var pkserver = admin.uid2pkplayer(uid);
            admin.httpClient.postJson("UpdatePlayer", {
                uid: uid,
                update: {$inc: {money: money}}
            }, pkserver.port + 1000, pkserver.host, function (er, rtn) {
                if (rtn && typeof rtn.money == 'number') {
                    admin.doLog("add user money success:", req.body, "growth.log");
                    res.json(rtn);
                    return;
                }

                res.json({er: 1, errmsg:"add money fail"});
                return;
            });
        },
        queryOpenIdByUid: function (req, res) {
            var uid = req.body.uid;
            var acccessId = req.body.access_id;
            var sign = req.body.sign;

            if (typeof uid != 'number') {
                res.json({er: 2});
                return;
            }

            var objInput = {
                "uid"   : uid,
                'access_id' : acccessId
            };
            var genSign = postTools.genGrowthSign(objInput, "/growth/queryOpenIdByUid");
            if (genSign != sign) {
                res.json({er: 10});
                return;
            }

            admin.mdb.collection("cgbuser").findOne({uid:uid}, function(er, rtn) {
                if (er) {
                    res.json({errno:1, errmsg: er.errmsg});
                    return;
                }

                if(rtn) {
                    res.json({errno:0, openid:rtn.openid, uid:rtn.uid, unionid:rtn.unionid});
                } else {
                    res.json({errno:1, errmsg: "no uid info"});
                    return;
                }

                return;

            });


        },
        getMemberBuyRecord: function (req, res) {
            var uids = req.body.uids;
            var start = req.body.start;
            var days = req.body.days;
            var sign = req.body.sign;
            var acccessId = req.body.access_id;

            if (typeof uids != 'string') {
                res.json({er: 2});
                return;
            }
            uidsStr = uids
            uids = JSON.parse(uids)
            if(typeof(uids) != 'object') {
                res.json({er: 2});
                return;
            }

            if (typeof start != 'string') {
                res.json({er: 2});
                return;
            }

            if (typeof days != 'number') {
                res.json({er: 2});
                return;
            }

            //verify sign
            var objInput = {
                "uids"   : uidsStr,
                "start" : start,
                "days"  : days.toString(),
                'access_id' : acccessId
            };
            var genSign = postTools.genGrowthSign(objInput, "/growth/getMemberBuyRecord");
            if (genSign != sign) {
                res.json({er: 10});
                return;
            }

            if (days > 7) {
                days = 7;
            } else if (days < 1) {
                days = 1;
            }
            if (days != 1){
                res.json({er: 2,errmsg:"day has to be 1"});
                return;
            }
            var rtn = {};

            function getGameLog(day) {
                var data = {};

                admin.mdb.collection('memberMoney' + day).find({mid:{$in:uids}}).each(function (e, r) {
                    if (r) {
                        data[parseInt(r.mid)] = {
                            buyNum: r.buyNum,
                            money:r.buyMoney,
                            transction_id:r._id,
                            time:r.buyTime
                        }
                    } else {
                        //rtn.data.push(data);
                        //拼接为带短线的日期
                        var year = day.toString().substr(0,4);
                        var month = day.toString().substr(4,2)
                        var day_ = day.toString().substr(6,2)
                        rtn[year + '-' + month + '-' + day_] = data
                        if (Object.keys(rtn).length == days) {
                            res.json(rtn);
                        }
                    }
                });
            }

            var dd = new Date(start);
            dd.setDate(dd.getDate() - 1);

            for (var i = 0; i < days; i++) {
                dd.setDate(dd.getDate() + 1);
                var day = dd.getFullYear() * 10000 + (dd.getMonth() + 1) * 100 + dd.getDate();
                getGameLog(day);
            }
        },
        getUserchargeRecord: function (req, res) {
            var uids = req.body.uids;
            var start = req.body.start;
            var days = req.body.days;
            var sign = req.body.sign;
            var acccessId = req.body.access_id;

            if (typeof uids != 'string') {
                res.json({er: 2});
                return;
            }
            uidsStr = uids
            uids = JSON.parse(uids)
            if(typeof(uids) != 'object') {
                res.json({er: 2});
                return;
            }

            if (typeof start != 'string') {
                res.json({er: 2});
                return;
            }

            if (typeof days != 'number') {
                res.json({er: 2});
                return;
            }

            //verify sign
            var objInput = {
                "uids"   : uidsStr,
                "start" : start,
                "days"  : days.toString(),
                'access_id' : acccessId
            };
            var genSign = postTools.genGrowthSign(objInput, "/growth/getUserchargeRecord");
            if (genSign != sign) {
                res.json({er: 10});
                return;
            }

            if (days > 7) {
                days = 7;
            } else if (days < 1) {
                days = 1;
            }
            if (days != 1){
                res.json({er: 2,errmsg:"day has to be 1"});
                return;
	    }
            var rtn = {};

            function getGameLog(day) {
                var data = {};

                admin.mdb.collection('userMoney' + day).find({uid:{$in:uids}}).each(function (e, r) {
                    if (r) {
                        data[parseInt(r.uid)] = {
                            buyNum: r.buyNum,
				            money:r.buyMoney,
				            transction_id:r.byMid,
                            time:r.buyTime
			            }
                    } else {
                        //rtn.data.push(data);
                        //拼接为带短线的日期
                        var year = day.toString().substr(0,4);
                        var month = day.toString().substr(4,2)
                        var day_ = day.toString().substr(6,2)
                        rtn[year + '-' + month + '-' + day_] = data
                        if (Object.keys(rtn).length == days) {
                            res.json(rtn);
                        }
                    }
                });
            }

            var dd = new Date(start);
            dd.setDate(dd.getDate() - 1);

            for (var i = 0; i < days; i++) {
                dd.setDate(dd.getDate() + 1);
                var day = dd.getFullYear() * 10000 + (dd.getMonth() + 1) * 100 + dd.getDate();
                getGameLog(day);
            }
        },
        getUserAuthWithSign: function (req, res) {
            var uids = req.body.uids;
            var start = req.body.start;
            var days = req.body.days;
            var sign = req.body.sign;
            var acccessId = req.body.access_id;

            if (typeof uids != 'string') {
                res.json({er: 2});
                return;
            }
            uidsStr = uids
            uids = JSON.parse(uids)
            if(typeof(uids) != 'object') {
                res.json({er: 2});
                return;
            }

            if (typeof start != 'string') {
                res.json({er: 2});
                return;
            }

            if (typeof days != 'number') {
                res.json({er: 2});
                return;
            }

            //verify sign
            var objInput = {
                "uids"   : uidsStr,
                "start" : start,
                "days"  : days.toString(),
                'access_id' : acccessId
            };
            var genSign = postTools.genGrowthSign(objInput, "/growth/getUserAuthWithSign");
            if (genSign != sign) {
                res.json({er: 10});
                return;
            }

            if (days > 7) {
                days = 7;
            } else if (days < 1) {
                days = 1;
            }

            var rtn = {};
            var arrUid = [];

            for (k in uids) {
                arrUid.push(uids[k]);
            }

            admin.mdb.collection('majiang').find({_id:{$in:arrUid}}, function (er, docs) {
                if (er || !docs) {
                    res.json({er: 3});
                    return;
                }

                var uid2money = {};
                docs.each(function(er, doc){
                    if (er || !doc) {
                        return
                    }

                    uid2money[doc.uid] = doc.money
                });


                //rtn.uid = uids;
                rtn.money = uid2money;
                rtn.data = {};

                var para = {};
                para.$or = [];

                var para = {};
                para.$or = [];
                para.$or.push({uid1: {$in:arrUid}});
                para.$or.push({uid2: {$in:arrUid}});
                para.$or.push({uid3: {$in:arrUid}});
                para.$or.push({uid4: {$in:arrUid}});

                function getGameLog(day) {
                    var data = {};
                    for (k in uids) {
                        arrUid.push(uids[k]);

                        data[uids[k]] = {
                            money : 0,
                            create : 0,
                            join : 0
                        }
                    }

                    admin.mdb.collection('gameLog' + day).find(para).each(function (e, r) {
                        if (r) {
                            if (typeof(data[r.uid1]) == "object") {
                                data[r.uid1].money += r.money;
                                data[r.uid1].create ++;
                                data[r.uid1].join += r.createRound - r.remainRound;
                            }
                            if (typeof(data[r.uid2]) == "object") {
                                data[r.uid2].join += r.createRound - r.remainRound;
                            }
                            if (typeof(data[r.uid3]) == "object") {
                                data[r.uid3].join += r.createRound - r.remainRound;
                            }
                            if (typeof(data[r.uid4]) == "object") {
                                data[r.uid4].join += r.createRound - r.remainRound;
                            }
                        } else {
                            //rtn.data.push(data);
                            //拼接为带短线的日期
                            var year = day.toString().substr(0,4);
                            var month = day.toString().substr(4,2)
                            var day_ = day.toString().substr(6,2)
                            rtn.data[year + '-' + month + '-' + day_] = data
                            if (Object.keys(rtn.data).length == days) {
                                res.json(rtn);
                            }
                        }
                    });
                }

                var dd = new Date(start);
                dd.setDate(dd.getDate() - 1);

                for (var i = 0; i < days; i++) {
                    dd.setDate(dd.getDate() + 1);
                    var day = dd.getFullYear() * 10000 + (dd.getMonth() + 1) * 100 + dd.getDate();
                    getGameLog(day);
                }
            });
        },
    };


}
