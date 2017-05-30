/**
 * Created by lhq on 2016/8/19 0019.
 */

var express = require('express'); //引入express 核心模块？
var bodyParser = require('body-parser'); //body解析xml
var fs = require('fs');

var app = express(); //用express创建一个新的程序
app.use(bodyParser.json());

var dataServer = new require('./activityData.js');

dataServer = new dataServer(function(port) {
    app.listen(port);
    console.log('activityWeb listion on:' + port);
});

function AddWebHandler(type, path, js) {
    if (typeof js == 'function') {
        app[type](path, js);
        console.log("type, path", type, path);
    } else {
        console.log("AddWebHandler(...)");
        for (var pty in js) {
            AddWebHandler(type, path + "/" + pty, js[pty]);
        }
    }
}

function Reload() {
    var dirPath = __dirname + "/post";

    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        var lst = fs.readdirSync(dirPath);

        for (var i = 0; i < lst.length; i++) {
            if (fs.statSync(dirPath + "/" + lst[i]).isFile()) {
                delete require.cache[require.resolve("./post/" + lst[i])];
                var handler = require("./post/" + lst[i])(dataServer);
                console.log("Reload" + dirPath);
                var nojs = lst[i].substr(0, lst[i].length - 3);
                AddWebHandler('post', "/" + nojs, handler);
            }
        }
    }
}

Reload();