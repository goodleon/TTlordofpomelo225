module.exports = function(app,server,serverClass)
{
	// redis 链接
	var redis   = require('redis');
	var client  = redis.createClient('6379', app.getMaster().redis);

	// redis 链接错误
	client.on("error", function(error) {
		console.log(error);
	});
	client.auth("jxlw921JXLW");
	//var pkservers=app.GetCfgServers(app.serverType);
	//var idx=0;
	//for(idx=0;idx<pkservers.length;idx++) {if(pkservers[idx].id==app.serverId) break;}
	//最多15个
	client.select(0, function(error){
    if(error) {
        console.error("=========>pkplayer redis error " + error + ", ip = " + app.getMaster().redis);
    }
	else 
	{
		server.redisClient=client;
	}});

}

