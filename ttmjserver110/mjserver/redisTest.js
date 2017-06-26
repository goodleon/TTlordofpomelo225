// redis 链接
var redis = require('redis');
// var client = redis.createClient('6379', '6a12890d4f584e7e.m.cnsza.kvstore.aliyuncs.com');
var client = redis.createClient('6379', '127.0.0.1');
// redis 链接错误
client.on("error", function(error) {
    console.log("链接错误了----");
    console.log(error);
});

client.auth("jxlw921JXLW");

console.log("开始下一步的查询操作");
client.select('0', function(error) {
    if (error) {
        console.log("select错误了----");
        console.log(error);
    } else {
        console.log("select没错----");
        // set
        client.hget('SigninCfg', 'ozUH9w9Llxk59Xg7cvj3gsvLU73U@weixin', function(error, res) {
            console.log(JSON.stringify([error, res]));
            // 关闭链接
            client.end();
        });

        // client.get('SigninCfg', function(error, res) {
        //     console.log(JSON.stringify([error, res]));
        //     // 关闭链接
        //     client.end();
        // });
    }
});