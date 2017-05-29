/**
 * Created by Fanjiahe on 2016/11/26 0026.
 */

var fs = require('fs');
var cp = require('child_process');
var memberMoney = 'memberMoney';
var membersMoneyCollections = [];
var collections = [];
var sysIndex = 'system.indexes';    // 目录

var MongoClient = require('mongodb').MongoClient;
var dbServer = process.argv[2];
var db = process.argv[3];
var url = 'mongodb://' + dbServer + ':27017/' + db;
var members = "members"; // 会员
var membersRecords = 'membersRecords';  // 会员记录
var memberRetention = 'memberRetention';   // 会员留存
var currentCount = 0;

/*if (process.argv.length == 2)
{
	var os = require('os');
	var hostname = os.hostname().split("-");
	var type = hostname[1];
	hostname = hostname[0];

	if (type != "master" && type != "data" && type != "test")
	{
		console.log("不要在除了数据服之外的服务器上运行!");
	}

	var info = require('/root/mjserver/game-server/config/master.json');
	var host = info[hostname]["host"];
	dbServer = host;
	if (hostname != 'localhost')
	{
		db = hostname;
	}
	else
	{
		db = 'test';
	}
	url = 'mongodb://' + dbServer + ':27017/' + db;
}*/

var tools = require('./tools.js')();
url = tools.url;
dbServer = tools.dbServer;
db = tools.dbname;
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


MongoClient.connect(url, function (er, db)
{
	var today = (new Date().Format('yyyyMMdd'));


	/**
	 * 数组去重
	 * */
	Array.prototype.unique = function ()
	{
		var n = {}, r = []; //n为hash表，r为临时数组
		for (var i = 0; i < this.length; i++) //遍历当前数组
		{
			if (!n[this[i]]) //如果hash表中没有当前项
			{
				n[this[i]] = true; //存入hash表
				r.push(this[i]); //把当前数组的当前项push到临时数组里面
			}
		}
		return r;
	};


	function sortMS(a, b)
	{
		return Number(getRecordDate(a, memberMoney).date) - Number(getRecordDate(b, memberMoney).date);
	}

	/**
	 * 获取时间
	 * @param {string|number} record 合集的名称
	 * @param {string|number} key key
	 * */
	function getRecordDate(record, key)
	{
		var date = String(record).replace(key, '');
		var year = date.substring(0, 4);
		var month = date.substring(4, 6);
		var day = date.substring(6, 8);
		var data = {date: date, year: year, month: month, day: day};
		return data;
	}

	/**
	 *  解析 所需的集合
	 * */
	function analysisMemberMoneyCollections(key)
	{
		var tempArray = [];
		for (var count = 0; count < collections.length; count++)
		{
			var currentCollectionName = collections[count];
			if (currentCollectionName != (key) && currentCollectionName.indexOf(key) != -1 &&
				currentCollectionName.indexOf(String(today)) == -1)
			{
				tempArray.push(currentCollectionName);
			}
		}
		return tempArray;
	}


	/**
	 * 获取会员充值所有表
	 * @param {function} callBack 回调函数
	 * */
	function getMemberMoneyCollections(callBack)
	{
		db.collection(sysIndex).find().each(
			function (er, doc)
			{
				if (doc && doc.ns)
				{
					var currentName = doc.ns.split('.')[1];
					collections.push(currentName);
				}

				if (!doc)
				{
					membersMoneyCollections = analysisMemberMoneyCollections(memberMoney);
					membersMoneyCollections = membersMoneyCollections.unique();
					!callBack || callBack();
				}
			});
	}


	getMemberMoneyCollections(function ()
	{
		membersMoneyCollections.sort(sortMS);
		db.close();
		start();
	});

	function start()
	{
		var allProcess = [];

		function forkP(date)
		{
			var newProcess = cp.fork(__dirname + '/memberConsumption.js', [date]);
			allProcess.push(newProcess);
			newProcess.type = date;

			(function (newProcess)
			{
				var callBack = function (Data)
				{
					console.log('PARENT got message:', newProcess.type, Data);
					var next = nextDate();
					if(!next)
					{
							return;
					}
					forkP(next);
				};
				newProcess.onCallBack = callBack;
				newProcess.on('message', callBack);
			})(newProcess);
		}


		var currentC = membersMoneyCollections[currentCount];
		var cDate = getRecordDate(currentC, memberMoney);
		var date = cDate.year + '-' + cDate.month + '-' + cDate.day;

		forkP(date);
		
		function nextDate()
		{
			currentCount++;
			if(currentCount >= membersMoneyCollections.length)
			{
				return 0;
			}
			var currentC = membersMoneyCollections[currentCount];
			var cDate = getRecordDate(currentC, memberMoney);
			var date = cDate.year + '-' + cDate.month + '-' + cDate.day;
			return date;
		}
	}


});

