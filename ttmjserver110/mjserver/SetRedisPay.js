/**
 * Created by lhq on 2016/12/21 0021.
 * 比赛WEB程序主文件，其他与PKPLAYER有交互的WEB可借鉴
 */

var fs = require('fs');
var express = require('express'); //引入express 核心模块？
var bodyParser = require('body-parser'); //body解析xml
var app = express(); //用express创建一个新的程序
app.use(bodyParser.json());
//app.engine('.html', ejs.__express);
//app.set('view engine', 'html');
var http = require('http');
var cp = require('child_process');
var crypto = require('crypto');
var pass = "Am36p0RaxcZxNuPtHzUtPCL9";

var wxpayCfg = {
    "com.happy.scmj15": { type: 1, num: 15, fee: 3000 },
    "com.happy.scmj60": { type: 1, num: 60, fee: 11800 },
    "com.happy.scmj150": { type: 1, num: 150, fee: 28800 },
    "com.happy.scmj320": { type: 1, num: 320, fee: 58800 },
    "com.happy.scmj72000": { type: 2, num: 72000, fee: 600 },
    "com.happy.scmj220000": { type: 2, num: 220000, fee: 1800 },
    "com.happy.scmj380000": { type: 2, num: 380000, fee: 3000 },
    "com.happy.scmj900000": { type: 2, num: 900000, fee: 6800 },
    "com.happy.scmj1750000": { type: 2, num: 1750000, fee: 12800 },
    "com.happy.scmj4150000": { type: 2, num: 4150000, fee: 28800 },
    "com.happy.hnyymj.wxdimond1": { type: 1, num: 1, fee: 100 }, //1元买1钻
    "com.happy.hnyymj.wxdimond2": { type: 1, num: 6, fee: 600 }, //6元买6钻
    "com.happy.hnyymj.wxdimond3": { type: 1, num: 30, fee: 3000 }, //30元买30钻
    "com.happy.hnyymj.wxdimond4": { type: 1, num: 50, fee: 5000 }, //50元买50钻
    "com.happy.hnyymj.wxdimond5": { type: 1, num: 100, fee: 10000 } //100元买100钻
}

var iosiapCfg = {
    "com.happy.scmj15": { type: 1, num: 15, fee: 3000 },
    "com.happy.scmj60": { type: 1, num: 60, fee: 11800 },
    "com.happy.scmj150": { type: 1, num: 150, fee: 28800 },
    "com.happy.scmj320": { type: 1, num: 320, fee: 58800 },
    "com.happy.scmj72000": { type: 2, num: 72000, fee: 600 },
    "com.happy.scmj220000": { type: 2, num: 220000, fee: 1800 },
    "com.happy.scmj380000": { type: 2, num: 380000, fee: 3000 },
    "com.happy.scmj900000": { type: 2, num: 900000, fee: 6800 },
    "com.happy.scmj1750000": { type: 2, num: 1750000, fee: 12800 },
    "com.happy.scmj4150000": { type: 2, num: 4150000, fee: 28800 }
}


! function redisTest() {
    /*var _key = "Am36p0RaxcZxNuPtHzUtPCL9" + "/" + new Date() + "/" + 112233;
    //console.log(crypto.getCiphers());
    var userKey = {};
    //userKey.salt =  Math.floor(Math.random() * 1000);

    userKey.salt = Math.floor(Math.random()*100000000);
    userKey.uid = 1234;
    userKey.time = 1488615790.605;

    var testKey = JSON.stringify(userKey);
    //var testKey = '{"salt":708428843,"uid":1234,"time":1488615790.605}';
    console.log("user key = "+testKey);
    var iv = "";

    var cipher = crypto.createCipher('aes192', pass);
    var enc = cipher.update('gaowei', 'utf8', 'hex');
    enc += cipher.final('hex');

    //var key = new Buffer (pass,'base64');
    //var ivBuf = new Buffer("1234567812345678",'base64');
    //var ivBuf = new Buffer('123456781234567812345678');

    //var cipher = crypto.createCipheriv('des3', key, ivBuf);
    //var enc = cipher.update(testKey, 'utf8', 'base64');
    //enc += cipher.final('hex');
    console.log(enc);*/


    var redis = require('redis');
    var client = redis.createClient('6379', "cbfff72bcb1b4db9.redis.rds.aliyuncs.com");

    client.on("error", function(error) {
        console.log(error);
    });
    client.auth("jxlw921JXLW");

    client.select(0, function(error) {
        if (error) {
            console.error("=========>pkplayer redis error " + error);
        } else {
            client.set("iosiap", JSON.stringify(iosiapCfg), function(err, res) {
                if (err) {
                    console.log(" errr = " + err);
                } else {
                    console.log("ok, res =" + res);
                }
            });

            client.set("wxpay", JSON.stringify(wxpayCfg), function(err, res) {
                if (err) {
                    console.log(" errr = " + err);
                } else {
                    console.log("ok, res =" + res);
                }
            });
        }
    });

    client.select(0, function(error) {
        client.get("iosiap", function(err, res) {
            if (err) {
                console.log(" errr = " + err);
            } else {
                console.log("ok, res =" + res);
                var testData = JSON.parse(res);

                console.log("ioscfg = " + testData["com.happy.scmj15"].fee);
            }
        });

        client.get("wxpay", function(err, res) {
            if (err) {
                console.log(" errr = " + err);
            } else {
                console.log("ok, res =" + res);
                var testData = JSON.parse(res);

                console.log("wxpay = " + testData["com.happy.hnyymj.wxdimond5"].fee);
            }
        });
    });


}();