/**
 * Created by HJF on 2016/11/19 0019.
 * 临时导出 dayLog.json
 *（每小时导出dayLog今天数据用于数据服采集统计 2017-01-28 by hjf）
 * 数据库导出文件：日期/项目名.tar.gz (2016-11-19/a.txt b.txt ...)
 * 1、导出到 test
 * 2、重命名 test --> 2016-11-19
 * 3、压缩  test.tar.gz
 * 4、删除  2016-11-19
 */

var tools = require("../tools.js")();
module.exports = function(dbUrl, argv, endF, errF) {
    //dbUrl = "mongodb://10.47.191.7:27017/ahmj";
    const url = require('url');
    var fs = require('fs');
    var cp = require('child_process');
    var os = require('os');
    var serverInfo = require('../config.json');
    var MongoClient = require('mongodb').MongoClient;
    var mongoInfo = {};
    var hostname = os.hostname().split("-");
    // var type = hostname[1];
    hostname = hostname[0];
    if (hostname == "localhost") {
        hostname = "test";
    }
    mongoInfo.path = serverInfo.path;
    //解析url格式 str: {"protocol":"mongodb:","slashes":true,"auth":null, "host":"10.47.191.7:27017","port":"27017", "hostname":"10.47.191.7", "hash":null,"search":null,"query":null, "pathname":"/ahmj","path":"/ahmj", "href":"mongodb://10.47.191.7:27017/ahmj"}
    mongoInfo.url = url.parse(dbUrl); //解析url
    // mongoInfo.url.name = mongoInfo.url.pathname.substr(1, mongoInfo.url.pathname.length);

    if (!mongoInfo.url.host) {
        // console.log("---- parseDbUrl(): Error!!! mongoInfo = " + JSON.stringify(mongoInfo));
        !errF || errF("parseDbUrl(): Error!!! mongoInfo = " + JSON.stringify(mongoInfo));
        return;
    } else {
        // console.log("---- mongoInfo = " + JSON.stringify(mongoInfo));
    }

    var indexColl = 0;
    var maxColl = 0;
    var collections = [];
    var day = new Date(); //今天
    var date = tools.Format(day, 'yyyy-MM-dd');
    var outPath = mongoInfo.path.exportMongodbPath + date; //导出路径
    var collections = [];
    collections.push("dayLog");
    getMemberMoneyCollections();

    function closeDb() {
        // db.close();
    }


    // 所有集合
    function getMemberMoneyCollections() {
        // console.log("-----collections:" + collections);
        indexColl = 0;
        maxColl = collections.length;
        if (maxColl == 0) {
            closeDb();
            !errF || errF('collections empty!!');
            return;
        }
        if (!fs.existsSync(outPath)) {
            cp.exec('mkdir -p ' + outPath);
        }
        /*collections.forEach(function (item) {
         handleCollection(mongoInfo.url.host, hostname, item, outPath);
         });*/

        console.log(dbUrl + ", " + maxColl + " 导出中...");
        handleCollection(mongoInfo.url.host, hostname, collections[indexColl], outPath);
    };


    /**
     * 导出 collection
     * @param {string} ip: 地址
     * @param {string} name: 数据库名字
     * @param {string} collection: 表名
     * @param {string} dirName: 导出路径
     */
    function handleCollection(ip, name, collection, dirName) {
        var time = date.substr(0, 4) + date.substr(5, 2) + date.substr(8, 2);
        var query = '\'{\"_id\":' + Number(time) + '}\'';
        // var cmd = 'mongodump -h  ' + ip + ' -d ' + name + ' -c ' + collection + ' -q ' + query + '  -o  ' + dirName;
        var cmd = 'mongoexport -h  ' + ip + ' -d ' + name + ' -c ' + collection + ' -q ' + query + '  -o  ' + dirName + '/dayLog.json';

        if (tools.mdbUrl) {
            cmd = 'mongoexport -h ' + ip +
                ' --authenticationDatabase ' + serverInfo.aliyuncsDb.auth +
                ' -u ' + serverInfo.aliyuncsDb.user +
                ' -p ' + serverInfo.aliyuncsDb.passwd +
                ' -d ' + name + ' -c ' + collection + ' -q ' + query + '  -o  ' + dirName +
                '/dayLog.json';
        }
        // mongoexport -h 10.25.77.69 -d sdmj -c dayLog -o /tmp/tmp_sdmj.json
        // console.log("2cmd: " + cmd);
        cp.exec(cmd, function(error, stdout, stderr) {
            if (error) {
                console.log(error.stack);
                console.log('Error code: ' + error.code);
                console.log('Signal received: ' + error.signal);
            } else {
                console.log(cmd, "执行成功");
            }
            // console.log('stdout: ' + stdout);
            // console.log('stderr: ' + stderr);
            /*if (++indexColl >= maxColl) {
                handleRename(outPath, hostname, date);
            }
            else {
                if(indexColl % 10 == 0){
                    console.log(indexColl);
                }
                handleCollection(mongoInfo.url.host, hostname, collections[indexColl], outPath);
            }*/
        });
    }

    /**
     * 文件重命名
     * @param {string} path: 路径
     * @param {string} oldName: 原文件
     * @param {string} newName: 新文件
     */
    function handleRename(path, oldName, newName) {
        var cmd = 'cd ' + path + '&&mv ' + oldName + ' ' + newName;
        // console.log("1cmd: " + cmd);
        cp.exec(cmd, function(error, stdout, stderr) {
            if (error) {
                console.log(error.stack);
                console.log('Error code: ' + error.code);
                console.log('Signal received: ' + error.signal);
                closeDb();
                !errF || errF('handleRename(...), ' + error.stack);
            } else {
                // console.log('Rename Success: ' + newName);
                handleCompressed(outPath, hostname, date);
            }
        });
    }

    /**
     * 压缩文件
     * @param {string} path: 路径
     * @param {string} newName: 压缩名
     * @param {string} oldName: 文件名
     */
    function handleCompressed(path, newName, oldName) {
        // var cmd = 'cd ' + path + '&&tar zcf ' + newName + ".tar.gz " + oldName;
        // tar cvf - 目录名 | pigz -9 -p 10 > file.tgz
        var cmd = 'cd ' + path + '&&tar cvf - ' + oldName + " | pigz -9 -p 10 -k > " + newName + ".tgz";
        console.log("0cmd: " + cmd);
        cp.exec(cmd, function(error, stdout, stderr) {
            if (error) {
                closeDb();
                !errF || errF('handleCompressed(...), ' + error.stack);
            } else {
                console.log('Compressed Success: ' + newName);
                handleRemoveFile(path, date);
            }

        });
    }

    /**
     * 删除文件
     * @param {string} dir: 路径
     * @param {string} fileName: 文件名
     */
    function handleRemoveFile(dir, fileName) {
        var cmd = 'cd ' + dir + '&&rm -rf ' + fileName;
        // console.log("----0-- cmd: " + cmd);
        cp.exec(cmd, function(error, stdout, stderr) {
            if (error) {
                !errF || errF('handleRemoveFile(...), ' + error.stack);
            } else {
                // console.log('Remove Success: ' + fileName);
                tools.wLog('hourDbTask', JSON.stringify({ Success: 'dayLogSuccess', time: new Date() }), 'hourDbTask');
                endF(fileName);
            }
            closeDb();
        });
    }


}

/*
 导出今天数据
 node hourDbTask.js
 */
const hourDbTask = require('./hourDbTask.js');
hourDbTask(tools.url, null, function(endMsg) {
    console.log("导出完成: " + endMsg);
}, function(errMsg) {
    console.log("导出失败: " + errMsg)
});