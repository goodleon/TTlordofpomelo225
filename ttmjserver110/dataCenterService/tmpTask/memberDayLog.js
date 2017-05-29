/**
 * Created by Administrator on 2017/4/10 0029.
 * 方总需要的数据统计，写入./logs/abc.csv文件
 */
var fs = require('fs');
var serverInfo = require('../config.json');
var tools = require("../tools")();
var savePath = __dirname+"/tmpLogs/";
var logName = "产品数据.csv";
var title = null;
var isThisYear = true;//只跑今年
tools.exec('rm -f '+savePath+'*',function () {
    // console.log('rm -f ./logs/* 成功');
},function () {
    console.log('rm -f .'+savePath+' 失败');
});
var wLog = function (log, fileName)
{
    if (!fs.existsSync(savePath))
    {
        try
        {
            fs.mkdirSync(savePath);
        }
        catch (err)
        {
        }
    }
    fs.appendFile(savePath + fileName, log+"\n", function () {});
};

module.exports = function (dbUrl, dbName, startDay,endDay,endMsg, errMsg)
{

    require('mongodb').MongoClient.connect(dbUrl, function (err, db)
    {
        if(err) {
            console.info('db err ' + JSON.stringify(err));
            !errMsg || errMsg(err);
            return;
        }
        var events = require('events');

        var FLAG = ",\t";
        var ipMsg = {};
        var createIdx = null;
        var index = 0;
        var result = {};
        var sellMonth = {};//每月充钻石充值金额
        var dayMoneyMonth = {};//每月钻石消耗
        var userData = {};//注册、活跃
        var nowDate = new Date();
        var curDay = parseInt(tools.Format(nowDate, "yyyyMM")+"01");
        var today = 20170331;
        var gameLogIds = {};
        var strStartDay = startDay.substr(0,4) + '-' + startDay.substr(4,2) + '-' + startDay.substr(6,2);
        var strEndDay = endDay.substr(0,4) + '-' + endDay.substr(4,2) + '-' + endDay.substr(6,2);
        var iStartDay = parseInt(startDay);
        var iEndDay = parseInt(endDay);
        var strEndMonth = endDay.substr(0,4) + '-' + endDay.substr(4,2);
        //容错&&指数转int
        function indexToInt(num,day)
        {
            var tNum = 0;
            if(typeof num == 'number' && num > 0)
            {
                tNum = parseInt(Number(num));
                //容错
                if(tNum > 100000000)
                {
                    console.log("容错 day,num,tNum",day,num,tNum);
                    tNum = 500000;

                }
            }
            return tNum;
        }
        function getStrMonth(month) {
            return month > 9 ? "" + month : "0" + month;
        }
        function getStrFormArr(arr,obj,nKey) {
            var str = "";
            for(var i = 0; i < arr.length; i++)
            {
                var key = arr[i];
                str += obj[key][nKey]+FLAG
            }
            return str;
        }

        function getCnFormArr(arr,nStr) {
            var str = "";
            for(var i = 0; i < arr.length; i++)
            {
                var key = arr[i];
                str += ''+key+nStr+FLAG
            }
            return str;
        }

        var oldDate = new Date(strStartDay);
        var oldYear = oldDate.getFullYear();
        var oldMonth = oldDate.getMonth();
        var nowDate = new Date(strEndDay);
        var nowYear = ''+nowDate.getFullYear();
        var nowMonth = nowDate.getMonth();
        // console.log(oldMonth,oldYear,nowMonth,nowYear);
        var nMonth = ''+nowYear+getStrMonth(nowMonth+1);
        var oMonth = ''+oldYear+getStrMonth(oldMonth);
        var yearArr = [];
        var monthArr = [];
        //初始化年、月数据
        while(oMonth < nMonth)
        {
            oldMonth = oldDate.getMonth()+1;
            oldYear = ''+oldDate.getFullYear();
            oMonth = ''+oldYear+getStrMonth(oldMonth);
            if(!title) {
                console.log(oldYear, oMonth);
            }
            if(isThisYear)//只读今年
            {
                if(oldYear == nowYear)
                {
                    if(yearArr.indexOf(oldYear) < 0)
                    {
                        yearArr.push(oldYear);
                    }
                    monthArr.push(oMonth);
                }
            }
            else
            {
                if(yearArr.indexOf(oldYear) < 0)
                {
                    yearArr.push(oldYear);
                }
                monthArr.push(oMonth);
            }

            if(!dayMoneyMonth[oMonth])
            {
                dayMoneyMonth[oMonth] = {};
                dayMoneyMonth[oMonth].dayMoney = 0;
            }
            if(!sellMonth[oMonth])
            {
                sellMonth[oMonth] = {};
                sellMonth[oMonth].sellNum = 0;
                sellMonth[oMonth].sellMoney = 0;
            }
            if(!userData[oMonth])
            {
                userData[oMonth] = {};
                userData[oMonth].regCount = 0;
                userData[oMonth].activeCount = 0;
            }

            if(!dayMoneyMonth[oldYear])
            {
                dayMoneyMonth[oldYear] = {};
                dayMoneyMonth[oldYear].dayMoney = 0;
            }
            if(!sellMonth[oldYear])
            {
                sellMonth[oldYear] = {};
                sellMonth[oldYear].sellNum = 0;
                sellMonth[oldYear].sellMoney = 0;
            }
            if(!userData[oldYear])
            {
                userData[oldYear] = {};
                userData[oldYear].regCount = 0;
                userData[oldYear].activeCount = 0;
            }
            oldDate.setMonth(oldDate.getMonth()+1);
        }

        //流失分析
        function runStatic() {
            var str = tools.Format(date, 'yyyyMMdd');
            if (parseInt(str) > today) {
                console.info('static end');

                //只统计201701~201703
                var cgbuserIds = {};
                db.collection("cgbuser").find({sendTime:{$gt:new Date('20161231'),$lt:new Date('20170401')}},{_id:1}).each(function (err, doc){

                    if(doc)
                    {
                        cgbuserIds[doc._id] = 1;
                    }
                    else
                    {
                        var cgbObj = Object.keys(cgbuserIds);
                        var cgbLen = cgbObj.length;
                        for(var i = 0; i < cgbLen; i++)
                        {
                            
                        }

                    }
                });
                return;
            }

            db.collection("gameLog"+str).find().each(function (err, doc){
                if(doc)
                {
                    var td = {
                        uid1:doc.uid1,
                        uid2:doc.uid2,
                        uid3:doc.uid3,
                        uid4:doc.uid4,
                        uid5:doc.uid5,
                    };
                    //对战活跃人数
                    for(var uid in td){
                        var mUid = td[uid];
                        if(mUid > 9999)
                        {
                            gameLogIds[mUid] = 1;
                        }
                    }
                }
                else
                {
                    date.setDate(date.getDate() + 1);
                    runStatic();
                }
            });
        }

        // runStatic();

        function writeFile()
        {
            if(!title) {
                title = "产品名称" + FLAG
                    + "上线销售时间" + FLAG;
                if(!isThisYear)
                {
                    title += "2016全年会员销售钻石数量" + FLAG;
                }
                title += "2017年"+monthArr.length+"个月会员销售钻石数量" + FLAG
                    + getCnFormArr(monthArr, "会员销售钻石数量");
                if(!isThisYear)
                {
                    title += "2016全年会员销售金额" + FLAG;
                }
                title += "2017年"+monthArr.length+"个月会员销售金额" + FLAG
                    + getCnFormArr(monthArr, "会员销售金额");
                if(!isThisYear)
                {
                    title += "2016全年用户消耗钻石数量" + FLAG;
                }
                title += "2017年"+monthArr.length+"个月用户消耗钻石数量" + FLAG
                    + getCnFormArr(monthArr, "用户消耗钻石数量");
                if(!isThisYear)
                {
                    title += "2016全年注册用户总人数" + FLAG;
                }
                title += "2017年"+monthArr.length+"个月注册用户总人数" + FLAG;
                if(!isThisYear)
                {
                    title += "2016全年活跃用户总人数" + FLAG;
                }
                title += "2017年"+monthArr.length+"个月活跃用户总人数" + FLAG
                    + getCnFormArr(monthArr, "新增用户注册数量");
                wLog(title, logName);
            }
            var name = (serverInfo.server[dbName].cn||dbName);
            var sellTime = (serverInfo.server[dbName].sellTime||"-");
            var msg =name+FLAG
                    +sellTime+FLAG
                    +getStrFormArr(yearArr,sellMonth,"sellNum")
                    +getStrFormArr(monthArr,sellMonth,"sellNum")
                    +getStrFormArr(yearArr,sellMonth,"sellMoney")
                    +getStrFormArr(monthArr,sellMonth,"sellMoney")
                    /*
                     2016全年用户消耗钻石数量,\
                     2017年3个月用户消耗钻石数量,\
                     2017年1月用户消耗钻石数量,\
                     2017年2月用户消耗钻石数量,\
                     2017年3月用户消耗钻石数量,\
                     */
                    +getStrFormArr(yearArr,dayMoneyMonth,"dayMoney")
                    +getStrFormArr(monthArr,dayMoneyMonth,"dayMoney")

                    /*
                     2016全年注册用户总人数,\
                     2017年3月注册用户总人数,\
                     \
                     2016全年活跃用户总人数,\
                     2017年3个月活跃用户总人数,*/

                    +getStrFormArr(yearArr,userData,"regCount")
                    +getStrFormArr(yearArr,userData,"activeCount")
                    /*2017年1月新增用户注册数量,
                     2017年2月新增用户注册数量,
                     2017年3月新增用户注册数量,
                     */
                    +getStrFormArr(monthArr,userData,"regCount")
                    /*2017年1月流失用户注册数量,\
                     2017年2月流失用户注册数量,\
                     2017年3月流失用户注册数量";*/
                    /*+0+FLAG
                    +0+FLAG
                    +0+FLAG*/

                ;
            wLog(msg,logName);
        }

        var query = {_id: {$gte:iStartDay, $lte: iEndDay}};
        db.collection("memberDayLog").find(query,{buyNum:1, buyMoney:1}).each(function (err, doc) {
                if(doc)
                {
                    var day = doc._id;
                    var sellNum = indexToInt(doc.buyNum);//充钻石
                    var sellMoney = indexToInt(doc.buyMoney);//充值金额
                    var month = day+"";
                    month = month.substr(0,6);
                    var year = month.substr(0,4);

                    sellMonth[month].sellNum += sellNum;
                    sellMonth[month].sellMoney += sellMoney;
                    sellMonth[year].sellNum += sellNum;
                    sellMonth[year].sellMoney += sellMoney;

                }
                else
                {

                    db.collection("dayLog").find(query,{dayMoney:1}).each(function (err1, doc1) {
                        if(doc1)
                        {
                            var day1 = doc1._id;
                            var dayMoney = indexToInt(doc1.dayMoney);//钻石消耗
                            var month = day1+"";
                            month = month.substr(0,6);
                            var year = month.substr(0,4);

                            if(!dayMoneyMonth[month])
                            {
                                console.log(">>>month",month,JSON.stringify(dayMoneyMonth));
                            }
                            dayMoneyMonth[month].dayMoney += dayMoney;
                            dayMoneyMonth[year].dayMoney += dayMoney;
                        }
                        else
                        {
                            db.collection("userStatistics").find(query,{regCount:1,activeCount:1}).each(function (err2, doc2) {
                                if(doc2)
                                {
                                    var day2 = doc2._id;
                                    var regCount = indexToInt(doc2.regCount);//注册
                                    var activeCount = indexToInt(doc2.activeCount);//活跃
                                    var month = day2+"";
                                    month = month.substr(0,6);
                                    var year = month.substr(0,4);
                                    userData[month].regCount += regCount;
                                    userData[month].activeCount += activeCount;
                                    userData[year].regCount += regCount;
                                    userData[year].activeCount += activeCount;
                                }
                                else
                                {
                                    writeFile();
                                    db.close();
                                    !endMsg || endMsg(dbUrl+"  ok");
                                }

                            });
                        }
                    });




                }
            });

    });
}



