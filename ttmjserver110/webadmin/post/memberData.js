/**
 * Created by Fanjiahe on 2016/11/10 0010.
 * 操作玩家数据
 */

module.exports = function (admin)
{
	var tools=require('../tools')();
	var collections = {
		memberRetention:'memberRetention',  // 会员留存
		memberDayLog:'memberDayLog',  	// 会员基础统计
	};


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
					fmt.replace(RegExp.$1,
						(RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
			}
		}
		return fmt;
	};


	var getDate = function (date)
	{
		date = String(date);
		var year = date.substring(0, 4);
		var month = date.substring(4, 2);
		var day = date.substring(6, 2);
		return {
			date: date,
			year: year,
			month: month,
			day: day
		};
	};

	var cut = function (str, rules, separator)
	{
		var startPos = 0;
		var endPos = 0;
		var newStr = '';
		str = String(str);
		for (var count = 0; count < rules.length; count++)
		{
			endPos = startPos + rules[count];
			newStr += str.substring(startPos, endPos);
			if (count != rules.length - 1)
			{
				newStr += separator;
			}
			startPos = endPos;
		}
		return newStr;
	};

	var dateOffset = function (date, day)
	{
		day = day || 0;
		var cDate = (typeof  date == 'string') ?  new Date(date) : date;
		cDate.setDate(cDate.getDate() + day);
		return Number(cDate.Format('yyyyMMdd'));
	};


	var rtn = {

		getMember: function (req, res)
		{

		},

		getMemberRetained: function (req, res)
		{
			if (!admin.checkLevel(req, [1, 3, 10]))
			{
				res.json({er: 1});  // 权限错误
				return;
			}

			var info = req.body;
			if (!('date' in info) ||  (typeof info.date != 'number') ||  !admin.mdb)
			{
				res.json({er: 2});  // 数据错误
				return;
			}

			var endDate = info.date;
			var startDate = dateOffset(cut(String(endDate), [4, 2, 2], '-'), -30);
			var command = {_id:{$lte:endDate, $gte:startDate}};
			var result = [];
			admin.mdb.collection(collections.memberRetention).find(command).sort({_id:-1}).each(function (er, doc)
			{
				if (doc)
				{
					doc.rDate = doc._id;
					delete doc._id;
					result.push(doc);
				}

				if (!doc)
				{
					res.json({total: result.length, rows: result});
				}
			});

		},
		getMemberStatistics: function (req, res)
		{
			if (!admin.checkLevel(req, [1, 3, 10]))
			{
				res.json({er: 1});  // 权限错误
				return;
			}

			var info = req.body;
			if (!('month' in info) ||  !admin.mdb)
			{
				res.json({er: 2});  // 数据错误
				return;
			}
			var month = info.month;//201612
			var startDate = month+"01";
			var dayOfMonth = (new Date(month.substr(0,4), month.substr(4,2), 0)).getDate();
			var endDate = ""+month+dayOfMonth;
			//console.log("日期为：", startDate, endDate);
			var command = {_id:{$lte:Number(endDate), $gte:Number(startDate)}};
			var result = [];
			admin.mdb.collection(collections.memberDayLog).find(command).sort({_id:-1}).each(function (er, doc)
			{
				if (doc)
				{ 
					result.push(doc);
				}
				if (!doc)
				{
					res.json({total: result.length, rows: result});
				}
			});

		},
		/**
		 *会员业绩
		 * @param req
		 * @param res
		 */
		getMemberConsumption: function (req, res)
		{
			if (!admin.checkLevel(req, [3, 10]))
			{
				res.json({er: 1});  // 权限错误
				return;
			}

			var db = admin.mdb;

			/**
			 *两日期中间的日期
			 */
			var userList = {};
			function initUserList(uid){
				if(!userList[uid]) {
					userList[uid] = {};
					userList[uid].memberId = 0; //会员ID
					userList[uid].TWrechargeNumber = 0; //充值数量 --钻
					userList[uid].LWrechargeNumber = 0; //上周充值数量--钻

					userList[uid].TWbuyCount  = 0;//本周充值笔数
					userList[uid].LWbuyCount = 0; //上周充值笔数------
					
					userList[uid].TWsellPeople = 0;//销售人数
					userList[uid].LWsellPeople = 0; //上周销售人数------

					userList[uid].TWsellNum = 0;//本周销售数量
					userList[uid].LWsellNum = 0; //上周销售数量------

					userList[uid].recommendCount = 0;//推荐人数

					userList[uid].sumSellMoney = 0;//累计售出额度--元
					userList[uid].sumsellNum = 0;//累计售出数量 --钻
					userList[uid].sumBuyMoney = 0;//累计充值总额度--元
					userList[uid].sumBuyNum = 0;//累计购买总数 --钻
					//userList[uid].day = 0;//日期
					//userList[uid].statisticsCount = 0;//统计次数（测试字段）
				}
			}

			//查询条件

			var msg = req.body;
			//console.log(msg.thisWeekFrom); //本周开始时间
			//console.log(msg.thisWeekTo); //本周结束时间
			//console.log(msg.lastWeekFrom); //上周开始时间
			//console.log(msg.lastWeekTo); //上周结束时间

			var nowStart = msg.thisWeekFrom;//本周开始时间
			var nowEnd = msg.thisWeekTo;//本周结束时间

			var lastStart = msg.lastWeekFrom;//上周开始时间
			var lastEnd = msg.lastWeekTo;//上周结束时间
			
			//var nowStart = '20170123';//本周开始时间
			//var nowEnd = '20170129';//本周结束时间
			//
			//var lastStart = '20170116';//上周开始时间
			//var lastEnd = '20170122';//上周结束时间


			//日期格式2017-01-01
			var nowStartDay = nowStart.substr(0,4)+'-'+nowStart.substr(4,2)+'-'+nowStart.substr(6,2);//2017-01-01本周开始
			var nowEndDay = nowEnd.substr(0,4)+'-'+nowEnd.substr(4,2)+'-'+nowEnd.substr(6,2);//2017-01-01本周结束
			var lastStartDay = lastStart.substr(0,4)+'-'+lastStart.substr(4,2)+'-'+lastStart.substr(6,2);//2017-01-01上周开始
			var lastEndDay = lastEnd.substr(0,4)+'-'+lastEnd.substr(4,2)+'-'+lastEnd.substr(6,2);//2017-01-01上周结束

			var date3 = new Date(nowStartDay); //本周开始
			var date2 = new Date(lastStartDay); //上周开始

			var nowIEndDay = parseInt(nowEnd);//本周结束日期
			var lastIEndDay = parseInt(lastEnd);//上周结束日期

			var nowIEndMonth = parseInt(nowEnd.substr(0,6));//本周结束月份
			var lastIEndMonth = parseInt(lastEnd.substr(0,6));//上周结束月份
			var lastIStarMonth = parseInt(lastStart.substr(0,6));//上周开始月份


			var skip = msg.skip;
			var limit =Number(msg.limit);
			if (!skip){
				skip = 0;
			}
			if (!limit){
				limit = 50;
			}

			var memberId = msg.memberId;//获取玩家ID
			//临时查询条件
			var where ={};
		//	where.adminLevel = {$nin:[1,3,4,10]};  //反向查询 会员等级 0、2的数据 修改时间 20170323
			if(memberId){
				where._id = Number(memberId);
			}


			//综合查询字段
			var fieldArr = arr(lastStartDay,nowEndDay);

			//本周---查询规定日期字段
			var nowArr = arr1(nowStartDay,nowEndDay);

			//上周---查询规定日期字段
			var lastArr = arr1(lastStartDay,lastEndDay);

			var count = 0;

			//本周
			function getMem(){
				var month = tools.Format(date2, 'yyyyMM');
				if (parseInt(month) > nowIEndMonth) {  //表名时间    如果开始时间大于结束时间
					getEnd();
					return;
				}

				//查询分页总数量
				db.collection("memberConsumptionRecords"+month).count(where,function (er, rtn) {
					count = rtn;

					if(count){
						db.collection("memberConsumptionRecords"+month).find(where,fieldArr).skip(skip).limit(limit).sort({"_id":1}).each(function (er, rtn) {

							//db.collection("memberConsumptionRecords"+month).find(where,fieldArr).each(function (er, rtn) {
							if (rtn){
								//console.log(rtn);
								var id = rtn._id;
								if(id)
								{
									initUserList(id);

									userList[id].memberId = id; //会员ID

									//var nowData =  arrList(nowArr,rtn);

									for(var i=0;i<nowArr.length;i++){
										var nowData = rtn[nowArr[i]];

										if(nowData)
										{
											var sellNum = nowData.sellNum;
											if(sellNum > 0){
												userList[id].TWsellNum += sellNum; //本周销售数量
											}

											var buyNum =  nowData.buyNum;
											if(buyNum >0){
												userList[id].TWrechargeNumber += buyNum; //本周充值数量 --钻
											}

											var buyCount = nowData.buyCount;
											if (buyCount > 0){
												userList[id].TWbuyCount += buyCount;//本周充值笔数
											}

											var arr = Object.keys(nowData.sellAllUser);
											if (arr.length > 0){
												userList[id].TWsellPeople += arr.length;//本周销售人数
											}

											var recommend = nowData.recommendedNumber;
											if (recommend >0){
												userList[id].recommendCount += recommend;//推荐人数
											}

											var sumSellMoney = nowData.sumSellMoney;
											if (sumSellMoney >0){
												userList[id].sumSellMoney = sumSellMoney;//累计售出额度--元
											}

											var sumsellNum = nowData.sumsellNum;
											if (sumsellNum >0){
												userList[id].sumsellNum = sumsellNum;//累计售出额度 -- 钻
											}

											var sumBuyMoney = nowData.sumBuyMoney;
											if (sumBuyMoney >0){
												userList[id].sumBuyMoney = sumBuyMoney;//累计充值总额度--元
											}

											var sumBuyNum = nowData.sumBuyNum;
											if (sumBuyNum >0){
												userList[id].sumBuyNum = sumBuyNum;//累计购买总数 -- 钻
											}
										}
									}


									for(var j=0;j<lastArr.length;j++){
										var lastData = rtn[lastArr[j]];
										if(lastData)
										{
											var sellNum = lastData.sellNum;
											if(sellNum > 0){
												userList[id].LWsellNum += sellNum; //上周销售数量
											}

											var buyNum =  lastData.buyNum;
											if(buyNum >0){
												userList[id].LWrechargeNumber += buyNum; //上周充值数量 --钻
											}


											var buyCount = lastData.buyCount;
											if (buyCount > 0){
												userList[id].LWbuyCount += buyCount;//上周充值笔数
											}

											var arr = Object.keys(lastData.sellAllUser);
											if (arr.length > 0){
												userList[id].LWsellPeople += arr.length;//上周销售人数
											}
										}
									}
									//var lastData =  arrList(lastArr,rtn);
								}
							}
							else
							{
								date2.setMonth(date2.getMonth() + 1);
								getMem();
							}
						});
					}

				});


			}

			function getEnd(){
			//	console.log(userList);
				var arr = Object.keys(userList);
			//	console.log(arr);

				var userdianum =[];
				for(var p in userList){
					userdianum.push(userList[p]);  //将对象值存入数组
				}
				if (arr.length>limit){
					var con = arr.length - limit;
					userdianum.splice(limit,con);
				}
			//	console.log("分页总数量2 ----"+count);
				res.json({total: count, rows: userdianum});
				//res.json({total: arr.length, rows: userdianum,count:count});

				//	console.log("跳出循环...");
			}

			/**
			 * 查询字段
			 */
			function arr(stime,etime){
				var arr = {};
				var s_time = Date.parse(stime); //本周开始时间
				var e_time = Date.parse(etime); //本周结束时间
				while (s_time <= e_time){
					var date = new Date(s_time);
					var day = tools.Format(date, 'yyyyMMdd');
					s_time = s_time + 24*60*60*1000;
					arr[day]=1; //本周查询字段
				}
				return arr;
			}
			function arr1(stime,etime){
				var s_time = Date.parse(stime); //本周开始时间
				var e_time = Date.parse(etime); //本周结束时间
				var datalist = [];
				while (s_time <= e_time){
					var date = new Date(s_time);
					datalist.push(tools.Format(date, 'yyyyMMdd'));//转换时间并存数组
					s_time = s_time + 24*60*60*1000;
					//arr[day]=1; //本周查询字段
				}
				return datalist;
			}
			getMem();
		},
		/**
		 * 个人汇总
		 *
		 */
		getUserMembers:function(req,res){

			if (!admin.checkLevel(req, [3, 10]))
			{
				res.json({er: 1});  // 权限错误
				return;
			}
			var db = admin.mdb;

			var List = {};
			function initlist(id){
				List[id] = {};
				List[id].memberId = 0; //会员ID
				List[id].rechargeNumber = 0; //充值数量
				List[id].sellNumber  = 0;//销售次数
				List[id].sellPeople = 0;//销售人数
				List[id].remMemberNum = 0;//推荐人数

				//List[id].recommendBuyNum = 0;//推荐会员充值总数----（添加时间：20140420）
				List[id].reMeRechargeCount = 0;//推荐会员充值总数----（添加时间：20140420）

				List[id].number = 0;//周起始时间

				List[id].sumSellMoney = 0;//累计售出额度--元
				List[id].sumsellNum = 0;//累计售出额度--钻
				List[id].sumBuyMoney = 0;//累计充值总额度--元
				List[id].sumBuyNum = 0;//累计购买总额度--钻
			}



			var msg = req.body;
			var startDate = msg.startDate;//开始时间
			var endDate = msg.endDate;//结束时间
			var memberId = msg.memberId;//玩家ID

			console.log(startDate+" ------------ "+endDate);


			//-- time--
			var nowStartDay = startDate.substr(0,4)+'-'+startDate.substr(4,2)+'-'+startDate.substr(6,2);//2017-01-01开始
			var nowEndDay = endDate.substr(0,4)+'-'+endDate.substr(4,2)+'-'+endDate.substr(6,2);//2017-01-01结束
		//	var date2 = new Date(nowStartDay); //开始
			var iEndMonth = parseInt(endDate.substr(0,6));//结束月份

		//	console.log("iEndMonth ---------------------- "+iEndMonth);

			//查询限制日期（字段）
			var fieldArr = arr(nowStartDay,nowEndDay);

			//日期
			var fieldList = arr1(nowStartDay,nowEndDay);


			//查询条件
			var where = {};
			where._id = memberId;


			var date1=new Date(nowStartDay);  //开始时间
			var date2=new Date(nowEndDay);    //结束时间
			var date3=date2.getTime()-date1.getTime()  //时间差的毫秒数
			var days=Math.floor(date3/(24*3600*1000))
			var days = days+1;
			var weekss = Math.ceil(days/7);

			//循环开始时间
			var stime = [];
			var testTime = nowStartDay;
			for (var i=0;i<weekss;i++){
				var preDate = new Date(testTime);
				preDate.setDate(preDate.getDate() + 7*i);//前一天
				stime[i] = tools.Format(preDate, 'yyyy-MM-dd');
			}
			//循环结束时间
			var etime = [];
			for (var j=1;j<weekss+1;j++){
				var preDate = new Date(testTime);
				preDate.setDate(preDate.getDate() + 7*j-1);//前一天
				etime[j-1] = tools.Format(preDate, 'yyyy-MM-dd');
			}
			
			var dataList = {};
			function infoData(date){
				dataList[date] = {};
				dataList[date].uid = 0;
				dataList[date].sellNum = 0;//--
				//dataList[date].sellMoney = 0;
				dataList[date].sellAllUser = 0;//--
				//dataList[date].sellCount = 0;
				//dataList[date].buyCount = 0;
				dataList[date].buyNum = 0;//--
				//dataList[date].buyMoney = 0;
				dataList[date].recommendedNumber = 0;//--
				dataList[date].sumBuyMoney = 0;//--
				dataList[date].sumBuyNum = 0;//--
				dataList[date].sumSellMoney = 0;//--
				dataList[date].sumsellNum = 0;//--

				dataList[date].recommendUidArr = [];
				dataList[date].reMeRechargeCount = 0;
			}

			//var rtns = {};

			function getMem(){

			//	console.log("----------******----------"+date1);

				var month = tools.Format(date1, 'yyyyMM');
				if (parseInt(month) > iEndMonth) {  //表名时间    如果开始时间大于结束时间
					dataArray();
					return;
				}
				db.collection("memberConsumptionRecords"+month).find(where,fieldArr).each(function (er, rtn) {
					if(rtn){
					//	rtns = rtn;
						var id = rtn._id;
						for (var day in fieldArr) {
							//for (var i=0;i<fieldList.length;i++){
							//	var day = fieldList[i];
							var nowData = rtn[day];

							if (nowData) {

								infoData(day);

								dataList[day].uid = id; //充值数量

								dataList[day].buyNum = nowData.buyNum; //充值数量

								dataList[day].sellNum = nowData.sellNum;//销售数量

								var selllist = Object.keys(nowData.sellAllUser);//--
								if (selllist.length > 0) {
									dataList[day].sellAllUser = selllist.length;//本周销售人数
								}else {
									dataList[day].sellAllUser = 0;
								}

								dataList[day].sumSellMoney = nowData.sumSellMoney;//累计售出额度--元

								dataList[day].sumsellNum = nowData.sumsellNum;//累计售出额度--钻

								dataList[day].sumBuyMoney = nowData.sumBuyMoney;//累计充值总额度--元

								dataList[day].sumBuyNum = nowData.sumBuyNum;//累计购买总数 --钻石

								dataList[day].recommendedNumber = nowData.recommendedNumber;//推荐人数


								dataList[day].recommendUidArr = nowData.recommendUidArr;
								//	if (rUidArr.length >0){
								//var q = 0;
								//db.collection("memberConsumptionRecords"+month).find({"_id":{"$in":rUidArr}},fieldArr).each(function (er, rtn1) {
								//	if(rtn1){
								//		//for (var day1 in fieldArr) {
								//		for (var i=0;i<fieldList.length;i++){
								//			var day1 = fieldList[i];
								//			var recommend = rtn1[day1];
								//
								//			if (recommend){
								//				dataList[day1].reMeRechargeCount += recommend.buyNum; //推荐人充值数量
								//			}
								//		}
								//
								//	}
								//	else {
								//		q++;
								//		if (q == fieldList.length) {
								//			date1.setMonth(date1.getMonth() + 1);
								//			getMem();
								//		}
								//	}
								//});
								//}
							}
						}
					}
					else
					{
						date1.setMonth(date1.getMonth() + 1);
						getMem();
					}
				});
			}

			function dataArray(){
				//console.log(dataList);
				//console.log("查询是否有数据");
				var arr = Object.keys(dataList);

				//console.log(arr.length);
				if(arr.length == 0){
					getEnd();
				}

				for (var day in fieldArr) {
					var dataLists = dataList[day];
					//console.log(dataLists);
					//console.log("--------------------------------------");
					if (dataLists) {
						var rUidArr = dataLists.recommendUidArr;
						//console.log("*******************SSSSS");
						//console.log(rUidArr);
						//console.log("*******************EEEEE");
						var q = 0;
						var data = day.substr(0, 4) + '-' + day.substr(4, 2) + '-' + day.substr(6, 2);//2017-01-01开始
						var datetime = new Date(data);  //开始时间
						var month = tools.Format(datetime, 'yyyyMM');
						db.collection("memberConsumptionRecords" + month).find({"_id": {"$in": rUidArr}}, fieldArr).each(function (er, rtn1) {
							if (rtn1) {

								//	console.log(rtn1);
								//	console.log("-----------------------------------------------");

								//	for (var day1 in fieldArr) {
								for (var i = 0; i < fieldList.length; i++) {
									var day1 = fieldList[i];
									var recommend = rtn1[day1];

									if (recommend) {
										dataList[day1].reMeRechargeCount += recommend.buyNum; //推荐人充值数量
									}
								}
							}
							else {
								q++;
								//if (q == fieldList.length) {
								if (q == arr.length){
									//	date1.setMonth(date1.getMonth() + 1);
									getEnd();
								}
							}
						});
					}
				}
			}



			function getEnd(){
			//	console.log(dataList);

				//for (var day in dataList) {
                //
				//	var rUidArr = dataList[day].recommendUidArr;
				//	if (rUidArr.length >0){
                //
				//		var dayS = day.substr(0,4)+'-'+day.substr(4,2)+'-'+day.substr(6,2);//2017-01-01开始
				//		var dayS=new Date(dayS);
                //
				//		var month = tools.Format(dayS, 'yyyyMM');
                //
				//		var dd = day;
                //
				//		var fired = {};
				//		fired[day] = 1;
				//		db.collection("memberConsumptionRecords"+month).find({"_id":{"$in":rUidArr}},fired).each(function (er, doc) {
				//			if(doc){
				//				for (var day in fieldArr) {
				//					var recommend = doc[day];
				//					if (recommend){
				//						dataList[day].recommendBuyNum += recommend.buyNum; //推荐人充值数量
				//					}
				//				}
				//			}else {
				//				console.log(dataList);
				//				console.log("-------------------------------------------------------------------------------------");
				//			}
				//		});
				//	}
				//}

			//	console.log("-----------------------------------------------------------");

				if(dataList)
				{
					for (var a=0;a<weekss;a++){
						initlist(a);
						//	List[a].memberId = id; //会员ID

						var nowArr = arr(stime[a],etime[a]);
						List[a].number =stime[a]+"/"+etime[a];  //期数时间

						for(var day in nowArr)
						{
							var nowData = dataList[day];
							//console.log(day);
							//console.log(nowData);

							if(nowData)
							{
								List[a].memberId = nowData.uid; //会员ID

								var buyNum =  nowData.buyNum;//--
								if(buyNum >0){
									List[a].rechargeNumber += buyNum; //本周充值数量
								}

								var sellNum = nowData.sellNum;//--
								if (sellNum > 0){
									List[a].sellNumber += sellNum;//销售数量
								}

								var sellAllUser = nowData.sellAllUser;//--
								if (sellAllUser > 0){
									List[a].sellPeople += sellAllUser;//本周销售人数
								}

								var recommend = nowData.recommendedNumber;
								if (recommend >0){
									List[a].remMemberNum += recommend;//推荐人数
								}


								var chargeCount = nowData.reMeRechargeCount;
								if (chargeCount >0){
									List[a].reMeRechargeCount += chargeCount;//推荐人数本期购买数量
								}


								var sumSellMoney = nowData.sumSellMoney;
								if (sumSellMoney >0){
									List[a].sumSellMoney = sumSellMoney;//累计售出额度--元
								}

								var sumsellNum = nowData.sumsellNum;
								if (sumsellNum >0){
									List[a].sumsellNum = sumsellNum;//累计售出额度--钻
								}

								var sumBuyMoney = nowData.sumBuyMoney;
								if (sumBuyMoney >0){
									List[a].sumBuyMoney = sumBuyMoney;//累计充值总额度--元
								}

								var sumBuyNum = nowData.sumBuyNum;
								if (sumBuyNum >0){
									List[a].sumBuyNum = sumBuyNum;//累计购买总数 --钻石
								}
							}
						}
					}
				}

				var arr1 = Object.keys(List);

				var userdianum =[];
				for(var p in List){
					userdianum.push(List[p]);  //将对象值存入数组
				}

				res.json({total: arr1.length, rows: userdianum});

				console.log("跳出....");

			}

			/**
			 * 查询字段
			 */
			function arr(stime,etime){
				var arr = {};
				var s_time = Date.parse(stime); //本周开始时间
				var e_time = Date.parse(etime); //本周结束时间
				while (s_time <= e_time){
					var date = new Date(s_time);
					var day = tools.Format(date, 'yyyyMMdd');
					s_time = s_time + 24*60*60*1000;
					arr[day]=1; //本周查询字段
				}
				return arr;
			}

			function arr1(stime,etime){
				var s_time = Date.parse(stime); //本周开始时间
				var e_time = Date.parse(etime); //本周结束时间
				var datalist = [];
				while (s_time <= e_time){
					var date = new Date(s_time);
					datalist.push(tools.Format(date, 'yyyyMMdd'));//转换时间并存数组
					s_time = s_time + 24*60*60*1000;
					//arr[day]=1; //本周查询字段
				}
				return datalist;
			}


			/**
			 * 日期循环
			 */
			function arrList(arr,rtn){
				for(var day in arr)
				{
					var dData = rtn[day];//本周当天有销售
					if(dData)
					{
						return dData;
					}
				}
			}

			getMem();
		}
	};

	return rtn;
};