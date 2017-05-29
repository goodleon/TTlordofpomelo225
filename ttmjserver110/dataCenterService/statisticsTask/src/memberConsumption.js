/**
 * Created by Fanjiahe on 2016/9/19.
 * 统计 会员消费记录
 * 统计 会员消费趋势
 *
 *  node memberConsumption.js 20160701
 *
 */
var tools = require("./tools")();


var day = null;
var today = null;
if(process.argv.length == 3 && process.argv[2].length == 8)
{
	//跑指定日期
	day = process.argv[2];
}
else
{
	//跑前一天的数据
	today = new Date();
	today.setDate(today.getDate() - 1);
	day = tools.Format(today, 'yyyyMMdd');
}
//var lastStart = '20170201';
var lastStartDay = day.substr(0,4)+'-'+day.substr(4,2)+'-'+day.substr(6,2);//2017-01-01上周开始
var date2 = new Date(lastStartDay); //上周开始
var date1 = new Date();
var endDate = tools.Format(date1, 'yyyyMMdd');


var url = tools.url;

var tableName = 'userMoney';    // 卖出
var tableName2 = 'memberMoney'; // 买入
var tableName3 = "members"; // 会员
var memberConsumptionRecords = "memberConsumptionRecords";
var memberConsumptionTrends = "memberConsumptionTrends";
var allCount = 0;

var baseMembers = {};