/*
 跑所有产品，指定开始和结束时间，选项可以忽略某些项目
 node memberDayLog.js "20160701" "20170101" "test:shmj"

 */
const memberDayLog = require('./memberDayLog.js');
var date = null;
var today = null;
serverInfo.server["kwx"] = serverInfo.server.kwx;
var dbIp = serverInfo.db.ip+':'+serverInfo.db.port;
var mongodbUrl = "mongodb://"+dbIp+"/"+process.argv[2];
// var mongodbUrl = tools.url;
console.log("mongodbUrl",mongodbUrl, process.argv);
var runType = null;
if(process.argv[3] == 1)
{
    runType = 0;
}
else if(process.argv.length == 4 && process.argv[3].length == 8)
{
    runType = 1;
}
else if(process.argv.length == 5)
{
    runType = 2;
}

if(runType == 0) {
}
else if(runType == 1)
{
}
else if(runType == 2)
{
    var events = require('events');
    var eventEmitter = new events.EventEmitter();

    var startDay = process.argv[2];
    var endDay = process.argv[3];
    var hostname = process.argv[4];
    var ignoreOp = hostname.split(':');
    console.log("startDay,endDay",startDay,endDay);
    console.log('ignoreOp',ignoreOp);
    for (var i = 0; i < ignoreOp.length; i++)
    {
        var key = ignoreOp[i];
        if(serverInfo.server[key])
        {
            delete serverInfo.server[key];
            console.log("忽略: " + key);
        }
    }
    if(serverInfo.server[hostname])
    {
        delete serverInfo.server[hostname];
    }
    // console.log(JSON.stringify(serverInfo.server));
    var keysServers = Object.keys(serverInfo.server);
    var keysServersLen = keysServers.length;
    var keysServersIdx = 0;
    var dbIp = serverInfo.db.ip+':'+serverInfo.db.port;
    var startTime = new Date();

    // return;
    function runTask (dbUrl, dbName,endMsg)
    {
        memberDayLog(dbUrl, dbName, startDay,endDay,function (msg) {
            // console.info(msg);
            !endMsg||endMsg(dbUrl+', time: ' + (new Date() - startTime));
        }, function (msg) {
            // console.info(msg);
            !endMsg||endMsg(dbUrl+', time: ' + (new Date() - startTime));
        });
    }

    function execFunc() {
        var dbName = keysServers[keysServersIdx];
        var dbUrl = "mongodb://"+dbIp+"/"+dbName;
        // console.log("len "+keysServersLen+" ,idx "+keysServersIdx+", "+dbName);
        runTask(dbUrl,dbName,function (endMsg) {
            console.log("完成: " + endMsg);
            if(++keysServersIdx < keysServersLen)
            {
                eventEmitter.emit('execFunc');
            }
            else
            {
                console.log(">>>>>>>>>已写入 "+savePath+logName);
            }
        });
    }
    eventEmitter.on('execFunc', execFunc);
    eventEmitter.emit('execFunc');
}
