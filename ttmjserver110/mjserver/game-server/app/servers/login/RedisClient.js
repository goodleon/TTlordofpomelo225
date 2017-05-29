module.exports = function(app,server,serverClass)
{
	// redis Á´½Ó
	var redis   = require('redis');
	var client  = redis.createClient('6379', app.getMaster().redis);

	// redis Á´½Ó´íÎó
	client.on("error", function(error) {
		console.log(error);
	});
	client.auth("jxlw921JXLW");
	client.select(0, function(error){
    if(error) {
        console.log(error);
    }
	else 
	{
		server.redisClient=client;
	}});
	
}

