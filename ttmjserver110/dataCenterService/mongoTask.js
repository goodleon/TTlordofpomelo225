/**
 * Created by HJF on 2016/11/19 0019.
 *
 * 数据库导出文件：日期/项目名.tar.gz (2016-11-19/a.txt b.txt ...)
 * 1、导出到 test
 * 2、重命名 test --> 2016-11-19
 * 3、压缩  test.tar.gz
 * 4、删除  2016-11-19
 */

module.exports = function(dbUrl, endF, errF) {
    //dbUrl = "mongodb://10.47.191.7:27017/ahmj";
    const url = require('url');
    var fs = require('fs');
    var cp = require('child_process');
    var tools = require('./tools')();
    var MongoClient = require('mongodb').MongoClient;
    var serverInfo = require('./config.json');
    var mongoInfo = {};
    mongoInfo.path = serverInfo.path;
    //解析url格式 str: {"protocol":"mongodb:","slashes":true,"auth":null, "host":"10.47.191.7:27017","port":"27017", "hostname":"10.47.191.7", "hash":null,"search":null,"query":null, "pathname":"/ahmj","path":"/ahmj", "href":"mongodb://10.47.191.7:27017/ahmj"}
    mongoInfo.url = url.parse(dbUrl); //解析url
    mongoInfo.url.name = mongoInfo.url.pathname.substr(1, mongoInfo.url.pathname.length);
    if (!mongoInfo.url.host) {
        console.log("---- parseDbUrl(): Error!!! mongoInfo = " + JSON.stringify(mongoInfo));
        !errF || errF("parseDbUrl(): Error!!! mongoInfo = " + JSON.stringify(mongoInfo));
        return;
    } else {
        console.log("---- mongoInfo = " + JSON.stringify(mongoInfo));
    }
    // 连接数据库
    MongoClient.connect(dbUrl, function(err, db) {
        if (!db) {
            console.info('db err ' + JSON.stringify(err));
            !errF || errF('db err ' + JSON.stringify(err));
            return;
        }
        var sysIndex = 'system.indexes'; // 目录
        var indexColl = 0;
        var maxColl = 0;
        var collections = [];
        var date = new Date(new Date() - 24 * 60 * 60 * 1000).Format('yyyy-MM-dd'); //前一天
        var outPath = mongoInfo.path.exportMongodbPath + date; //导出路径
        if (!fs.existsSync(outPath)) {
            cp.exec('mkdir -p ' + outPath);
        }

        function closeDb() {
            db.close();
        }

        function getMemberMoneyCollections(callBack) {
            db.collection(sysIndex).find().each(
                function(er, doc) {
                    if (doc && doc.ns) {
                        var currentName = doc.ns.split('.')[1];
                        collections.push(currentName);
                    }

                    if (!doc) {
                        !callBack || callBack();
                    }
                });
        }

        /**
         * 数组去重
         * */
        Array.prototype.unique = function() {
            var n = {},
                r = []; //n为hash表，r为临时数组
            for (var i = 0; i < this.length; i++) //遍历当前数组
            {
                if (!n[this[i]]) //如果hash表中没有当前项
                {
                    n[this[i]] = true; //存入hash表
                    r.push(this[i]); //把当前数组的当前项push到临时数组里面
                }
            }
            return r;
        };
        // 获取所有集合
        getMemberMoneyCollections(function() {
            collections = collections.unique();
            // console.log("-----collections:" + collections);
            indexColl = 0;
            maxColl = collections.length;
            if (maxColl == 0) {
                closeDb();
                !errF || errF('collections empty!!');
                return;
            }
            collections.forEach(function(item) {
                handleCollection(mongoInfo.url.host, mongoInfo.url.name, item, outPath);
            });
        });


        /**
         * 导出 collection
         * @param {string} ip: 地址
         * @param {string} name: 数据库名字
         * @param {string} collection: 表名
         * @param {string} dirName: 导出路径
         */
        function handleCollection(ip, name, collection, dirName) {
            var cmd = "mongodump -h  " + ip + " -d " + name + " -c " + collection + "  -o  " + dirName;
            // console.log("2cmd: " + cmd);
            cp.exec(cmd, function(error, stdout, stderr) {
                if (error) {
                    console.log(error.stack);
                    console.log('Error code: ' + error.code);
                    console.log('Signal received: ' + error.signal);
                }
                // console.log('stdout: ' + stdout);
                // console.log('stderr: ' + stderr);
                if (++indexColl == maxColl) {
                    handleRename(outPath, mongoInfo.url.name, date);
                }
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
            console.log("1cmd: " + cmd);
            cp.exec(cmd, function(error, stdout, stderr) {
                if (error) {
                    console.log(error.stack);
                    console.log('Error code: ' + error.code);
                    console.log('Signal received: ' + error.signal);
                    closeDb();
                    !errF || errF('handleRename(...), ' + error.stack);
                } else {
                    // console.log('Rename Success: ' + newName);
                    handleCompressed(outPath, mongoInfo.url.name, date);
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
            var cmd = 'cd ' + path + '&&tar zcf ' + newName + ".tar.gz " + oldName;
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
                    console.log('Remove Success: ' + fileName);
                    endF(fileName);
                }
                closeDb();
            });
        }

    });


}