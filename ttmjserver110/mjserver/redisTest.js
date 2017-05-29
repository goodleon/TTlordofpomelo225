// redis 链接
var redis   = require('redis');
var client  = redis.createClient('6379', '6a12890d4f584e7e.m.cnsza.kvstore.aliyuncs.com');

// redis 链接错误
client.on("error", function(error) {
    console.log(error);
});

client.auth("jxlw921JXLW");

client.select('0', function(error){
    if(error) {
        console.log(error);
    } else {
        // set
        client.hget('login_6', 'ozUH9w9Llxk59Xg7cvj3gsvLU73U@weixin', function(error, res) {
                console.log(JSON.stringify([error,res ] ));
            // 关闭链接
            client.end();
        });
    }
});