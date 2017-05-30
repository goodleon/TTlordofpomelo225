/*
var cp = require('child_process');
var fs = require('fs');
var serverInfo = require('./config.json');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var servers = serverInfo.server;
var keysServers = Object.keys(servers);
var keysServersLen = keysServers.length;
var keysServersIdx = 0;
function execFunc() {
    var key = keysServers[keysServersIdx];
    var ip = servers[key].ip;
    var port = servers[key].port;
    console.log("len "+keysServersLen+" ,idx "+keysServersIdx+", "+key+", "+ip+", "+port);

/!*
    入库
    mongorestore -h 127.0.0.1 -d ddz 2016-12-09
    出库
    mongodump -h 127.0.0.1 -d ddz -c cgbuser -o outPa th
    mongodump -h 127.0.0.1 -d gdmj -c cguser -q '{"sendTime":{$gte:Date(1481241600000)}}' -o 2016-12-10
    wget 下载
    wget -P 指定目录 http://139.224.25.69:88/2016-11-10/ynmj.tgz


*!/

    var cmd = "rm -rf "+key;
    cp.exec(cmd, function (err, output, stderr)
    {
        if (err)
        {
            // console.log("失败: " + err);
            console.log(err);
        }
        else
        {
            console.log("完成: " + output);
        }
        if(++keysServersIdx < keysServersLen)
        {
            eventEmitter.emit('next');
        }
        else
        {
            console.log("全部结束");
        }
    });

}
eventEmitter.on('next', execFunc);
eventEmitter.emit('next');
*/

/*
 * 1、下载并采集单个，默认时间为昨天，可以指定时间（严格时间格式）
 * node test.js 1 'gdmj' //昨天
 * node test.js 1 'gdmj' '2016-11-01' //指定日期
 *
 * 2、不下载只采集单个，默认时间为昨天，可以指定时间（严格时间格式）
 * node test.js 0 'gdmj' //昨天
 * node test.js 0 'gdmj' '2016-11-01' //指定日期
 *
 * 3、单个不下载采集全部
 * node test.js 2 'gdmj'
 * 4、所有项目不下载采集全部,选项可以忽略某些项目
 * node test.js 3 'sdmj:fjmj'
 * 5、只下载和导入数据库 不采集分析！
 * node test.js 4 'gdmj'
 * node test.js 4 'fjmj' '2017-01-15' //指定日期
 *
 * */
require('./dayTask/userStatisticsTask.js')(process.argv[2], process.argv[3], process.argv[4], function(endMsg) {
    console.log("导出完成: " + endMsg);
}, function(errMsg) {
    console.log("导出失败: " + errMsg);
});