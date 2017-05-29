/**
 * Created by HJF on 2017/02/16 0022.
 * 跨时间段统计用户充钻人数（去重）
 * userMoney20161014 --> total（不入库）
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
    var dbUrl = 'mongodb://' + tools.dbServer +':' +serverInfo.db.port + '/' + dbName;
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

            console.info('==========统计============', start, end);
            var uidObjKeys = Object.keys(uidObj);
            var uidAll = {};
            var uidMonth = {};
            for(var i = 0; i < uidObjKeys.length;i++)
            {
                //日人数
                var uidDay = uidObjKeys[i];
                var uidDayKeys = Object.keys(uidObj[uidDay])
                console.info('日人数 uidDay, uidDayKeys.length', uidDay, uidDayKeys.length);

                var month = uidDay.substr(0,6);
                if(!uidMonth[month])
                {
                    uidMonth[month] = {};
                }
                for(var uid in uidObj[uidDay])
                {
                    uidAll[uid] = 1;
                    uidMonth[month][uid] = 1;
                }
            }


            //月人数
            var uidMonthKeys = Object.keys(uidMonth);
            for(var i = 0; i < uidMonthKeys.length; i++)
            {
                var mMonth = uidMonthKeys[i];
                var mKeys = Object.keys(uidMonth[mMonth]);
                console.log("月人数 mMonth, mKeys.length",mMonth, mKeys.length);
            }
            //年人数
            var uidAllKeys = Object.keys(uidAll);
            console.info('合计', uidAllKeys.length);
        }
        function runStatic() {
            var day = tools.Format(date, 'yyyyMMdd');

            if (parseInt(day) > today) {
                userInfo();
                db.close();
                return;
            }

            var uidDay = {};
            var userMoneyDay = 'userMoney'+day;
            uidObj[day] = {};
            db.collection(userMoneyDay).find({buyType:"1"},{_id:0, uid:1, buyType:1, adminLevel:1, buyNum:1}).each(function (err, doc) {
                if(doc)
                {
                    var uid = doc.uid;
                    if(uid)
                    {
                        uidObj[day][uid] = 1;
                        uidDay[uid] = 1;
                    }
                }
                else
                {
                    var uidDayKeys = Object.keys(uidDay);
                    console.info('day, uidDayKeys.length', day, uidDayKeys.length);
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
 node userMoney.js '20161201' '20161231' 'scmj'
 */

if(process.argv.length == 5) {

    var userMoney = require('./userMoney.js');
    var start = process.argv[2];
    var end = process.argv[3];
    var dbName = process.argv[4];
    userMoney(start,end,dbName);
}
