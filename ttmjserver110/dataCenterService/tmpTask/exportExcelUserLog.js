/**
 * Created by HJF on 2016/12/8 0008.
 * 导出玩家留存excel
 */
//node --max-old-space-size=8192 exportExcelUserLog.js

module.exports = function(dbName, tableName, endF, errF)
{
    if(!tableName || !dbName) {
        !errF || errF(dbName+"___"+tableName+"___error!!!");
        return;
    }
    console.log("开始", dbName, tableName);
    var serverInfo = require('./../config.json');
    var dbUrl = "mongodb://"+serverInfo.db.ip+":"+serverInfo.db.port+"/" + dbName;
    require('mongodb').MongoClient.connect(dbUrl, function (err, db) {
        if(!db) {
            console.info('db err ' + JSON.stringify(err));
            !errF || errF(dbName+"___"+tableName+"___"+err);
            return;
        }
        var fs = require('fs');
        var cp = require("child_process");
        var json2xls = require('json2xls');
        var tools = require('./../tools.js')();
        var events = require('events');
        var eventEmitter = new events.EventEmitter();
        var date = new Date('2016-7-1');
        // var date = new Date('2016-12-20');
        var today = tools.Format(new Date(),'yyyyMMdd');
        var allUsers = {};
        var newData = [];
        var MAX_ROW = 100000; //每个excel表保存最大条数
        var count = 0;//excel表数量
        var xlsName = './excel/' + dbName + "_" + tableName;
        today = parseInt(today);


        function writeOne(isEnd) {
            if(isEnd || newData.length >= MAX_ROW)
            {
                var tName = xlsName+'_'+count+'.xlsx';
                console.log(tName);
                var xlsData = json2xls(newData);
                fs.writeFileSync(tName, xlsData, 'binary');
                newData = [];
                count++;
            }
        }

        function writeXLSX() {
            var relData = Object.keys(allUsers);

            console.info("====== excel导出中 ===== ", dbName, tableName);
            // console.info("============= "+JSON.stringify(allUsers));
            // return;
            var index = 0;
            for (var i = 0; i < relData.length; i++)
            {
                var curDay = relData[i];
                var tDay = allUsers[curDay];
                // if(i%30 == 0)
                // console.info("============= ", JSON.stringify(tDay));
                if(tools.isOwnEmpty(tDay))
                {
                    continue;
                }
                var uids = Object.keys(tDay);
                var isAdd = true;
                for (var ii = 0; ii < uids.length; ii++) {
                    var uid = uids[ii]
                    var data = tDay[uid];
                    var obj = {
                        // "登录日期": isAdd ? curDay : "",
                        "index":index,
                        "date": curDay,
                        "id": uid,
                        "ip": data,
                    }
                    newData.push(obj);
                    isAdd = false;
                    index++;
                    writeOne();
                }
            }

            writeOne(true);
            db.close();
            !endF||endF(dbName+"___"+tableName+"___OK!");
        }


        function writeXLSX2() {
            var relData = Object.keys(allUsers);

            console.info("====== excel导出中 =====");
            // console.info("============= "+JSON.stringify(allUsers));
            // return;
            var index = 0;
            for (var i = 0; i < relData.length; i++) {
                var curDay = relData[i];
                var uids = allUsers[curDay];
                var isAdd = true;
                for (var ii = 0; ii < uids.length; ii++) {
                    var uid = uids[ii]
                    var obj = {
                        // "对战日期": isAdd ? curDay : "",
                        "index": index,
                        "date": curDay,
                        "id": uid[0],
                        "score": uid[1],
                    }
                    newData.push(obj);
                    isAdd = false;
                    index++;
                    writeOne();
                }
            }

            writeOne(true);
            db.close();
            !endF||endF(dbName+"___"+tableName+"___OK!");
        }

        function runStatic() {
            var curDay = tools.Format(date, 'yyyyMMdd') + "";

            if (parseInt(curDay) >= today) {
                console.info('static end');
                writeXLSX(allUsers);
                eventEmitter.removeAllListeners();
                return;
            }
            allUsers[curDay+''] = {};
            console.info(tableName + curDay);
            db.collection(tableName + curDay).find({}).each(function (err, doc) {

                // console.log("--------------------loginLog");
                if(doc && doc.uid)
                {
                    allUsers[curDay+''][doc.uid] = doc.ip;
                }

                if(!doc)
                {

                    date.setDate(date.getDate() + 1);
                    eventEmitter.emit('next');
                }
            });
        }


        function runStatic2() {
            var curDay = tools.Format(date, 'yyyyMMdd') + "";

            if (parseInt(curDay) >= today) {
                console.info('static end');
                db.close();
                eventEmitter.removeAllListeners();
                writeXLSX2(allUsers);
                return;
            }
            allUsers[curDay+''] = [];
            console.info(tableName + curDay);
            db.collection(tableName + curDay).find({}).each(function (err, doc) {

                if(doc)
                {

                    var uids = [];
                    var fraction = [];
                    for(var i = 0; i < 5; i++)
                    {
                        var uid = 'uid' + i;
                        var win = 'winall' + i;
                        if(doc[uid])
                        {
                            // console.log("===== gameLog: ", curDay, doc[uid], doc['winall' + i]);
                            uids.push(doc[uid]);
                            fraction.push(doc[win]);
                        }
                    }
                    allUsers[curDay].push([uids, fraction]);
                }
                if(!doc)
                {

                    date.setDate(date.getDate() + 1);
                    eventEmitter.emit('next');
                }
            });
        }
        // console.info('---------44444-----------'+tableName);
        if(tableName == 'loginLog')
        {
            eventEmitter.on('next', runStatic);
        }
        else if(tableName == 'gameLog')
        {
            eventEmitter.on('next', runStatic2);
        }
        eventEmitter.emit('next');

    })

}


var events = require('events');
var eventEmitter = new events.EventEmitter();
var tExportExcelUserLog = require('./exportExcelUserLog.js');
var project = ['phz', 'scmj', 'gzmj', 'ddz', 'sxmj'];
// var project = ['nxmj', 'jsmj', 'gsmj', 'guandan', 'hanmj'];
var collection = ['loginLog', 'gameLog'];
var projectLen = project.length;
var projectIdx = 0;
var collectionLen = collection.length;
var collectionIdx = 0;


function execFunc() {
    tExportExcelUserLog(project[projectIdx], collection[collectionIdx], endFunc, endFunc);
}
function endFunc(msg) {
    console.log("完成_ ", msg, collectionIdx, collectionLen, projectIdx, projectLen);
    if(++collectionIdx < collectionLen)
    {
        eventEmitter.emit('execFunc');
    }
    else if(++projectIdx < projectLen)
    {
        collectionIdx = 0;
        eventEmitter.emit('execFunc');
    }
}
eventEmitter.on('execFunc', execFunc);
eventEmitter.emit('execFunc');