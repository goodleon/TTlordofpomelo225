module.exports=function(admin) {
    var schedule = require("node-schedule");

    Date.prototype.Format = function (fmt) {
        var o = {
            "M+": this.getMonth() + 1,
            "d+": this.getDate(),
            "h+": this.getHours(),
            "m+": this.getMinutes(),
            "s+": this.getSeconds(),
            "q+": Math.floor((this.getMonth() + 3) / 3),
            "S": this.getMilliseconds()
        };
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(fmt)) {
                fmt =
                    fmt.replace(RegExp.$1,
                        (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            }
        }
        return fmt;
    };

    var createActivityIndex = false;
    var createActivityUserStatusIndex = {};

    //用于issur reward请求并发时候的保护
    var issueRewardLock = 0;
    var issueRewardLockStartTime = 0;
    var issueRewardLockTimeout = 5;

    //TODO 防攻击
    //TODO 转义
    //TODO start time建索引
    var activityStatus = {
        "running": 0,
        "not_start": 1,
        "manual_stop": 2,
        "time_end_stop": 3,
    }
    var activityUserStatus = {
        "running": 0,
        "reach_reward": 1,
        "get_reward": 2
    };

    var completeconditionBitmap = {
        //bitmap 设置
        //complete_yuanbao:8 complete_createroom:4 complete_round:2 complete_bigwinner:1
        complete_yuanbao: 1 << 3,
        complete_createroom: 1 << 2,
        complete_round: 1 << 1,
        complete_bigwinner: 1
    }

    var rtn = {
        createActivity: function (req, res) {
             if (!admin.checkLevel(req, [3, 10])) {
                res.json({er: 1});
                return;
             }

             var member = admin.getMember(req);
             if (0 == member || !member) {
                res.json({er: 1});
                return;
             }

             var uid = member._id;
             var uname = member.mName;

            var activity_name = req.body.activity_name;
            var desc = req.body.desc;
            var start_time = req.body.start_time;
            var end_time = req.body.end_time;
            if (typeof activity_name != 'string' ||
                typeof desc != 'string' ||
                typeof start_time != 'string' ||
                typeof end_time != 'string') {
                res.json({errno: 2, errmsg: "param invalid"});
                return;
            }

            var startime_str = start_time.replace(/-/g, '/');
            var start_date = new Date(startime_str);
            var start_timestamp = start_date.getTime();
            if (typeof start_timestamp != 'number' || start_timestamp < 0) {
                res.json({errno: 2, errmsg: "param invalid"});
            }

            var endtime_str = end_time.replace(/-/g, '/');
            var end_date = new Date(endtime_str);
            var end_timestamp = end_date.getTime();
            if (typeof end_timestamp != 'number' || end_timestamp < 0) {
                res.json({errno: 2, errmsg: "param invalid"});
            }

            var complete_yuanbao = req.body.complete_yuanbao;
            var complete_createroom = req.body.complete_createroom;
            var complete_round = req.body.complete_round;
            var complete_bigwinner = req.body.complete_bigwinner;
            if (typeof complete_yuanbao != 'number' ||
                typeof complete_createroom != 'number' ||
                typeof complete_round != 'number' ||
                typeof complete_bigwinner != 'number') {
                res.json({errno: 2, errmsg: "param invalid"});
                return;
            }


            var reward_diamend = req.body.reward_diamend;
            var reward_coin = req.body.reward_coin;
            //金币奖励暂不开启
            reward_coin = 0;
            var reward_others = req.body.reward_others;
            if (typeof reward_diamend != 'number' ||
                typeof reward_coin != 'number' ||
                typeof reward_others != 'string') {

                res.json({errno: 2, errmsg: "param invalid"});
                return;
            }

            if(end_time < current_timestamp || end_time < start_time) {
                res.json({er: 3});
                return;
            }

            var now = new Date();
            var status = activityStatus.running;
            var current_timestamp = Math.floor(now.getTime());
            if(start_timestamp > current_timestamp) {
                status = activityStatus.not_start;
            }

            var newActivity = {
                creator_uid: uid,
                creator_uname: uname,
                activity_name: activity_name,
                desc: desc,
                start_time: start_timestamp / 1000,
                end_time: end_timestamp / 1000,

                complete_yuanbao: complete_yuanbao,
                complete_createroom: complete_createroom,
                complete_round: complete_round,
                complete_bigwinner: complete_bigwinner,

                reward_diamend: reward_diamend,
                reward_coin: reward_coin,
                reward_others: reward_others,

                status: status,

                join_cnt: 0,
                reach_reward_cnt: 0,
                get_reward_cnt: 0

            };

            admin.mdb.collection("activity").findAndModify({"_id": "activity_id"}, [], {$inc: {'seq': 1}}, {
                new: true,
                upsert: true
            }, function (er, rtn) {
                //获取自增id
                if (er) {
                    res.json({errno: 1, errmsg: er.errmsg});
                    return;
                }

                if (!rtn || !rtn.value) {
                    res.json({errno: 1});
                    return;
                }

                newActivity.id = rtn.value.seq;

                admin.mdb.collection("activity").insertOne(newActivity, function (er, rtn) {
                    if (er) {
                        if(-1 != er.errmsg.indexOf("E11000")) {
                            res.json({errno: 5, errmsg: er.errmsg});
                            return;
                        }
                        res.json({errno: 1, errmsg: er.errmsg});
                        return;
                    }

                    if(!createActivityIndex) {
                        createActivityIndex = true;
                        admin.mdb.collection("activity").createIndex({"activity_name":1},{"background":1, "unique":true}, function(err, result) {
                            if(err) {
                                console.log(err.errmsg);
                            }
                        });
                        admin.mdb.collection("activity").createIndex({"id":1},{"background":1, "unique":true}, function(err, result) {
                            if(err) {
                                console.log(err.errmsg);
                            }
                        });
                        admin.mdb.collection("activity").createIndex({"status":1},{"background":1}, function(err, result) {
                            if(err) {
                                console.log(err.errmsg);
                            }
                        });
                        admin.mdb.collection("activity").createIndex({"start_time":1},{"background":1}, function(err, result) {
                            if(err) {
                                console.log(err.errmsg);
                            }
                        });
                    }
                    res.json({errno: 0});
                    return;

                });
            });

        },
        stopActivity: function (req, res) {

             if (!admin.checkLevel(req, [3, 10])) {
             res.json({er: 1});
             return;
             }

             var member = admin.getMember(req);
             if (0 == member || !member) {
             res.json({er: 1});
             return;
             }
            var uid = member._id;
            var uname = member.mName;

            var id = req.body.id;
            var reason = req.body.reason;
            if (typeof id != 'number' || typeof reason != 'string') {
                res.json({errno: 2, errmsg: "param invalid"});
                return;
            }

            admin.mdb.collection('activity').updateOne({id: id}, {
                $set: {
                    status: activityStatus.manual_stop, stop_reason: reason,
                    stop_uid: uid, stop_uname: uname
                }
            }, function (err, r) {
                if (err || !r) {
                    res.json({errno: 1, errmsg: er.errmsg});
                } else {
                    if (1 == r.matchedCount) {
                        res.json({errno: 0});
                    } else {
                        res.json({errno: 1, errmsg: "no activity"});
                    }
                }
            });
        },
        queryUserStatus: function (req, res) {
            if (!admin.checkLevel(req, [1, 3, 10])) {
                res.json({er: 1});
                return;
            }

            var member = admin.getMember(req);
            if (0 == member || !member) {
                res.json({er: 1});
                return;
            }

            var uid = req.body.uid;
            var activity_id = req.body.activity_id;
            if (typeof uid != 'number' || typeof activity_id != 'number') {
                res.json({errno: 2, errmsg: "param invalid"});
                return;
            }

            admin.mdb.collection("activity_id_" + activity_id + "_user_stastic").findOne({uid: uid.toString()}, function (e, r) {
                if (e) {
                    res.json({errno: 1, errmsg: e.errmsg});
                    return;
                }

                if (!r) {
                    res.json({errno: 1, errmsg: "no record"});
                    return;
                }

                delete r._id;
                res.json(r);
            });
        },
        queryActivityById: function (req, res) {
            var activity_id = req.body.activity_id;
            if (typeof activity_id != 'number' || activity_id < 0) {
                res.json({errno: 2, errmsg: "param invalid"});
                return
            }

            var para = {
                id: activity_id
            };
            admin.mdb.collection('activity').findOne(para, function (e, r) {
                if(e) {
                    res.json({errno: 1, errmsg: e.errmsg});
                    return;
                }

                if(!r) {
                    res.json({errno: 3, errmsg: "no activity"});
                    return;
                }

                var now = new Date();
                var current_timestamp = Math.floor(now.getTime()/1000);
                var interval_time = r.end_time - r.start_time;
                var interval_day = Math.floor(interval_time/86400);
                var interval_hour = Math.floor((interval_time - interval_day*86400)/3600);

                var remains_time = r.end_time - current_timestamp;
                if(remains_time < 0) {
                    remains_time = 0;
                }
                var remains_day = Math.floor(remains_time/86400);
                var remains_hour = Math.floor((remains_time - remains_day*86400)/3600);

                r.interval_time = interval_day.toString() + " " + interval_hour.toString();
                r.remains_time = remains_day.toString() + " " + remains_hour.toString();

                res.json(r);
                return;
            });


        },
        getActivityList: function (req, res) {
             if (!admin.checkLevel(req, [1, 3, 10])) {
             res.json({er: 1});
             return;
             }

             var member = admin.getMember(req);
             if (0 == member || !member) {
             res.json({er: 1});
             return;
             }

            var start = req.body.start;
            var limit = req.body.limit;
            var activity_status = req.body.activity_status;

            if (typeof start != 'number' || start < 0) {
                start = 0;
            }
            if (typeof limit != 'number' || limit < 0 || limit > 100) {
                limit = 10;
            }

            var para = {
                _id: {$ne: "activity_id"},
                flag: {$ne: "iter_cursor"}
            };
            if (typeof status == 'string') {
                para.status = status;
            }

            var response = [];
            var cnt = 0;
            admin.mdb.collection('activity').count(para, function(e, r){
               if(e) {
                   res.json({errno: 1, errmsg: e.errmsg});
                   return;
               }
               if(typeof r != "number") {
                   res.json({errno: 1, errmsg: "no record"});
                   return;
               }

               cnt = r;
               var now = new Date();
               var current_timestamp = Math.floor(now.getTime()/1000);
               admin.mdb.collection('activity').find(para).sort({"status":1, 'start_time':1}).skip(start).limit(limit).each(function (e, r) {
                    if (r) {
                        delete r._id;

                        var interval_time = r.end_time - r.start_time;
                        var interval_day = Math.floor(interval_time/86400);
                        var interval_hour = Math.floor((interval_time - interval_day*86400)/3600);

                        var remains_time = r.end_time - current_timestamp;
                        if(remains_time < 0) {
                            remains_time = 0;
                        }
                        var remains_day = Math.floor(remains_time/86400);
                        var remains_hour = Math.floor((remains_time - remains_day*86400)/3600);

                        r.interval_time = interval_day.toString() + " " + interval_hour.toString();
                        r.remains_time = remains_day.toString() + " " + remains_hour.toString();

                        response.push(r);

                    } else {
                        res.json({total: cnt, rows:response});
                    }
               });
            });

        },
        getActivityUserList: function (req, res) {
            if (!admin.checkLevel(req, [3, 10])) {
                res.json({er: 1});
                return;
            }

            var member = admin.getMember(req);
            if (0 == member || !member) {
                res.json({er: 1});
                return;
            }

            var activity_id = req.body.activity_id;
            var start = req.body.start;
            var limit = req.body.limit;
            if (typeof activity_id != 'number' || activity_id < 0) {
                res.json({errno: 2, errmsg: "param invalid"});
                return
            }

            if (typeof limit != 'number' || limit < 0 || limit > 100) {
                limit = 10;
            }
            if (typeof start != 'number' || start < 0) {
                start = 0;
            }
            if (typeof limit != 'number' || limit < 0 || limit > 100) {
                limit = 10;
            }

            admin.mdb.collection('activity').findOne({id: activity_id}, function (err, doc) {
                if (err) {
                    res.json({errno: 1, errmsg: err.errmsg});
                    return;
                }

                if (!doc) {
                    res.json({errno: 1, errmsg: "no this activity"});
                    return;
                }

                var response = [];
                var cnt = 0;
                admin.mdb.collection("activity_id_" + doc.id + "_user_stastic").count({}, function(e, r){
                    if(e) {
                        res.json({errno: 1, errmsg: e.errmsg});
                        return;
                    }
                    if(typeof r != "number") {
                        res.json({errno: 1, errmsg: "no record"});
                        return;
                    }
                    cnt = r;

                    admin.mdb.collection("activity_id_" + doc.id + "_user_stastic").find({}).skip(start).limit(limit).each(function (e, r) {
                        if (r) {
                            delete r._id;
                            response.push(r);
                        } else {
                            res.json({total: cnt, rows:response});
                        }
                    });
                });




            });
        },
        issueReward: function (req, res) {
            var now = new Date();
            var current_timestamp = Math.floor(now.getTime()/1000);

            if(current_timestamp - issueRewardLockStartTime > issueRewardLockTimeout) {
                issueRewardLock = 0;
                issueRewardLockStartTime = current_timestamp;
            }

            if(1 == issueRewardLock) {
                res.json({er: 20});
                return;
            }
            issueRewardLock = 1;
            issueRewardLockStartTime = current_timestamp;

             if (!admin.checkLevel(req, [1, 3, 10])) {
             res.json({er: 1});
             issueRewardLock = 0;
             return;
             }

             var member = admin.getMember(req);
             if (0 == member || !member) {
                res.json({er: 1});
                issueRewardLock = 0;
                return;
             }
            var uid = req.body.uid;
            var activity_id = req.body.activity_id;
            if (typeof activity_id != 'number' || typeof uid != 'number' || uid < 0) {
                res.json({errno: 2, errmsg: "param invalid"});
                issueRewardLock = 0;
                return;
            }

            admin.mdb.collection('activity').findOne({id: activity_id}, function (err, doc) {
                if (err) {
                    admin.doLog("issue reward", {errno: 1, errmsg: err.errmsg}, "activity.log");
                    res.json({errno: 1, errmsg: err.errmsg});
                    issueRewardLock = 0;
                    return;
                }
                if (!doc) {
                    admin.doLog("issue reward", {errno: 1, errmsg: "no activity"}, "activity.log");
                    res.json({errno: 1, errmsg: "no activity"});
                    issueRewardLock = 0;
                    return;
                }
                var activity = doc;
                var reward_diamend = doc.reward_diamend;
                var reward_coin = doc.reward_coin;
                var reward_others = doc.reward_others;

                admin.mdb.collection("activity_id_" + activity.id + "_user_stastic").findOne({"uid": uid.toString()}, function (err, r) {
                    if (err) {
                        admin.doLog("issue reward", {errno: 1, errmsg: err.errmsg}, "activity.log");
                        res.json({errno: 1, errmsg: err.errmsg});
                        issueRewardLock = 0;
                        return;
                    }
                    if (!r) {
                        admin.doLog("issue reward", {errno: 1, errmsg: "no user"}, "activity.log");
                        res.json({errno: 1, errmsg: "no user"});
                        issueRewardLock = 0;
                        return;
                    }

                    if (activityUserStatus.reach_reward != r.status) {
                        admin.doLog("issue reward", {errno: 1, errmsg: "status:" + r.status}, "activity.log");
                        if (activityUserStatus.running == r.status) {
                            res.json({errno: 3, errmsg: "not reach reward condition"});
                            issueRewardLock = 0;
                            return
                        } else if (activityUserStatus.get_reward == r.status) {
                            res.json({errno: 4, errmsg: "already get reward condition"});
                            issueRewardLock = 0;
                            return
                        }

                        res.json({errno: 5, errmsg: "unkown status"});
                        issueRewardLock = 0;
                        return;
                    }

                    //调用mjserver发奖
                    var para = {
                        money: reward_diamend,
                        coin: reward_coin
                    };

                    var opLogRecord = {
                        money: reward_diamend,
                        coin: reward_coin,
                        uid: uid
                    };

                    var pkserver = admin.uid2pkplayer(uid);
                    admin.httpClient.postJson("UpdatePlayer", {
                        uid: uid,
                        update: {$inc: para}
                    }, pkserver.port + 1000, pkserver.host, function (er, rtn) {
                        if (rtn && typeof rtn.money == 'number') {
                            admin.opLog(member._id, admin.getClientIp(req), 'issue_reward_suceess', opLogRecord);
                            setGetReward(uid, activity);
                            res.json({errno: 0});
                            issueRewardLock = 0;
                            //添加充值记录
                            var msg = {};
                            msg.uid = uid;
                            msg.buyNum = reward_diamend;
                            msg.buyMoney = 0;
                            msg.buyNote = "活动奖励";
                            msg.byMid = member._id;
                            msg.byName = member.mName;
                            msg.adminLevel = member.adminLevel;
                            msg.money = rtn.money;
                            msg.buyTime = new Date();
                            msg.ip = admin.getClientIp(req);
                            var day = new Date();
		            day = (day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate()) + "";
                            admin.mdb.collection("userMoney" + day).insertOne(msg, function () {
                                admin.checkUserDay();
                            });

                        } else {
                            admin.opLog(member._id, admin.getClientIp(req), 'issue_reward_fail', opLogRecord);
                            res.json({errno: 6, errmsg: "call mjserver fail"});
                            issueRewardLock = 0;
                        }
                    });
                });
            });
        }
    }


    function scanGameLog() {
        var day = new Date().Format("yyyyMMdd");

        var uid_data = {};

        admin.mdb.collection("activity").findAndModify({"_id": "gamelog_iter_cursor_" + day}, [],
            {$inc: {'cnt': 0}, $set:{"activity_name": day.toString() + "gamelog_cursor", "flag": "iter_cursor", "id": day.toString()}}, {new: true, upsert: true}, function (er, rtn) {
                //获取cursor，不存在则初始化为0
                if(er) {
                    //console.log("scanGameLog err:" + er.errmsg);
                    admin.doLog("add activity", {errno:1, errmsg:"scanGameLog err:" + er.errmsg}, "activity.log");
                    return;
                }

                var cursor = admin.mdb.collection('gameLog' + day).find().skip(rtn.value.cnt).limit(5000).batchSize(10);
                var new_record = 0;
                cursor.each(function (err, doc) {
                    if (doc) {
                        //金币场的不纳入统计
                        if(0 == doc.money && 1 == doc.createRound) {
                            return;
                        }

                        new_record++;

                        var round = doc.createRound - doc.remainRound;
                        if(!uid_data[doc.uid1]) {
                            uid_data[doc.uid1] = {};
                        }
                        if(!uid_data[doc.uid2]) {
                            uid_data[doc.uid2] = {};
                        }
                        if(!uid_data[doc.uid3]) {
                            uid_data[doc.uid3] = {};
                        }
                        if(!uid_data[doc.uid4]) {
                            uid_data[doc.uid4] = {};
                        }

                        if(!uid_data[doc.uid1].complete_createroom) {
                            uid_data[doc.uid1].complete_createroom = 0;
                        }
                        if(!uid_data[doc.uid1].complete_yuanbao) {
                            uid_data[doc.uid1].complete_yuanbao = 0;
                        }
                        if(!uid_data[doc.uid2].complete_createroom) {
                            uid_data[doc.uid2].complete_createroom = 0;
                        }
                        if(!uid_data[doc.uid2].complete_yuanbao) {
                            uid_data[doc.uid2].complete_yuanbao = 0;
                        }
                        if(!uid_data[doc.uid3].complete_createroom) {
                            uid_data[doc.uid3].complete_createroom = 0;
                        }
                        if(!uid_data[doc.uid3].complete_yuanbao) {
                            uid_data[doc.uid3].complete_yuanbao = 0;
                        }
                        if(!uid_data[doc.uid4].complete_createroom) {
                            uid_data[doc.uid4].complete_createroom = 0;
                        }
                        if(!uid_data[doc.uid4].complete_yuanbao) {
                            uid_data[doc.uid4].complete_yuanbao = 0;
                        }

                        uid_data[doc.uid1].complete_createroom += 1;
                        uid_data[doc.uid1].complete_yuanbao += doc.money;

                        if(!uid_data[doc.uid1].complete_round) {
                            uid_data[doc.uid1].complete_round = 0;
                        }
                        if(!uid_data[doc.uid2].complete_round) {
                            uid_data[doc.uid2].complete_round = 0;
                        }
                        if(!uid_data[doc.uid3].complete_round) {
                            uid_data[doc.uid3].complete_round = 0;
                        }
                        if(!uid_data[doc.uid4].complete_round) {
                            uid_data[doc.uid4].complete_round = 0;
                        }
                        uid_data[doc.uid1].complete_round += round;
                        uid_data[doc.uid2].complete_round += round;
                        uid_data[doc.uid3].complete_round += round;
                        uid_data[doc.uid4].complete_round += round;

                        if(!uid_data[doc.uid1].complete_bigwinner) {
                            uid_data[doc.uid1].complete_bigwinner = 0;
                        }
                        if (doc.winall1 > 0) {
                            uid_data[doc.uid1].complete_bigwinner += 1;
                        }

                        if(!uid_data[doc.uid2].complete_bigwinner) {
                            uid_data[doc.uid2].complete_bigwinner = 0;
                        }
                        if (doc.winall2 > 0) {
                            uid_data[doc.uid2].complete_bigwinner += 1;
                        }

                        if(!uid_data[doc.uid3].complete_bigwinner) {
                            uid_data[doc.uid3].complete_bigwinner = 0;
                        }
                        if (doc.winall3 > 0) {
                            uid_data[doc.uid3].complete_bigwinner += 1;
                        }

                        if(!uid_data[doc.uid4].complete_bigwinner) {
                            uid_data[doc.uid4].complete_bigwinner = 0;
                        }
                        if (doc.winall4 > 0) {
                            uid_data[doc.uid4].complete_bigwinner += 1;
                        }
                    } else {
                        if (0 == new_record) {
                            return;
                        }
                        admin.mdb.collection("activity").findAndModify({"_id": "gamelog_iter_cursor_" + day}, [],
                            {$inc: {'cnt': new_record}}, {new: true, upsert: true}, function (er, rtn) {

                                if (!er) {
                                    admin.mdb.collection('activity').find({status: activityStatus.running}).each(function (err, doc) {
                                        if (err) {
                                            res.json({errno: 1, errmsg: err.errmsg});
                                            return;
                                        }

                                        if (doc) {
					    if(uid_data[0]){
						delete uid_data[0];
					    }
                                            addActivityData(doc, uid_data);
                                        }
                                    });

                                }
                            });

                    }
                });



                return;
            });
    }

    function addActivityData(activity, uid_data) {
        var now = new Date();
        var current_timestamp = Math.floor(now.getTime()/1000);
        if(current_timestamp > activity.end_time || current_timestamp < activity.start_time) {
            admin.doLog("add activity", {errno:1, errmsg:"not in right time range"}, "activity.log");
            return;
        }

        if(activity.status != activityStatus.running) {
            admin.doLog("add activity", {errno:1, errmsg:"not running"}, "activity.log");
            return;
        }

        for(uid in uid_data) {

            var para = {
                'complete_yuanbao' : uid_data[uid].complete_yuanbao,
                'complete_createroom' : uid_data[uid].complete_createroom,
                'complete_round' : uid_data[uid].complete_round,
                'complete_bigwinner' : uid_data[uid].complete_bigwinner
            }

            admin.mdb.collection("activity_id_" + activity.id + "_user_stastic").findAndModify({"uid":uid}, [], {$inc:para}, {new:true, upsert:true},function(er, rtn){
                if(!createActivityUserStatusIndex[activity.id]) {
                    createActivityUserStatusIndex[activity.id] = 1;

                    admin.mdb.collection("activity_id_" + activity.id + "_user_stastic").createIndex({"uid":1},{"background":1, "unique":true});
                }

                if(er) {
                    admin.doLog("add activity", {errno:1, errmsg:er.errmsg}, "activity.log");
                    return;
                }

                if(!rtn) {
                    admin.doLog("add activity", {errno:1, errmsg:"update fail"}, "activity.log");
                    return;
                }

                if(!rtn.value.join_time) {
                    var para = {
                        "single_condition_bitmap" : 0,
                        "join_time" : current_timestamp,
                        "reach_reward_time" : 0,
                        "get_reward_time" : 0,
                        "status" : activityUserStatus.running
                    };

                    admin.mdb.collection("activity_id_" + activity.id + "_user_stastic").updateOne({"uid":rtn.value.uid}, {$set: para}, function(err, r){
                        if (err) {
                            admin.doLog("add activity", {errno:1, errmsg:er.errmsg}, "activity.log");
                            return;
                        } else {
                            if (1 != r.matchedCount) {
                                admin.doLog("add activity", {errno:1, errmsg:"no uid in activity"}, "activity.log");
                                return;
                            }

                            rtn.value.status = activityUserStatus.running;
                            verifyReachReward(activity, rtn.value, current_timestamp);

                            return;
                        }
                    });

                    //更新activity的统计数据
                    var para = {
                        "join_cnt": 1,
                    }
                    admin.mdb.collection('activity').updateOne({id:activity.id}, {$inc: para}, function(err, r){
                        if (err) {
                            admin.doLog("add activity join_cnt stastic", {errno:1, errmsg:er.errmsg}, "activity.log");
                        } else {
                            if (1 != r.matchedCount) {
                                admin.doLog("add activity join_cnt stastic", {errno:1, errmsg:"incr stastic fail"}, "activity.log");
                            }
                        }
                    });
                } else {
                    verifyReachReward(activity, rtn.value, current_timestamp);
                }

            });
        }
    }

    function setGetReward(uid, activity) {
        var now = new Date();
        var current_timestamp = Math.floor(now.getTime()/1000);
        var para = {
            "get_reward_time": current_timestamp,
            "status": activityUserStatus.get_reward
        };
        admin.mdb.collection("activity_id_" + activity.id + "_user_stastic").updateOne({"uid":uid.toString()}, {$set: para}, function(err, r){
            if (err) {
                admin.doLog("set get reward", {errno:1, errmsg:err.errmsg}, "activity.log");
                return;
            } else {
                if (!r || 1 != r.matchedCount) {
                    admin.doLog("set get reward", {errno:1, errmsg:"no uid in activity"}, "activity.log");
                    return;
                }

                //更新activity的统计数据
                var para = {
                    "get_reward_cnt": 1,
                }
                admin.mdb.collection('activity').updateOne({id:activity.id}, {$inc: para}, function(err, r){
                    if (err) {
                        admin.doLog("add activity get_reward_cnt stastic", {errno:1, errmsg:err.errmsg}, "activity.log");
                    } else {
                        if (!r || 1 != r.matchedCount) {
                            admin.doLog("add activity get_reward_cnt stastic", {errno:1, errmsg:"incr stastic fail"}, "activity.log");
                        }
                    }
                });

                return;
            }
        });
    }



    function verifyReachReward(activity, user_record, current_timestamp) {
        if (user_record.status != activityUserStatus.running) {
            return;
        }

        var bitmap = user_record.single_condition_bitmap;
        if(!bitmap) {
            bitmap = 0;
        }
        var conditionCnt = {
            complete_yuanbao_cnt : 0,
            complete_createroom_cnt :0,
            complete_round_cnt: 0,
            complete_bigwinner_cnt: 0
        };

        //修改单个条件完成的计数
        //bitmap 设置
        //complete_yuanbao:8 complete_createroom:4 complete_round:2 complete_bigwinner:1
        var updatebitmap = false;
        if (user_record.complete_yuanbao >= activity.complete_yuanbao && !(bitmap & completeconditionBitmap.complete_yuanbao) ) {
            bitmap = bitmap | completeconditionBitmap.complete_yuanbao
            conditionCnt.complete_yuanbao_cnt = 1;
            updatebitmap = true;
        }
        if (user_record.complete_createroom >= activity.complete_createroom && !(bitmap & completeconditionBitmap.complete_createroom) ) {
            bitmap = bitmap | completeconditionBitmap.complete_createroom
            conditionCnt.complete_createroom_cnt = 1;
            updatebitmap = true;
        }

        if (user_record.complete_round >= activity.complete_round && !(bitmap & completeconditionBitmap.complete_round) ) {
            bitmap = bitmap | completeconditionBitmap.complete_round
            conditionCnt.complete_round_cnt = 1;
            updatebitmap = true;
        }

        if (user_record.complete_bigwinner >= activity.complete_bigwinner && !(bitmap & completeconditionBitmap.complete_bigwinner) ) {
            bitmap = bitmap | completeconditionBitmap.complete_bigwinner
            conditionCnt.complete_bigwinner_cnt = 1;
            updatebitmap = true;
        }

        if(updatebitmap) {
            var para = {
                single_condition_bitmap : bitmap
            };
            admin.mdb.collection("activity_id_" + activity.id + "_user_stastic").updateOne({"uid":user_record.uid}, {$set: para}, function(err, r){
                if (err) {
                    admin.doLog("add activity", {errno:1, errmsg:err.errmsg}, "activity.log");
                    return;
                } else {
                    if (1 != r.matchedCount) {
                        admin.doLog("add activity", {errno:1, errmsg:"no uid in activity"}, "activity.log");
                        return;
                    }

                    //更新activity的统计数据
                    admin.mdb.collection('activity').updateOne({id:activity.id}, {$inc: conditionCnt}, function(err, r){
                        if (err) {
                            admin.doLog("add activity conditionCnt stastic", {errno:1, errmsg:err.errmsg}, "activity.log");
                        } else {
                            if (1 != r.matchedCount) {
                                admin.doLog("add activity conditionCnt stastic", {errno:1, errmsg:"incr stastic fail"}, "activity.log");
                            }
                        }
                    });

                    return;
                }
            });
        }




        if (user_record.complete_yuanbao >= activity.complete_yuanbao &&
            user_record.complete_createroom >= activity.complete_createroom &&
            user_record.complete_round >= activity.complete_round &&
            user_record.complete_bigwinner >= activity.complete_bigwinner) {
            var para = {
              "reach_reward_time": current_timestamp,
                "status": activityUserStatus.reach_reward
            };

            admin.mdb.collection("activity_id_" + activity.id + "_user_stastic").updateOne({"uid":user_record.uid}, {$set: para}, function(err, r){
                if (err) {
                    admin.doLog("add activity", {errno:1, errmsg:err.errmsg}, "activity.log");
                    return;
                } else {
                    if (1 != r.matchedCount) {
                        admin.doLog("add activity", {errno:1, errmsg:"no uid in activity"}, "activity.log");
                        return;
                    }

                    //更新activity的统计数据
                    var para = {
                        "reach_reward_cnt": 1,
                    }
                    admin.mdb.collection('activity').updateOne({id:activity.id}, {$inc: para}, function(err, r){
                        if (err) {
                            admin.doLog("add activity reach_reward_cnt stastic", {errno:1, errmsg:err.errmsg}, "activity.log");
                        } else {
                            if (1 != r.matchedCount) {
                                admin.doLog("add activity reach_reward_cnt stastic", {errno:1, errmsg:"incr stastic fail"}, "activity.log");
                            }
                        }
                    });

                    return;
                }
            });
        }

    }

    function scanActivity() {
        var cursor = admin.mdb.collection("activity").find().batchSize(1000);

        var now = new Date();
        var current_timestamp = Math.floor(now.getTime()/1000);

        cursor.each(function (err, doc) {
            if (doc) {
                if(current_timestamp > doc.start_time && current_timestamp < doc.end_time && doc.status == activityStatus.not_start) {
                    var para = {
                        status: activityStatus.running
                    }

                    admin.mdb.collection('activity').updateOne({id:doc.id}, {$set: para}, function(err, r) {
                        if (err) {
                            admin.doLog("update activity fail", {errno: 1, errmsg: err.errmsg}, "activity.log");
                        } else {
                            if (1 != r.matchedCount) {
                                admin.doLog("update activity fail", {
                                    errno: 1,
                                    errmsg: "update activity fail"
                                }, "activity.log");
                            }
                        }
                    });

                }
                if(current_timestamp > doc.end_time && doc.status == activityStatus.running) {
                    var para = {
                        status: activityStatus.time_end_stop
                    }

                    admin.mdb.collection('activity').updateOne({id:doc.id}, {$set: para}, function(err, r) {
                        if (err) {
                            admin.doLog("update activity fail", {errno: 1, errmsg: err.errmsg}, "activity.log");
                        } else {
                            if (1 != r.matchedCount) {
                                admin.doLog("update activity fail", {
                                    errno: 1,
                                    errmsg: "update activity fail"
                                }, "activity.log");
                            }
                        }
                    });
                }

                var round = doc.createRound - doc.remainRound
            }

        });
    }





    function cronTask() {
        if(admin.jsonCfg.startActivityScan != 1) {
            return
        }
        schedule.scheduleJob('*/60 * * * * *', function(){
            //console.log("start scan gamelog");
            scanGameLog();
        });

        schedule.scheduleJob('*/60 * * * * *', function(){
            //console.log("start scan activity");
            scanActivity();
        });
    }

    function updateActivityStastic(){
        admin.mdb.collection('activity').find({status:activityStatus.running}).each(function(err, doc) {
            if(err) {
                admin.doLog("updateActivityStastic", {errno:1, errmsg:er.errmsg}, "activity.log");
                return
            }
            if(!doc) {
                admin.doLog("updateActivityStastic", {errno:1, errmsg:"no activity"}, "activity.log");
                return
            }

            var now = new Date();
            var current_timestamp = Math.floor(now.getTime()/1000);
            if(current_timestqmp > doc.end_time || current_timestqmp < doc.start_time) {
                return;
            }

            var activity_id = doc.id;

            var join_cnt = 0;
            var reach_reward_cnt = 0;
            var get_reward_cnt = 0;
            admin.mdb.collection("activity_id_" + doc.id + "_user_stastic").find({}).batchSize(100).each(function (e, r) {
                if (r) {
                    if(activityUserStatus.get_reward == r.status){
                        get_reward_cnt++;
                    } else if(activityUserStatus.reach_reward == r.status){
                        reach_reward_cnt++;
                    }
                    join_cnt++;
                } else {
                    var para = {
                        "join_cnt": join_cnt,
                        "reach_reward_cnt": reach_reward_cnt,
                        "get_reward_cnt": get_reward_cnt,
                    }
                    admin.mdb.collection('activity').updateOne({id:activity_id}, {$set: para}, function(err, r){
                        if (err) {
                            res.json({errno:1, errmsg:er.errmsg});
                        } else {
                            if (1 == r.matchedCount) {
                                res.json({errno:0});
                            } else {
                                res.json({errno:1, errmsg:"no activity"});
                            }
                        }
                    });
                }
            });
        });
    }
    cronTask();
    return rtn;
}
