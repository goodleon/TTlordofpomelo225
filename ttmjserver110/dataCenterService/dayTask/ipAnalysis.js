/**
 * Created by Administrator on 2017/3/29 0029.
 * ip区域分布
 */
var ipx = require("../ipip/ip")
var tools = require("../tools")();
ipx.load("../ipip/17monipdb.dat");
function getLocation(ip) {
    var arr = ipx.findSync(ip);
    var location = "";
    for(var i = 0; i < arr.length; i++)
    {
        location += arr[i];
    }
    return location;
}

module.exports = function (dbUrl, day, endMsg, errMsg)
{
    if(typeof day != 'string') {
        console.info('typeof day  must be string !!');
        !errMsg || errMsg('typeof day  must be string !!');
        return;
    }
    if(day.length != 8){
        console.info('day\'s format invaid !!');
        !errMsg || errMsg('day\'s format invaid !!');
        return;
    }
    require('mongodb').MongoClient.connect(dbUrl, function (err, db)
    {
        if(err) {
            console.info('db err ' + JSON.stringify(err));
            !errMsg || errMsg(err);
            return;
        }
        var events = require('events');
        console.time('runTime');
        
        //登录
        /*var ipMsg = {};
        var tb = 'loginLog' + day;
        var createIdx = null;
        var index = 0;
        db.collection(tb).find({"type" : "doLogin"},{uid:1, ip:1}).each(function (err, doc) {
            if(doc && doc.ip)
            {
                if(!ipMsg[doc.ip])
                {
                  /!*  ipMsg[doc.ip] = {};
                    ipMsg[doc.ip].uid = doc.uid;
                    ipMsg[doc.ip].location = getLocation(doc.ip);*!/
                    ipMsg[doc.ip] = 1;
                    if(++index % 2000 == 0)
                    {
                        console.log("index",index);
                    }
                    var param = {ip:doc.ip, location:getLocation(doc.ip)};
                    db.collection('ipLog'+day).update(
                        {_id:Number(doc.uid)}, {$set:param}, {upsert:true},function (err, doc) {});

                    if(createIdx != day)
                    {
                        createIdx = day;
                        db.collection(tb).createIndex({"ip":1},{"background":1});
                    }
                }
            }
            if(!doc)
            {
                db.close();
                !endMsg || endMsg(day + ", index: "+index+", ok!");
            }
        });*/

        var ipMsg = {};
        var tb = 'loginLog' + day;
        var createIdx = null;
        var index = 0;
        var result = {};
        console.log("index",index);
        db.collection(tb).find({"type" : "doLogin"},{uid:1, ip:1}).each(function (err, doc) {
            if(doc && doc.ip)
            {
                if(!ipMsg[doc.ip])
                {
                    ipMsg[doc.ip] = 1;
                    if(++index % 10000 == 0)
                    {
                        console.log("index",index);
                    }
                    var loc = getLocation(doc.ip);
                    if(loc.length > 0)
                    {
                        if(!result[loc])
                        {
                            result[loc] = 0;
                        }
                        result[loc]++;
                    }
                }
            }
            if(!doc)
            {
                db.collection('ipDayLog').update(
                    {_id:Number(day)}, {$set:{distribution:result}}, {upsert:true},function (err, doc) {
                        db.close();
                        console.timeEnd('runTime');
                        !endMsg || endMsg(day + ", index: "+index+", ok!");
                    });

            }
        });

    });
}



/*
 ip区域分布

 从头开始跑某产品
 node ipAnalysis.js "scmj" 1

 指定产品、开始时间、结束时间
 node ipAnalysis.js "scmj" 1 "20170101" "20170301"

 跑指定日期
 node ipAnalysis.js "scmj" "20161201"

 跑前一天
 node ipAnalysis.js "scmj"

 跑所有产品，指定开始和结束时间，选项可以忽略某些项目
 node ipAnalysis.js "20160701" "20170101" "test:shmj"

 */
const ipAnalysis = require('./ipAnalysis.js');
var date = null;
var today = null;

var serverInfo = require('../config.json');
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
    //从头开始跑的逻辑
    var startDay = process.argv[4];
    var endDay = process.argv[5];
    if(startDay)
    {
        var sStartDay = startDay.substr(0,4) + '-' + startDay.substr(4,2) + '-' + startDay.substr(6,2);
        date = new Date(sStartDay);
    }
    else
    {
        date = new Date('2016-07-01');
    }
    if(endDay)
    {
        today = parseInt(endDay);
    }
    else
    {
        today = tools.Format(new Date(),'yyyyMMdd');
        today = parseInt(today);
    }
    function runStatic() {
        var str = tools.Format(date, 'yyyyMMdd');
        if (parseInt(str) > today) {
            console.info('static end');
            return;
        }

        ipAnalysis(mongodbUrl, str, function (msg) {
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
else if(runType == 1)
{
    //跑指定日期
    ipAnalysis(mongodbUrl, process.argv[3], function (msg) {
        console.info(msg);
    }, function (msg) {
        console.info(msg);
    });
}
else if(runType == 2)
{
    var events = require('events');
    var eventEmitter = new events.EventEmitter();

    var startDay = process.argv[2];
    var endDay = parseInt(process.argv[3]);
    var hostname = process.argv[4];
    var strStartDay = startDay.substr(0,4) + '-' + startDay.substr(4,2) + '-' + startDay.substr(6,2);
    var ignoreOp = hostname.split(':');
    console.log("startDay,strStartDay,endDay",startDay,strStartDay,endDay);
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
    console.log(JSON.stringify(serverInfo.server));
    var keysServers = Object.keys(serverInfo.server);
    var keysServersLen = keysServers.length;
    var keysServersIdx = 0;
    var dbIp = serverInfo.db.ip+':'+serverInfo.db.port;
    var startTime = new Date();

    // return;
    function runTask (dbUrl, endMsg)
    {
        var date = new Date(strStartDay);
        // var date = new Date('2017-1-9');
        function runStatic2() {
            var str = tools.Format(date, 'yyyyMMdd');

            if (parseInt(str) > endDay) {
                !endMsg||endMsg(dbUrl+', time: ' + (new Date() - startTime));
                return;
            }
            ipAnalysis(dbUrl, str, function (msg) {
                console.info(msg);
                date.setDate(date.getDate() + 1);
                runStatic2();
            }, function (msg) {
                console.info(msg);
                date.setDate(date.getDate() + 1);
                runStatic2();
            });

            //测试
            /*console.info(str);
            date.setDate(date.getDate() + 1);
            runStatic2();*/
        }
        runStatic2();
    }

    function execFunc() {
        var dbName = keysServers[keysServersIdx];
        var dbUrl = "mongodb://"+dbIp+"/"+dbName;
        console.log("len "+keysServersLen+" ,idx "+keysServersIdx+", "+dbName);
        runTask(dbUrl,function (endMsg) {
            console.log("采集完成: " + endMsg);
            if(++keysServersIdx < keysServersLen)
            {
                eventEmitter.emit('execFunc');
            }
        });

    }
    eventEmitter.on('execFunc', execFunc);
    eventEmitter.emit('execFunc');
}
else
{
    //跑前一天的数据
    today = new Date();
    today.setDate(today.getDate() - 1);
    var day = tools.Format(today, 'yyyyMMdd');
    ipAnalysis(mongodbUrl, day, function (msg) {
        console.info(msg);
    }, function (msg) {
        console.info(msg);
    });
}