var lastUserList = {};
require('mongodb').MongoClient.connect(url, function (err, db) {
	function getMemberStart() {
		var startData = tools.Format(date2, 'yyyyMMdd');

		if (parseInt(startData) >= endDate) {  //表名时间    如果开始时间大于结束时间
			getMemberEnd();
			return;
		}
		var startTime = new Date().getTime();//开始时间

		var startMonth = tools.Format(date2, 'yyyyMM');
		var totalMoney = 0;
		var totalNum = 0;

		var allStatusLen = 0;
		var writeTrendLen = 2;

		console.log("执行进度 -------------------------------- : ", startData, endDate);



		//基础数据定义
		var allStatus = {};
		function initUserStatistics(uid)
		{
			if(allStatus[uid])return;
			allStatus[uid] = {};
		//	allStatus[uid].adminLevel = null;//会员等级
			allStatus[uid].mName = '';
			allStatus[uid].sellNum = 0; 	//售出的钻石
			allStatus[uid].sellMoney = 0;	//售出的钱数
			allStatus[uid].sellAllUser = {};//所属玩家售出次数
			allStatus[uid].sellCount = 0;	//售出次数
			allStatus[uid].buyCount = 0;	//充值次数
			allStatus[uid].buyNum = 0;   	//买入钻石
			allStatus[uid].buyMoney = 0; 	//买入的钱数
			allStatus[uid].money = 0;    	//剩余钱数
			//----------新增字段---------
			allStatus[uid].recommendedNumber = 0;//推荐人数
			allStatus[uid].recommendUidArr = [];
			//先取前一天的数据
			//allStatus[uid].sumBuyCount = 0;//累计充值总数量-- 元
			allStatus[uid].sumBuyMoney = 0;//累计充值总数量-- 元
			allStatus[uid].sumBuyNum = 0;//累计充值总数量-- 钻石
			//allStatus[uid].sumSellCount = 0;//累计售出总额度 -- 元
			allStatus[uid].sumSellMoney = 0;//累计售出总额度 -- 元
			allStatus[uid].sumsellNum = 0;//累计售出额度-- 钻石
			//----------新增字段---------
		}
		function filterUid(uid)
		{
			if (uid <= 10000)
			{
				return false;
			}
			return true;
		}

	//	StatisticsSaleRecord();
		BaseInfo();



		/**
		 * 统计基础数据
		 */
		function BaseInfo(){
			var BaseInfoStartTime = new Date().getTime();//基础数据时间记录

			var len = Object.keys(baseMembers).length;
			if(len > 0)
			{
				console.log("缓存获取基础数据");
				//	console.log(allStatus[100058]);
				for(var uid in baseMembers)
				{
					initUserStatistics(uid);
					var data = baseMembers[uid];
					allStatus[uid].money = data.money; //用户余额
					allStatus[uid].mName = data.mName; //用户姓名

					var userList = data.recommended;

					var recommendUid = [];

					for(var p in userList){
						if (Number(startData) === userList[p].mTime) {
							allStatus[uid].recommendedNumber ++;  //推荐人数
							recommendUid.push(userList[p]._id);
							//console.log("recommende "+ uid +" ----- 被推荐人ID ---- " +);
						}
					}
					allStatus[uid].recommendUidArr = recommendUid;
				}
				var BaseInfoEndTime = new Date().getTime();
				console.log("统计基本信息1 -Time: " + (BaseInfoEndTime - BaseInfoStartTime));
				//handleStatistics();
				StatisticsSaleRecord();
			}else{
				console.log("查询获取基础数据");
				var allCount = 0;

				var where ={};
				where.adminLevel = {$nin:[1,3,4,10]};  //反向查询 会员等级 0、2的数据 修改时间 20170323

				db.collection("members").find(where).each(function (er, doc){

					if (allCount++ % 2000 == 0)
					{
						//	console.log(allCount);
					}

					//console.log(doc);

					if (doc && "_id" in doc && "money" in doc)
					{
						var uid = doc._id;
						var money = doc.money;
						var mName = doc.mName || '';
						var adminLevel = doc.adminLevel;

						if (filterUid(uid))
						{
							initUserStatistics(uid);
							allStatus[uid].money = money;
							allStatus[uid].mName = mName;
					//		allStatus[uid].adminLevel = adminLevel;

							if(!baseMembers[uid])
							{
								baseMembers[uid] = {};
								baseMembers[uid].money = money;
								baseMembers[uid].mName = mName;
					//			baseMembers[uid].adminLevel = adminLevel;
								var tt = {};
								//db.collection(tableName3).find({byMid:Number(uid)},{_id:1,mTime:1}).each(function (e, d) {   //195253
								db.collection(tableName3).find({byMid:Number(uid)},{_id:1,mTime:1}).each(function (e, d) {
									if (d) {
										var id = d._id;
										d.mTime = Number(tools.Format(new Date(d.mTime),'yyyyMMdd'));//时间格式转换
										tt[id] = d;
										baseMembers[uid].recommended = tt;
									}
								});

								var recommendUid = [];
								var userList = baseMembers[uid].recommended;
								for(var p in userList){
									if (Number(startData) === userList[p].mTime) {
										allStatus[uid].recommendedNumber ++;
										recommendUid.push(userList[p]._id);
										//	console.log("recommende ----- 被推荐人ID ---- ");
									}
								}
								allStatus[uid].recommendUidArr = recommendUid;
							}
						}
					}
					if(!doc){
						var arr = Object.keys(allStatus);

						console.log("UserInfo allStatus Count------ : "+arr.length);
						var BaseInfoEndTime = new Date().getTime();
						console.log("统计基本信息2 -Time: " + (BaseInfoEndTime - BaseInfoStartTime));
						//handleStatistics();
						StatisticsSaleRecord();
						return 0;
					}
				});
			}
		}



		/**
		 * 统计出售记录
		 */
		function StatisticsSaleRecord() {
			var StatisticsSaleRecordStartTime = new Date().getTime();
			var allCount = 0;
			db.collection("userMoney"+startData).find().each(function (er, doc){
				// 卖出和卖出的价格
				if (doc && "byMid" in doc && "buyNum" in doc && "buyMoney" in doc)
				{

					if (allCount++ % 2000 == 0) {
						//	console.log(allCount);
					}
					var mid = doc.byMid;
					var sellNum = doc.buyNum;
					var sellMoney = doc.buyMoney;
					var uid = doc.uid;  // 买钻的玩家   1245929925  luojian609

					if(allStatus[mid]) {
						if (filterUid(mid)) {
							initUserStatistics(mid);
							if (!(uid in allStatus[mid].sellAllUser)) {
								allStatus[mid].sellAllUser[uid] = 0;
							}
							allStatus[mid].sellAllUser[uid]++;
							allStatus[mid].sellCount++;
							allStatus[mid].sellMoney += sellMoney;
							allStatus[mid].sellNum += sellNum;
							//allStatus[mid].sumSellCount++;//累计售出次数
							allStatus[mid].sumSellMoney += sellMoney;//累计售出额度--元
							allStatus[mid].sumsellNum += sellNum;//累计售出额度--钻
						}
					}
				}
				if (!doc)
				{
					var arr = Object.keys(allStatus);
					console.log("StatisticsSaleRecord allStatus Count------ : "+arr.length);

					var StatisticsSaleRecordEndTime = new Date().getTime();
					console.log("统计出售记录 -Time: " + (StatisticsSaleRecordEndTime - StatisticsSaleRecordStartTime));
					//	console.log("-------------------------------------");
					StatisticalPurchaseRecords();
					return 0;
				}
			});
		}


		/**
		 * 统计购买记录
		 */
		function StatisticalPurchaseRecords() {
			var StatisticalPurchaseRecordsStartTime = new Date().getTime();
			var allCount = 0;
			//	console.log("finding memberMoney"+startData);
			db.collection("memberMoney"+startData).find().each(function (er, doc)
			{
				// 卖出和卖出的价格
				if (doc && "mid" in doc && "buyNum" in doc && "buyMoney" in doc)
				{
					if (allCount++ % 2000 == 0)
					{
						//	console.log(allCount);
					}
					var uid = doc.mid;
					var buyNum = doc.buyNum;
					var buyMoney = doc.buyMoney;
					if(allStatus[uid]) {
						if (filterUid(uid)) {
							initUserStatistics(uid);
							allStatus[uid].buyMoney += buyMoney;
							allStatus[uid].buyNum += buyNum;
							allStatus[uid].buyCount++;
							//	allStatus[uid].sumBuyCount++;//累计充值总次数
							allStatus[uid].sumBuyMoney += buyMoney;//累计充值总次数--元
							allStatus[uid].sumBuyNum += buyNum;//累计购买总数--钻
							totalMoney += buyMoney;
							totalNum += buyNum;
						}
					}
				}
				if (!doc)
				{
					var arr = Object.keys(allStatus);
					console.log("StatisticalPurchaseRecords allStatus Count------ : "+arr.length);
					//	console.log(allStatus[100058]);
					var StatisticalPurchaseRecordsEndTime = new Date().getTime();
					console.log("统计购买记录 -Time: " + (StatisticalPurchaseRecordsEndTime - StatisticalPurchaseRecordsStartTime));
					//	console.log("-------------------------------------");
					Accumulat();
					return 0;
				}
			});
		}


		/**
		 * 历史累计记录
		 */
		function Accumulat(){
			var AccumulatStartTime = new Date().getTime();
			//	console.log('memberConsumptionRecords' + startMonth);

			var len = Object.keys(lastUserList).length;  //获取缓存

			//	console.log(len);

			if(len > 0){  //判断是否有缓存
				console.log("缓存获取历史累计");
				for(var uid in lastUserList)
				{
					initUserStatistics(uid);
					var data = lastUserList[uid];
					//allStatus[uid].money = data.money; //用户余额
					//allStatus[uid].mName = data.mName; //用户姓名
					initUserStatistics(uid);
					if (data.sumBuyMoney) {
						allStatus[uid].sumBuyMoney += data.sumBuyMoney;//累计充值总--元
					}
					if (data.sumBuyNum) {
						allStatus[uid].sumBuyNum += data.sumBuyNum;//累计购买总数--钻
					}

					if (data.sumSellMoney) {
						allStatus[uid].sumSellMoney += data.sumSellMoney;//累计售出次数--元
					}
					if (data.sumsellNum) {
						allStatus[uid].sumsellNum += data.sumsellNum;//累计售出额度--钻
					}
					//重新写入累计缓存
					lastUserList[uid] = {};
					lastUserList[uid].sumBuyMoney = allStatus[uid].sumBuyMoney;
					lastUserList[uid].sumBuyNum = allStatus[uid].sumBuyNum;
					lastUserList[uid].sumSellMoney = allStatus[uid].sumSellMoney;
					lastUserList[uid].sumsellNum = allStatus[uid].sumsellNum;
				}

				var AccumulatEndTime = new Date().getTime();
				console.log("统计累计记录1 -Time: " + (AccumulatEndTime - AccumulatStartTime));
				//console.log("--------------------------------------------");
				var len = Object.keys(allStatus).length;
				if(len > 0)
				{
					//	console.log('=========1111111===========', len);
					handleStatistics();
				}
				else
				{
					writeUserTrend();
				}
				return 0;


			}else{
				console.log("查询获取历史累计");

				var ytdat = startData.toString().replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3");//时间格式 2017-01-01

				var preDate = new Date(ytdat);
				preDate.setDate(preDate.getDate() - 1);//前一天
				//	ytdat = tools.Format(preDate, 'yyyyMMdd');//时间格式 yyyyMMdd
				var ymonth = tools.Format(preDate, 'yyyyMM');//时间格式 yyyyMM

				db.collection('memberConsumptionRecords' + ymonth).find({}, {sumBuyMoney:1,sumBuyNum:1,sumSellMoney:1,sumsellNum:1}).each(function (errs, docs) {
					if (docs) {
						//process.exit();
						var uid = docs._id;
						initUserStatistics(uid);
						if (docs.sumBuyMoney) {
							allStatus[uid].sumBuyMoney += docs.sumBuyMoney;//累计充值总次数
						}
						if (docs.sumBuyNum) {
							allStatus[uid].sumBuyNum += docs.sumBuyNum;//累计购买总数
						}

						if (docs.sumSellMoney) {
							allStatus[uid].sumSellMoney += docs.sumSellMoney;//累计售出次数
						}
						if (docs.sumsellNum) {
							allStatus[uid].sumsellNum += docs.sumsellNum;//累计售出额度
						}

						//历史累计写入缓存
						if(!lastUserList[uid]){
							lastUserList[uid] = {};
							lastUserList[uid].sumBuyMoney = allStatus[uid].sumBuyMoney;
							lastUserList[uid].sumBuyNum = allStatus[uid].sumBuyNum;
							lastUserList[uid].sumSellMoney = allStatus[uid].sumSellMoney;
							lastUserList[uid].sumsellNum = allStatus[uid].sumsellNum;
						}

					}
					else
					{
						var AccumulatEndTime = new Date().getTime();
						console.log("统计累计记录2 -Time: " + (AccumulatEndTime - AccumulatStartTime));
						//console.log("--------------------------------------------");
						var len = Object.keys(allStatus).length;
						if(len > 0)
						{
							//	console.log('=========1111111===========', len);
							handleStatistics();
						}
						else
						{
							writeUserTrend();
						}
						return 0;
					}
				});
			}
		}



		function handleStatistics()
		{
			pr();
			writeUserStatistics();
		}


		// 数据分布
		var sellDistribution = [0, 0, 0, 0, 0, 0, 0];
		var buyDistribution = [0, 0, 0, 0, 0, 0, 0];

		function subFile(num, isBuy)
		{
			var t = isBuy ? buyDistribution : sellDistribution;
			if (num > 0 && num < 200)
			{
				t[0]++;
			}

			if (num >= 200 && num < 500)
			{
				t[1]++;
			}

			if (num >= 500 && num < 1000)
			{
				t[2]++;
			}

			if (num >= 1000 && num < 2000)
			{
				t[3]++;
			}

			if (num >= 2000 && num < 5000)
			{
				t[4]++;
			}

			if (num >= 5000 && num < 10000)
			{
				t[5]++;
			}

			if (num >= 10000)
			{
				t[6]++;
			}

		}

		/**
		 * 处理用户消费记录结果写入数据库
		 * */
		function writeUserStatistics()
		{
			allStatusLen = Object.keys(allStatus).length;
			console.log("数据写入中 allStatusLen: ",allStatusLen);
			var InsrtStartTime = new Date().getTime();//开始时间
			for (var key in allStatus)
			{
				var newData = {};
				newData[startData] = allStatus[key];
				//	console.log(newData);
				subFile(newData[startData].sellNum);
				subFile(newData[startData].buyNum, true);
				newData["sumBuyMoney"] = newData[startData].sumBuyMoney;
				newData["sumBuyNum"] = newData[startData].sumBuyNum;
				newData["sumSellMoney"] = newData[startData].sumSellMoney;
				newData["sumsellNum"] = newData[startData].sumsellNum;
				if(newData[startData].adminLevel || newData[startData].adminLevel == 0){
					newData["adminLevel"] = newData[startData].adminLevel;   //会员等级
				}

				//	console.log(newData);
				//	console.log("-----------------------------");

				writeConsumer(key, newData);
			}
			var InsrtendTime = new Date().getTime();
			console.log("time: " + (InsrtendTime - InsrtStartTime));
		}

		/**
		 * 处理用户消费趋势结果写入数据库
		 * */
		function writeUserTrend()
		{
			var yesterdayData = {};
			//yesterdayData[day] = totalMoney;
			yesterdayData[day] = {
				money: totalMoney,
				buyDistribution: buyDistribution,
				sellDistribution: sellDistribution
			};
			writeTrend(yesterdayData);
			writeTrend({total: totalMoney});

			date2.setDate(date2.getDate() + 1);
			getMemberStart();
		}

		function pr()
		{
			var count = 0;
			for (var key in allStatus)
			{
				count++;
				if (count < 10)
				{
					//	console.log(key + ": " + JSON.stringify(allStatus[key]));
				}
			}

			console.log("count: " + count);
			console.log("totalMoney: " + totalMoney);
			console.log("totalNum: " + totalNum);

			//var endTime = new Date().getTime();
			//console.log("time: " + (endTime - startTime));
		}


		function writeConsumer(id, info) {
			db.collection("memberConsumptionRecords" + startMonth).update({_id: Number(id)}, {$set: info}, {upsert: true},
				function (err, result) {
					if (err) {
						console.log("writeConsumer error : id: " + id
							+ "info:" + JSON.stringify(info) + '\n' + JSON.stringify(err));
					}

					if (--allStatusLen == 0)
					{
						// console.log("=====allStatusLen: ",allStatusLen);
						writeUserTrend();
						/*console.log('close db');
						 process.send({pid:process.pid});
						 db.close();*/
					}
				});
		}

		/**
		 * info 统计的总和
		 * */
		function writeTrend(info)
		{
			var condition = ("total" in info) ? {$inc: info} : {$set: info};
			db.collection("memberConsumptionTrends").update({_id: startMonth}, condition, {upsert: true}, function (err, result)
			{

				if (err)
				{
					console.log("writeTrend error : id: " + startMonth + "info:" + JSON.stringify(info) + '\n' + JSON.stringify(err));
				}
				// console.log("=====writeTrendLen: ",writeTrendLen);
				if(--writeTrendLen == 0)
				{

					// process.send({pid:process.pid});
					//	db.close();
					//	!endF || endF();
					console.log(startData+" ok!! time:"+ (new Date().getTime() - startTime));
				}
			});
		}

	}

	getMemberStart();
	function getMemberEnd() {
		console.log("--- 执行结束！");
		process.exit();
	}
});