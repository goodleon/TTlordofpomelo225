module.exports=function(app){
	
   var http = require('http');
   var qs = require('querystring');
   http.globalAgent.maxSockets=256;

   var client= {
   		get:function(path,msg,port,host,next)
		{
            var content = qs.stringify(msg);

            var options = {
                host: host,
                port: port,
                path: path + "?" +content,
                method: 'GET'
            };

            var req = http.request(options, function (response) {
                var responseText=[];
                var size = 0;
                response.on('data', function (data) {
                    responseText.push(data);
                    size+=data.length;
                });
                response.on('end', function () {
                    // Buffer 是node.js 自带的库，直接使用
                    responseText = Buffer.concat(responseText,size);
                    next(null, responseText.toString());
                });
                response.on('error', function (e) {
                    next(e, null);
                });
            });

            req.on('error', function (e) {
                next(e, null);
            });

            req.end();
        },
   	    postForm:function(path,msg,port,host,next)
		{
			msg = JSON.stringify(msg);
            var post_options = {
                host: host,
                port: port,
                path: path,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': msg.length
                }
            };

            var post_req = http.request(post_options, function (response) {
                var responseText=[];
                var size = 0;
                response.on('data', function (data) {
                    responseText.push(data);
                    size+=data.length;
                });
                response.on('end', function () {
                    // Buffer 是node.js 自带的库，直接使用
                    responseText = Buffer.concat(responseText,size);
                    next(null, responseText.toString());
                });
                response.on('error', function (e) {
                    next(e, null);
                });
            });


            post_req.write(msg);

            post_req.end();
		},
		postJson:function(path,msg,port,host,next)
		{
			//console.info('http postJson : ' + JSON.stringify({path:path, msg:msg, port:port, host:host}));

			var userString = JSON.stringify(msg);//转换为json字符格式,在服务器端直接解析req.body
			var headers = {
				'Content-Type': 'application/json',
				'Content-Length': userString.length
			};
			var options = {
				host: host,//主机：切记不可在前面加上HTTP://
				port: port,//端口号
				path: '/' + path,//路径
				method: 'POST',//提交方式
				headers: headers
			};

			var tagbuf = new Buffer(0);

			var req = http.request(options, function (res) {
				res.on('data', function (data) {
					tagbuf = Buffer.concat([tagbuf, data]);
				});
				res.on('end', function () {
					/*console.info("status "+res.statusCode+" "+tagbuf.toString());*/
					if (res.statusCode == 403) next({statusCode: 403, body: tagbuf.toString()}, null);
					else next(null, JSON.parse(tagbuf.toString()));
				});
			});
			req.on('error', function (e) {
				next(e, null);
			});
			// write data to request body
			req.write(userString);//向req.body里写入数据
			req.end();
		}
   }
   
   //client.getMemberByIDPass({mid:13520189350,mPass:"189350"},function(er,rtn){  console.info(JSON.stringify([er,rtn])); });
   //client.reqGuestID({},function(er,rtn){});
   return client;
}



