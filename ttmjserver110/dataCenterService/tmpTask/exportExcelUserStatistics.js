/**
 * Created by HJF on 2016/12/8 0008.
 * 导出玩家留存excel
 */
//node exportExcelUserStatistics.js test 20161001 20161205
var dbName = process.argv[2];
var startDate = process.argv[3];
var endDate = process.argv[4];
var serverInfo = require('./../config.json');
require('mongodb').MongoClient.connect("mongodb://"+serverInfo.db.ip+":"+serverInfo.db.port+"/" + dbName, startDate, endDate, function (err, db) {
    if(!db) {
        console.info('db err ' + JSON.stringify(err));
        return;
    }
    var fs = require('fs');
    var json2xls = require('json2xls');
    var tools = require('./../tools.js')();

    function collection(tempDate, nDayAfter, info, type)
    {
        var currentDate = tools.dateOffset(tempDate, nDayAfter);
        var ret = 0;
        if(type == 2)
        {
            currentDate += "_active";	//活跃时间
        }
        if (currentDate in info)
        {
            ret = info[currentDate];
        }
        return ret;
    }

    function percentage(a, b)
    {
        if(b > 0){
            return (a / b * 100).toFixed(2) + '%';
        }
        else
        {
            return "0.00%";
        }
    }
    function writeXLSX(data) {
        var newData = [];
        var relData = data;
        var date = new Date(new Date() - 1*24*60*60*1000);//前一天
        for (var count = 0; count < relData.length; count++)
        {
            var currentMemberInfo = relData[count];
            var dateOfRegistration = currentMemberInfo._id;
            var numberOfRegistered = currentMemberInfo.regCount;
            var tempDate = tools.cut(String(dateOfRegistration), [4, 2, 2], '-');
            //登录数据
            var dailyLiving = currentMemberInfo.loginCount;
            var retainedInTheFollowingDay = collection(tempDate, 1, currentMemberInfo);
            var threeDaysRetained = collection(tempDate, 3, currentMemberInfo);
            var sevenDaysRetained = collection(tempDate, 7, currentMemberInfo);
            var thirtyDaysRetained = collection(tempDate, 30, currentMemberInfo);
            var soFarRetained = collection(date, -1, currentMemberInfo);

            //活跃数据
            var dailyLiving2 = currentMemberInfo.activeCount;
            var retainedInTheFollowingDay2 = collection(tempDate, 1, currentMemberInfo, 2);
            var threeDaysRetained2 = collection(tempDate, 3, currentMemberInfo, 2);
            var sevenDaysRetained2 = collection(tempDate, 7, currentMemberInfo, 2);
            var thirtyDaysRetained2 = collection(tempDate, 30, currentMemberInfo, 2);
            var soFarRetained2 = collection(date, -1, currentMemberInfo, 2);


            var obj = {
                "注册日期": dateOfRegistration,
                "注册人数": numberOfRegistered,

                /*登录数据*/
                "登录人数": dailyLiving,
                "次日登录留存": retainedInTheFollowingDay + ' / ' + percentage(retainedInTheFollowingDay,
                    numberOfRegistered),
                "3日登录留存": threeDaysRetained + ' / ' + percentage(threeDaysRetained, numberOfRegistered),
                "7日登录留存": sevenDaysRetained + ' / ' + percentage(sevenDaysRetained, numberOfRegistered),
                "30日登录留存": thirtyDaysRetained + ' / ' + percentage(thirtyDaysRetained, numberOfRegistered),
                "至今日登录留存": soFarRetained + ' / ' + percentage(soFarRetained, numberOfRegistered),

                /*活跃人数*/
                "活跃人数": dailyLiving2,
                "次日活跃留存": retainedInTheFollowingDay2 + ' / ' + percentage(retainedInTheFollowingDay2,
                    numberOfRegistered),
                "3日活跃留存": threeDaysRetained2 + ' / ' + percentage(threeDaysRetained2, numberOfRegistered),
                "7日活跃留存": sevenDaysRetained2 + ' / ' + percentage(sevenDaysRetained2, numberOfRegistered),
                "30日活跃留存": thirtyDaysRetained2 + ' / ' + percentage(thirtyDaysRetained2, numberOfRegistered),
                "至今日活跃留存": soFarRetained2 + ' / ' + percentage(soFarRetained2, numberOfRegistered)
            };
            newData.push(obj);
        }

        if(newData.length > 0)
        {
            var date = tools.Format(new Date(), "yyyyMMddhhmmss");
            var xlsName = './' + dbName + "_"+startDate+"_"+endDate+"_"+ date + '.xlsx';
            var xlsData = json2xls(newData);
            // console.log("data:"+JSON.stringify(newData));
            console.log(xlsName);
            fs.writeFileSync(xlsName, xlsData, 'binary');
        }
        else
        {
            console.log("没有数据");
        }
    }
    var result = [];
    var command = {_id: {$lte: Number(endDate), $gte: Number(startDate)}};
    console.log("----> command: " + JSON.stringify(command));
    db.collection("userStatistics").find(command).sort({_id: 1}).each(function (er, doc) {
        if (doc) {
            result.push(doc);
        }

        if (!doc) {
            db.close();
            writeXLSX(result);
        }
    });


})