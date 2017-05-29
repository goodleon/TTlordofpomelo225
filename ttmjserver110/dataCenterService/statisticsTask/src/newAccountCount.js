/**
 * Created by Fanjiahe on 2016/9/19.
 * 统计 每日新增人数
 */


var MongoClient = require('mongodb').MongoClient;
var dbServer = process.argv[2];
var db = process.argv[3];
var url = 'mongodb://' + dbServer  + ':27017/' + db;
var tableName = 'cgbuser';


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
	fs.writeFile(file, str, function(err)
	{
		if(err)
			console.log("fail " + err);
		else
			console.log("写入文件ok");
	});
}

Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, 
        "d+": this.getDate(), 
        "h+": this.getHours(),  
        "m+": this.getMinutes(),  
        "s+": this.getSeconds(), 
        "q+": Math.floor((this.getMonth() + 3) / 3), 
        "S": this.getMilliseconds() 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

require('mongodb').MongoClient.connect(url,function(er,db)
{
	var allStatus={};
	var allCount=0;
	var today = new Date().Format('yyyyMMdd');
	var isToday = function (day)
	{
		return today==day;
	};
	try
	{
		db.collection(tableName).find().each(
			function(er,doc)
			{
				if (doc&&doc.sendTime)
				{	
					var day = new Date(doc.sendTime).Format('yyyyMMdd');
					allStatus[day] = (allStatus[day] || 0) + 1;
					if (!(allCount++ % 500))
					{
						console.log(allCount);
					}
				}

				if (!doc)
				{
					console.log('allCount is: ' + allCount);
					console.log('today registered account count is :' + (allStatus[today] || 0) );
					console.log('all registered account count is: ' + JSON.stringify(allStatus));
					db.close();
					return 0;
				}
		});
	}catch (e)
	{
		console.log('error: ' + JSON.stringify(e));
	}
});
