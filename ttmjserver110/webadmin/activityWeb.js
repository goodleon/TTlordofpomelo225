/**
 * Created by lhq on 2016/8/19 0019.
 */

var express = require('express');//引入express 核心模块？
var bodyParser = require('body-parser');//body解析xml
var fs = require('fs');

var app = express();//用express创建一个新的程序
app.use(bodyParser.json());

var dataServer = new require('./activityData.js');

dataServer = new dataServer(function(ip, port) {
    app.listen(port, ip);
    console.info('activityWeb listion on ' + ip + ':' + port);
});

function AddWebHandler(type, path, js) {
    if(typeof js == 'function') {
        app[type](path, js);
    } else {
        for(var pty in js) {
            AddWebHandler(type, path + "/" + pty, js[pty]);
        }
    }
}

function Reload() {
    var dirPath = __dirname+"/activity";

    if(fs.existsSync(dirPath) && fs.statSync(dirPath ).isDirectory()) {
        var lst = fs.readdirSync(dirPath);

        for(var i = 0; i < lst.length; i++) {
            if(fs.statSync(dirPath + "/" + lst[i]).isFile()) {
                delete require.cache[require.resolve("./activity/" + lst[i])];
                var handler = require("./activity/"+lst[i])(dataServer);
                var nojs = lst[i].substr(0, lst[i].length - 3);
                AddWebHandler('post', "/" + nojs, handler);
            }
        }
    }
}

Reload();








