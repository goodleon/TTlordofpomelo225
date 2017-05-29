/**
 * Created by HJF on 2017/1/5 0005.
 * 用户充值消费统计 userMoney20161014 --> userConsumption
 */

module.exports = function (dbUrl, day, endMsg, errMsg)
{
    if(typeof day != 'string') {
        console.info('typeof day  must be string !!');
        !errMsg || errMsg('typeof day  must be string !!');
        return;
    }
    if(day.length != 8) {
        console.info('day\'s format invaid !!');
        !errMsg || errMsg('day\'s format invaid !!');
        return;
    }
    require('mongodb').MongoClient.connect(dbUrl, function (err, db)
    {
        if(err) {
            console.info('db err ' + JSON.stringify(err));
            !errMsg || errMsg('db err ' +err);
            return;
        }

        var tools = require('./tools.js')();
        var events = require('events');

        var uids = [];//充钻人数
        var giveUids = [];//赠钻人数
        var allUsers = {};
        function initUsers(tDay) {
            if(allUsers[tDay])return;
            allUsers[tDay] = {};
            allUsers[tDay].buyNum = 0;//充钻人数
            allUsers[tDay].buyCount = 0;//充钻次数
            allUsers[tDay].buyDiamonds = 0;//购买钻石
            allUsers[tDay].userDiamonds = 0;//钻石余额
            allUsers[tDay].giveDiamonds = 0;//赠送钻石
            allUsers[tDay].giveCount = 0;//赠送次数
            allUsers[tDay].giveNum = 0;//赠钻人数
        }

        //获取充钻记录
        function getUserMoney()
        {
            db.collection('userMoney'+day).find().each(function (err, doc) {
                if(doc && doc.buyType)
                {
                    //类型：1或'1'充值，0或'0'赠送
                    if(Number(doc.buyType) == 0)//赠送
                    {
                        initUsers(day);
                        allUsers[day].giveDiamonds += doc.buyNum;
                        allUsers[day].giveCount++;//赠送次数
                        if(doc.uid && giveUids.indexOf(doc.uid) < 0)
                        {
                            giveUids.push(doc.uid);
                        }
                    }
                    else if(Number(doc.buyType) == 1)//充钻
                    {
                        initUsers(day);
                        allUsers[day].userDiamonds += doc.userMoney;//钻石余额
                        allUsers[day].buyDiamonds += doc.buyNum;//购买钻石
                        allUsers[day].buyCount++;//充钻次数
                        if(doc.uid && uids.indexOf(doc.uid) < 0)
                        {
                            uids.push(doc.uid);
                        }
                    }
                }

                if(!doc)
                {
                    setUserConsumption();
                }
            });
        }



        //写入表
        function setUserConsumption()
        {
            if(allUsers[day])
            {
                allUsers[day].buyNum = uids.length;//充钻人数
                allUsers[day].giveNum = giveUids.length;//赠钻人数
                db.collection('userConsumption').update({_id:Number(day)}, {$set:allUsers[day]}, {upsert:true},function (err, doc) {

                    if(err)
                    {
                        //连接失败会重连，这里不处理回调
                        // !errMsg || errMsg(day+', '+err);
                        // console.log("userConsumption 写入失败");
                    }
                    else
                    {
                        db.close();
                        !endMsg || endMsg("userConsumption 写入成功 " + day);
                        // console.log("userConsumption 写入成功 " + day);
                    }
                })
            }
            else
            {
                db.close();
                !errMsg || errMsg(day+" 无数据, 写入失败");
            }
        }

        getUserMoney();

    });
}



/*
 用户充钻消费统计
 1:重头开始跑
 node userConsumption.js 1
 2:跑指定日期
 node userConsumption.js 20161201
 3:跑前一天
 node userConsumption.js
 */
var tools = require("./tools")();
const userConsumption = require('./userConsumption.js');
var date = null;
var today = null;
if(process.argv.length == 3 && process.argv[2] == 1) {
    //从头开始跑的逻辑
    date = new Date('2016-7-1');
    today = tools.Format(new Date(),'yyyyMMdd');
    today = parseInt(today);
    function runStatic() {
        var str = tools.Format(date, 'yyyyMMdd') + "";

        if (parseInt(str) >= today) {
            console.info('static end');
            return;
        }

        userConsumption(tools.url, str, function (msg) {
            console.info(msg);
            date.setDate(date.getDate() + 1);
            runStatic();
        }, function (msg) {
            console.info(str, msg);
            // tools.wLog('userConsumption', msg, 'userConsumption');
            date.setDate(date.getDate() + 1);
            runStatic();
        });
    }

    runStatic();
}
else if(process.argv.length == 3 && process.argv[2].length == 8)
{
    //跑指定日期
    userConsumption(tools.url, process.argv[2], function (msg) {
        console.info(msg);
    }, function (msg) {
        console.info(msg);
    });
}
else
{
    //跑前一天的数据
    today = new Date();
    today.setDate(today.getDate() - 1);
    var day = tools.Format(today, 'yyyyMMdd');
    userConsumption(tools.url, day, function (msg) {
        console.info(msg);
    }, function (msg) {
        console.info(msg);
    });
}
