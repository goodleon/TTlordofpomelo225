/**
 * Created by HJF on 2016/11/22 0022.
 * 用户登录/活跃留存
 * @param {string} dbUrl mongodbUrl
 * @param {string} day
 * userStatistics + cgbuser + loginLog20170101 + gameLog20170101 ==> userStatistics
 */
var allUsers = {};
var allTimes = {};
module.exports = function(dbUrl, day, endF, errF) {
    var startTime = new Date();
    var isRunAll = day == 1;
    if (day == 1) {
        day = new Date('2016-7-1'); //从头开始
    } else if (!day) {
        day = new Date(new Date() - 1 * 24 * 60 * 60 * 1000); //采集昨天
        allUsers = {};
        allTimes = {}
    } else {
        day = new Date(day); //指定日期
        allUsers = {};
        allTimes = {}
    }
    var tools = require("./tools")();
    var today = tools.Format(day, "yyyyMMdd");
    var userStatistics = "userStatistics"; //统计用户留存
    var MAX_HOUR = 24; //时间段
    var events = require('events');
    var eventEmitter = new events.EventEmitter();
    var regTotal = 0,
        loginTotal = 0,
        activeTotal = 0,
        vipTableTotal = 0; //注册、登录、活跃总人数,开房间总数
    var writeLen = 0;
    var KEY_ACTIVE = "_active";
    var iToday = Number(today);
    var vipTableArr = []; //房间数量
    var vipTableCount = 0;
    for (var i = 0; i < MAX_HOUR; i++) {
        vipTableArr.push(0);
    }

    if (today.length != 8) {
        !errF || errF(day + ", ERROR!!!");
        return;
    }
    console.log('today分析中', today, dbUrl);
    require('mongodb').MongoClient.connect(dbUrl, function(er, db) {

        if (!db) {
            !errF || errF(dbUrl + "connect ERROR!!!");
            return;
        }

        //注册人数
        var reg = {};
        //登录人数
        var login = {};
        //对战活跃人数
        var active = {}
            //对战场次
        var game = [];
        for (var i = 0; i < MAX_HOUR; i++) {
            game.push(0);
            login[i] = {};
            active[i] = {};
        }
        var MIN_UID = 9999;

        function closeDb() {
            db.close();
        }

        function getUserStatistics() {
            var yesterday = tools.Format(new Date(day - 1 * 24 * 60 * 60 * 1000), "yyyyMMdd");
            // console.log("yesterday", yesterday, today);
            db.collection(userStatistics).findOne({ _id: Number(yesterday) }, { regTotal: 1, loginTotal: 1, activeTotal: 1, vipTableTotal: 1 }, function(er, doc) {

                if (doc) {
                    if (doc.regTotal) {
                        regTotal += doc.regTotal;
                    }
                    if (doc.loginTotal) {
                        loginTotal += doc.loginTotal;
                    }
                    if (doc.activeTotal) {
                        activeTotal += doc.activeTotal;
                    }
                    if (doc.vipTableTotal) {
                        vipTableTotal += doc.vipTableTotal;
                    }
                    // console.log("regTotal", regTotal, loginTotal,activeTotal);
                }
                eventEmitter.emit('getCgbuser');
            });
        }
        //注册数据
        function getCgbuser() {
            var command = {};
            var timer = 1 * 24 * 60 * 60 * 1000;
            if (!isRunAll) {
                //当天-次日-3天-7天-15天-30天
                // var strDay = today.substr(0,4)+'-'+today.substr(4,2)+'-'+today.substr(6,2);
                var strDay = today.substr(0, 4) + '-' + today.substr(4, 2) + '-' + today.substr(6, 2) + ' 00:00:00'; //改成跟dayLog一致每天23:59:59采集注册数据
                var nextday = new Date(strDay);
                nextday.setMilliseconds(nextday.getMilliseconds() - 1000); //改成跟dayLog一致每天23:59:59采集注册数据
                nextday.setDate(nextday.getDate() + 1);
                var day = new Date(strDay);
                var day1 = { sendTime: { $gte: new Date(day), $lt: nextday } };
                var day2 = { sendTime: { $gte: new Date(day - 1 * timer), $lt: new Date(day) } };
                var day3 = { sendTime: { $gte: new Date(day - 2 * timer), $lt: new Date(day - 1 * timer) } };
                var day7 = { sendTime: { $gte: new Date(day - 6 * timer), $lt: new Date(day - 5 * timer) } };
                var day15 = { sendTime: { $gte: new Date(day - 14 * timer), $lt: new Date(day - 13 * timer) } };
                var day30 = { sendTime: { $gte: new Date(day - 29 * timer), $lt: new Date(day - 28 * timer) } };
                command = { $or: [day1, day2, day3, day7, day15, day30] };
            }

            // console.log("注册数据--- command:"+JSON.stringify(command));
            db.collection('cgbuser').find(command, { _id: 1, sendTime: 1 }).each(function(er, doc) {
                if (doc && doc._id && doc.sendTime) {
                    var uid = doc._id;
                    if (uid > MIN_UID) {

                        var sendTime = new Date(doc.sendTime);
                        var day = tools.Format(sendTime, 'yyyyMMdd');
                        if (!reg[day]) {
                            reg[day] = {};
                        }
                        reg[day][uid] = 1;
                    } else {
                        tools.wLog('cgbuser_error_id', JSON.stringify({ uid: uid, sendTime: doc.sendTime }), 'cgbuser_error_id');
                    }
                }
                if (!doc) {
                    eventEmitter.emit('getLoginLog');
                }
            });
        }

        //2、登录数据
        function getLoginLog() {
            db.collection('loginLog' + today).find({ 'type': 'doLogin' }).each(function(er, doc) {
                if (doc && doc.uid) {
                    var hour = new Date(doc.time).getHours();
                    var uid = doc.uid;
                    login[hour][uid] = 1;
                }
                if (!doc) {
                    eventEmitter.emit('getGameLog');
                }
            });
        }
        // 3、活跃数据(每日跑)
        function getGameLog() {
            db.collection('gameLog' + today).find().each(function(er, doc) {
                if (doc && doc.time) {
                    var hour = new Date(doc.time).getHours();
                    var td = {
                        uid1: doc.uid1,
                        uid2: doc.uid2,
                        uid3: doc.uid3,
                        uid4: doc.uid4,
                        uid5: doc.uid5,
                    };
                    //对战活跃人数
                    for (var uid in td) {
                        var mUid = td[uid];
                        if (mUid > MIN_UID) {
                            active[hour][mUid] = 1;
                        }
                    }
                    //对战小时场次
                    game[hour]++;

                }
                if (!doc) {
                    eventEmitter.emit('getAllInfo');
                }
            });
        }

        //分析
        function getAllInfo() {

            // console.log('===============分析================',today);
            var allInfo = {}; //写数据库详细数据
            allInfo[today] = {};
            allInfo[today].regCount = 0;
            allInfo[today][today] = 0;
            allInfo[today].regTotal = 0;
            //注册人数
            var regKeys = Object.keys(reg);
            //rla 记录注册当天在次日-3天-7天-15天-30天后的登录、活跃人数情况
            var rla = {};
            for (var i = 0; i < regKeys.length; i++) {
                var day = regKeys[i];
                var uids = reg[day];
                var uidsLen = Object.keys(uids).length;
                // console.log('注册人数',day, uidsLen);
                allInfo[day] = {};
                if (day == today) {
                    // console.log('总注册人数',uidsLen, uidsLen+regTotal);
                    allInfo[today].regCount = uidsLen;
                    allInfo[today][day] = uidsLen;
                    allInfo[today].regTotal = uidsLen + regTotal;
                }
                rla[day] = {
                    loginCount: 0,
                    activeCount: 0,
                }
            }
            //登录人数
            var loginKeys = Object.keys(login);
            var todayUidsLogin = {};
            var loginUid = [];
            for (var i = 0; i < loginKeys.length; i++) {
                var hours = loginKeys[i];
                var uids = login[hours];
                var count = Object.keys(uids).length;
                loginUid.push(count)
                for (var id in uids) {
                    todayUidsLogin[id] = 1;
                }
                // console.log('今天每小时登录人数',hours, count);
            }
            var tulKeys = Object.keys(todayUidsLogin);
            var todayUidsLoginLen = tulKeys.length;
            // console.log('今天登录人数',todayUidsLoginLen, todayUidsLoginLen+loginTotal, loginUid);
            allInfo[today].loginCount = todayUidsLoginLen;
            allInfo[today].loginTotal = todayUidsLoginLen + loginTotal;
            allInfo[today].loginTimes = loginUid;

            //注册id在今天登录统计
            for (var i = 0; i < todayUidsLoginLen; i++) {
                var uid = tulKeys[i];
                for (var j = 0; j < regKeys.length; j++) {
                    var day = regKeys[j];
                    var uidsReg = reg[day];
                    if (uid in uidsReg) {
                        rla[day].loginCount++;
                    }
                }
            }


            //对战活跃人数
            var activeKeys = Object.keys(active);
            var todayUidsActive = {};
            var activeUid = [];
            for (var i = 0; i < activeKeys.length; i++) {
                var hours = activeKeys[i];
                var uids = active[hours];
                var count = Object.keys(uids).length;
                activeUid.push(count);
                for (var id in uids) {
                    todayUidsActive[id] = 1;
                }
                // console.log('今天每小时对战活跃人数',hours, count);
            }
            var tuaKeys = Object.keys(todayUidsActive);
            var todayUidsActiveLen = tuaKeys.length;
            // console.log('今天对战活跃人数',todayUidsActiveLen, todayUidsActiveLen+activeTotal, activeUid);
            allInfo[today][today + KEY_ACTIVE] = todayUidsActiveLen;
            allInfo[today].activeCount = todayUidsActiveLen;
            allInfo[today].activeTotal = todayUidsActiveLen + activeTotal;
            allInfo[today].activeTimes = activeUid;
            //注册id在今天对战活跃统计
            for (var i = 0; i < todayUidsActiveLen; i++) {
                var uid = tuaKeys[i];
                for (var j = 0; j < regKeys.length; j++) {
                    var day = regKeys[j];
                    var uidsReg = reg[day];
                    if (uid in uidsReg) {
                        rla[day].activeCount++;
                    }
                }

            }
            //对战场次
            var gameTotal = 0;
            for (var i = 0; i < game.length; i++) {
                gameTotal += game[i];
            }
            // console.log('今天对战场次',gameTotal, gameTotal+vipTableTotal, game);
            // console.log('注册id在今天登录活跃统计',JSON.stringify(rla));
            allInfo[today].vipTableCount = gameTotal;
            allInfo[today].vipTableTime = game;
            allInfo[today].vipTableTotal = gameTotal + vipTableTotal;


            delete rla[today];
            for (var day in rla) {
                allInfo[day][today] = rla[day].loginCount;
                allInfo[day][today + KEY_ACTIVE] = rla[day].activeCount;
            }
            // console.log('入库 allInfo ',JSON.stringify(allInfo));
            writeDb(allInfo);
        }

        function writeDb(info) {
            var times = Object.keys(info);
            var i = 0;
            var writeLen = times.length;

            function save() {
                if (i >= writeLen) {
                    closeDb();
                    !endF || endF('分析结束', today);
                    return;
                }

                var time = times[i];
                var iTime = Number(time);
                var para = {};
                para.$set = info[time];
                db.collection(userStatistics).update({ _id: iTime }, para, { upsert: true }, function(er, rtn) {
                    i++;
                    // console.log('para',JSON.stringify(para),i,iTime);
                    save();
                });
            }
            save();
        }
        eventEmitter.on('getCgbuser', getCgbuser);
        eventEmitter.on('getLoginLog', getLoginLog);
        eventEmitter.on('getGameLog', getGameLog);
        eventEmitter.on('getAllInfo', getAllInfo);
        getUserStatistics();
    });
}


/*
 1:跑指定日期
 node userStatistics222.js '2017-01-01' 'sxmj'
 */

/*
var userStatistics222 = require("./userStatistics222.js");
var serverInfo = require('./config.json');
var dbUrl = 'mongodb://' + serverInfo.db.ip +':' +serverInfo.db.port + '/' + process.argv[3];
userStatistics222(dbUrl, process.argv[2], function (msg) {
    console.info(msg);
}, function (msg) {
    console.info(msg);
});*/