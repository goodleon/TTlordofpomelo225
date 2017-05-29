
/*
* 1、下载并采集单个，默认时间为昨天，可以指定时间（严格时间格式）
* node userStatisticsTask.js 1 'gdmj' //昨天
* node userStatisticsTask.js 1 'gdmj' '2016-11-01' //指定日期
* 
* 2、不下载只采集单个，默认时间为昨天，可以指定时间（严格时间格式）
* node userStatisticsTask.js 0 'gdmj' //昨天
* node userStatisticsTask.js 0 'gdmj' '2016-11-01' //指定日期
*
* */

module.exports = function(type, hostname, day, gEndMsg, gErrMsg, option)
{
    var taskTools = require("../tools.js")();
    var importDbTask = require("../importDbTask.js");
    var serverInfo = require('../config.json');
    var userStatistics = require("../userStatistics.js");
    var hourDayLog = require("../hourDayLog.js");
    if(serverInfo)
    {
        var fs = require('fs');
        var cp = require('child_process');
        if(!serverInfo.server[hostname] && (type == 1 || type == 3))//下载项
        {
            serverInfo.server[hostname] = serverInfo.db;
        }
        var ip = serverInfo.server[hostname].ip;
        var port = serverInfo.server[hostname].port;
        var tDay = null;
        if(!ip)
        {
            console.log(hostname+" 不存在");
            console.log("serverInfo.server:"+JSON.stringify(serverInfo.server));
            !gErrMsg||gErrMsg(hostname+" 不存在")
            return;
        }

        if(!day)
        {
            tDay = new Date(new Date() - 24 * 60 * 60 * 1000);//默认前一天
        }
        else if(typeof day == 'string' && day.length == 10)
        {
            tDay = new Date(day);//指定日期
        }
        else
        {
            !gErrMsg||gErrMsg(day+" 日期格式错误, 格式必须为： \"2016-01-02\"");
            return;
        }

        var path = serverInfo.path;
        var date = taskTools.Format(tDay, 'yyyy-MM-dd');  //前一天 做保存路径
        var startTime = new Date();
        var tarPath = path.tarPath+"/"+date;//目标解压路径
        var fileName = hostname+".tgz";
        if(type == 1 && option == 1)//dayLog.json
        {
            fileName = 'dayLog.json';
        }
        var downloadUrl = "http://"+ip+":"+port +"/" + date+"/"+fileName;
        var dbIp = serverInfo.db.ip+':'+serverInfo.db.port;
        var mongodbUrl = "mongodb://"+dbIp+"/"+hostname;


        if(type == 1)//下载并采集单个
        {
            if(option == 1)//dayLog.json
            {
                tarPath += "/"+hostname;
                if(fs.existsSync(path.download+"/"+date+"/"+fileName))
                {
                    cp.exec('rm -rf '+ path.download+"/"+date+"/"+fileName);
                    console.log("删除下载的存在的文件:" +tarPath+"/"+fileName);
                }
                if (fs.existsSync(tarPath+"/"+fileName))
                {
                    cp.exec('rm -rf '+ tarPath+"/"+fileName);
                    console.log("删除解压的存在的文件:" +tarPath+"/"+fileName);
                }

                console.log("下载中:" +downloadUrl);
                taskTools.downloadFile(tarPath, downloadUrl, function (endMsg) {
                    console.log("下载成功:" +downloadUrl);
                    var jsonPath = tarPath+'/'+fileName;//mnt/vdb1/backup/2017-02-18/sdmj/dayLog.json
                    var dayLogJson = require(jsonPath);
                    console.log('解析 .json',JSON.stringify(dayLogJson));
                    console.log('解析成功:' + hostname+', 采集分析中...');
                    //前一小时
                    hourDayLog(mongodbUrl, new Date(new Date() - 1 * 60 * 60 * 1000),
                        function (endMsg) {
                            console.info(fileName + ', 成功：'+endMsg+', time: ' + (new Date() - startTime));
                            !gEndMsg||gEndMsg(endMsg)
                        }, function (errMsg) {
                            console.info('error ======== ' + errMsg);
                            !gErrMsg||gErrMsg(errMsg)
                        }, dayLogJson);


                }, function (error) {
                    console.log('downloadFile Failed: ' + downloadUrl);
                    !gErrMsg||gErrMsg(error)
                });

            }
            else
            {
                if(fs.existsSync(path.download+"/"+date+"/"+fileName))
                {
                    cp.exec('rm -rf '+ path.download+"/"+date+"/"+fileName);
                    console.log("删除下载的存在的文件:" +tarPath+"/"+fileName);
                }
                if (fs.existsSync(tarPath+"/"+fileName))
                {
                    cp.exec('rm -rf '+ tarPath+"/"+fileName);
                    console.log("删除解压的存在的文件:" +tarPath+"/"+fileName);
                }

                console.log("下载中:" +downloadUrl);
                taskTools.downloadFile(tarPath, downloadUrl, function (endMsg) {
                    console.log("下载成功:" +downloadUrl);
                    var unTarPath = path.unTarPath+"/"+hostname;//文件解压后路径
                    if (!fs.existsSync(unTarPath))
                    {
                        cp.exec('mkdir -p '+ unTarPath);
                        // cp.exec('mkdir -p '+ unTarPath, {cwd:unTarPath});
                    }

                    taskTools.extractFile(fileName, tarPath, unTarPath, function (endMsg) {
                        console.log('解压成功:' + fileName+ ', 导入中...');
                        // console.log("路径： "+'cd '+ unTarPath);
                        importDbTask(dbIp, hostname, date, unTarPath, function (endMsg) {

                            console.log('导入成功:' + hostname+', 采集分析中...');
                            userStatistics(mongodbUrl, day,
                                function (endMsg) {
                                    console.info(fileName + ', 成功：'+endMsg+', time: ' + (new Date() - startTime));
                                    !gEndMsg||gEndMsg(endMsg)
                                }, function (errMsg) {
                                    console.info('error ======== ' + errMsg);
                                    !gErrMsg||gErrMsg(errMsg)
                                });

                        }, function (error) {
                            console.log('importDbTask Failed: ' + error);
                            !gErrMsg||gErrMsg(error)
                        });


                    }, function (error) {
                        console.log('unTargzFile Failed: ' + fileName);
                        !gErrMsg||gErrMsg(error)
                    });

                }, function (error) {
                    console.log('downloadFile Failed: ' + downloadUrl);
                    !gErrMsg||gErrMsg(error)
                });
            }

        }
        else if(type == 2)//不下载只采集全部
        {
            var date = new Date('2016-7-1');
            var today = taskTools.Format(new Date(),'yyyyMMdd');
            today = parseInt(today);
            function runStatic() {
                var str = taskTools.Format(date, 'yyyyMMdd');

                if (parseInt(str) >= today) {
                    !gEndMsg||gEndMsg(hostname + '.tgz, 成功, time: ' + (new Date() - startTime));
                    return;
                }
                var mDay = str.substr(0,4)+'-'+str.substr(4,2)+'-'+str.substr(6,2);//2017-01-01
                userStatistics(mongodbUrl, mDay, function (msg) {
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
        else if(type == 3)//所有项目不下载采集全部,选项可以忽略某些项目
        {
            var events = require('events');
            var eventEmitter = new events.EventEmitter();
            var ignoreOp = hostname.split(':');
            console.log('ignoreOp',ignoreOp);
            for (var i = 0;i < ignoreOp.length; i++)
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

            function runTask (dbUrl, endMsg)
            {
                var date = new Date('2016-7-1');
                // var date = new Date('2017-1-9');
                var today = taskTools.Format(new Date(),'yyyyMMdd');
                today = parseInt(today);
                function runStatic2() {
                    var str = taskTools.Format(date, 'yyyyMMdd');

                    if (parseInt(str) >= today) {
                        !endMsg||endMsg(dbUrl+', time: ' + (new Date() - startTime));
                        return;
                    }
                    var mDay = str.substr(0,4)+'-'+str.substr(4,2)+'-'+str.substr(6,2);//2017-01-01
                    userStatistics(dbUrl, mDay, function (msg) {
                        console.info(msg);
                        date.setDate(date.getDate() + 1);
                        runStatic2();
                    }, function (msg) {
                        console.info(msg);
                        date.setDate(date.getDate() + 1);
                        runStatic2();
                    });
                  /*  console.info(mDay);
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
        else if(type == 4)//只下载和导入数据库 不采集分析！
        {
            if (fs.existsSync(path.download+"/"+date+"/"+fileName))
            {
                cp.exec('rm -rf '+ path.download+"/"+date+"/"+fileName);
                console.log("删除下载的存在的文件:" +tarPath+"/"+fileName);
            }
            if (fs.existsSync(tarPath+"/"+fileName))
            {
                cp.exec('rm -rf '+ tarPath+"/"+fileName);
                console.log("删除解压的存在的文件:" +tarPath+"/"+fileName);
            }

            console.log("下载中:" +downloadUrl);
            taskTools.downloadFile(tarPath, downloadUrl, function (endMsg) {
                console.log("下载成功:" +downloadUrl);
                var unTarPath = path.unTarPath+"/"+hostname;//文件解压后路径
                if (!fs.existsSync(unTarPath))
                {
                    cp.exec('mkdir -p '+ unTarPath);
                    // cp.exec('mkdir -p '+ unTarPath, {cwd:unTarPath});
                }

                taskTools.extractFile(fileName, tarPath, unTarPath, function (endMsg) {
                    console.log('解压成功:' + fileName+ ', 导入中...');
                    // console.log("路径： "+'cd '+ unTarPath);
                    importDbTask(dbIp, hostname, date, unTarPath, function (endMsg) {

                        console.log('导入成功:' + hostname);
                    }, function (error) {
                        console.log('importDbTask Failed: ' + error);
                        !gErrMsg||gErrMsg(error)
                    });


                }, function (error) {
                    console.log('unTargzFile Failed: ' + fileName);
                    !gErrMsg||gErrMsg(error)
                });

            }, function (error) {
                console.log('downloadFile Failed: ' + downloadUrl);
                !gErrMsg||gErrMsg(error)
            });
        }
        else// 不下载只采集单个
        {
            userStatistics(mongodbUrl, day,
                function (endMsg) {
                    console.info(hostname + '.tgz, 成功：'+endMsg+', time: ' + (new Date() - startTime));
                    !gEndMsg||gEndMsg(endMsg)
                }, function (errMsg) {
                    !gErrMsg||gErrMsg(errMsg)
                })
        }

    }
}
