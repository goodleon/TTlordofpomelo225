/**
 * Created by lhq on 2016/11/9 0009.
 * 玩家查询，需要统计战绩日志中的消耗，创建房间数量，参与数量
 */

module.exports=function(admin) {
    // var tools = require("../statistics/src/tools.js")();
    var tools = require("../tools.js")();
    console.log("-------post/userData.js-------");
    function getUserConsumption2(req, res) {
        // console.log("----> command 3333-----------",JSON.stringify(req.body));
        var info = req.body;
        var dbName = info.dbName;
        if (!admin.dataCenterDb[dbName]) {
            //如果没连接，连一个
            admin.connectDB(dbName, function () {
                getUserConsumption2(req, res);
            });
            return;
        }
        if (!admin.dataCenterDb[dbName]) {
            res.json({er: 2});  // 数据错误
            return;
        }

        var allUser = {};
        var total = {
            "buyNum": 0,//充钻人数
            "buyCount": 0,//充钻次数
            "buyDiamonds": 0,//购买钻石
            "userDiamonds": 0,//钻石余额
            "giveDiamonds": 0,//赠送钻石
            "giveCount": 0,//赠送次数
            "giveNum": 0//赠钻人数
        };
        function  initAllUser(month) {
            if(allUser[month])return;
            allUser[month] = {
                "buyNum": 0,//充钻人数
                "buyCount": 0,//充钻次数
                "buyDiamonds": 0,//购买钻石
                "userDiamonds": 0,//钻石余额
                "giveDiamonds": 0,//赠送钻石
                "giveCount": 0,//赠送次数
                "giveNum": 0//赠钻人数
            };
        }
        admin.dataCenterDb[dbName].collection('userConsumption').find().sort({_id: 1}).each(function (er, doc) {
            if(doc)
            {

                var sDay = doc._id.toString();
                var month = sDay.substr(0,6);
                initAllUser(month);

                if(typeof doc.buyNum != 'number' || isNaN(doc.buyNum))
                {
                    doc.buyNum = 0;
                }
                if(typeof doc.buyCount != 'number' || isNaN(doc.buyCount))
                {
                    doc.buyCount = 0;
                }
                if(typeof doc.buyDiamonds != 'number' || isNaN(doc.buyDiamonds))
                {
                    doc.buyDiamonds = 0;
                }
                if(typeof doc.userDiamonds != 'number' || isNaN(doc.userDiamonds))
                {
                    doc.userDiamonds = 0;
                }
                if(typeof doc.giveDiamonds != 'number' || isNaN(doc.giveDiamonds))
                {
                    doc.giveDiamonds = 0;
                }
                if(typeof doc.giveCount != 'number' || isNaN(doc.giveCount))
                {
                    doc.giveCount = 0;
                }
                if(typeof doc.giveNum != 'number' || isNaN(doc.giveNum))
                {
                    doc.giveNum = 0;
                }
                doc.buyNum = parseInt(doc.buyNum);
                doc.buyCount = parseInt(doc.buyCount);
                doc.buyDiamonds = parseInt(doc.buyDiamonds);
                doc.userDiamonds = parseInt(doc.userDiamonds);
                doc.giveDiamonds = parseInt(doc.giveDiamonds);
                doc.giveCount = parseInt(doc.giveCount);
                doc.giveNum = parseInt(doc.giveNum);

                allUser[month].buyNum += doc.buyNum;
                allUser[month].buyCount += doc.buyCount;
                allUser[month].buyDiamonds += doc.buyDiamonds;
                allUser[month].userDiamonds += doc.userDiamonds;
                allUser[month].giveDiamonds += doc.giveDiamonds;
                allUser[month].giveCount += doc.giveCount;
                allUser[month].giveNum += doc.giveNum;

                total.buyNum += doc.buyNum;
                total.buyCount += doc.buyCount;
                total.buyDiamonds += doc.buyDiamonds;
                total.userDiamonds += doc.userDiamonds;
                total.giveDiamonds += doc.giveDiamonds;
                total.giveCount += doc.giveCount;
                total.giveNum += doc.giveNum;

            }
            else
            {
                var result = [];
                for(var month in allUser)
                {
                    allUser[month].time = month;
                    result.push(allUser[month]);
                }
                // console.log("==========result.length=========", result.length);
                res.json({total: result.length, rows: result});
            }
        });
    }
    function getUserStatistics2(req, res)
    {
        // console.log("----> command 3333-----------",JSON.stringify(req.body));
        var info = req.body;
        var dbName = info.dbName;
        if(!admin.dataCenterDb[dbName])
        {
            //如果没连接，连一个
            admin.connectDB(dbName,function () {
                getUserStatistics2(req, res);
            });
            return;
        }

        if (!info.start || !info.end || !admin.dataCenterDb[dbName]) {
            res.json({er: 2});  // 数据错误
            return;
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
        // console.log("-00---> command: " + JSON.stringify(command));
        var result = [];
        var result2 = [];
        admin.dataCenterDb[dbName].collection("userStatistics").find(command).sort({_id: 1}).each(function (er, doc) {
            if (doc) {
                result.push(doc);
                // console.log("----> doc: " + JSON.stringify(doc));
            }

            if (!doc) {
                admin.dataCenterDb[dbName].collection("userConsumption").find(command).sort({_id: 1}).each(function (er, doc) {
                    if (doc) {
                        // console.log("userConsumption ----> doc: " + JSON.stringify(doc));
                        result2.push(doc);
                    }

                    if (!doc) {

                        var users = {};

                        for(var i = 0; i < result.length; i++)
                        {
                            var data = result[i]
                            var id  = data._id;
                            users[id] = data;
                        }

                        for(var i = 0; i < result2.length; i++)
                        {
                            var data = result2[i]
                            var id = data._id;
                            if(!users[id])
                            {
                                users[id] = {};
                            }
                            for(var key in data)
                            {
                                users[id][key] = data[key];
                            }
                        }

                        var relData = Object.keys(users);
                        var newData = [];
                        for (var count = 0; count < relData.length; count++) {
                            newData.push(users[relData[count]]);
                        }

                        res.json({total: result.length, rows: newData});
                    }
                });
            }
        });
    }
    function getMemberUserDayLog2(req, res) {
        var info = req.body;
        var dbName = info.dbName;
        if(!admin.dataCenterDb[dbName])
        {
            //如果没连接，连一个
            admin.connectDB(dbName,function () {
                getMemberUserDayLog2(req, res);
            });
            return;
        }

        if (!info.month || !admin.dataCenterDb[dbName]) {
            res.json({er: 2});  // 数据错误
            return;
        }
        var month = info.month;//201612
        var startDate1 = month + "01";//20161201
        var yesterday = new Date(new Date() - 1 * 24 * 60 * 60 * 1000);
        var yesterday2 = new Date(new Date() - 1 * 24 * 60 * 60 * 1000);
        var endDate = yesterday.Format('yyyyMMdd');//采集昨天

        //查询月
        var startDayNum = new Date(startDate1.substr(0, 4), startDate1.substr(4, 2), 0).getDate();//31
        var endDate1 = month + startDayNum;//20161231

        //上月
        var day2 = new Date(startDate1.substr(0, 4) + '-' + startDate1.substr(4, 2) + '-' + '01');
        day2.setMonth(day2.getMonth() - 1);
        var startDate2 = day2.Format('yyyyMMdd');//20170131
        var day2Num = new Date(startDate2.substr(0, 4), startDate2.substr(4, 2), 0).getDate();//31
        var endDate2 = startDate2.substr(0, 4) + startDate2.substr(4, 2) + day2Num;//20170101

        //最近7天
        yesterday.setDate(yesterday.getDate() - 6);
        var startDate3 = yesterday.Format('yyyyMMdd');

        //上月7天
        yesterday2.setMonth(yesterday2.getMonth() - 1);
        var endDate4 = yesterday2.Format('yyyyMMdd');
        yesterday2.setDate(yesterday2.getDate() - 6);
        var startDate4 = yesterday2.Format('yyyyMMdd');
        /*日期为： 20160901 20170205
         查询月，上月，最近7天，上月7天 20160901 20160930 20160801 20160831 20170130 20170205 20161230 20170105*/
        var command = {_id: {$lte: Number(endDate), $gte: Number(startDate2)}};
        // console.log("日期为：", startDate1, endDate);
        // console.log("查询月，上月，最近7天，上月7天", startDate1, endDate1, startDate2, endDate2, startDate3, endDate, startDate4, endDate4);
        var iStartDate1 = Number(startDate1);
        var iEndDate1 = Number(endDate1);
        var iStartDate2 = Number(startDate2);
        var iEndDate2 = Number(endDate2);
        var iStartDate3 = Number(startDate3);
        var iEndDate3 = Number(endDate);
        var iStartDate4 = Number(startDate4);
        var iEndDate4 = Number(endDate4);

        //会员充值
        var buyMoneyMember1 = 0;//查询月
        var buyMoneyMember2 = 0;//上月
        var buyMoneyMember3 = 0;//最近7天
        var buyMoneyMember4 = 0;//上月7天
        //玩家日活跃
        var gameCountUser1 = 0;//查询月
        var gameCountUser2 = 0;//上月
        var gameCountUser3 = 0;//最近7天
        var gameCountUser4 = 0;//上月7天
        //玩家场次
        var totalsUser1 = 0;//查询月
        var totalsUser2 = 0;//上月
        var totalsUser3 = 0;//最近7天
        var totalsUser4 = 0;//上月7天

        var totalEscape = {
            _id:1,
            dayMoney:1,
            allCount:1,
            gameCount:1,
            gameCount3:1,
            gameCount7:1,
            gameCount15:1,
            gameCount30:1,
            memberMoney:1,
            userMoney:1,
            fillMembersMoney:1,
            gameMoney:1,
            gameMoney3:1,
            gameMoney7:1,
            gameMoney15:1,
            gameMoney30:1,
        };
        admin.dataCenterDb[dbName].collection('memberDayLog').find(command).sort({_id: -1}).each(function (er, doc) {
            if (doc) {
                var day = doc._id;
                var buyMoney = doc.buyMoney;
                if (day >= iStartDate1 && day <= iEndDate1) {
                    buyMoneyMember1 += buyMoney;
                }
                if (day >= iStartDate2 && day <= iEndDate2) {
                    buyMoneyMember2 += buyMoney;
                }
                if (day >= iStartDate3 && day <= iEndDate3) {
                    buyMoneyMember3 += buyMoney;
                }
                if (day >= iStartDate4 && day <= iEndDate4) {
                    buyMoneyMember4 += buyMoney;
                }

            }
            if (!doc) {

                admin.dataCenterDb[dbName].collection('dayLog').find(command).sort({_id: -1}).each(function (er2, doc2) {
                    if (doc2) {

                        var day = doc2._id;
                        var gameCount = doc2.gameCount||0;
                        var totals = 0;//对战场次
                        for(var key in doc2)
                        {
                            if(!totalEscape[key])
                            {
                                totals += doc2[key];
                            }
                        }
                        if (day >= iStartDate1 && day <= iEndDate1) {
                            gameCountUser1 += gameCount;
                            totalsUser1 += totals;
                        }
                        if (day >= iStartDate2 && day <= iEndDate2) {
                            gameCountUser2 += gameCount;
                            totalsUser2 += totals;
                        }
                        if (day >= iStartDate3 && day <= iEndDate3) {
                            gameCountUser3 += gameCount;
                            totalsUser3 += totals;
                        }
                        if (day >= iStartDate4 && day <= iEndDate4) {
                            gameCountUser4 += gameCount;
                            totalsUser4 += totals;
                        }
                    }
                    if (!doc2) {
                        var result = {
                            buyMoneyMember1: buyMoneyMember1,
                            buyMoneyMember2: buyMoneyMember2,
                            buyMoneyMember3: buyMoneyMember3,
                            buyMoneyMember4: buyMoneyMember4,
                            //玩家日活跃
                            gameCountUser1: gameCountUser1,
                            gameCountUser2: gameCountUser2,
                            gameCountUser3: gameCountUser3,
                            gameCountUser4: gameCountUser4,
                            //玩家场次
                            totalsUser1: totalsUser1,
                            totalsUser2: totalsUser2,
                            totalsUser3: totalsUser3,
                            totalsUser4: totalsUser4,
                        };
                        // console.log("日活跃", JSON.stringify(result));
                        res.json(result);
                    }
                });
            }
        });
    }

    function getVipTableTime2(req, res)
    {
        var info = req.body;
        var dbName = info.dbName;
        if(!admin.dataCenterDb[dbName])
        {
            //如果没连接，连一个
            admin.connectDB(dbName,function () {
                getVipTableTime2(req, res);
            });
            return;
        }

        if (!info.day|| !admin.dataCenterDb[dbName]) {
            res.json({er: 2});  // 数据错误
            return;
        }
        var startDay = info.day;
        var endDay = null;
        if(startDay.length == 8)//多取10天
        {
            var sStartDay = startDay.substr(0,4) + '-' + startDay.substr(4,2) + '-' + startDay.substr(6,2);
            sStartDay = new Date(sStartDay);
            sStartDay.setDate(sStartDay.getDate() - 10);
            endDay = tools.Format(sStartDay, 'yyyyMMdd')
        }
        else
        {
            res.json({er: 3});  // day数据错误
            return;
        }
        var command = {_id: {$lte: Number(startDay), $gte: Number(endDay)}};
        console.log("command: " + JSON.stringify(command));
        var result = [];
        admin.dataCenterDb[dbName].collection("userStatistics").find(command, {vipTableCount:1,vipTableTime:1,vipTableTotal:1}).sort({_id: 1}).each(function (er, doc) {
            if (doc) {
                result.push(doc);
            }
            else
            {
                res.json(result);
            }

        });
    }
    function getIpLog2(req, res)
    {
        var info = req.body;
        var dbName = info.dbName;
        var day = info.day;
        var result = {};
        if(!admin.dataCenterDb[dbName])
        {
            //如果没连接，连一个
            admin.connectDB(dbName,function () {
                getIpLog2(req, res);
            });
            return;
        }
        if(!day || !Number(day))
        {
            res.json({er: 2});  //格式错误
            return;
        }
        /*admin.dataCenterDb[dbName].collection("ipLog"+day).find().each(function (er, doc) {
            if (doc) {
                if(doc.location)
                {
                    if(!result[doc.location])
                    {
                        result[doc.location] = 0;
                    }
                    result[doc.location]++;

                }
            }
            else{
                /!*!//排序后,最多下发max条数据
                result.sort(tools.jsonSort("location",true,parseInt));
                var keys  = Object.keys(result);
                var len = keys.length;
                var max = 1000;
                if(len > max)
                {
                    for(var i=max; i<len; i++)
                    {
                        delete result[keys[i]];
                    }
                }*!/

                //前端格式
                var fResult = [];
                for(var key in result)
                {
                    fResult.push({addr:key, total:result[key]})
                }
                //排序
                fResult.sort(tools.jsonSort("total",true,parseInt));
                console.log("fResult.length", fResult.length);
                res.json({total:fResult.length, rows:fResult});
            }
        });*/
        admin.dataCenterDb[dbName].collection("ipDayLog").find({_id:Number(day)}).each(function (er, doc) {
            if (doc) {
                if(doc.distribution)
                {
                    result = doc.distribution;
                }
            }
            else{
                /*//排序后,最多下发max条数据
                 result.sort(tools.jsonSort("location",true,parseInt));
                 var keys  = Object.keys(result);
                 var len = keys.length;
                 var max = 1000;
                 if(len > max)
                 {
                 for(var i=max; i<len; i++)
                 {
                 delete result[keys[i]];
                 }
                 }*/

                //前端格式
                var fResult = [];
                for(var key in result)
                {
                    fResult.push({addr:key, total:result[key]})
                }
                //排序
                fResult.sort(tools.jsonSort("total",true,parseInt));
                console.log("fResult.length", fResult.length);
                res.json({total:fResult.length, rows:fResult});
            }
        });
    }

    function getCustomDb2(req, res)
    {
        var info = req.body.dbCfg;
        var dbName = info.dbName;
        if(!admin.dataCenterDb[dbName])
        {
            //如果没连接，连一个
            admin.connectDB(dbName,function () {
                getCustomDb2(req, res);
            });
            return;
        }
        if (!info.collection || !admin.dataCenterDb[dbName]) {
            res.json({er: 2});  // 数据错误
            return;
        }
        if(!info.param)
        {
            info.param = {};
        }
        if(!info.filter)
        {
            info.filter = {};
        }
        if(!info.sort)
        {
            info.sort = {};
        }
        var result = [];
        admin.dataCenterDb[dbName].collection(info.collection).find(info.param,info.filter).sort(info.sort).each(function (er, doc){
            if (doc)
            {
                result.push(doc);
            }
            else
            {
                res.json({data:result});
            }
        });
    }
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
            getUserStatistics2(req, res);
        },
        getMemberUserDayLog: function (req, res) {
            getMemberUserDayLog2(req, res);
        },
        getUserConsumption:function (req, res) {
            getUserConsumption2(req, res);
        },
        /*对战场次|开房数量*/
        getVipTableTime:function (req, res) {
            getVipTableTime2(req, res);
        },
        getIpLog:function(req, res) {
            getIpLog2(req, res);
        },
        getCustomDb:function (req, res) {
            getCustomDb2(req, res);
        }
    }
}