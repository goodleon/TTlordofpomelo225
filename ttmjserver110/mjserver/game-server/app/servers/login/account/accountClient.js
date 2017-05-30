module.exports = function(app) {

    var http = require('http');
    var ahost = "localhost";
    var aport = 4005;

    var accountClient = app.getMaster().accountClient;
    if (accountClient) { ahost = accountClient.host;
        aport = accountClient.port; }

    function postJson(path, msg, next, port) {
        console.info(ahost + " " + port + " " + path);

        var userString = JSON.stringify(msg); //转换为json字符格式,在服务器端直接解析req.body  
        var headers = {
            'Content-Type': 'application/json',
            'Content-Length': userString.length
        };
        var options = {
            host: ahost, //主机：切记不可在前面加上HTTP://  
            port: port, //端口号  
            path: '/' + path, //路径  
            method: 'POST', //提交方式  
            headers: headers
        };

        var tagbuf = new Buffer(0);

        var req = http.request(options, function(res) {
            res.on('data', function(data) { tagbuf = Buffer.concat([tagbuf, data]); });
            res.on('end', function() {
                console.info("status " + res.statusCode + " " + tagbuf.toString());
                if (res.statusCode == 403) next({ statusCode: 403, body: tagbuf.toString() }, null);
                else next(null, JSON.parse(tagbuf.toString()));
            });
        });
        req.on('error', function(e) { next(e, null); });
        // write data to request body  
        req.write(userString); //向req.body里写入数据  
        req.end();
    }


    var client = {

        NewPlayer: function(msg, next) {
            postJson("NewPlayer", msg, next, aport);
        },
        reqGuestID: function(msg, next) {
            postJson("reqGuestID", msg, next, aport);
        },
        getMemberByIDPass: function(msg, next) {
            postJson("getMemberByIDPass", msg, next, aport + 1);
        }
    }

    //client.getMemberByIDPass({mid:13520189350,mPass:"189350"},function(er,rtn){  console.info(JSON.stringify([er,rtn])); });
    //client.reqGuestID({},function(er,rtn){});
    return client;
}