/**
 * Created by Fanjiahe on 2016/12/22 0022.
 */

var fs = require('fs');
var cp = require('child_process');
var os = require('os');
var region = require('./region.json');
// 1. 修改所有json文件

console.log(process.argv.length);
if(process.argv.length < 3)
{
	return;
}

var proName = process.argv[2];

var hostname = os.hostname();
//hostname = 'lb-hd1-port'.split("-");
hostname = hostname.split("-");
hostname = hostname.shift();
var type =   process.argv[3] || hostname;

var serversConfig = region.region[type];
var serversPort = region.region.port;

if(!serversConfig || !serversPort || type == "port")
{
	console.log("error : no serversConfig or port field",type, region);
	return;
}

var curSType = serversConfig[proName];

var curSPort = serversPort[proName];
if(!curSType || !curSType.length || !proName)
{
	console.log("error : no curSType ", curSType, proName, serversConfig);
	return;
}

var curServersConfig = "";
//curSType += curSPort;
for(var count = 0; count < curSType.length; count++)
{
	var curServer =  curSType[count];
	curServersConfig = curServersConfig + curServer + curSPort + (count == curSType.length - 1 ? "":",");
}

console.log(type, JSON.stringify(curServersConfig));

var path = "/root/" + proName + "/web/";
fs.readdir(path, function(err, files){
	//err 为错误 , files 文件名列表包含文件夹与文件
	if(err){
		console.log('error:\n' + err);
		return;
	}

	files.forEach(function (file)
	{
		if(file.indexOf(".json") < 0)
		{
			return;
		}

		var jsonFile = require(path + file);

		if(jsonFile.servers)
		{
			console.log(file, jsonFile.servers);
			jsonFile.servers = curServersConfig;
			fs.writeFileSync(path + file,JSON.stringify(jsonFile, null, 4));
			console.log(file, jsonFile.servers);
		}
		//console.log(file, jsonFile.servers);
	});

	exec("node xxteaEncode.js " + path + " " + path,function ()
	{
		console.log("is OK");
	},function ()
	{
		console.log("is error");
	});


});

console.log("proName", proName, path);


var exec = function (cmd, endF, errF)
{
	cp.exec(cmd, function (err, output, stderr)
	{
		if (err)
		{
			!errF || errF(err);
		}
		else
		{
			endF(output);
		}
	});
};
