/**
 * Created by Fanjiahe on 2017/1/19.
 * 用户统计 - 30/15/7日活跃用户 拥有钻石数量
 * 用户统计
 */
var tools = require("./tools")();

module.exports = function(dbUrl, tDay, endF, errF)
{
	require('mongodb').MongoClient.connect(dbUrl, function (err, db) {
		if(err)
		{
			!errF||errF(JSON.stringify(err));
			return;
		}
		var startTime = new Date().getTime();
		var yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
		var argYesterday = tDay;
		if(argYesterday)
		{
		//	console.log("argYesterday.length ============ "+argYesterday.length);

			if(argYesterday.length != 10)
			{
				db.close();
				!errF||errF("node dayLogStatistics.js '2016-12-18', argYesterday ===> "+argYesterday);
				return;
			}
			yesterday = new Date(argYesterday);
		}

		//yesterday = new Date('2016-11-09');
		//var month = Number(tools.Format(yesterday,'yyyyMM'));
		//var day = Number(tools.Format(yesterday,'dd'));
		yesterday = tools.Format(yesterday,'yyyyMMdd');
	//	console.log("yesterday ========= "+yesterday);

//		var yesterday = '20160801';
		var startTime = yesterday.substr(0,4)+'-'+yesterday.substr(4,2)+'-'+yesterday.substr(6,2);//2017-01-01开始

		var oneDayMsec = 86400000; //一天时间
		var timeZone = 28800000; //8小时
		var nowData = new Date(startTime);

		var nowTime = Date.parse(nowData);
	//	console.log(nowTime);

		var dayZero = Math.floor((nowTime + timeZone) / oneDayMsec) * oneDayMsec - timeZone;//凌晨8点减去8个小时
		var diffMsec = oneDayMsec - (nowTime - dayZero) - 60000;//23:59:00
		var nextTime = nowTime + diffMsec;

		//console.log("nextTime ============= " +nextTime);

		function interDay() {
			var day = new Date(nextTime);
			var dayTime = nextTime;
			nextTime += oneDayMsec;
			day = (day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate());

			var allCount = 0;
			var gameCount = {};
			console.log("days ---------- "+day);
			/**
			 * 用户初始化
			 */
			var userInfo = {};

			/**
			 * 余钻初始化
			 */
			var gameMoney = {};

			function checkGameCount() {
				//0 3 7 15 30
				if (Object.keys(gameCount).length == 5) {
					db.collection("dayLog").update({_id: day}, {
						'$set': {
							allCount: allCount,
							gameCount: gameCount[0],
							gameCount3: gameCount[3],
							gameCount7: gameCount[7],
							gameCount15: gameCount[15],
							gameCount30: gameCount[30],
							gameMoney: gameMoney[0],
							gameMoney3: gameMoney[3],
							gameMoney7: gameMoney[7],
							gameMoney15: gameMoney[15],
							gameMoney30: gameMoney[30]
						}
					}, {upsert:true}, function (er ,doc) {

						db.close();
						if(er)
						{
							!errF || errF(day+', '+err);
							// console.log("customerDayLog 写入失败");
						}
						else
						{
							!endF || endF("dayLogStatistics 写入成功 " + day);
							// console.log("customerDayLog 写入成功 " + day);
						}
					});
				}
			}
			function getGameCount(days) {
				if(days == 0) {
					var resultId = [];
					db.collection("majiangLog").find({lastGameDay:day}).each(function (er, doc){ //查询活跃用户
						if(doc){
							var uid = doc._id;
							resultId.push(uid);
						}else{
							userInfo[days] = resultId;
							userInfoMoney(days);
						}
					});

				} else {
				//	console.log("test---------------------test-------------------"+days);
					var dd = new Date(dayTime);
					dd.setDate(dd.getDate() - days);
					dd = (dd.getFullYear() * 10000 + (dd.getMonth() + 1) * 100 + dd.getDate());

					var resultId = [];
					db.collection("majiangLog").find({lastGameDay:{$gt:dd}}).each(function (er, doc){ //查询活跃用户
						if(doc){
							var uid = doc._id;
							resultId.push(uid);
						}else{
							userInfo[days] = resultId;
							userInfoMoney(days);
						//	console.log("test---------------------test-------------------"+days);
						}
					});
				}
			}
			/**
			 *查询余钻
			 */
			function userInfoMoney(days){
				if(userInfo[days]){
					var resultId = userInfo[days];
					var cnt = Object.keys(resultId);
					if (cnt){
						gameCount[days] = cnt.length;//活跃人数
					}else {
						gameCount[days] = 0;
					}
				//	console.log(gameCount);

					db.collection("majiang").find({uid:{$in:resultId}}).each(function (er, doc1) {  //根据活跃用户ID查询余钻
						if (doc1){
							if(!gameMoney[days]){
								gameMoney[days] = 0;
							}
							gameMoney[days] += doc1.money;
						}else{
							checkGameCount();
						}
					});
				}
			}
			db.collection("cgbuser").count(function (er, rtn) {
				if(!er) {
					allCount = rtn;
				}

				getGameCount(0);
				getGameCount(3);
				getGameCount(7);
				getGameCount(15);
				getGameCount(30);
			});
		}
		interDay();
	});
}




var tools = require("./tools")();
var memberConsumption = require('./dayLogStatistics.js');
var date = '2016-07-01';
var today = null;

if(process.argv[2] == 1) {
	//从头开始跑的逻辑
	date = new Date(date);
	today = tools.Format(new Date(),'yyyyMMdd');
	today = parseInt(today);
	function runStatic() {
		var str = tools.Format(date, 'yyyyMMdd');

		if (parseInt(str) >= today) {
			console.info('static end');
			return;
		}
		var day = str.substr(0,4)+"-"+str.substr(4,2)+"-"+str.substr(6,2);
		memberConsumption(tools.url, day, function (msg) {
			console.info(msg);
			date.setDate(date.getDate() + 1);
			runStatic();
		}, function (msg) {
			console.info('error======== '+msg);
		});
	}

	runStatic();
}
else
{
	//跑昨天或某一天的数据
	memberConsumption(tools.url, process.argv[2],function (msg) {
		console.info(msg);
	}, function (msg) {
		console.info('error======== '+msg);
	});
}





