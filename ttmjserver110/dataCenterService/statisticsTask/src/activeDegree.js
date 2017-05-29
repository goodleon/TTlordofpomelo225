/**
 * Created by Fanjiahe on 2016/9/19.
 * 统计 日活跃人数 (开房间的人数)
 */

var MongoClient = require('mongodb').MongoClient;
var dbServer = process.argv[2];
var db = process.argv[3];
var url = 'mongodb://' + dbServer + ':27017/' + db;
var tableName = 'majiangLog';

/*if (process.argv.length == 2)
{
	var os = require('os');
	var hostname = os.hostname().split("-");
	var type = hostname[1];
	hostname = hostname[0];

	if(type != "master" && type != "data" && type != "test")
	{
		console.log("不要在除了数据服之外的服务器上运行!");
	}

	var info = require('/root/mjserver/game-server/config/master.json');
	var host = info[hostname]["host"];
	dbServer = host;
	db = hostname;
	var url = 'mongodb://' + dbServer + ':27017/' + db;
}*/

var tools = require('./tools.js')();
url = tools.url;
dbServer = tools.dbServer;
db = tools.dbname;
console.log("start ------ : "+ dbServer + " "  + db);
var fs = require('fs');
var file = "G:\\b.txt";

function writeFile(str)
{
	fs.writeFile(file, str, function (err)
	{
		if (err)
		{
			console.log("fail " + err);
		}
		else
		{
			console.log("写入文件ok");
		}
	});
}

Date.prototype.Format = function (fmt)
{
	var o = {
		"M+": this.getMonth() + 1,
		"d+": this.getDate(),
		"h+": this.getHours(),
		"m+": this.getMinutes(),
		"s+": this.getSeconds(),
		"q+": Math.floor((this.getMonth() + 3) / 3),
		"S": this.getMilliseconds()
	};
	if (/(y+)/.test(fmt))
	{
		fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	}
	for (var k in o)
	{
		if (new RegExp("(" + k + ")").test(fmt))
		{
			fmt =
				fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
		}
	}
	return fmt;
};

require('mongodb').MongoClient.connect(url, function (er, db)
{
	var allStatus = {};
	var allCount = 0;
	var today = new Date().Format('yyyyMMdd');
	var isToday = function (day)
	{
		return today == day;
	};

	var getCount = function (o)
	{
		var i = 0;
		for (var key in o)
		{
			i++;
		}
		return i;
	};

	try
	{
		db.collection(tableName).find().each(
			function (er, doc)
			{
				if (doc && doc.logs && doc.logs.length && doc.logs[0]["now"] && doc.logs[0]["players"] && doc.logs[0]["players"].length)
				{
					var currentInfo = doc.logs[0];
					var time = new Date(currentInfo["now"]).Format('yyyyMMdd');
					if(!allStatus[time])
					{
						allStatus[time] = {};
					}

					var uids = [];
					for (var count = 0; count < currentInfo["players"].length; count ++)
					{
						var currentUid = currentInfo["players"][count].uid;
						uids.push(currentUid);
						allStatus[time][currentUid] = allStatus[time][currentUid] ? allStatus[time][currentUid] + 1 : 1;
					}

					if (!(allCount++ % 500))
					{
						console.log(allCount);
					}
				}

				if(!doc)
				{
					console.log('allCount is: ' + allCount);

					for (var key in  allStatus)
					{
						if (allStatus[key])
						{
							console.log(key + " Active number: " + getCount(allStatus[key]));
						}
					}

					if (allStatus[today])
					{
						console.log("today Active number: " + getCount(allStatus[today]));
					}


					db.close();
					return 0;
				}
			});
	} catch (e)
	{
		console.log('error: ' + JSON.stringify(e));
	}
});
