/**
 * Created by HJF on 2017/02/16 0022.
 * 每小时人数统计(只用于测试)
 * loginLog20170101 --> console.log();
 */
module.exports = function(start,end,dbName)
{
    if(typeof start != 'string' || typeof end != 'string') {
        console.info('typeof day  must be string !!');
        return;
    }
    if(start.length != 8 || end.length != 8){
        console.info('day\'s format invaid !!');
        return;
    }

    var tools = require("./../tools")();
    var serverInfo = require('./../config.json');
    var dbUrl = 'mongodb://' + serverInfo.db.ip +':' +serverInfo.db.port + '/' + dbName;
    var sStart = start.substr(0,4)+'-'+start.substr(4,2)+'-'+start.substr(6,2);
    var sEnd = end.substr(0,4)+'-'+end.substr(4,2)+'-'+end.substr(6,2);
    var date = new Date(sStart);
    var today = parseInt(end);
    console.log('sStart, sEnd, dbUrl', sStart, sEnd, dbUrl);
    require('mongodb').MongoClient.connect(dbUrl, function (er, db)
    {

        if(!db)
        {
            console.log(dbUrl+" connect ERROR!!!");
            return;
        }
        var uidObj = {};
        function userInfo() {
            var dayKeys = Object.keys(uidObj);
            for(var i = 0; i < dayKeys.length; i++)
            {
                var day = dayKeys[i];
                var dayHour = uidObj[day];
                var dayHourKeys = Object.keys(dayHour);
                var dayUid = {};
                for(var j = 0; j < dayHourKeys.length; j++)
                {
                    var our = dayHourKeys[j];
                    var ourKeys = Object.keys(dayHour[our]);
                    for(var uid in dayHour[our])
                    {
                        dayUid[uid] = 1;
                    }
                    console.log('day, our, ourKeys.length', day, our, ourKeys.length);
                }
                console.log('dayUid', Object.keys(dayUid).length);
            }
        }
        function runStatic() {
            var day = tools.Format(date, 'yyyyMMdd');

            if (parseInt(day) > today) {
                userInfo();
                db.close();
                return;
            }

            var dayUids = {};
            var loginLogDay = 'loginLog'+day;
            uidObj[day] = {};
            for(var i = 0; i < 24; i++)
            {
                uidObj[day][i] = {};
            }
            db.collection(loginLogDay).find({"type" : "doLogin"}).each(function (err, doc) {
                if(doc)
                {
                    var hour = new Date(doc.time).getHours();
                    var uid = doc.uid;
                    if(uid)
                    {
                        uidObj[day][hour][uid] = 1;
                        dayUids[uid] = 1;
                    }
                }
                else
                {
                    console.log('day, Object.keys(dayUids).length',day, Object.keys(dayUids).length);
                    date.setDate(date.getDate() + 1);
                    runStatic();
                }
            });

        }
        runStatic();

    });
}


/*
 1:跑指定日期
 node userLoginTest.js '20170101' '20170101' 'sxmj'
 */

if(process.argv.length == 5) {

    var userLoginTest = require('./userLoginTest.js');
    var start = process.argv[2];
    var end = process.argv[3];
    var dbName = process.argv[4];
    userLoginTest(start,end,dbName);
}
