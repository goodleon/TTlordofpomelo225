/**
 * Created by Fanjiahe on 2016/9/19.
 * 统计 会员消费记录
 * 统计 会员消费趋势
 */

var MongoClient = require('mongodb').MongoClient;
var cp = require('child_process');

var dbServer = process.argv[2];
var db = process.argv[3];
var url = 'mongodb://' + dbServer + ':27017/' + db;
var userMoney = 'userMoney';    // 卖出
var memberMoney = 'memberMoney'; // 买入
var members = "members"; // 会员
var memberConsumptionRecords = "memberConsumptionRecords";
var memberConsumptionTrends = "memberConsumptionTrends";
var cgbUser = "cgbuser";
var sysIndex = 'system.indexes';    // 目录
var memberRetention = 'memberRetention';   // 会员留存

var totalMoney = 0;
var totalNum = 0;
var allCount = 0;
var membersMoneyCollections = null;


//if (process.argv.length == 2)
//{
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

db = 'phz';
var dataBase = db;
var url = 'mongodb://' + dbServer + ':27017/' + db;
//}

console.log("start ------ : " + dbServer + " " + db);
var fs = require('fs');
var file = __dirname + '/' + dataBase + '.txt';

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
	var startTime = new Date().getTime();
	var today = (new Date().Format('yyyyMMdd'));
	var allStatus = {};

	var userMoneyCollections = [];
	var collections = [];


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

	function sortMS2(a, b)
	{
		return Number(getRecordDate(a, userMoney).date) - Number(getRecordDate(b, userMoney).date);
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
		var month = date.substring(4, 8);
		var data = {date: date, year: year, month: month};
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
			if (currentCollectionName.indexOf(key) != -1 && currentCollectionName.indexOf(String(today)) == -1)
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
					userMoneyCollections = analysisMemberMoneyCollections(userMoney);
					userMoneyCollections = userMoneyCollections.unique();

					membersMoneyCollections = analysisMemberMoneyCollections(memberMoney);
					membersMoneyCollections = membersMoneyCollections.unique();
					!callBack || callBack();
				}
			});
	}

	// 获取每日注册人数
	function getRNum()
	{
		db.collection(memberRetention).find({}, {count: 1}).each(function (err, doc)
		{
			if (doc)
			{
				var date = doc._id;
				var count = doc.count;
				allStatus[date] = count;
			}
			else
			{
				console.log('时间' + "    " + '注册人数');
				for (var key in allStatus)
				{
					console.log(key + "    " + allStatus[key]);
				}
				db.close();
			}
		});
	}


	jisuansuoyou();

	var zhuanzhangcishu = {};
	var zhuanzhangrenshu = {};


	// 计算十月份注册的玩家
	function OctoberRegisteredUsers()
	{
		function subProcess(count)
		{
			if(!count)
			{
				return;
			}
			var status = [];
			var distribution = [];
			var currentPCount = 0;
			var len  = 30;
			for(var y = 0; y < len; y++)
			{
				if(currentPCount >= count)
				{
					currentPCount = 0;
				}

				if(!distribution[currentPCount])
				{
					distribution[currentPCount] = 0;
				}

				distribution[currentPCount] ++;
				currentPCount++;
			}
			console.log(distribution);
			var allProcess = [];
			var backCount = 0;
			console.log('len: ' + len + 'processNum:' + count);
			var startDate = '2016-10-01';
			var endDate ='2016-11-01';

			var maxDate = Number(new Date(endDate).Format('yyyyMMdd'));
			var currentEndDate = '';
			for (var x = 0; x < count; x++)
			{
				var currentDate = new Date(startDate);
				var date = currentDate.getDate();   // 日
				date = date + distribution[x] ;
				currentDate.setDate(date);
				currentEndDate = currentDate.Format('yyyy-MM-dd');
				if(maxDate < currentEndDate)
				{
					maxDate = currentEndDate;
				}

				console.log(x + ' || startDate:' + startDate + ' || currentEndDate: ' + currentEndDate);
				var newProcess = cp.fork(__dirname + '/testS.js', [dbServer, dataBase, startDate, currentEndDate]);
				startDate = currentEndDate;
				allProcess.push(newProcess);
				newProcess.type = x;
				(function (newProcess)
				{
					var callBack = function (Data)
					{
						status = status.concat(Data.status);
						console.log('PARENT got message:', newProcess.type, Data.pid);
						if(++backCount == count)
						{
							console.log("status" + status.length);
							writeFile(status.join('\n'));
						}
					};

					newProcess.onCallBack = callBack;
					newProcess.on('message', callBack);
				})(newProcess);
			}
		}

		function start(startDate, endDate)
		{
			var status = [];
			var count = 0;
			var message = {$gte: new Date(startDate), $lt: new Date(endDate)};
			console.log(message);
			//db.cgbuser.find({sendTime:{$lt:ISODate("2016-11-01T00:00:00.000Z"),$gte:ISODate("2016-10-01T00:00:00.000Z")}}).count()
			db.collection(cgbUser).find({sendTime: {$gte: new Date(startDate), $lt: new Date(endDate)}},{_id:1, sendTime:1, remoteIP:1}).
			each(function (err, doc)
			{
				if (doc)
				{
					var uid = doc._id;
					var ip = doc.remoteIP;
					var time = doc.sendTime;
					var date = new Date(time);
					date = date.Format('yyyy-MM-dd');
					count++;
					var newStr = ('uid:    ' + uid + '    date:    ' + date + '    ip:    ' + ip||'');
					status.push(newStr);
				}
				else
				{
					process.send({pid: process.pid, status:status});
					console.log(process.pid + '注册人数: ' + count);
					db.close();
				}
			});
		}

		if(process.argv.length == 2)
		{
			subProcess(20);
		}

		if(process.argv.length == 6)
		{
			var startDate = process.argv[4];
			var endDate = process.argv[5];
			start(startDate, endDate);
		}


	}

	function extend(destination, source)
	{
		for (var property in source)
		{
			if(property in destination)
			{
				destination[property] += source[property];
			}
			else
			{
				destination[property] = source[property];

			}
		}
		return destination;
	}

	// 每月充值玩家的数量
	function RechargeUserCount()
	{
		var collections = process.argv[4];
		if (!collections)
		{
			var allProcess = [];
			//var dbServer = '10.46.97.83';
			//var dataBase = 'scmj';
			var status = {};
			var status2 = {};
			var moneyStatus = {};
			var allMoney = {};
			var moneyStatusArray = [];
			var backCount = 0;
			getMemberMoneyCollections(function ()
			{
				userMoneyCollections.sort(sortMS2);

				function subProcess(count)
				{
					var len = userMoneyCollections.length;
					var eCount = parseInt(len / count) || 1;
					var remainder = len % count;

					console.log('len: ' + len + 'processNum:' + count);

					for (var x = 0; x < count; x++)
					{
						var newCollections = userMoneyCollections.splice(0, eCount);
						if (x == count - 1)
						{
							newCollections = newCollections.concat(userMoneyCollections.splice(0, remainder));
						}
						if(!newCollections || !newCollections.length)
						{
							backCount++;
							continue;
						}

						var newProcess = cp.fork(__dirname + '/testS.js', [dbServer, db, [newCollections]]);
						allProcess.push(newProcess);
						newProcess.type = x;
						(function (newProcess)
						{
							var callBack = function (Data)
							{
								status = extend(status, Data.status);
								moneyStatus = extend(moneyStatus, Data.moneyStatus);
								allMoney = extend(allMoney, Data.allMoney);
								console.log('PARENT got message:', newProcess.type, Data.pid);
								if(++backCount == count)
								{
									for (var key in moneyStatus)
									{
										var nObj = {};
										nObj['uid'] = key;
										nObj['money'] = moneyStatus[key];
										moneyStatusArray.push(nObj);
									}

									function tempSortMS(a, b)
									{
										return Number(b.money) - Number(a.money);
									}

									moneyStatusArray.sort(tempSortMS);

									for(var k in status)
									{
										var month = k.substring(0,6);
										if(!(month in status2))
										{
											status2[month] = 0;
										}
										status2[month]+=status[k];
									}

									console.log(hostname + ' status2:', status2);
									console.log(hostname +' allMoney: ' , allMoney);
									moneyStatusArray = moneyStatusArray.splice(0,10001);
									var tempStatusArray = [];
									for(var i = 0; i < moneyStatusArray.length; i++)
									{
										var obj = moneyStatusArray[i];
										tempStatusArray.push('index: '+ i  + '    id: ' + obj.uid + '    money: ' + obj.money)
									}
									writeFile(tempStatusArray.join('\n'));
									console.log('moneyStatus:', moneyStatusArray.length);
								}
							};

							newProcess.onCallBack = callBack;
							newProcess.on('message', callBack);
						})(newProcess);
					}
				}

				subProcess(20);
			});

		}
		else
		{
			status = {};
			moneyStatus = {};
			allMoney = {};
			collections = collections.split(',');
			var allCount = collections.length;
			console.log('allCount: ' + allCount);
			var currentCount = 0;
			for (var count = 0; count < collections.length; count++)
			{
				var currentCollectionName = collections[count];
				var time = getRecordDate(currentCollectionName, userMoney);
				var date = time.date;
				(function (currentCollectionName, date)
				{
					db.collection(currentCollectionName).find().each(function (err, doc)
					{
						if (doc && doc.uid)
						{
							var uid = doc.uid;
							var buyNum = doc.buyNum;    // 购买钻石数量

							if(!buyNum || parseInt(Number(buyNum)) <= 0)
							{
							}else
							{
								var cDate =date.substring(0,6);

								if(!(cDate in allMoney))
								{
									allMoney[cDate] = 0;
								}
								allMoney[cDate]+=parseInt(Number(buyNum));
							}
							if (!(uid in moneyStatus))
							{
								moneyStatus[uid] = 0;
							}
							moneyStatus[uid] += buyNum;

							if (!(date in status))
							{
								status[date] = 0;
							}
							status[date]++;
						}
						else
						{
							if (++currentCount == allCount)
							{
								process.send({pid: process.pid, status: status, moneyStatus:moneyStatus, allMoney:allMoney});
								//console.log(status);
								db.close();
								// 回调
							}
						}
					});
				})(currentCollectionName, date);
			}
		}
	}

	function jisuansuoyou()
	{
		OctoberRegisteredUsers();
		//RechargeUserCount();

		//getRNum();

		// 获取所有集合
		//getMemberMoneyCollections(function ()
		//{
		//	membersMoneyCollections.sort(sortMS);
		//	userMoneyCollections.sort(sortMS2);
		//	//StatisticalPurchaseRecords(function ()
		//	//{
		//		StatisticsSaleRecord(function ()
		//		{
		//
		//			for(var date in allStatus)
		//			{
		//				var dInfo = allStatus[date];
		//				for(var id in dInfo)
		//				{
		//					var memberInfo = dInfo[id];
		//					var transferTimes = memberInfo.sellCount;   // 转账次数
		//					var transferNumber = 0; // 转账人数
		//					for(var key in memberInfo['sellAllUser'])
		//					{
		//						transferNumber++;
		//					}
		//					if(!(transferTimes in zhuanzhangcishu))
		//					{
		//						zhuanzhangcishu[transferTimes] = 0;
		//					}
		//					zhuanzhangcishu[transferTimes]++;
		//
		//
		//					if(!(transferNumber in zhuanzhangrenshu))
		//					{
		//						zhuanzhangrenshu[transferNumber] = 0;
		//					}
		//					zhuanzhangrenshu[transferNumber]++;
		//				}
		//			}
		//
		//			console.log('转账次数    代理人数');
		//			for(var key in zhuanzhangcishu)
		//			{
		//				console.log(key + '    ' + zhuanzhangcishu[key]);
		//			}
		//			console.log('\n\n');
		//			console.log('转账人数    代理人数');
		//			for( key in zhuanzhangrenshu)
		//			{
		//				console.log(key + '    ' + zhuanzhangrenshu[key]);
		//			}
		//			//writeUserStatistics();
		//			//writeUserTrend();
		//			db.close();
		//
		//		});
		//	//});
		//});


		//var zero = 0;
		//var two = 0;
		//db.collection(members).find({'adminLevel':{$in:[null,0]}}).each(function (err,doc)
		//{
		//	if(doc)
		//	{
		//		zero++;
		//	}else
		//	{
		//		db.collection(members).find({'adminLevel':2}).each(function (err2,doc2)
		//		{
		//			if(doc2)
		//			{
		//				two++;
		//			}else
		//			{
		//				console.log('0 级权限    ' + zero + '\n2 级权限    ' + two + '\n所有代理    '+ ( zero + two));
		//				db.close();
		//			}
		//		});
		//	}
		//});

	}

	var isToday = function (day)
	{
		return today == day;
	};

	function initUserStatistics(day, uid)
	{
		allStatus[day][uid] = {};
		allStatus[day][uid].mName = '';
		allStatus[day][uid].sellAllUser = {};
		allStatus[day][uid].sellCount = 0;
		allStatus[day][uid].sellNum = 0;
		allStatus[day][uid].buyMoney = 0;
		allStatus[day][uid].buyNum = 0;
	}

	function filterUid(uid)
	{
		if (uid <= 10000)
		{
			return false;
		}
		return true;
	}

	function writeConsumer(id, info)
	{
		db.collection(memberConsumptionRecords).
		update({_id: Number(id)}, {$set: info}, {upsert: true}, function (err, result)
		{
			testCloseDb();
			if (err)
			{
				console.log(
					"writeConsumer error : id: " + id + "info:" + JSON.stringify(info) + '\n' + JSON.stringify(
						err));
			}
		});
	}

	/**
	 * info 统计的总和
	 * */
	function writeTrend(info)
	{
		var condition = ("total" in info) ? {$inc: info} : {$set: info};
		db.collection(memberConsumptionTrends).update({_id: month}, condition, {upsert: true}, function (err, result)
		{
			testCloseDb();
			if (err)
			{
				console.log(
					"writeTrend error : id: " + month + "info:" + JSON.stringify(info) + '\n' + JSON.stringify(err));
			}
		});
	}

	/**
	 * 统计出售记录
	 * */
	function StatisticsSaleRecord(callBack)
	{
		var allCount = userMoneyCollections.length;
		allCount || callBack();
		var currentCount = 0;
		for (var count = 0; count < userMoneyCollections.length; count++)
		{
			var currentCollectionName = userMoneyCollections[count];
			(function (currentCollectionName)
			{
				var currentDay = getRecordDate(currentCollectionName, userMoney).date;
				db.collection(currentCollectionName).find().each(
					function (er, doc)
					{
						if (doc && "byMid" in doc && "buyNum" in doc && "buyMoney" in doc)
						{
							var mid = doc.byMid;
							var uid = doc.uid;
							var sellNum = doc.buyNum;

							if (filterUid(mid))
							{
								if (!allStatus[currentDay])
								{
									allStatus[currentDay] = {};
								}

								if (!allStatus[currentDay][mid])
								{
									initUserStatistics(currentDay, mid);
								}

								if (!(uid in allStatus[currentDay][mid].sellAllUser))
								{
									allStatus[currentDay][mid].sellAllUser[uid] = 0;
								}
								allStatus[currentDay][mid].sellAllUser[uid]++;
								allStatus[currentDay][mid].sellCount++;
								allStatus[currentDay][mid].sellNum += sellNum;
							}

						}

						if (!doc)
						{
							if (++currentCount == allCount)
							{
								!callBack || callBack();
							}
						}
					});
			})(currentCollectionName);
		}
	}


	/**
	 * 统计购买记录
	 * */
	function StatisticalPurchaseRecords(callBack)
	{
		var allCount = membersMoneyCollections.length;
		allCount || callBack();
		var currentCount = 0;
		for (var count = 0; count < membersMoneyCollections.length; count++)
		{
			var currentCollectionName = membersMoneyCollections[count];
			(function (currentCollectionName)
			{
				var currentDay = getRecordDate(currentCollectionName, memberMoney).date;
				db.collection(currentCollectionName).find().each(
					function (er, doc)
					{
						if (doc && "byMid" in doc && "buyNum" in doc && "buyMoney" in doc)
						{
							var uid = doc.mid;
							var buyNum = doc.buyNum;
							var buyMoney = doc.buyMoney;

							if (filterUid(uid))
							{
								if (!allStatus[currentDay])
								{
									allStatus[currentDay] = {};
								}

								if (!allStatus[currentDay][uid])
								{
									initUserStatistics(currentDay, uid);
								}

								allStatus[currentDay][uid].buyMoney += buyMoney;
								allStatus[currentDay][uid].buyNum += buyNum;
							}

						}

						if (!doc)
						{
							if (++currentCount == allCount)
							{
								!callBack || callBack();
							}
						}
					});
			})(currentCollectionName);
		}
	}


	function testCloseDb()
	{
		if (--allCount == 0)
		{
			console.log('close db');
			db.close();
		}
	}

	var sellDistribution = {};
	var buyDistribution = {};
	// 数据分布
	//var sellDistribution = [0, 0, 0, 0, 0, 0, 0];
	//var buyDistribution = [0, 0, 0, 0, 0, 0, 0];

	function subFile(day, num, isBuy)
	{
		var t = isBuy ? buyDistribution : sellDistribution;
		if (!(day in t))
		{
			t[day] = [0, 0, 0, 0, 0, 0, 0];
		}

		if (num >= 0 && num < 200)
		{
			t[day][0]++;
		}

		if (num >= 200 && num < 500)
		{
			t[day][1]++;
		}

		if (num >= 500 && num < 1000)
		{
			t[day][2]++;
		}

		if (num >= 1000 && num < 2000)
		{
			t[day][3]++;
		}

		if (num >= 2000 && num < 5000)
		{
			t[day][4]++;
		}

		if (num >= 5000 && num < 10000)
		{
			t[day][5]++;
		}

		if (num >= 10000)
		{
			t[day][6]++;
		}

	}

	/**
	 * 处理用户消费记录结果写入数据库
	 * */
	function writeUserStatistics()
	{
		for (var key in allStatus)
		{
			var newData = {};
			newData[key] = allStatus[key];
			//key 日期
			for (var id in allStatus[key])
			{
				subFile(key, newData[key][id].sellNum);
				subFile(key, newData[key][id].buyNum, true);
			}
			//console.log(JSON.stringify(newData));
		}
	}

	/**
	 * 处理用户消费趋势结果写入数据库
	 * */
	function writeUserTrend()
	{
		console.log('售卖日期    0-200    200-500    500-1000    1000-2000    2000-5000    5000-10000    10000+');

		for (var key in sellDistribution)
		{
			console.log(key + "    " + sellDistribution[key].join('    '));
		}
		//console.log('\n\n\n\n');
		//console.log('购买日期    0-200    200-500    500-1000    1000-2000    2000-5000    5000-10000    10000+');
		//for( key in sellDistribution)
		//{
		//	console.log(key + "    " + buyDistribution[key].join('    '));
		//}
	}

	function pr()
	{
		var count = 0;
		for (var key in allStatus)
		{
			count++;
			if (count < 10)
			{
				console.log(key + ": " + JSON.stringify(allStatus[key]));
			}
		}

		allCount = count + 2;
		console.log("count: " + count);
		console.log("totalMoney: " + totalMoney);
		console.log("totalNum: " + totalNum);

		var endTime = new Date().getTime();
		console.log("time: " + (endTime - startTime));
	}
});
