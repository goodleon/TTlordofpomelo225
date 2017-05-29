/**
 * Created by HJF on 2017/02/18 0022.
 * 临时测试：每小时统计今天场次
 * （因为dayLog每小时时间，采集有误差）
 */
module.exports = function(dbUrl, day, endF, errF,dayLogJson)
{
    var startTime = new Date();
    var tools = require("./tools")();

    var hour = day.getHours();
    var today = tools.Format(day, "yyyyMMdd");
    var userStatistics = "userStatistics";  //统计用户留存
    var MAX_HOUR = 24; //时间段
    var iToday = Number(today);
    var vipTableTime = [];//每小时场次
    var vipTableCount = 0;
    for(var i = 0; i < MAX_HOUR; i++)
    {
        vipTableTime.push(0);
    }

    if(today.length != 8)
    {
        !errF || errF(day + ", ERROR!!!");
        return;
    }
    // console.log('dbUrl',dbUrl);
    require('mongodb').MongoClient.connect(dbUrl, function (er, db) {

        if (!db) {
            !errF || errF(dbUrl + "connect ERROR!!!");
            return;
        }
        var totalEscape = {
            _id: 1,
            dayMoney: 1,
            allCount: 1,
            gameCount: 1,
            gameCount3: 1,
            gameCount7: 1,
            gameCount15: 1,
            gameCount30: 1,
            memberMoney: 1,
            userMoney: 1,
            fillMembersMoney: 1,
            gameMoney:1,
            gameMoney3:1,
            gameMoney7:1,
            gameMoney15:1,
            gameMoney30:1,
        };
        var nowCount = 0;//目前对战场次
        for (var key in dayLogJson) {
            if (!totalEscape[key]) {
                nowCount += dayLogJson[key];
            }
        }
        console.log("today, dbUrl", today, dbUrl);
        db.collection('userStatistics').findOne({_id: iToday}, {vipTableTotal: 1,vipTableCount: 1,vipTableTime: 1}, function (er, doc) {
            if (doc) {
                if (doc.vipTableTime) {
                    vipTableTime = doc.vipTableTime;
                }
            }
            //容错处理
            for(var i = 0; i < hour; i++)
            {
                vipTableCount += vipTableTime[i];
            }
            var curCount = nowCount - vipTableCount;
            vipTableTime[hour] = curCount;

            console.log("vipTableCount, vipTableTime", nowCount, vipTableTime);
            db.collection('userStatistics').update({_id: iToday},
                {$set: {vipTableTime: vipTableTime, vipTableCount: nowCount}}, {upsert:true},
                function (er3, rtn3) {
                    // console.info(dbUrl+', 操作结束'+' i = '+i+' len = '+len);
                    db.close();
                    console.info('time: ' + (new Date() - startTime));
                    endF(dbUrl + ", 写入成功: " + today);
                });
        });
    });
}
