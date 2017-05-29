/**
 * Created by lhq on 2016/11/9 0009.
 * 玩家查询，需要统计战绩日志中的消耗，创建房间数量，参与数量
 */

module.exports=function(admin) {
    var tools = require("../tools.js")();
    var postAdmin = require("./admin.js")(admin);
    var postTools = require("./tools.js")(admin);
    var events = require('events');
    // var eventEmitter = new events.EventEmitter();
    var dbIp =  "106.14.20.195";
    var dbPort =  900
    console.log('dataCenter', dbIp, dbPort);
    var project = {
        scmj:     '四川麻将',
        ddz:      '斗地主',
        gzmj:     '贵州麻将',
        pdk:      '跑得快',
        sxmj:     '陕西麻将',
        phz:      '跑胡子',
        hnmj:     '湖南麻将',
        ynmj:     '云南麻将',
        fjmj:     '福建麻将',
        kwx:      '卡五星',
        xynmmj:   '内蒙麻将',
        zjmj:     '浙江麻将',
        gxmj:     '广西麻将',
        gdmj:     '广东麻将',
        gxphz:    '广西跑胡子',
        jxmj:     '江西麻将',
        gsmj:     '甘肃麻将',
        henmj:    '河南麻将',
        nxmj:     '宁夏麻将',
        sdmj:     '山东麻将',
        ljmj:     '辽宁麻将',
        ahmj:     '安徽麻将',
        jsmj:     '江苏麻将',
        hanmj:    '海南麻将',
        guandan:  '掼蛋',
        ylgymj:   '贵阳麻将',
        psz:      '热血海南'
    };
    return {
        getUser: function (req, res) {
            if (!admin.checkLevel(req, [1, 3, 10])) {
                res.json({er: 1});
                return;
            }

            var uid = req.body.uid;
            var start = req.body.start;
            var days = req.body.days;

            if (typeof uid != 'number') {
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

            if (days > 7) {
                days = 7;
            } else if (days < 1) {
                days = 1;
            }


            var rtn = {};

            admin.mdb.collection('majiang').findOne({_id: uid}, {}, function (er, doc) {
                if (er || !doc) {
                    res.json({er: 3});
                    return;
                }

                rtn.uid = uid;
                rtn.money = doc.money;
                rtn.data = [];

                var para = {};
                para.$or = [];
                para.$or.push({uid1: uid});
                para.$or.push({uid2: uid});
                para.$or.push({uid3: uid});
                para.$or.push({uid4: uid});

                function getGameLog(day) {
                    var data = {};
                    data.day = day;
                    data.money = 0;
                    data.create = 0;
                    data.join = 0;

                    admin.mdb.collection('gameLog' + day).find(para).each(function (e, r) {
                        if (r) {
                            if (uid == r.uid1) {
                                data.money += r.money;
                                data.create++;
                            }

                            data.join += r.createRound - r.remainRound;
                        } else {
                            rtn.data.push(data);

                            if (rtn.data.length == days) {
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
        getUserStatistics: function (req, res) {
            if (!admin.checkLevel(req, [1, 3, 10])) {
                res.json({er: 1});  // 权限错误
                return;
            }
            if(!req.body.dbName)
            {
                req.body.dbName = admin.dbName;
            }
            //console.log("--------command-----------",dbPort, dbIp, JSON.stringify(req.body));
            admin.httpClient.postJson("userData/getUserStatistics", req.body, dbPort, dbIp, function (er,rtn) {
                if (er || !rtn) {
                    res.json({er: 3});
                    return;
                }
                else
                {
                    res.json(rtn);
                }
            });

        },
        getUserStatisticsActive: function (req, res) {
            //3日活跃	 7日活跃 15日活跃 30日活跃
            if (!admin.checkLevel(req, [1, 3, 10])) {
                res.json({er: 1});  // 权限错误
                return;
            }
            var info = req.body;
            if (!info.start || !info.end || !admin.mdb) {
                res.json({er: 2});  // 数据错误
                return;
            }
            if(!req.body.dbName)
            {
                req.body.dbName = admin.dbName;
            }
            var strdate = info.start;
            if(strdate.length == 8)//多取一天计算登录和活跃增长
            {
                strdate = strdate.substr(0,4) + '-' + strdate.substr(4,2) + '-' + strdate.substr(6,2);
                strdate = new Date(strdate);
                strdate.setDate(strdate.getDate() - 1);
                strdate = tools.Format(strdate, 'yyyyMMdd')
            }
            var command = {_id: {$lte: Number(info.end), $gte: Number(strdate)}};
            //console.log("--------command-----------",dbPort, dbIp, JSON.stringify(req.body));
            admin.httpClient.postJson("userData/getUserStatistics", req.body, dbPort, dbIp, function (er,rtn) {
                if (er || !rtn) {
                    res.json({er: 3});
                    return;
                }
                else
                {
                    // res.json(rtn);
                    //console.log("--------dayLog_command-----------",JSON.stringify(command));
                    var active = {};
                    admin.mdb.collection("dayLog").find(command).each(function(er,doc){
                        if(doc){
                            active[doc._id] = doc;
                        }
                        else
                        {
                            // console.log("--------active-----------",JSON.stringify(active));
                            for (var count = 1; count < rtn.rows.length; count++) {
                                var info = rtn.rows[count];
                                var day = info._id;
                                var activeData = active[day];
                                info.allCount = 0;
                                info.gameCount = 0;
                                info.gameCount3 = 0;
                                info.gameCount7 = 0;
                                info.gameCount15 = 0;
                                info.gameCount30 = 0;

                                info.gameMoney7 = 0;
                                info.gameMoney15 = 0;
                                info.gameMoney30 = 0;

                                info.userDiamonds = 0;
                                if(activeData)
                                {
                                    if(activeData.allCount)
                                    {
                                        info.allCount = activeData.allCount;
                                    }
                                    if(activeData.gameCount)
                                    {
                                        info.gameCount = activeData.gameCount;
                                    }
                                    if(activeData.gameCount3)
                                    {
                                        info.gameCount3 = activeData.gameCount3;
                                    }
                                    if(activeData.gameCount7)
                                    {
                                        info.gameCount7 = activeData.gameCount7;
                                    }
                                    if(activeData.gameCount15)
                                    {
                                        info.gameCount15 = activeData.gameCount15;
                                    }
                                    if(activeData.gameCount30)
                                    {
                                        info.gameCount30 = activeData.gameCount30;
                                    }

                                    if(activeData.gameMoney7)
                                    {
                                        info.gameMoney7 = activeData.gameMoney7;
                                    }
                                    if(activeData.gameMoney15)
                                    {
                                        info.gameMoney15 = activeData.gameMoney15;
                                    }
                                    if(activeData.gameMoney30)
                                    {
                                        info.gameMoney30 = activeData.gameMoney30;
                                    }

                                    if(activeData.userMoney)
                                    {
                                        info.userDiamonds = activeData.userMoney;//所有用户钻石总余额
                                    }
                                }
                            }
                            res.json(rtn);
                        }
                    });
                }
            });

        },

        getMemberUserDayLog: function (req, res) {
            if (!admin.checkLevel(req, [10])) {
                res.json({er: 1});  // 权限错误
                return;
            }

            var keysServers = Object.keys(project);
            var keysServersLen = keysServers.length;
            var keysServersIdx = 0;
            var result = [];

            function execFunc() {
                var key  = keysServers[keysServersIdx];
                if(!key)
                {
                    return;
                }
                req.body.dbName = key;
                // console.log("==========", JSON.stringify(req.body),key,project[key]);
                admin.httpClient.postJson("userData/getMemberUserDayLog", req.body, dbPort, dbIp, function (er,rtn) {
                    if(rtn)
                    {
                        rtn.pKey = key;
                        rtn.pValue = project[key];
                        result.push(rtn);
                    }

                    if(++keysServersIdx < keysServersLen)
                    {
                        // eventEmitter.emit('next');
                        execFunc();
                    }
                    else
                    {
                        res.json({total: result.length, rows: result});
                    }

                });
            }
            // eventEmitter.on('next', execFunc);
            execFunc();
        },
        getUserConsumption: function (req,res) {
            if (!admin.checkLevel(req, [10])) {
                res.json({er: 1});  // 权限错误
                return;
            }
            if(!req.body.dbName)
            {
                req.body.dbName = admin.dbName;
            }
            admin.httpClient.postJson("userData/getUserConsumption", req.body, dbPort, dbIp, function (er,rtn) {
                if (er || !rtn) {
                    res.json({er: 3});
                    return;
                }
                else
                {
                    res.json(rtn);
                }
            });
        },
        getVipTableTime: function (req, res) {
            var keysServers = Object.keys(project);
            if(req.body.type == 1)//选单个产品
            {
                //单个产品权限：3、10
                if (!admin.checkLevel(req, [3,10])) {
                    res.json({er: 1});  // 权限错误
                    return;
                }
                //3级只能查看自己的产品
                var lev = admin.getLevel(req);
                keysServers = lev == 3 ? [admin.dbName]:[req.body.dbName];
            }
            else {
                if (!admin.checkLevel(req, [10])) {
                    res.json({er: 1});  // 权限错误
                    return;
                }
            }
            var keysServersLen = keysServers.length;
            var keysServersIdx = 0;
            var result = [];
            // console.log("=====11=====", JSON.stringify(req.body), keysServers);

            function getVipTableTimeFunc() {
                var key  = keysServers[keysServersIdx];
                if(!key)
                {
                    return;
                }
                req.body.dbName = key;
                // console.log("==========", keysServersIdx,JSON.stringify(req.body),key, project[key]);
                admin.httpClient.postJson("userData/getVipTableTime", req.body, dbPort, dbIp, function (er,rtn) {
                    if(rtn)
                    {
                        var data = {};
                        data.pKey = key;
                        data.pValue = project[key];
                        data.data = rtn;
                        result.push(data);
                    }

                    if(++keysServersIdx < keysServersLen)
                    {
                        // eventEmitter.emit('next');
                        getVipTableTimeFunc();
                    }
                    else
                    {
                        //console.log("result", JSON.stringify(result));
                        // res.json({total: result.length, rows: result});
                        res.json(result);
                    }

                });
            }
            // eventEmitter.on('next', getVipTableTimeFunc);
            getVipTableTimeFunc();
        },
        getIpLog:function (req,res) {
            if (!admin.checkLevel(req, [1,3,10])) {
                res.json({er: 1});  // 权限错误
                return;
            }
            if(!req.body.dbName)
            {
                req.body.dbName = admin.dbName;
            }
            // console.log("==========", keysServersIdx,JSON.stringify(req.body),key, project[key]);
            admin.httpClient.postJson("userData/getIpLog", req.body, dbPort, dbIp, function (er,rtn) {
                if (er || !rtn) {
                    res.json({er: 2});
                    return;
                }
                else
                {
                    res.json(rtn);
                }

            });
        },
        getPlayNum:function (req,res) {
            //玩家场次分布
            if (!admin.checkLevel(req, [1,3,10])) {
                res.json({er: 1});  // 权限错误
                return;
            }
            var startNum = req.body.startNum; //起始
            var intervalNum = req.body.intervalNum; //间隔
            var maxIndex = req.body.maxRow; //行数
            var type = req.body.type; //0:当天场次分布 1: 总的场次分布

            if(typeof startNum != 'number'
                || typeof intervalNum != 'number'
                || typeof maxIndex != 'number'
                || startNum < 0
                || intervalNum < 0
                || maxIndex < 0)
            {
                res.json({er: 2});  //参数错误
                return;
            }
            if((startNum % 50 != 0)//起始：50倍数
                || (intervalNum % 50 != 0)//间隔：50倍数 && 50~10000
                || (intervalNum < 50|| intervalNum > 10000)
                || (maxIndex < 10 || maxIndex > 50)) //行：10~50
            {
                res.json({er: 3});  //范围错误
                return;
            }
            var result = [];
            var index = 0;

            if(type == 1)//总的场次分布
            {
                function runPlayNum() {
                    if (index >= maxIndex) {
                        res.json({total:result.length, row:result});
                        return;
                    }
                    var parma = {$gte:startNum+intervalNum*index+(index>0?1:0), $lte:startNum+intervalNum*(index+1)};
                    admin.mdb.collection("majiang").count({playNum:parma}, function(er, cnt) {
                        result.push(er?0:cnt);
                        index++;
                        runPlayNum();
                    });
                }
                runPlayNum();
            }
            else//当天场次分布
            {
                var today = parseInt(tools.Format(new Date(), 'yyyyMMdd'));
                var idObj = {};
                var uids = [];
                admin.mdb.collection("majiangLog").find({lastGameDay:today},{_id:1}).each(function(err,doc){

                    if(doc)
                    {
                        var uid = doc._id ;
                        if(uid && !idObj[uid])
                        {
                            idObj[uid] = 1;
                            uids.push(uid);
                        }
                    }
                    else
                    {
                        function runPlayNum2() {
                            if (index >= maxIndex) {
                                res.json({total:result.length, row:result});
                                return;
                            }
                            var parma = {$gte:startNum+intervalNum*index+(index>0?1:0), $lte:startNum+intervalNum*(index+1)};
                            admin.mdb.collection("majiang").count({_id:{$in:uids},playNum:parma}, function(er, cnt) {
                                result.push(er?0:cnt);
                                index++;
                                runPlayNum2();
                            });
                        }
                        runPlayNum2();
                    }

                });
            }
        }
    }
}