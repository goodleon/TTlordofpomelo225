module.exports = function(gapp, gserver) {

    //console.info(gapp.serverId+" "+hport);

    var express = require('express'); //引入express 核心模块？
    var bodyParser = require('body-parser'); //body解析xml
    var fs = require('fs');

    var app = express(); //用express创建一个新的程序
    app.use(bodyParser.json());

    var aServer = this;

    function AddWebHandler(type, path, js) {
        if (typeof js == 'function') {
            app[type](path, js);
        } else {
            for (var pty in js) {
                AddWebHandler(type, path + "/" + pty, js[pty]);
            }
        }
    }

    AddWebHandler("post", "", {
        ReloadCode: function(req, res) {
            if (gserver.webFunc && gserver.webFunc.ReloadCode) {
                gserver.webFunc.ReloadCode(req, res);
                return;
            }
            if (gserver.ReloadCode) {
                gserver.ReloadCode();
                res.json("reload ok");
            } else res.json("reload fail");
        }
    });
    //在给定的主机和端口上监听请求，这个和node的文档http.Server#listen()是一致的
    app.listen(gapp.getCurServer().port + 1000, gapp.getCurServer().host);
    this.close = function() {

    }
    return aServer;

}