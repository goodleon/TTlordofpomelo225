/**
 * Created by Fanjiahe on 2016/11/15 0015.
 */

// 进程间通讯
//module.exports = function (admin)
//{
var fs = require('fs');
var cp = require('child_process');
var serverInfo = require('./config.json');
var tools = require('./tools')();

// var date = new Date(new Date() - 24*60*60*1000).Format('yyyy-MM-dd');  //前一天
var date = process.argv[2]; //前一天或今天
var dlType = Number(process.argv[3]); //下载dayLog
// var date = new Date().Format('yyyy-MM-dd');  //今天
console.log('date, dlType', date, dlType);
var servers = serverInfo.server;
var path = serverInfo.path;
var downloadPath = path.download + "/" + date;
var tarPath = path.tarPath + "/" + date;
var allProcess = [];

if (!fs.existsSync(downloadPath)) {
    cp.exec('mkdir -p ' + downloadPath);
}

if (!fs.existsSync(tarPath)) {
    cp.exec('mkdir -p ' + tarPath);
}



// for(const key in server)
for (var key in servers) {
    if (!servers.hasOwnProperty(key)) {
        continue;
    }
    (function(key) {
        var unTarPath = path.unTarPath + "/" + key;
        if (!fs.existsSync(unTarPath)) {
            cp.exec('mkdir -p ' + unTarPath);
        }
        var tIp = servers[key].ip;
        var tPort = servers[key].port;

        // console.log("url = %s", downloadUrl);
        var newProcess = cp.fork(__dirname + '/task.js', [key, tIp, tPort]);
        allProcess.push(newProcess);
        newProcess.type = key;
        var callBack = function(Data) {
            console.log('PARENT got message:', key, Data);
        };

        newProcess.onCallBack = callBack;
        newProcess.on('message', callBack);

        //newProcess.send({msg: 'world'});

    })(key);
}

function notifyAll(msg) {
    if (typeof msg != 'object') {
        tools.sLog('notifyAll', 'msg is not object->' + msg);
        return 1;
    }

    for (var count = 0; count < allProcess.length; count++) {
        var currentProcess = allProcess[count];
        if (currentProcess) {
            currentProcess.send(msg);
        } else {
            // 删掉
        }
    }
}

//用户存留逐个分析
var events = require('events');
var userStatisticsTask = require('./dayTask/userStatisticsTask.js');
var eventEmitter = new events.EventEmitter();
var keysServers = Object.keys(servers);
var keysServersLen = keysServers.length;
var keysServersIdx = 0;

function execFunc() {
    console.log("len " + keysServersLen + " ,idx " + keysServersIdx + ", " + keysServers[keysServersIdx]);
    userStatisticsTask(1, keysServers[keysServersIdx], date, function(endMsg) {
        console.log("导出完成: " + endMsg);
        tools.wLog('usTaskSuccess', { Success: '(' + keysServers[keysServersIdx] + ') Success!' }, 'usTaskSuccess');
        if (++keysServersIdx < keysServersLen) {
            eventEmitter.emit('next');
        }
    }, function(errMsg) {
        console.log("导出失败: " + errMsg);
        tools.wLog('usTaskFailed', { errMsg: "(" + keysServers[keysServersIdx] + ")" + errMsg }, 'usTaskFailed');
        if (++keysServersIdx < keysServersLen) {
            eventEmitter.emit('next');
        }

    }, dlType);

}
eventEmitter.on('next', execFunc);
eventEmitter.emit('next');