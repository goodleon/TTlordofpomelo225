/**
 * Created by Fanjiahe on 2016/11/8 0008.
 * 将之前的数据统计出来
 */

var MongoClient = require('mongodb').MongoClient;
var cp = require('child_process');
var dbServer = process.argv[2];
var db = process.argv[3];
var url = 'mongodb://' + dbServer + ':27017/' + db;

var memberMoney = 'memberMoney'; // 买入
var members = "members"; // 会员
var membersRecords = 'membersRecords';  // 会员记录
var memberRetention = 'memberRetention';   // 会员留存
var sysIndex = 'system.indexes';    // 目录
var membersRecordsCollections = null;

var untreatedCount = 0;
var wantComplete = [];
var allStatus = {}; // 玩家信息
var memberRetentionInfo = {};


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
}

console.log("start ------ : " + dbServer + " " + db);*/

var tools = require('./tools.js')();
url = tools.url;
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


MongoClient.connect(url, function (er, db)
{
	var startTime = new Date().getTime();
	var yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
	var today = (new Date().Format('yyyyMMdd'));
	var month = Number(yesterday.Format('yyyyMM'));
	var day = Number(yesterday.Format('dd'));
	yesterday = Number(yesterday.Format('yyyyMMdd'));

	//memberMoney = memberMoney + "" + yesterday;
	var membersMoneyCollections = [];
	var collections = [];
	var step = 0;


	function runCmd(cmd, para, opt, endf, errf)
	{
		var tagbuf = new Buffer(0);
		var tagproc = cp.spawn(cmd, para, opt);
		tagproc.stdout.on('data', function (data)
		{
			tagbuf = Buffer.concat([tagbuf, data]);
		});
		tagproc.stdout.on('end', function ()
		{
			endf(tagbuf.toString());
		});
		tagproc.stdout.on('error', function ()
		{
			errf("error");
		});
	}

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
			if (currentCollectionName != (key) && currentCollectionName.indexOf(key) != -1 &&
				currentCollectionName.indexOf(String(today)) == -1)
			{
				tempArray.push(currentCollectionName);
			}
		}
		return tempArray;
	}


	/**
	 * 初始化会员所需数据
	 * @param {string|number} mid 会员ID
	 * */
	function initUserStatistics(mid)
	{
		allStatus[mid] = {};
		allStatus[mid].mid = mid;
		allStatus[mid].mName = '';  // 名字
		allStatus[mid].mTime = '';    // 注册时间
		allStatus[mid].totalRecharge = 0;   // 购买总额
		allStatus[mid].rechargeTimes = 0;   // 购买次数
		allStatus[mid].residualAmount = 0;  // 剩余额度
		allStatus[mid].totalSales = 0;  //购买总额 - 剩余额度   销售总额
		allStatus[mid].recommendedNumber = 0;   //  推荐人数
		allStatus[mid].buyDate = [];    // 购买时间
		allStatus[mid].lastLoginTime = 0;   // 最后登录时间
		allStatus[mid].finalSalesTime = 0;  // 最后销售时间
	}


	/**
	 * 初始化留存所需数据
	 * @param {string|number} time 注册时间
	 * */
	function initMemberRetained(time)
	{
		memberRetentionInfo[time] = {};
		memberRetentionInfo[time].count = 0;
		memberRetentionInfo[time].dailyLiving = 0;
	}

	/**
	 * 设置加1运算, 如果没有则创建此属性
	 * @param {object} obj 对象
	 * @param {string} key 属性
	 * */
	function setCountPlus(obj, key)
	{
		if (!(key in obj))
		{
			obj[key] = 0;
		}
		obj[key]++;
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


	/**
	 * 获取所有时间段的充值
	 * @param {function} callBack 回调函数
	 * */
	function GetRechargeRecords(callBack)
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
						if (doc && doc.mid)
						{
							var mid = doc.mid;
							var buyNum = doc.buyNum;
							var buyMoney = doc.buyMoney;
							if(!buyMoney)
							{

							}else
							{
								if (!allStatus[mid])
								{
									initUserStatistics(mid);
								}
								allStatus[mid].buyDate.push(currentDay);
								allStatus[mid].totalRecharge += buyNum; // 充值总额
								allStatus[mid].rechargeTimes += 1;
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

	function closeDb()
	{
		if (untreatedCount == 0)
		{
			end();
		}
	}

	function end()
	{
		var endTime = new Date().getTime();
		console.log('runTime:' + (endTime - startTime));
		db.close();
	}


	/**
	 * 执行命令脚本
	 * @param {string} command 命令脚本
	 * */
	function execCmd(command)
	{
		cp.exec(command,
			function (error, stdout, stderr)
			{
				if (error !== null)
				{
					console.log('exec error: ' + error);
				}
			});
	}

	/**
	 * 填补最后购买日期
	 * @param {string|number} mid 会员id
	 * @param {function} callBack 回调
	 * */
	function writeLastBuyDay(mid, callBack)
	{
		if (allStatus[mid] && allStatus[mid].buyDate)
		{
			var currentMemberDate = allStatus[mid].buyDate;
			var lastBuyDay = Number(currentMemberDate[currentMemberDate.length - 1]);
			db.collection(members).
				update({_id: mid}, {$set: {lastBuyDay: lastBuyDay}}, {upsert: true}, function (err, result)
				{
					--untreatedCount;
					runCallBack(callBack);
					if (err)
					{
						console.log("writeLastBuyDay error : mid: " + mid + "info:" + JSON.stringify(info) + '\n'
							+ JSON.stringify(err));
					}
				});
		}
		else
		{
			--untreatedCount;
			runCallBack(callBack);
		}
	}

	/**
	 * 写玩家购买记录
	 * @param {string|number} mid 会员id
	 * @param {object} info 消息
	 * @param {function} callBack 回调
	 * */
	function writeBuyRecord(mid, info, callBack)
	{
		var totalRecharge = 0;
		db.collection(membersRecords).findOne({_id: mid}, function (e, r)
		{
			if (r)
			{
				totalRecharge = r.totalRecharge;
			}

			info.totalSales = totalRecharge + info.totalRecharge - info.residualAmount;

			db.collection(membersRecords).update({_id: mid}, {
				$set: {
					mName: info.mName,
					mTime: Number(info.mTime),
					residualAmount: Number(info.residualAmount),
					recommendedNumber: Number(info.recommendedNumber),
					lastLoginTime: Number(info.lastLoginTime),
					finalSalesTime: Number(info.finalSalesTime),
					totalSales: Number(info.totalSales)
				}, $addToSet: {
					buyDate: {$each: info.buyDate}
				}, $inc: {
					totalRecharge: Number(info.totalRecharge),
					rechargeTimes: Number(info.rechargeTimes)
				}
			}, {upsert: true}, function (err, result)
			{
				--untreatedCount;
				runCallBack(callBack);
				if (err)
				{
					console.log(
						"writeBuyRecord update error : mid: " + mid + "info:" + JSON.stringify(info) + '\n'
						+ JSON.stringify(err));
				}
			});

			if (e)
			{
				console.log(
					"writeBuyRecord findOne error : mid: " + mid + "info:" + JSON.stringify(info) + '\n'
					+ JSON.stringify(e));
			}

		});
	}

	/**
	 * 写会员留存分析
	 * @param {number|string} rTime 注册时间
	 * @param {object} info 信息
	 * @param {function} callBack 回调
	 * */
	function writeMemberRetention(rTime, info, callBack)
	{
		db.collection(memberRetention).update({_id: Number(rTime)}, {
			$set: info
		}, {upsert: true}, function (err, result)
		{
			--untreatedCount;
			runCallBack(callBack);
			if (err)
			{
				console.log(
					"writeMemberRetention update error : rTime: " + rTime + "info:" + JSON.stringify(info) + '\n'
					+ JSON.stringify(err));
			}
		});
	}

	/**
	 * 过滤
	 * */
	function filterUid(uid)
	{
		if (uid <= 10000)
		{
			return false;
		}
		return true;
	}

	/**
	 * 统计基本信息
	 * @param {function} callBack 回调
	 * */
	function BaseInfo(callBack)
	{
		db.collection(members).find().each(
			function (er, doc)
			{
				if (doc && "_id" in doc)
				{
					var mid = doc._id;
					var mName = doc.mName || '';
					var mTime = doc.mTime || '';
					var recommendedPersonId = doc.mAddByMid;

					var lastLoginTime = 0;
					if (doc.mlogtime)
					{
						lastLoginTime = new Date(doc.mlogtime).Format('yyyyMMdd');
					}

					if (!recommendedPersonId || recommendedPersonId == '')
					{
						recommendedPersonId = 'other';
					}
					var residualAmount = doc.money || 0;
					if (filterUid(mid))
					{
						if (!allStatus[mid])
						{
							initUserStatistics(mid);
						}

						if (!allStatus[recommendedPersonId])
						{
							initUserStatistics(recommendedPersonId);
						}

						allStatus[mid].mTime = new Date(mTime).Format('yyyyMMdd');
						allStatus[mid].mName = mName;
						allStatus[mid].residualAmount = residualAmount;
						allStatus[recommendedPersonId].recommendedNumber++;   //  推荐人数
						allStatus[mid].lastLoginTime = lastLoginTime;
					}

				}

				if (!doc)
				{
					!callBack || callBack();
				}
			});
	}


	/**
	 * 统计所有没有lastBuyDay的用户
	 * @param {function} callBack 回调
	 * */
	function statisticsLastBuyDay(callBack)
	{
		db.collection(members).find().each(
			function (er, doc)
			{
				if (doc && doc._id && !('lastBuyDay' in doc))
				{
					var mid = doc._id;
					wantComplete.push(mid);
				}

				if (!doc)
				{
					!callBack || callBack();
				}
			});
	}

	/**
	 * 补齐没有lastBuyDay的数据
	 * @param {function} callBack 回调
	 * */
	function CompleteLastBuyDay(callBack)
	{
		untreatedCount = wantComplete.length;
		for (var count = 0; count < wantComplete.length; count++)
		{
			var mid = wantComplete[count];
			writeLastBuyDay(mid, callBack);
		}
	}

	/**
	 * 建立会员充值时间记录表格 用于分析充值留存
	 * @param {function} callBack 回调
	 * */
	function completeMembersRecord(callBack)
	{
		for (var key in allStatus)
		{
			untreatedCount++;
		}

		for (key in allStatus)
		{
			var currentInfo = allStatus[key];
			writeBuyRecord(key, currentInfo, callBack);
		}
	}

	/**
	 * 满足条件可以回调
	 * @param {function} callBack 回调
	 * */
	function runCallBack(callBack)
	{
		if (untreatedCount == 0)
		{
			!callBack || callBack();
		}
	}

	function isRepairLastBuyDay()
	{
		if (!membersRecordsCollections)
		{
			membersRecordsCollections = analysisMemberMoneyCollections(membersRecords);
			if (membersRecordsCollections.length)
			{
				membersMoneyCollections = [membersMoneyCollections[membersMoneyCollections.length - 1]];
			}
		}
		return !membersRecordsCollections.length;
	}

	/**
	 * 会员留存分析
	 * */
	function memberRetentionAnalysis()
	{
		for (var key in allStatus)
		{
			var currentMember = allStatus[key];
			var time = String(currentMember.mTime);
			var date = currentMember.buyDate;
			if (!time || time == '' || time == "NaNaNaN" || time == 0 || time == 'NaN')
			{
				time = 'other';
			}
			if (!(time in memberRetentionInfo))
			{
				initMemberRetained(time);
			}
			var currentTime = memberRetentionInfo[time];
			currentTime.count++;     // 注册人数+1

			for (var count = 0; count < date.length; count++)
			{
				var currentDate = date[count];
				if (currentDate)
				{
					setCountPlus(currentTime, currentDate);
				}

				// 日活
				if (!(currentDate in memberRetentionInfo))
				{
					initMemberRetained(currentDate);
				}
				memberRetentionInfo[currentDate].dailyLiving++;
			}
		}
	}


	/**
	 * 会员留存写入数据库
	 * */
	function MemberRetention(callBack)
	{
		for (var key in memberRetentionInfo)
		{
			untreatedCount++;
		}

		for (key in memberRetentionInfo)
		{
			if (key == 'other')
			{
				untreatedCount--;
				continue;
			}

			var info = memberRetentionInfo[key];
			writeMemberRetention(key, info, callBack);
		}

	}


	/**
	 * 步骤执行
	 * */
	function sequentialExecution()
	{
		step++;
		console.log('step: ' + step);
		switch (step)
		{
			case 1:
			{
				// 获取所有集合
				getMemberMoneyCollections(function ()
				{
					membersMoneyCollections.sort(sortMS);
					sequentialExecution();
				});
				break;
			}
			case 2:
			{
				// 获取充值记录
				GetRechargeRecords(function ()
				{
					if (!isRepairLastBuyDay())
					{
						sequentialExecution();
						return;
					}

					// 补齐会员lastBuyDay
					statisticsLastBuyDay(function ()
					{
						CompleteLastBuyDay(sequentialExecution);
					});
				});
				break;
			}
			case 3:
			{
				// 取基础信息补齐会员充值时间记录
				BaseInfo(function ()
				{
					completeMembersRecord(sequentialExecution);
				});
				break;
			}
			case 4:
			{
				// 留存分析
				memberRetentionAnalysis();
				MemberRetention(sequentialExecution);
				break;
			}
			case 5:
			{
				// 关闭数据库
				closeDb();
				break;
			}
			case 6:
			{
				//closeDb();
				break;
			}
		}
	}

	sequentialExecution();
});
