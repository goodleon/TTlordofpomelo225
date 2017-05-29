/**
 * 废弃！！！：userStatistics已有统计
 * Created by HJF on 2017/02/14 0022.
 * 每小时对战场次统计
 * gameLog20161101 --> userStatistics
 */
module.exports = function(dbUrl, day, endF, errF)
{
    if(typeof day != 'string') {
        console.info('typeof day  must be string !!');
        !errF || errF('typeof day  must be string !!');
        return;
    }
    if(day.length != 8){
        console.info('day\'s format invaid !!');
        !errF || errF('day\'s format invaid !!');
        return;
    }
    require('mongodb').MongoClient.connect(dbUrl, function (er, db)
    {

        if(!db)
        {
            !errF || errF(dbUrl+"connect ERROR!!!");
            return;
        }
        var HOUR = 24;
        var user = []; //每小时对战场次
        var totals = 0;//总对战场次
        for(var i = 0; i < HOUR; i++)
        {
            user.push(0);
        }
        console.log('day',day,dbUrl);
        var gameLogDay = 'gameLog'+day;
        db.collection(gameLogDay).find().each(function (err, doc) {
            if(doc)
            {
                if(doc.time)
                {
                    var hour = new Date(doc.time).getHours();
                    user[hour]++;
                }
            }
            else
            {
                console.log('user', JSON.stringify(user));
                db.collection(gameLogDay).count(function (er, rtn) {
                    totals = rtn;
                    db.collection("userStatistics").update({_id: Number(day)}, {'$set': {vipTableCount: totals, vipTableTime:user}}, {upsert:true}, function () {db.close()});
                });
            }
        });

    });
}


/*
废弃！！！：userStatistics已有统计
 每小时对战场次统计
 1:重头开始跑
 node userGameLog.js 1 'scmj'
 2:跑指定日期
 node userGameLog.js '20161201' 'scmj'
 3:跑前一天
 node userGameLog.js 'scmj'
 */
var tools = require("./../tools")();
const userGameLog = require('./userGameLog.js');
var date = null;
var today = null;
var serverInfo = require('./../config.json');
tools.url = 'mongodb://' + serverInfo.db.ip +':' +serverInfo.db.port + '/' + process.argv[3];
if(process.argv.length == 4 && process.argv[2] == 1) {
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

        userGameLog(tools.url, str, function (msg) {
            console.info(msg);
            date.setDate(date.getDate() + 1);
            runStatic();
        }, function (msg) {
            console.info(msg);
            date.setDate(date.getDate() + 1);
            runStatic();
        });
    }

    runStatic();
}
else if(process.argv.length == 4 && process.argv[2].length == 8)
{
    //跑指定日期
    userGameLog(tools.url, process.argv[2], function (msg) {
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
    userGameLog(tools.url, day, function (msg) {
        console.info(msg);
    }, function (msg) {
        console.info(msg);
    });
}
