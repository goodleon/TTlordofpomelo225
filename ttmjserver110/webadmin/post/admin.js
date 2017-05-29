module.exports=function(admin)
{
	var fs=require('fs');
	var crypto=require('crypto');
	var ghttp=require("http");
	var gqs= require('querystring');
	var tools = require("../tools")();
    var postTools = require("./tools.js")(admin);
	var addMoneyTime={};
	var onlineReport=[];
	var onlineReportTime=0;
	var memberStruct = ['mNick', 'mName', 'mAddress'];//, 'mPhone1', 'mPhone2'];
	var opLogDay = 0;

	var escapeList = /[<>()'"${}\[\]:]/;//需要屏蔽的特殊字符
	var diamondMsg = {
		/*补钻权限配置*/
		diamond: {
			//玩家
			maxUserSignNum: 0,		//单次为玩家补钻数量上限
			maxUserSignDayNum: 0,	//每日为玩家补钻数量上限
			maxUserDayCount: 0,		//每日为玩家补钻次数上限
			maxUserBatDayCount: 0,	//每日为玩家批量补钻次数上限
			maxUserBatNum:0,			//单次为玩家批量补钻数量上限
			//会员
			maxMemSignNum: 0,		//单次为会员补钻数量上限
			maxMemSignDayNum: 0,		//每日为会员补钻数量上限
			maxMemDayCount: 0,		//每日为会员补钻次数上限
			maxMemBatDayCount: 1000,	//每日为会员批量补钻次数上限
			maxMemBatNum:100000,			//单次为会员批量补钻数量上限
			switchFlag:0,				//10级控制补钻扣除钻石开关: 0关1开
		}
	}
	var computeRewardFlag = false;
	//补钻权限
	function getDiamondCfg2(callback) {
		var result = null;

		//console.log("========getDiamondCfg2==");
		admin.mdb.collection("diamondCfg").find().each(function (er, doc) {
			if (doc) {
				result = doc;
			}else{
				if(!result)
				{
					result = diamondMsg;
					admin.mdb.collection("diamondCfg").update({},{'$set':result},{upsert:true},function (er, rtn) {
					});
				}
				!callback || callback(result)
			}
		});
	}
	/*
	* 获取补钻权限和当前补钻信息
	* */
	function getCurDiamond(mid, callback)
	{
		var curData = null;
		var money = null;
		var day = new Date();
		day = day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate();
		//console.log("getCurDiamond");
		getDiamondCfg2(function (maxCfg) {
			//console.log("========getCurDiamond==members",mid);
			//最近一次操作时间
			admin.mdb.collection('members').findOne({_id:mid},{money:1},function (err, rtn)
			{

				//console.log("=======",JSON.stringify(rtn));
				if(rtn)
				{
					money = rtn.money;
				}
				//最近一次操作时间
				admin.mdb.collection('opLog'+day).find({type: "fillMembersMoney", mid:mid}).sort({time:-1}).limit(1).each(function (err2, rtn2)
				{
					if(rtn2)
					{
						curData = rtn2.args;
					}
					else
					{
						if(!curData)
						{
							curData = {
								curUserSignDayNum:0,	//每日为玩家补钻数量上限
								curUserDayCount:0,		//每日为玩家补钻次数上限
								curUserBatDayCount:0,	//每日为玩家批量补钻次数上限

								curMemSignDayNum:0,		//每日为会员补钻数量上限
								curMemDayCount:0,		//每日为会员补钻次数上限
								curMemBatDayCount:0,	//每日为会员会员批量补钻次数上限
							};
						}
						//console.log("====111===",JSON.stringify(curData));
						!callback || callback(maxCfg, curData, money);
					}
				})
			})

		})
	}

	function addMember(req, res) {
        var db = admin.mdb;
        var member = admin.getMember(req);
        admin.opLog(member._id, admin.getClientIp(req), 'addMember', req.body);
        if (db) {
            var msg = req.body;

            var data = {};

            if (!msg.mid) {
                data.mid = Math.floor(Math.random() * 899999) + 100000;
            }

            var mPass = '123456';

            for(var i = 0; i < memberStruct.length; i++) {//注意如果外部的参数变多需要修改全局变量
                var k = memberStruct[i];

                if(msg[k]) {
                    var type = typeof(msg[k]);

                    if(k == 'mPhone1' || k == 'mPhone2') {
                        if(type != 'number') {
                            res.end();
                            return;
                        }

                        if(msg[k] < 10000000000 || msg[k] >= 100000000000) {
                            //fix me 11位手机号码
                            res.end();
                            return;
                        }
                    } else {
                        if (type != 'string' || escapeList.test(msg[k]) || msg[k].length > 150) {
                            //fix me，字符串最多150长度，utf8汉字50个。。。
                            res.end();
                            return;
                        }
                    }

                    data[k] = msg[k];
                }
            }

            data._id       = data.mid;
            data.mAddBy    = member.mName;
            data.mAddByMid = member.mid;

            if(member.adminLevel == 2) {
                data.byMid  =  member.byMid;
                data.byName =  member.byName;
            } else {
                data.byMid  = member.mid;
                data.byName = member.mName;
            }

            data.buyTotal = 0;
            data.buyReward = 0;
            data.money = 0;
            data.mTime = new Date();
            data.mPass = admin.cryptoMemberPass(mPass);
            data.forcePass = 1;
            data.adminLevel = 0;

            if(admin.jsonCfg.defaultGameId) {
                data.gameids = admin.jsonCfg.defaultGameId;
            }


            db.collection("members").insertOne(data, function (er, rtn) {
				//var resp = rtn.result;
				//resp.id = data._id;
                //res.json(resp);
				res.json(1);
            });
            //return;
        }
	}

	var rtn= {
		checkFile:function(req,res){
			if (!admin.checkLevel(req, [3, 10])) {
				res.end();
				return;
			}
			var msg=req.body;
			if (req.cookies.sessionID){
				var sessionID = req.cookies.sessionID;
				var member = admin.sid2member[sessionID];
				var level=member.adminLevel;
			}
			var dirPath="/root/webagent/public/helpDoc"+level+"/";
			if(fs.existsSync(dirPath) && fs.statSync(dirPath ).isDirectory())
			{
				var lst=fs.readdirSync(dirPath);
				for(var j=0;j<lst.length;j++)
				{
					if(lst[j]==msg.url) {
						//http://git.game-yes5.com:88/bulletinboard.html
						var retUrl = 'http://' + req.host + ':' + admin.jsonCfg.httpPort+'/helpDoc'+level+'/'+msg.url;
						res.json({url:retUrl});
						return;
					}
				}
				res.json(0);
			}
		},
		majiangLog: function (req, res) {
			if (!admin.checkLevel(req, [1, 3, 10])) {
				res.end();
				return;
			}

			if(typeof(req.body.uid) != 'number') {
				res.end();
				return;
			}

			//var member = admin.getMember(req);
			//admin.opLog(member._id, admin.getClientIp(req), 'majiangLog', {uid:req.body.uid});

			var db = admin.mdb;

			//_strDate:_strDate,_endDate:_endDate
			var _strDate=req.body._strDate;
			var _endDate=req.body._endDate;
			var rows=[];
			if (db) {
				var msg = req.body;
				db.collection("majiangLog").findOne({_id: msg.uid}, function (er, rtn) {
					if (rtn && rtn.logs) {
						rtn = rtn.logs;
						for(var l= 0,len=rtn.length;l<len;l++){
							var comparetime=Date.parse(rtn[l]["now"]);
							if(_strDate<=comparetime && _endDate>=comparetime){
								rows.push(rtn[l]);
							}

						}
						res.json({total: rows.length, rows: rows});
					} else {
						res.json({total: 0, rows: []});
					}
				});
				return;
			}

			admin.request("majiangLog", {msg: req.body}, function (er, rtn) {
				if (rtn && rtn.logs) {
					rtn = rtn.logs;
					res.json({total: rtn.length, rows: rtn});
				}
				else res.json({total: 0, rows: []});
			});
		},
		majiangLog1: function (req, res) {
			if (!admin.checkLevel(req, [1, 3, 10])) {
				res.end();
				return;
			}

			if(typeof(req.body.uid) != 'number') {
				res.end();
				return;
			}

			//var member = admin.getMember(req);
			//admin.opLog(member._id, admin.getClientIp(req), 'majiangLog', {uid:req.body.uid});

			var db = admin.mdb;

			if (db) {
				var msg = req.body;
				db.collection("majiangLog").findOne({_id: msg.uid}, function (er, rtn) {
					if (rtn && rtn.logs) {
						rtn = rtn.logs;
						res.json({total: rtn.length, rows: rtn});
					} else {
						res.json({total: 0, rows: []});
					}
				});
				return;
			}

			admin.request("majiangLog", {msg: req.body}, function (er, rtn) {
				if (rtn && rtn.logs) {
					rtn = rtn.logs;
					res.json({total: rtn.length, rows: rtn});
				}
				else res.json({total: 0, rows: []});
			});
		},
		onlineReport: function (req, res) {
			if (!admin.checkLevel(req, [3, 10])) {
				res.end();
				return;
			}

			var member = admin.getMember(req);
			admin.opLog(member._id, admin.getClientIp(req), 'onlineReport', {});

			//不在这里返回，防止第一次请求为空

			if(onlineReportTime+600000<Date.now()) {
				onlineReport=[];
				onlineReportTime=Date.now();
				var count = 0;
				var pkplayers = admin.pkplayer;
				for(var i=0;i<pkplayers.length;i++) {
					var pkserver=pkplayers[i];
					admin.httpClient.postJson("GetAudit", {}, pkserver.port + 1000, pkserver.host, function (er, rtn) {
						if(rtn) {
							count++;
							onlineReport.push(rtn);

							if(count == pkplayers.length) {
								res.json(onlineReport);
							}
						}
					});
				}
			} else {
				res.json(onlineReport);
			}

		},
		getDiamondCfg:function (req,res) {
			if (!admin.mdb || !admin.checkLevel(req, [3,10])) {
				res.json(1);
				return;
			}
			getDiamondCfg2(function (result) {
				res.json({content:result});
			});
		},
		setDiamondCfg:function (req,res) {
			if (!admin.mdb || !admin.checkLevel(req, [3,10])) {
				res.json(-1);
				return;
			}
			var msg = req.body;
			//console.log('>>>>>>>msg ', msg);
			if(!msg)
			{
				res.json(-100);
				return;
			}
			var write = {
				diamond:{},
				mid:msg.byMid,
				mName:msg.byName,
				time:new Date(),
			}
			for(var k in msg)
			{
				if(k == 'byName' || k == 'byMid')
				{
					continue;
				}
				if(typeof msg[k] != 'number' || msg[k] < 0)
				{
					//console.log('typeof msg[k]',typeof msg[k], k, msg[k]);
					res.json(-200);
					return;
				}
				write.diamond[k] = msg[k];
			}
			var member = admin.getMember(req);
			var level = admin.getLevel(req);
			if(level != 10)
			{
				delete write.switchFlag;
			}
			admin.opLog(member._id, admin.getClientIp(req), 'setDiamondCfg', write);
			admin.mdb.collection("diamondCfg").update({},{'$set':write},{upsert:true}, function (er, rtn) {
				res.json(er ? -300 : 1);
			});
		},
		//查询全体补钻总人数
		checkMembersNum:function(req,res)
		{
			if (!admin.mdb || !admin.checkLevel(req, [3,10])) {
				res.json(1);
				return;
			}
			admin.mdb.collection("members").count({$or:[{adminLevel:0},{adminLevel:2}]},function (er, rtn) {
				res.json({count:rtn});
			});
		},
		fillMembersMoney:function (req, res) {
			//会员补钻功能
			var db = admin.mdb;
			if (!db || !admin.checkLevel(req, [3,10])) {
				res.json(1);
				return;
			}
			//console.log(">>>>>>>>req.body>>>>>>>",JSON.stringify(req.body));
			// 仅限0级和2级
			// 补钻类型 1全体补钻 2ID补钻 3筛选补钻 4指定补钻 5导入补钻
			var type = req.body.type;//补钻类型
			var diamondCount = req.body.mount;//补钻数量
			var commit = req.body.commit;//运营注释
			var ids = req.body.ids;//ID补钻
			var field = null;//筛选条件
			if(type == 3)
			{
				field = req.body.field;//筛选条件
			}
			if(!diamondCount || typeof(diamondCount) != "number"
				|| diamondCount < 1 //不能扣钻
				|| !type || typeof(type) != "number"
				|| !commit || typeof(commit) != "string")
			{
				res.json(1);
				return;
			}
			var args = null;
			var title = null;
			var errIds = null;
			switch (type)
			{

				case 1://全体补钻
					args = {"$or":[{adminLevel:{"$in":[0,2]}}]};
					title = "全体补钻";
					break;
				case 2://ID补钻
				case 3://筛选补钻
				case 4://指定补钻
				case 5://导入补钻
					//console.log('typeof ids',typeof ids);
					if(!ids || ids.length == 0)
					{
						res.json(1);
						return;
					}
					for(var i = 0; i < ids.length; i++)
					{
						var id = ids[i];
						if(typeof id != 'number' || id < 10000)
						{
							res.json(2);
							return;
						}
					}

					args = {"$or":[{adminLevel:{"$in":[0,2]},_id:{"$in":ids}}]};
					if(type == 2)
					{
						title = "ID补钻";
					}
					else if(type == 3)
					{
						title = "筛选补钻";
					}
					else if(type == 4)
					{
						title = "指定补钻";
					}
					else if(type == 5)
					{
						title = "导入补钻";
					}
					errIds = ids.slice();
					break;
			}

			var member = admin.getMember(req);
			var memberId = member._id;
			// var day = tools.Format(new Date(), "yyyyMMdd");
			var day = new Date();
			day = day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate();
			var allMember = [];
			function opLogBuzuan(mid, type, commit, title, allMember, diamondCount,field) {

				var tb = 'supplyDiamond' + day;
				var logData     = {};
				logData.mid     = mid;//操作id
				logData.type    = type;//补钻类型
				logData.title   = title;//补钻类型cn
				logData.commit  = commit;//补钻备注
				logData.time    = new Date();
				logData.num 	= diamondCount;//补钻数量
				logData.total   = allMember.length * diamondCount;//补钻总额
				logData.members = allMember;//补钻id
				if(field)
				{
					logData.field = field;//筛选条件
				}

				db.collection(tb).insertOne(logData, function(er, rtn) {
					if(er) {
						return;
					}
					if(opLogDay != day)
					{
						opLogDay = day;
						db.collection(tb).createIndex({"mid":1},{"background":1});
						db.collection(tb).createIndex({"type":1},{"background":1});
					}
				});
			}

			getCurDiamond(memberId, function (maxDiamond,curIdDiamond, diamond) {

				if(type >= 1 && type <= 5)
				{
					//console.log("补钻权限", JSON.stringify(maxDiamond))
					//console.log("补钻数据", JSON.stringify(curIdDiamond), diamond)
					if(curIdDiamond.curMemBatDayCount >= maxDiamond.diamond.maxMemBatDayCount)
					{
						res.json(-101);//每日为会员会员批量补钻次数上限
						return;
					}

					if(diamondCount > maxDiamond.diamond.maxMemBatNum)
					{
						res.json(-102);//单次为会员批量补钻数量上限
						return;
					}
					//{$or:[{adminLevel:0},{adminLevel:2}]}
					db.collection("members").find(args).each(function (er, doc) {
						if (doc) {
							//查询  统计人的id 然后存库
							if(doc.mid > 9999)
							{
								var msgdata = {};
								msgdata[doc.mid] = diamondCount;
								allMember.push(msgdata);
								if((type >= 2 && type <= 5) && errIds)
								{
									var index = errIds.indexOf(doc.mid);
									if(index >= 0)
									{
										errIds.splice(index,1);
									}
								}
							}
						}
						else
						{
							if(type >= 2 && type <= 5)
							{
								if(errIds.length > 0)
								{
									res.json({error:-200, errIds:errIds});//只返回无效ID,有效ID前端已有缓存
									return;
								}
							}

							if(allMember.length == 0)
							{
								res.json(-100);//没有会员
								return;
							}
							var curCount = diamondCount*allMember.length;
							 if(maxDiamond.diamond.switchFlag == 1 && diamond < curCount)
							 {
								 res.json(-103); //当前账号钻石少于补钻数量
								 return;
							 }
							curIdDiamond.curMemBatDayCount++;

							// 统计会员/玩家剩余钻石并写入dayLog memberMoney userMoney
							//{$or:[{adminLevel:0},{adminLevel:2}]}
							db.collection("members").update(args,{$inc:{money:diamondCount}},{multi:true}, function (er, rtn) {
								if (er || !rtn)
								{
									res.json(-104);//操作失败
									return;
								}
								else
								{
									//console.log("maxDiamond.diamond.switchFlag", maxDiamond.diamond.switchFlag);
									if(maxDiamond.diamond.switchFlag == 1)
									{
										db.collection("members").update({_id:memberId}, {$inc:{money:-curCount}},{upsert:true}, function (er, rtn) {
											if(rtn)
											{
												//console.log("成功扣除客服账号钻石",memberId, diamondCount);
											}
										});
									}
									admin.opLog(memberId, admin.getClientIp(req), 'fillMembersMoney', curIdDiamond);
									db.collection("dayLog").update({_id:day}, {$inc:{fillMembersMoney:diamondCount}},{upsert:true}, function(er, rtn) {
									});
									opLogBuzuan(memberId, type, commit, title, allMember, diamondCount,field);

									//console.log("成功补钻");
									res.json({total:allMember.length, count:diamondCount});//成功补钻
								}
							});
						}
					});
				}

			})


		},
		getSupplyDiamond:function(req, res)
		{
			//会员补钻日志
			var db = admin.mdb;
			if (!db || !admin.checkLevel(req, [3,10])) {
				res.json(1);
				return;
			}
			//console.log('====req.body====',JSON.stringify(req.body));
			var msg = req.body;
			if (!msg.startDay
				|| !msg.endDay
				|| (typeof msg.startDay != 'string')
				|| (typeof msg.endDay != 'string')
				|| (msg.startDay.length != 8)
				|| (msg.endDay.length != 8)
				|| (parseInt(msg.startDay) > parseInt(msg.endDay))) {
				res.json(2);
				return;
			}
			//查询条件
			var startDay = msg.startDay;
			var endDay = msg.endDay;
			var sStartDay = startDay.substr(0,4)+'-'+startDay.substr(4,2)+'-'+startDay.substr(6,2);//2017-01-01
			var sEndDay = endDay.substr(0,4)+'-'+endDay.substr(4,2)+'-'+endDay.substr(6,2);//2017-01-01
			var date1 = new Date(sStartDay);
			var iEndDay = parseInt(endDay);
			var result = [];
			var maxQueryDay = 2;//最大查询天数3天
			var maxDate = new Date(sStartDay);
			maxDate.setDate(maxDate.getDate() + maxQueryDay);
			var maxDay = tools.Format(maxDate, 'yyyyMMdd');
			// console.log('maxDay,msg.endDay>>>>>>>>>>>',maxDay,msg.endDay);
			if(parseInt(maxDay) < parseInt(msg.endDay))
			{
				res.json(2);
				return;
			}
			function runSupplyDiamond() {
				var day = tools.Format(date1, 'yyyyMMdd');
				if (parseInt(day) > iEndDay) {
					//console.log('>>> runSupplyDiamond()',day);
					res.json({total: result.length, rows: result});
					return;
				}
				db.collection("supplyDiamond"+day).find().each(function (er, rtn) {
					if(rtn)
					{
						result.push(rtn);
					}
					else
					{
						date1.setDate(date1.getDate() + 1);
						runSupplyDiamond();
					}
				});
			}
			runSupplyDiamond();
		},
		getMembersFilter:function (req, res) {
			//会员管理筛选(3,10级)
			if (!admin.checkLevel(req, [3,10])) {
				res.json(1);
				return;
			}
			//console.log('====req.body====',JSON.stringify(req.body));
			var msg = req.body;
			var db = admin.mdb;
			if (!db) {
				res.json(1);
				return;
			}
			if (!msg.startDay
				|| !msg.endDay
				|| (typeof msg.startDay != 'string')
				|| (typeof msg.endDay != 'string')
				|| (msg.startDay.length != 8)
				|| (msg.endDay.length != 8)
				|| (parseInt(msg.startDay) > parseInt(msg.endDay))) {
				res.json(2);
				return;
			}
			var runTime0 = new Date();
			console.time('runTime0');
			//查询条件
			var startDay = msg.startDay;
			var endDay = msg.endDay;
			var sStartDay = startDay.substr(0,4)+'-'+startDay.substr(4,2)+'-'+startDay.substr(6,2);//2017-01-01
			var sEndDay = endDay.substr(0,4)+'-'+endDay.substr(4,2)+'-'+endDay.substr(6,2);//2017-01-01
			var date1 = new Date(sStartDay);
			var date2 = new Date(sStartDay);
			var date3 = new Date(sStartDay);
			var iStartDay = parseInt(startDay);
			var iEndDay = parseInt(endDay);
			var iEndMonth = parseInt(endDay.substr(0,6));

			var maxQueryDay = 31;//最大查询天数
			var maxDate = new Date(sStartDay);
			maxDate.setDate(maxDate.getDate() - maxQueryDay);
			var maxDay = tools.Format(maxDate, 'yyyyMMdd');
			if(parseInt(maxDay) > parseInt(msg.endDay))
			{
				res.json(2);
				return;
			}

			//登录条件
			var loginType = msg.logintype;//活跃还是流失 1是活跃 2是流失
			var loginDay = msg.loginday;//天数
			var loginDayArr = null;
			if(loginDay > 0)
			{
				loginDayArr = [];
				var loginDate = new Date(sEndDay);
				for(var i = 0; i < loginDay; i++)
				{
					var loginBegin = tools.Format(loginDate, 'yyyyMMdd'); //开始时间
					loginDayArr.push(loginBegin);
					loginDate.setDate(loginDate.getDate() - 1);
				}
			}

			//充值条件
			var chargeType = msg.chargetype;  //活跃还是流失 1是活跃 2是流失
			var chargeDay = msg.chargeday;//天数
			var chargeDayArr = null;
			if(chargeDay > 0)
			{
				chargeDayArr = [];
				var chargeDate = new Date(sEndDay);
				for(var i = 0; i < chargeDay; i++)
				{
					var chargeBegin = tools.Format(chargeDate, 'yyyyMMdd'); //开始时间
					chargeDayArr.push(chargeBegin);
					chargeDate.setDate(chargeDate.getDate() - 1);
				}
			}

			//销售条件
			var sellType = msg.selltype;//活跃还是流失 1是活跃 2是流失
			var sellDay = msg.sellday;//天数
			var sellDayArr = null;
			if(sellDay > 0)
			{
				sellDayArr = [];
				var sellDate = new Date(sEndDay);
				for(var i = 0; i < sellDay; i++)
				{
					var sellBegin = tools.Format(sellDate, 'yyyyMMdd'); //开始时间
					sellDayArr.push(sellBegin);
					sellDate.setDate(sellDate.getDate() - 1);
				}
			}

			//充值数量
			var chargeNum = msg.chargemount;//充值数量
			var chargeNumType = msg.chargemounttype;//大于还是小于 1是大于 2是小于

			//销售数量
			var sellNum = msg.sellmount;//销售数量
			var sellNumType = msg.sellmounttype;//大于还是小于 1是大于 2是小于
			//console.log('查询条件',startDay,endDay, loginDay,loginDayArr, loginType, chargeDay, chargeDayArr,chargeType, sellDay,sellDayArr, sellType, chargeNum,chargeNumType,sellNum,sellNumType);

			//console.log('typeof chargeNum',typeof chargeNum, chargeNum);
			//console.log('typeof sellNum',typeof sellNum, sellNum);
			var memInfo = {};//会员总记录
			function initMemberInfo(id) {
				if(memInfo[id])return;
				memInfo[id] = {};
				memInfo[id].loginDay = {};
				memInfo[id].chargeDay = {};
				memInfo[id].sellDay = {};
				memInfo[id].chargeNum = 0;
				memInfo[id].sellNum = 0;
			}
			//是否是会员
			function isMember(id) {
				return memInfo[id];
			}
			var dayArr = {};//查找日期

			var memberMsg = {};
			function getMembers() {

				db.collection("members").find({adminLevel:{$in:[0,2]}}/*,{_id:1, mName:1}*/).each(function (er, rtn) {
					if(rtn)
					{
						var id = rtn._id;
						if(id)
						{
							initMemberInfo(id);
							memberMsg[id] = rtn;
						}
					}
					else
					{
						runStatic1();
					}
				});
			}

			//登录
			var test1 = {};
			function runStatic1() {
				var day = tools.Format(date1, 'yyyyMMdd');
				if (parseInt(day) > iEndDay) {
					//console.log('>>> runStatic2()',day, Object.keys(test1).length);
					runStatic2();
					return;
				}
				dayArr[day] = 1;
				db.collection("opLog"+day).find({type:"login"}, {mid:1, _id:0}).each(function (er, rtn) {
					if(rtn)
					{
						var id = rtn.mid;
						if(id&&isMember(id))
						{
							initMemberInfo(id);
							memInfo[id].loginDay[day] = 1;
							test1[id] = 1;
						}
					}
					else
					{
						//console.log('登录 day, Object.keys(test1).length',day, Object.keys(test1).length);
						date1.setDate(date1.getDate() + 1);
						runStatic1();
					}
				});
			}
			//充值
			var test2 = {};
			function runStatic2() {
				var day = tools.Format(date2, 'yyyyMMdd');
				if (parseInt(day) > iEndDay) {
					runStatic3();
					return;
				}
				db.collection("memberMoney"+day).find({buyType: "1"}).each(function (er, rtn) {
					if(rtn)
					{
						var id = rtn.mid;
						if(id&&isMember(id))
						{
							initMemberInfo(id);
							var num = rtn.buyNum;
							if(num > 0)
							{
								memInfo[id].chargeDay[day] = 1;
								memInfo[id].chargeNum += num;
							}
							test2[id] = 1;
						}
					}
					else
					{
						//console.log('充值 day, Object.keys(test1).length',day, Object.keys(test2).length);
						date2.setDate(date2.getDate() + 1);
						runStatic2();
					}
				});
			}

			/*function runStatic3() {
				var month = tools.Format(date3, 'yyyyMM');
				if (parseInt(month) > iEndMonth) {
					endStatic();
					return;
				}
				db.collection("memberConsumptionRecords"+month).find({}, dayArr).each(function (er, rtn) {
					if(rtn)
					{
						var id = rtn._id;
						if(id&&isMember(id))
						{
							initMemberInfo(id)
							for(var day in dayArr)
							{
								var dData = rtn[day];//当天有销售
								if(dData)
								{
									var num = dData.sellNum;
									if(num > 0)
									{
										memInfo[id].sellDay[day] = 1;
										memInfo[id].sellNum += num;
									}
								}
							}
							test3[id] = 1;
						}
					}
					else
					{
						console.log('销售 month, Object.keys(test1).length',month, Object.keys(test3).length);
						date3.setMonth(date3.getMonth() + 1);
						runStatic3();
					}
				});
			}*/
			//销售(出售钻石给玩家的会员)
			var test3 = {};
			function runStatic3() {
				var day = tools.Format(date3, 'yyyyMMdd');
				if (parseInt(day) > iEndDay) {
					endStatic();
					return;
				}
				db.collection("userMoney"+day).find({}, {byMid:1,buyNum:1}).each(function (er, rtn) {
					if(rtn)
					{
						var id = rtn.byMid;
						if(id&&isMember(id))
						{
							initMemberInfo(id);
							var num = rtn.buyNum;
							if(num > 0)
							{
								memInfo[id].sellDay[day] = 1;
								memInfo[id].sellNum += num;
							}
							test3[id] = 1;
						}
					}
					else
					{
						//console.log('销售 day, Object.keys(test3).length',day, Object.keys(test3).length);
						date3.setDate(date3.getDate() + 1);
						runStatic3();
					}
				});
			}
			function endStatic() {
				var mKeys = Object.keys(memInfo);
				var loginUid = {};//登录天数
				var chargeUid = {};//充值天数
				var sellUid = {};//销售天数
				var cnUid = {};//充值数量
				var snUid = {};//销售数量
				var allUid = {};//满足所有条件
				var tAll = 0;
				if(loginDayArr)
				{
					tAll++;
				}
				//充值条件
				if(chargeDayArr)
				{
					tAll++;
				}
				//销售条件
				if(sellDayArr)
				{
					tAll++;
				}
				//充值数量
				if(chargeNumType == 1 || chargeNumType == 2)
				{
					tAll++;
				}

				//销售数量
				if(sellNumType == 1 || sellNumType == 2)
				{
					tAll++;
				}
				//console.log("条件数",tAll);
				for(var i = 0; i < mKeys.length; i++)
				{
					var id = mKeys[i];
					var data = memInfo[id];
					var iAll = 0;
					//登录条件
					if(loginDayArr)
					{
						var lDesArr = [];
						for(var t in data.loginDay)
						{
							lDesArr.push(t);
						}
						if(loginType == 1)
						{
							if(!tools.isNoElement(lDesArr,loginDayArr))//存在
							{
								loginUid[id] = 1;
								iAll++;

							}
						}
						else if(loginType == 2)
						{
							if(tools.isNoElement(loginDayArr,lDesArr))//流失
							{
								loginUid[id] = 1;
								iAll++;
							}
						}
					}

					//充值条件
					if(chargeDayArr)
					{
						var cDesArr = [];
						for(var t in data.chargeDay)
						{
							cDesArr.push(t);
						}
						if(chargeType == 1)
						{
							if(!tools.isNoElement(cDesArr, chargeDayArr))//存在
							{
								chargeUid[id] = 1;
								iAll++;
							}
						}
						else if(chargeType == 2)
						{
							if(tools.isNoElement(chargeDayArr,cDesArr))//流失
							{
								chargeUid[id] = 1;
								iAll++;
							}
						}
					}
					//销售条件
					if(sellDayArr)
					{
						var sDesArr = [];
						for(var t in data.sellDay)
						{
							sDesArr.push(t);
						}
						if(sellType == 1)
						{
							if(!tools.isNoElement(sDesArr, sellDayArr))//存在
							{
								sellUid[id] = 1;
								iAll++;
							}
						}
						else if(sellType == 2)
						{
							if(tools.isNoElement(sellDayArr,sDesArr))//流失
							{
								sellUid[id] = 1;
								iAll++;
							}
						}

					}
					//充值数量
					if(chargeNumType == 1)
					{
						if(data.chargeNum >= chargeNum)
						{
							cnUid[id] = 1;
							iAll++;
						}
					}
					else if(chargeNumType == 2)
					{
						if(data.chargeNum <= chargeNum)
						{
							cnUid[id] = 1;
							iAll++;
						}
					}

					//销售数量
					if(sellNumType == 1)
					{
						if(data.sellNum >= sellNum)
						{
							snUid[id] = 1;
							iAll++;
						}
					}
					else if(sellNumType == 2)
					{
						if(data.sellNum <= sellNum)
						{
							snUid[id] = 1;
							iAll++;

						}
					}

					//if(i%500 == 0)
					//if(iAll == 1)
					//{
					//	console.log("iAll, tAll", iAll, tAll);
					//}
					if(iAll == tAll)
					{
						//console.log("========", id);
						allUid[id] = 1;
					}
				}


				var loginUidKeys = Object.keys(loginUid);
				var chargeUidKeys = Object.keys(chargeUid);
				var sellUidKeys = Object.keys(sellUid);
				var cnUidKeys = Object.keys(cnUid);
				var snUidKeys = Object.keys(snUid);
				var result = {};
				//登录条件
				if(loginDayArr)
				{
					result.loginDayNum = loginUidKeys.length;
				}

				//充值条件
				if(chargeDayArr)
				{
					result.chargeDayNum = chargeUidKeys.length;
				}
				//销售条件
				if(sellDayArr)
				{
					result.sellDayNum = sellUidKeys.length;
				}
				//充值数量
				if(chargeNumType == 1 || chargeNumType == 2)
				{
					result.chargeNum = cnUidKeys.length;
				}

				//销售数量
				if(sellNumType == 1 || sellNumType == 2)
				{
					result.sellNum = snUidKeys.length;
				}

				var rtnMember = [];
				var max = 20000;//最大下发数量
				var idx = 0;
				for(var uid in allUid)
				{
					rtnMember.push(memberMsg[uid]);
					if(++idx > max)
					{
						break;
					}
				}
				// for(var i = 0; i < 20000; i++)
				// {
				// 	rtnMember.push(rtnMember[0]);
				// }
				result.total = rtnMember.length;//实际下发数量
				result.qtotal = Object.keys(allUid).length;//查询到的数量
				console.timeEnd('runTime0');
				//console.log('>>>>>> time, result >>>>>>',new Date() - runTime0,JSON.stringify(result));
				result.rows = rtnMember;
				res.json(result);
			}

			getMembers();

		},
		getMembersCount: function (req, res) {
			if (!admin.checkLevel(req, [1, 3, 10])) {
				res.end();
				return;
			}

			var msg = req.body;
			var db = admin.mdb;
			var member = admin.getMember(req);

			if (db) {
				if(msg.type == 1) {
					db.collection("members").count(function (er, rtn) {
						res.json(rtn);
					});
				}else if(msg.type == 2) {
				     //只返回 0 级 2级的会员数
					/*db.collection("members").count({$or:[{adminLevel:0},{adminLevel:2}]},function (er, rtn) {
						res.json(rtn);
					});*/
					//早期产品没有adminLevel字段，改为：非1、3、10级
					/*db.collection("members").count({adminLevel:{$nin:[1,3,10]}},function (er, rtn) {
						res.json(rtn);
					});*/
					db.collection("members").count(function (er, rtn) {
						res.json(rtn);
					});

				} else {
					delete msg.type;

					if (msg.mid) {
						msg._id = msg.mid;
						delete msg.mid;
					}

					if(member.adminLevel == 1) {//1权限的会员，只能查询自己管理的会员
						msg.byMid = member._id;
						delete msg.adminLevel;
					}

					if(msg.lastBuyDay) {
						var days = msg.lastBuyDay;
						var dd = new Date();
						dd.setDate(dd.getDate() - days);
						dd = dd.getFullYear() * 10000 + (dd.getMonth() + 1) * 100 + dd.getDate();
						delete msg.lastBuyDay;

						msg.$or = [{lastBuyDay: null}, {lastBuyDay: {$lte: dd}}];
					}

					if (msg.buyDay) {
						var days = msg.buyDay;
						var dd = new Date();
						dd.setDate(dd.getDate() - days);
						dd = dd.getFullYear() * 10000 + (dd.getMonth() + 1) * 100 + dd.getDate();
						delete msg.buyDay;

						msg = {lastBuyDay: {$gte: dd}};
					}

					db.collection("members").count(msg, function (er, rtn) {
						res.json(rtn);
					});
				}
			}
		},
		getMembers: function (req, res) {
			if (!admin.checkLevel(req, [1, 3, 10])) {
				res.end();
				return;
			}

			var member = admin.getMember(req);
			//admin.opLog(member._id, admin.getClientIp(req), 'getMember', req.body);

			if (admin.mdb) {
				var msg = req.body.searchKey;
				var skip = req.body.skip;
				var limit = req.body.limit;

				if (!skip)  skip = 0;

				if (!limit) limit = 50;

				if(msg) {
					if (msg.mid) {
						msg._id = msg.mid;
						delete msg.mid;
					}

					if (member.adminLevel == 1) {//1权限的会员，只能查询自己管理的会员
						msg.byMid = member._id;
					} else if(req.body.adminLevel) {
						msg.adminLevel = req.body.adminLevel;
					}

					if (msg.lastBuyDay) {
						var days = msg.lastBuyDay;
						var dd = new Date();
						dd.setDate(dd.getDate() - days);
						dd = dd.getFullYear() * 10000 + (dd.getMonth() + 1) * 100 + dd.getDate();
						delete msg.lastBuyDay;

						msg.$or = [{lastBuyDay: null}, {lastBuyDay: {$lte: dd}}];
					}
					if (msg.buyDay) {
						var days = msg.buyDay;
						var dd = new Date();
						dd.setDate(dd.getDate() - days);
						dd = dd.getFullYear() * 10000 + (dd.getMonth() + 1) * 100 + dd.getDate();
						delete msg.buyDay;

						msg= {lastBuyDay: {$gte: dd}};
					}
				} else {
					msg = {};

					if (member.adminLevel == 1) {//1权限的会员，只能查询自己管理的会员
						msg.byMid = member._id;
					} else if(req.body.adminLevel) {
						msg.adminLevel = req.body.adminLevel;
					}
				}

				var rtn = [];
				//console.info("msg"+JSON.stringify(msg));
				admin.mdb.collection("members").find(msg).skip(skip).limit(limit).sort({mTime:-1}).each(function (er, doc) {
					if (doc) {
						if(!(member.adminLevel == 1 && (doc.adminLevel == 1 || doc.adminLevel >= 3))) {//1权限的OR有问题，需要过滤
							rtn.push(doc);
						}
					} else {
						res.json({total: rtn.length, rows: rtn});
					}
				});
				return;
			}

			admin.request("getMembers", {msg: req.body}, function (er, rtn) {
				if (er)
					res.json({total: 0, rows: []});
				else
					res.json({total: rtn.length, rows: rtn});
			});
		},
		asManager: function (req, res) {
			if (!admin.checkLevel(req, [3, 10])) {
				res.end();
				return;
			}

			var db = admin.mdb;
			var member = admin.getMember(req);
			admin.opLog(member._id, admin.getClientIp(req), 'asManager', req.body);

			if (db) {
				var msg = req.body;
				db.collection("members").update({_id: msg.mid}, {$set: {adminLevel: 1}}, function (er, rtn) {
					res.json(rtn);
				});
				return;
			}

			admin.request("asManager", {msg: req.body}, function (er, rtn) {
				res.json(rtn);
			});

		},
		changeMemberPass: function (req, res) {
			if (!admin.checkLevel(req, [3, 10])) {
				res.end();
				return;
			}

			if(typeof(req.body.mid) != 'number') {
				res.end();
				return;
			}

			var member = admin.getMember(req);
			admin.opLog(member._id, admin.getClientIp(req), 'changeMemberPass', {_id:req.body.mid});
			var db = admin.mdb;

			if (db) {
				var msg = req.body;
				db.collection("members").findOne({_id:msg.mid}, function(er, doc) {
					if(doc) {
						if(doc.adminLevel && member.adminLevel != 10) {
							if(member.adminLevel <= doc.adminLevel) {
								res.end();
								return;
							}
						}

						msg.mPass = admin.cryptoMemberPass(msg.mPass);//强制修改密码

						db.collection("members").update({_id: msg.mid}, {$set: {mPass: msg.mPass, forcePass:1}}, function (er, rtn) {
                            if(admin.mid2sid[msg.mid]) {
                                delete admin.sid2member[admin.mid2sid[msg.mid]];
                                delete admin.mid2sid[msg.mid];
                            }
						});
						res.json(1);
					}
				});

				//return;
			}

			/*admin.request("changeMemberPass", {msg: req.body}, function (er, rtn) {
			 res.json(rtn);
			 });*/
		},
		computeMemberReward: function (req, res) {
			if (!admin.checkLevel(req, [3, 10])) {
				res.end();
				return;
			}

			var member = admin.getMember(req);
			admin.opLog(member._id, admin.getClientIp(req), 'computeMemberReward', {computeRewardFlag:computeRewardFlag});

			if(computeRewardFlag) {
				res.end();
				return;
			}

			computeRewardFlag = true;

			if (admin.mdb) {
				//console.time('new');
				var rebate;

				if(!admin.jsonCfg["isOpenRebateCfg"]) {
					var host = req.headers.host.split(".");
					rebate = admin.gameType[host[0]].rebate;
					//var rebate2 = admin.gameType[host[0]].rebate2;
				} else {
					rebate = admin.getAlipayJsonCfg().rebate;
					//var rebate2 = admin.getAlipayJsonCfg().rebate2;
				}

				var db = admin.mdb;
				var buyInfo = {};
				var id2member = {};
				//var mids = {};//三级返利使用的
				//var fresult = [];

				db.collection("members").find().each(function (er, doc) {
					if (doc) {
						id2member[doc.mid] = doc;

						/*if(doc.mAddByMid) {
						 if(!mids[doc.mAddByMid]) {
						 mids[doc.mAddByMid] = [];
						 }

						 mids[doc.mAddByMid].push(doc.mid);
						 }

						 if(rebate2 && doc.adminLevel == 2) {
						 //三级返利结构通过自身建立，并向前追溯，其他玩家通过m1 m2追溯到自身
						 //高级会员的数量有限，多增加一些循环，可以接受
						 if(!buyInfo[doc.mid]) {
						 buyInfo[doc.mid] = {
						 mid: doc.mid,//string -> int
						 bigNum1: 0,
						 bigNum2: 0,
						 rewards: [],
						 bigNum21: 0,
						 bigNum22: 0,
						 rewards2: []
						 };
						 } else {
						 buyInfo[doc.mid].bigNum21 = 0;
						 buyInfo[doc.mid].bigNum22 = 0;
						 buyInfo[doc.mid].rewards2 = [];
						 }

						 var buyData = buyInfo[doc.mid];

						 if (mids[doc.mid] && mids[doc.mid].length > 0) {
						 for (var i = 0; i < mids[doc.mid].length; i++) {
						 var id = mids[doc.mid][i];
						 var rewards = buyInfo[id];

						 if (rewards && rewards.rewards.length > 0) {
						 rewards = rewards.rewards;

						 for (var ii = 0; ii < rewards.length; ii++) {
						 if (rewards[ii] >= rebate2.secondLevel.recharge) {
						 buyData.bigNum22++;
						 buyData.bigNum21++;
						 } else if (rewards[ii] >= rebate2.firstLevel.recharge) {
						 buyData.bigNum21++;
						 }

						 buyData.rewards2.push(rewards[ii]);
						 }
						 }
						 }
						 }
						 }*/

						if(doc.mAddByMid && doc.buyTotal > 0) {//第一级数据
							if (!buyInfo[doc.mAddByMid]) {
								buyInfo[doc.mAddByMid] = {
									mid: doc.mAddByMid,//string -> int
									bigNum1: 0,
									bigNum2: 0,
									rewards: []
								};
							}

							var buyData = buyInfo[doc.mAddByMid];

							if (doc.buyTotal >= rebate.secondLevel.recharge) {
								buyData.bigNum2++;
								buyData.bigNum1++;
							} else if (doc.buyTotal >= rebate.firstLevel.recharge) {
								buyData.bigNum1++;
							}

							buyData.rewards.push(doc.buyTotal);

							/*var m1 = id2member[doc.mAddByMid];
							 //三级返利数据
							 if(rebate2 && m1 && m1.mAddByMid && buyInfo[m1.mAddByMid] && buyInfo[m1.mAddByMid].rewards2) {
							 buyData = buyInfo[m1.mAddByMid];

							 if (doc.buyTotal >= rebate2.secondLevel.recharge) {
							 buyData.bigNum22++;
							 buyData.bigNum21++;
							 } else if (doc.buyTotal >= rebate2.firstLevel.recharge) {
							 buyData.bigNum21++;
							 }

							 buyData.rewards2.push(doc.buyTotal);
							 }*/
						}
					} else {
						var keys = Object.keys(buyInfo);
						var size = keys.length;
						var finishNum = 0;

						function finish() {
							finishNum++;
							if (finishNum == size + 1) {
								res.json(null);
								computeRewardFlag = false;
								//console.timeEnd('new');
								//console.info('count = ' + finishNum);
								//console.info('result ' + JSON.stringify(fresult));
							}
						}

						for (var i = 0; i < size; i++) {
							var mid = keys[i];
							var buyReward = 0;

							if (!id2member[mid]) {//玩家不存在
								finish();
								continue;
							}

							var data = buyInfo[mid];
							mid = data.mid;//string -> int
							/*
							 //三级返利
							 if(data.rewards2 && data.rewards2.length > 0) {
							 var rate = rebate2.basic.sca;

							 if (data.bigNum22 >= rebate2.secondLevel.recommend) {
							 rate = rebate2.secondLevel.sca;
							 } else if (data.bigNum21 >= rebate2.firstLevel.recommend) {
							 rate = rebate2.firstLevel.sca;
							 }

							 for(var ii = 0; ii < data.rewards2.length; ii++) {
							 buyReward += Math.floor(data.rewards2[ii] * rate);
							 }
							 console.info('sanji fanli ' + mid + " : " + buyReward);
							 }
							 //三级返利End
							 */
							if (data.rewards.length < 1) {//没有奖励
								/*if(buyReward > 0) {
								 //fresult.push([mid, buyReward, rate, data.bigNum1, data.bigNum2]);
								 db.collection("members").update({_id: mid}, {$inc: {buyReward: buyReward}}, function () {
								 finish();
								 });
								 } else {
								 finish();
								 }*/
								finish();//如果是三级返利，删除这个打开上面
								continue;
							}


							var rate = rebate.basic.sca;//0.16//rebate.basic

							if (data.bigNum2 >= rebate.secondLevel.recommend) {
								rate = rebate.secondLevel.sca;
							} else if (data.bigNum1 >= rebate.firstLevel.recommend) {
								rate = rebate.firstLevel.sca;
							}

							for (var k = 0; k < data.rewards.length; k++) {
								buyReward += Math.floor(data.rewards[k] * rate);
							}

							if (buyReward < 1) {
								finish();
								continue;
							}
							//console.info("suoyou fanli " +mid + " : " + buyReward);
							//fresult.push([mid, buyReward, rate, data.bigNum1, data.bigNum2]);
							db.collection("members").update({_id: mid}, {$inc: {buyReward: buyReward}}, function () {
								finish();
							});
						}

						db.collection("members").update({}, {$set: {buyTotal: 0}}, {multi: true}, function () {
							finish();
						});
					}
				});
				return;
			}

			admin.request("computeMemberReward", {msg: req.body}, function (er, rtn) {
				res.json(rtn);
				computeRewardFlag = false;
			});
		},
		getNoticeCfgJson: function (req, res) {
			if (!admin.checkLevel(req, [3, 10])) {
				res.end();
				return;
			}

			var kk = req.host.split(".");
			var mj = kk[0];
			var filePath = "../../mjserver/web-server/public/" + mj + "/notice.json";

			delete require.cache[require.resolve(filePath)];
			var json = require(filePath);

			res.json(json);
		},
		saveNoticeCfgJson: function (req, res) {
			if (!admin.checkLevel(req, [3, 10])) {
				res.end();
				return;
			}

			var kk = req.host.split(".");
			var mj = kk[0];

			var member = admin.getMember(req);
			admin.opLog(member._id, admin.getClientIp(req), 'saveNoticeCfgJson', {mj:mj});

			var filePath = "../../mjserver/web-server/public/" + mj + "/notice.json";
			delete require.cache[require.resolve(filePath)];
			var json = require(filePath);

			if (req.body.title) {
				json.title = req.body.title;
			}

			if (req.body.desc) {
				json.desc = req.body.desc;
			}

			if (req.body.contact) {
				json.contact = req.body.contact;
			}

			fs.writeFile("/root/mjserver/web-server/public/" + mj + "/notice.json", JSON.stringify(json), function (er) {});

			res.json(json);
		},
		getCfgJson: function (req, res) {
			//fix me 微信号与跑马灯稍后需改为和notice一样的独立json
			if (!admin.checkLevel(req, [3, 10])) {
				res.end();
				return;
			}

			var rtn = [];

			var kk = req.host.split(".");
			var mj = kk[0];

			var dirPath = __dirname + "/../../mjserver/web-server/public/" + mj + "/";
			//检测文件路径
			//statSync返回数组对象

			if(fs.existsSync(dirPath) && fs.statSync(dirPath ).isDirectory())
			{
				var lst=fs.readdirSync(dirPath);
				for(var j=0;j<lst.length;j++)
				{
					if(lst[j].indexOf(".json")>0)
					{
						// 湖南先行版
						if(lst[j] != "notice.json" && lst[j] != "action.json" && lst[j] != "configuration.json"){
							continue;
						}

						//查看缓存区模块对象
						//var a = require.cache[require.resolve("../../mjserver/web-server/public/"+mj+"/"+lst[j])];
						//require.cache 代表缓存了所有已被加载模块的缓存区
						//通过键名来访问某一模块 require.cache["模块文件名"]
						//使用 require.cache[require.resolve("")];查看缓存区模块对象
						//require.resolve("./testModule.js");查询某个模块文件的带有完整绝对路径的文件名
						//删除缓存区中缓存的某个模块对象后，下次加载该模块时将重新运行该模块中的代码

						delete require.cache[require.resolve("../../mjserver/web-server/public/" + mj + "/" + lst[j])];


						var json=require("../../mjserver/web-server/public/"+mj+"/"+lst[j]);
						json.file=lst[j];
						//json.file="configuration.json";

						rtn.push(json);
					}
				}
			}
			res.json({total: rtn.length, rows: rtn});
		}
		, saveCfgJson: function (req, res) {
			if (!admin.checkLevel(req, [3, 10])) {
				res.end();
				return;
			}

			var kk = req.host.split(".");
			var mj = kk[0];
			var info = req.body;
			var fileName = info.file;
			if(!fileName)
			{
				res.end();
				return;
			}

			var member = admin.getMember(req);
			admin.opLog(member._id, admin.getClientIp(req), 'saveCfgJson', {mj:mj});

			var dirPath = __dirname + "/../../mjserver/web-server/public/" + mj + "/";

			if(fs.existsSync(dirPath) && fs.statSync(dirPath ).isDirectory())
			{
				var files=[];
				delete require.cache[require.resolve("../../mjserver/web-server/public/" + mj + "/" + fileName)];

				var json = require("../../mjserver/web-server/public/" + mj + "/" + fileName);
				for (var key in info)
				{
					if(key=="byMid"||key=="byName"){
						continue;
					}
					//if (!json.hasOwnProperty(key))
					//{
					//	console.info("2220");
					//	continue;
					//}
					json[key] = info[key];
				}
				fs.writeFile("/root/mjserver/web-server/public/" + mj + "/" + fileName, JSON.stringify(json),
					function (er) {
						!er || console.log("saveCfgJson error: " + JSON.stringify(er));
					});

				json.file=fileName;
				files.push(json);
				res.json({total: files.length, rows: files});
			} else
			{
				res.end();
			}
		},
		getAdminSellList: function (req, res) {
			if (!admin.checkLevel(req, [1, 3, 10])) {
				res.end();
				return;
			}

			var db = admin.mdb;

			if (db) {

				//console.info("db exist");
				var msg = req.body;
				var _strDay=msg._strday;
				var _endDay=msg._endday;

				//console.info(_strDay);
				//console.info(_endDay);

				var rtn = [];
				var total=0;

				if(_endDay-_strDay>8*24*60*60*1000){
					//console.info("elts");
					res.end();
					return;
				}
				function requireDays(){
					//strday
					if(parseInt(_strDay)<parseInt(_endDay)){

						var day=admin.getFormatDate(_strDay);
						db.collection("memberMoney" + day).find({byMid: msg.mid ? msg.mid : msg.byMid}).each(function (er, doc) {
							if (doc) {
								rtn.push(doc);
								//console.info(rtn);
								total+=1;
								//console.info(total);
							}
							else
							{
								_strDay=parseInt(_strDay)+24*60*60*1000;
								requireDays();
							}
						});
					}
					else
					{
						res.json({total:total,rows:rtn});
					}
				}
				requireDays();
				return;
			}

			admin.request("getAdminSellList", {msg: req.body}, function (er, rtn) {
				if (er) res.json({total: 0, rows: []});
				else res.json({total: 1, rows: rtn});
			});
		}
		,
		getAdminSellList1: function (req, res) {
			if (!admin.checkLevel(req, [1, 3, 10])) {
				res.end();
				return;
			}

			var db = admin.mdb;

			if (db) {
				var msg = req.body;
				var day = msg.day;

				if (!day) day = "";

				var rtn = [];
				db.collection("memberMoney" + day).find({byMid: msg.mid ? msg.mid : msg.byMid}).each(function (er, doc) {
					if (doc) rtn.push(doc);
					else res.json({total: 1, rows: rtn});
				});
				return;
			}

			admin.request("getAdminSellList", {msg: req.body}, function (er, rtn) {
				if (er) res.json({total: 0, rows: []});
				else res.json({total: 1, rows: rtn});
			});
		}
		, addMember: function (req, res) {

			if (!admin.checkLevel(req, [1, 2, 3, 10])) {
				res.end();
				return;
			}

            addMember(req, res);

			/*admin.request("addMember", {msg: req.body}, function (er, rtn) {
			 res.json(rtn);
			 });*/
		}
		, saveMember: function (req, res) {
			if (!admin.checkLevel(req, [1, 3, 10])) {
				res.end();
				return;
			}
			for(var j=0;j<req.body.mid.length;j++){
				if(typeof(req.body.mid[j]) != 'number') {
					 res.end();
					 return;
				 }
				if(req.body.mid[j]==req.body.byMid){
					res.end();
					return;
				}
			}
			var member = admin.getMember(req);
			admin.opLog(member._id, admin.getClientIp(req), 'saveMember', req.body);

			var db = admin.mdb;

			if (db) {
				var msg = req.body;
				var mid = msg.mid;
				delete msg.mid;
				delete msg.money;

				if(msg.mPass) {//不会通过这个页面修改密码
					res.end();
					return;
				}

				var data = {};

				if(msg.adminLevel||msg.adminLevel==0) {
					if(msg.adminLevel >= member.adminLevel) {
						res.end();
						return;
					}

					data.adminLevel = msg.adminLevel;
				}

				if(msg.gameids) {
					if(member.adminLevel == 1) {//潘总需求，客户经理不可授权
						res.end();
						return;
					}
					data.gameids = msg.gameids;
				}

				if(msg.byMid) {
					data.byMid = msg.byMid;
					data.byName = msg.byName;
				}

				if(msg.mAddByMid) {
					data.mAddByMid = msg.mAddByMid;
					data.mAddBy = msg.mAddBy;
				}

				for(var i = 0; i < memberStruct.length; i++) {//注意如果外部的参数变多需要修改全局变量
					var k = memberStruct[i];

					if(msg[k]) {
						var type = typeof(msg[k]);

						if(k == 'mPhone1' || k == 'mPhone2') {
							if(type != 'number') {
								res.end();
								return;
							}

							if(msg[k] < 10000000000 || msg[k] >= 100000000000) {
								//fix me 11位手机号码
								res.end();
								return;
							}
						} else {
							if (type != 'string' || escapeList.test(msg[k]) || msg[k].length > 150) {
								//fix me，字符串最多150长度，utf8汉字50个。。。
								res.end();
								return;
							}
						}

						data[k] = msg[k];
					}
				}
				//{mid: 264637, adminLevel: 0}, mid是被选择的人
				/*db.collection("members").findOne({_id: mid}, function(e, r) {
					if(r) {
						if(r.adminLevel && member.adminLevel != 10) {
							if(member.adminLevel <= r.adminLevel) {
								res.end();
								return;
							}

							if(member.adminLevel == 1 && r.byMid != member.mid) {
								//1权限只能修改自己名下的
								res.end();
								return;
							}
						}

						db.collection("members").update({_id: mid}, {$set:data}, function (er, rtn) {

						});

						res.json(1);
					}
				});*/
				db.collection("members").find({_id:{$in:mid}}).each(function(e,r){

					if(r) {
						var isUpdate = true;
						if(r.adminLevel && member.adminLevel != 10) {
							if(member.adminLevel <= r.adminLevel) {
								//res.end();
								//return;
								isUpdate = false;
							}

							if(member.adminLevel == 1 && r.byMid != member.mid) {
								//1权限只能修改自己名下的
								//res.end();
								//return;
								isUpdate = false;
							}
						}

						if(isUpdate)
						{
							db.collection("members").update({_id:r.mid}, {$set:data}, function (er, rtn) {
								if(rtn||!er){

								}
							});
						}


					}
					else
					{
						res.json(1);
					}
				});
			}
		/*	var msg=isManager?
			{
				mid:toMember.mid,
				byName:addByMember.mNick,
				byMid:addByMember.mid
			}:
			{
				mid:toMember.mid,
				mAddBy:addByMember.mNick,
				mAddByMid:addByMember.mid
			};*/
		}
		, delMember: function (req, res) {
			if (!admin.checkLevel(req, [3, 10])) {
				res.end();
				return;
			}

			if(typeof(req.body.mid) != 'number') {
				res.end();
				return;
			}

			var member = admin.getMember(req);
			admin.opLog(member._id, admin.getClientIp(req), 'delMember', req.body);

			if (admin.mdb) {
				var mid = req.body.mid;
				var msg = req.body.member;
				delete msg._id;//防止_id冲突，恢复的时候再处理_id = mid
				admin.mdb.collection("members").remove({_id: mid}, 1, function (er, rtn) {
					if (er) {
						res.json({ok: 0});
						return;
					}

					admin.mdb.collection("memberAccrued").remove({_id: mid}, 1, function (er, rtn) {
					});

					var sid = admin.mid2sid[mid];

					if (sid) {//会员处于登录状态，删除...
						delete admin.sid2member[sid];
						delete admin.mid2sid[mid];
					}

					admin.mdb.collection("delMembers").insertOne(msg, function (er, rtn) {
						if (er) {
							console.info("delMember insert Error " + JSON.stringify(msg));
							//return;
						}
					});

					res.json(rtn);
				});
				//return;
			}


			//暂时游戏方面还没有这个接口
			/*admin.request("delMember", {msg:req.body}, function (er, rtn) {
			 res.json(rtn);
			 })*/
		}
		, getUserBuyList: function (req, res) {
			if (!admin.checkLevel(req, [1, 3, 10])) {
				res.end();
				return;
			}

			var db = admin.mdb;

			if (db) {
				var msg = req.body;
				var strday=msg.strday;
				var endday=msg.endday;
				var rtn = [];
				var total=0;
				if(endday-strday>8*24*60*60*1000){
					res.end();
					return;
				}
				function requireDays(){
					//strday
					if(parseInt(strday)<parseInt(endday)){

						var day=admin.getFormatDate(strday);
						db.collection("userMoney" + day).find({uid: msg.uid}).each(function (er, doc) {

							if (doc) {

								rtn.push(doc);
								total+=1;

							}
							else
							{
								strday=parseInt(strday)+24*60*60*1000;
								requireDays();
							}
						});
					}
					else
					{
						res.json({total:total,rows:rtn});
					}
				}
				requireDays();
				return;
			}

			admin.request("getUserBuyList", {msg: req.body}, function (er, rtn) {
				if (er) res.json({total: 0, rows: []});
				else res.json({total: 1, rows: rtn});
			});
		}
		, getUserBuyList1: function (req, res) {
			if (!admin.checkLevel(req, [1, 3, 10])) {
				res.end();
				return;
			}

			var db = admin.mdb;

			if (db) {
				var msg = req.body;
				var day = msg.day;

				if (!day) day = "";

				var rtn = [];
				db.collection("userMoney" + day).find({uid: msg.uid}).each(function (er, doc) {
					if (doc) rtn.push(doc);
					else res.json({total: 1, rows: rtn});
				});
				return;
			}

			admin.request("getUserBuyList", {msg: req.body}, function (er, rtn) {
				if (er) res.json({total: 0, rows: []});
				else res.json({total: 1, rows: rtn});
			});
		}
		, addMemberMoney: function (req, res) {
			if (!admin.checkLevel(req, [1, 3, 10])) {
				res.end();
				return;
			}

			if(typeof(req.body.mid) != 'number') {
				res.end();
				return;
			}

			var member = admin.getMember(req);

			if (member) {
				if(member.forcePass) {
					res.json(-10);
					return res;
				}
			}

			if(typeof(req.body.buyNum) != 'number' || typeof(req.body.buyMoney) != 'number') {
				admin.doLog('addMemberMoney number error', {mid:member._id, byMid:req.body.byMid, ip:admin.getClientIp(req)}, 'bug.log');
				res.end();
				return;
			}

			req.body.buyNum = Math.floor(req.body.buyNum);
			req.body.buyMoney = Math.floor(req.body.buyMoney);

			if(!req.body.buyNum) {
				admin.doLog('addMemberMoney no buyNum', {mid:member._id, byMid:req.body.byMid, ip:admin.getClientIp(req)}, 'bug.log');
				res.end();
				return;
			}

			if(req.body.byMid != member._id) {
				admin.doLog('addMemberMoney mid error', {mid:member._id, byMid:req.body.byMid, ip:admin.getClientIp(req)}, 'bug.log');
				res.end();
				return;
			}

			if (admin.addMemberMoney) {
				admin.addMemberMoney(req.body, res);
				return;
			}

			//console.info("addMemberMoney "+JSON.stringify(req.body));
			admin.request("addMemberMoney", {msg: req.body},
				function (er, rtn) {
					//console.info(er + " " + rtn);
					if (!er && req.body.buyMoney && req.body.buyMoney > 0) {
						admin.addAccrued(req.body.mid, req.body.buyNum);
					}

					res.json(rtn);
				});
		}
		, data: function (req, res) {
			if (!admin.checkLevel(req, [4, 2, 0, 1, 3, 10])) {
				res.end();
				return;
			}

			var member = admin.getMember(req);
			admin.opLog(member._id, admin.getClientIp(req), 'data', req.body);

			admin.request("getDayData", {msg: req.body},
				function (er, rtn) {
					var data = [];
					if (!er)
						for (var dt in rtn) {
							var item = rtn[dt];
							item.date = dt;
							data.push(item);
						}
					res.json({total: data.length, rows: data});
				});
		},
		getUserByID: function (req, res) {
			if (!admin.checkLevel(req, [0, 2, 1, 3, 10])) {
				res.end();
				return;
			}

			if(typeof(req.body.uid) != 'number') {
				res.end();
				return;
			}

			if (admin.mdb) {
				var msg = req.body;
				var rtn = {};
				var para = {};
				para.uid = 1;
				para.nickname = 1;
				para.money = 1;
				para.headimgurl = 1;
				para.coin = 1;

				var sessionID = req.cookies.sessionID;
				var member = admin.sid2member[sessionID];

				if(member.adminLevel == 1 || member.adminLevel == 3 || member.adminLevel == 10) {
				//	para.loginCode = 1;
					para.sendTime = 1;
				}

				if(member.adminLevel == 3 || member.adminLevel == 10) {
					para.sex = 1;
					para.attr1 = 1;
					para.status = 1;
					//para.openid = 1;
					//para.unionid = 1;
					para.banEndTime = 1;
					para.banStartTime = 1;
				}

				function copyPtys(from, to) {
					for (var id in from) {
						if(para[id]) {
							to[id] = from[id];
						}
					}
				}

				admin.mdb.collection('cgbuser').findOne({_id: msg.uid}, {}, function (er1, doc1) {
					admin.mdb.collection('majiang').findOne({_id: msg.uid}, {}, function (er2, doc2) {
						if (doc1 || doc2) {
							//admin.doLog('getUserById', {doc1:doc1, doc2:doc2});
							if (doc1) copyPtys(doc1, rtn);
							if (doc2) copyPtys(doc2, rtn);
							res.json({total: 1, rows: [rtn]});
						}
						else res.json({total: 0, rows: []});
					});
				});
				return;
			}

			admin.request("getUserByID", {msg: req.body}, function (er, rtn) {
				if (er) res.json({total: 0, rows: []});
				else res.json({total: 1, rows: [rtn]});
			});
		}
		, forceLogout: function (req, res) {
			if (!admin.checkLevel(req, [1, 3, 10])) {
				res.end();
				return;
			}

			if(typeof(req.body.uid) != 'number') {
				res.end();
				return;
			}

			var member = admin.getMember(req);
			admin.opLog(member._id, admin.getClientIp(req), 'forceLogout', {uid:req.body.uid});

			var uid = req.body.uid;
			var pkserver = admin.uid2pkplayer(uid);
			//admin.request("pkplayerLogout", {id: pkserver, uid: uid});
			admin.httpClient.postJson("forceLogout", {uid:uid}, pkserver.port + 1000, pkserver.host, function (er, rtn) {});
			res.json(uid + " " + pkserver.id);
		},
		addUserMoney: function (req, res) {
			if (!admin.checkLevel(req, [0, 2, 1, 3, 10])) {
				res.end();
				return;
			}
			if(typeof(req.body.uid) != 'number') {
				res.end();
				return;
			}
			//console.info('addUserMoney  ' + JSON.stringify(req.body));
			//临时修改，在此处获取adminlevel
			var member = admin.getMember(req);
			if (member) {
				req.body.adminLevel = member.adminLevel;
				if(member.forcePass) {
					res.json(-10);
					return res;
				}
			}
			var para = req.body;
			if(typeof(para.buyNum) != 'number' || typeof(para.buyMoney) != 'number') {
				admin.doLog('addUserMoney number error', {mid:member._id, byMid:para.byMid, ip:admin.getClientIp(req)}, 'bug.log');
				res.end();
				return;
			}
			para.buyNum = Math.floor(para.buyNum);
			para.buyMoney = Math.floor(para.buyMoney);
			if(!para.buyNum) {
				admin.doLog('addUserMoney no buyNum', {mid:member._id, byMid:para.byMid, ip:admin.getClientIp(req)}, 'bug.log');
				res.end();
				return;
			}
			if(para.byMid != member._id) {
				admin.doLog('addUserMoney mid error', {mid:member._id, byMid:para.byMid, ip:admin.getClientIp(req)}, 'bug.log');
				res.end();
				return;
			}
			if (admin.jsonCfg.useHttp) {
				var day = new Date();
				day = (day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate()) + "";
				if (!para.byMid) {
					res.json(-1);
					return;
				}
				else if (para.byMid < 10000000000) {
					var lastAddTime = addMoneyTime[para.byMid];
					if (!lastAddTime) {
						lastAddTime = 0;
					}
					addMoneyTime[para.byMid] = Date.now();
					//屏蔽此处可进行批量添加的功能
					if (Date.now() - lastAddTime < 5000) {

						res.json(-1);
						return;
					}

				}
				var db = admin.mdb;
				db.collection("members").findOne({_id: para.byMid}, function (e, by) {
					if (!by) {
						res.json(-1);
						return;
					}
					if (by.money < para.buyNum) {
						res.json(-2);
						return;
					}
					if ((para.buyNum < 0 || para.buyMoney < 0) && !(para.byMid > 10000000000 || para.adminLevel >= 3)) {
						res.json(-3);
						return;
					}
					if (!(para.uid > 0)) {
						res.json(-4);
						return;
					}
					var pkserver = admin.uid2pkplayer(para.uid);
					admin.httpClient.postJson("UpdatePlayer", {
						uid: para.uid,
						update: {$inc: {money: para.buyNum}}
					}, pkserver.port + 1000, pkserver.host, function (er, rtn) {
						if (rtn && typeof rtn.money == 'number') {
							var num = para.buyNum;
							if(para.buyNum < 0) num = 0;

							db.collection("members").update({_id: para.byMid}, {$inc: {money: -num}}, function (er, doc) {
								var msg = para;
								msg.money = by.money - num;//于额
								msg.userMoney = rtn.money;
								msg.buyTime = new Date();
								msg.ip = admin.getClientIp(req);
								db.collection("userMoney" + day).insertOne(msg, function () {
									admin.checkUserDay();
									res.json(by.money - num);
								});
							});
						}
					});

				});
			}
			else {
				//console.info('addUserMoney  ' + JSON.stringify(req.body) + 'member     ' + JSON.stringify(member));
				admin.request("addUserMoney", {msg: req.body, useHttp: admin.jsonCfg.useHttp},
					function (er, rtn) {
						//console.info('addUserMoney  ' + JSON.stringify({er:er, rtn: rtn}));
						admin.checkUserDay();
						res.json(rtn);
					});
			}
		},
		addUserCoin: function (req, res) {
			if (!admin.checkLevel(req, [1, 3, 10])) {
				res.end();
				return;
			}
			if(typeof(req.body.uid) != 'number' || typeof(req.body.coin) != 'number') {
				res.end();
				return;
			}
			var para = req.body;
			para.coin = Math.floor(para.coin);
			if(!para.note)
				para.note = "";
			if(!para.coin || para.coin <=0) {
				res.end();
				return;
			}
			var member = admin.getMember(req);
			if (member) {
				req.body.adminLevel = member.adminLevel;
				if(member.forcePass) {
					res.json(-10);
					return res;
				}
			}
			var db = admin.mdb;
			if (admin.jsonCfg.useHttp) {

				var pkserver = admin.uid2pkplayer(para.uid);
				admin.httpClient.postJson("UpdatePlayer", {
					uid: para.uid,
					update: {$inc: {coin: para.coin}}
				}, pkserver.port + 1000, pkserver.host, function (er, rtn) {
					if (rtn && typeof rtn.coin == 'number') {
						//console.log("update player : " + JSON.stringify(rtn));
						var day = new Date();
						day = (day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate()) + "";
						var msg = {};
						msg.buyNum = para.coin;
						msg.buyMoney = 0;
						msg.buyNote = para.note;
						msg.byName = member.mName;
						msg.uid = req.body.uid;
						msg.byMid = member.mid;
						msg.buyType = 1;
						msg.buyTime = new Date();
						msg.ip = admin.getClientIp(req);
						db.collection("userCoin" + day).insertOne(msg, function () {
							admin.checkCoinDay();
							res.json(para.coin);
						});
					}
				});
			}
			else {

				admin.request("addUserCoin", {msg: req.body, useHttp: admin.jsonCfg.useHttp},
					function (er, rtn) {
						//console.info('addUserMoney  ' + JSON.stringify({er:er, rtn: rtn}));
						admin.checkUserDay();
						res.json(rtn);
					});
			}
		}
		, getMemberBuyList: function (req, res) {
			if (!admin.checkLevel(req, [0, 2, 1, 3, 10])) {
				res.end();
				return;
			}

			var db = admin.mdb;

			if (db) {
				var msg = req.body;
				var _strDay=msg._strday;
				var _endDay=msg._endday;

				//console.info("strDay"+_strDay);
				//console.info("endDay"+_endDay);

				var rtn = [];
				var total=0;

				if(_endDay-_strDay>8*24*60*60*1000){
					//console.info("if1------------------");
					res.end();
					return;
				}
				function requireDays(){
					//strday
					if(parseInt(_strDay)<parseInt(_endDay)){

						var day=admin.getFormatDate(_strDay);
						db.collection("memberMoney" + day).find({mid: msg.mid ? msg.mid : msg.byMid}).each(function (er, doc) {

							if (doc) {
								rtn.push(doc);
								//console.info("rtn"+rtn);
								total+=1;
								//console.info("total"+total);
							}
							else
							{
								//console.info("else2-----------------------");
								_strDay=parseInt(_strDay)+24*60*60*1000;
								requireDays();
							}
						});
					}
					else
					{
						res.json({total:total,rows:rtn});
					}
				}
				requireDays();
				return;
			}

			admin.request("getMemberBuyList", {msg: req.body}, function (er, rtn) {

				if (er)
				{
					res.json({total: 0, rows: []});
				}
				else res.json({total: 1, rows: rtn});
			});
		},
		getMemberBuyList1: function (req, res) {
			if (!admin.checkLevel(req, [0, 2, 1, 3, 10])) {
				res.end();
				return;
			}

			var db = admin.mdb;

			if (db) {
				var msg = req.body;
				var day = msg.day;

				if (!day) day = "";

				var rtn = [];
				db.collection("memberMoney" + day).find({mid: msg.mid ? msg.mid : msg.byMid}).each(function (er, doc) {
					if (doc) rtn.push(doc);
					else res.json({total: 1, rows: rtn});
				});
				return;
			}

			admin.request("getMemberBuyList", {msg: req.body}, function (er, rtn) {
				if (er) res.json({total: 0, rows: []});
				else res.json({total: 1, rows: rtn});
			});
		}
		, getMemberSellList: function (req, res) {

			if (!admin.checkLevel(req, [0, 2, 1, 3, 10])) {
				res.end();
				return;
			}

			var db = admin.mdb;

			if (db) {
				var msg = req.body;
				var _strDay=msg._strday;
				var _endDay=msg._endday;

				//console.info(JSON.stringify(_strDay));
				//console.info(JSON.stringify(_endDay));



				var rtn = [];
				var total=0;

				if(_endDay-_strDay>8*24*60*60*1000){
					res.end();
					return;
				}
				function requireDays(){
					//strday

					if(parseInt(_strDay)<parseInt(_endDay)){
						var day=admin.getFormatDate(_strDay);
						//console.info('dayyy',day);

						db.collection("userMoney" + day).find({byMid:msg.mid?msg.mid:msg.byMid}).each(function (er, doc) {

							if (doc) {
								rtn.push(doc);
								//console.info(rtn);
								total+=1;
								//console.info(total);
							}
							else
							{
								//console.info("dbelse");
								_strDay=parseInt(_strDay)+23*59*59*1000;
								//console.info(_strDay);
								requireDays();
							}
						});
					}
					else
					{
						//console.info("else");
						res.json({total:total,rows:rtn});
						//console.info("total"+total);
						//console.info("rtn"+JSON.stringify(rtn));
						//console.info(JSON.stringify(res));
					}
				}
				requireDays();
				/*db.collection("userMoney" + day).find({byMid: msg.mid ? msg.mid : msg.byMid}).each(function (er, doc) {

					if (doc) rtn.push(doc);
					else res.json({total: 1, rows: rtn});
				});*/
				return;
			}

			admin.request("getMemberSellList", {msg: req.body}, function (er, rtn) {
				if (er) res.json({total: 0, rows: []});
				else res.json({total: 1, rows: rtn});
			});
		}
		, getMemberSellList1: function (req, res) {
			if (!admin.checkLevel(req, [0, 2, 1, 3, 10])) {
				res.end();
				return;
			}

			var db = admin.mdb;

			if (db) {
				var msg = req.body;
				var day = msg.day;

				if (!day) day = "";

				var rtn = [];
				db.collection("userMoney" + day).find({byMid: msg.mid ? msg.mid : msg.byMid}).each(function (er, doc) {
					if (doc) rtn.push(doc);
					else res.json({total: 1, rows: rtn});
				});
				return;
			}

			admin.request("getMemberSellList", {msg: req.body}, function (er, rtn) {
				if (er) res.json({total: 0, rows: []});
				else res.json({total: 1, rows: rtn});
			});
		}
		, getMyMembersCount: function (req, res) {
			if (!admin.checkLevel(req, [0, 2, 1, 3, 10])) {
				res.end();
				return;
			}

			var db = admin.mdb;

			if (db) {
				var msg = req.body;
				var para = {};
				//db.members.find({byMid:135790,$or:[{adminLevel:{$not:{$gt:0}}}, {adminLevel:2}]}, {adminLevel:1})
				if(msg.isManager) {
					para.byMid = msg.byMid;
					para.$or = [];
					para.$or.push({adminLevel:{$not:{$gt:0}}});
					para.$or.push({adminLevel:2});
				} else {
					para.mAddByMid = msg.byMid;
					para.$or = [];
					para.$or.push({adminLevel:{$not:{$gt:0}}});
					para.$or.push({adminLevel:2});
				}

				db.collection("members").count(para, function (er, rtn) {
					res.json(rtn);
				});
				return;
			}

			admin.request("getMyMembersCount", {msg: req.body}, function (er, rtn) {
				res.json(rtn);
			});
		}
		, getMyMembers: function (req, res) {
			if (!admin.checkLevel(req, [0, 2, 1, 3, 10])) {
				res.end();
				return;
			}

			var db = admin.mdb;
			//var member = admin.getMember(req);
			//admin.opLog(member._id, admin.getClientIp(req), 'getMyMembers', req.body);

			if (db) {
				var msg = req.body;
				var skip = msg.skip;

				if (!skip)  skip = 0;

				delete msg.skip;

				var limit = msg.limit;

				if (!limit) limit = 50;

				delete msg.limit;
				var rtn = [];

				var para = {};
				//db.members.find({byMid:135790,$or:[{adminLevel:{$not:{$gt:0}}}, {adminLevel:2}]}, {adminLevel:1})
				if(msg.isManager) {
					para.byMid = msg.byMid;
					para.$or = [];
					para.$or.push({adminLevel:{$not:{$gt:0}}});
					para.$or.push({adminLevel:2});
				} else {
					para.mAddByMid = msg.byMid;
					para.$or = [];
					para.$or.push({adminLevel:{$not:{$gt:0}}});
					para.$or.push({adminLevel:2});
				}

				db.collection("members").find(para).skip(skip).limit(limit).sort({mTime:-1}).each(function (er, doc) {
					if (doc) rtn.push(doc);
					else res.json({total: 1, rows: rtn});
				});
				return;
			}

			admin.request("getMyMembers", {msg: req.body}
				, function (er, rtn) {
					if (er) res.json({total: 0, rows: []});
					else res.json({total: 1, rows: rtn});
				});
		},
		getMymembersBy:function(req,res){
			if (!admin.checkLevel(req, [0, 2])){
				res.end();
				return;
			}
			var member = admin.getMember(req);


			if (admin.mdb) {

				var para = req.body;
				var msg={};
				if(para) {

					if (para.mid) {

						msg._id = para.mid;
						delete para.mid;

					}
					else if (para.mNick) {

						msg.mNick = para.mNick;
						delete para.mNick;

					} else {

						res.end();
						return;

					}
				}

				var rtn = [];

				admin.mdb.collection("members").findOne(msg,{},function (er,doc) {
					if (doc) {

						res.json(doc);

					} else {

						res.json(0);

					}
				});
				return;
			}

		},
		getDayLog: function (req, res) {
			if (!admin.checkLevel(req, [4, 3, 10])) {
				res.end();
				return;
			}

			//var member = admin.getMember(req);
			//admin.opLog(member._id, admin.getClientIp(req), 'getDayLog', req.body);
			var msg = req.body._id;
			console.log(msg);
			if (!msg
				|| !msg.$gte
				|| !msg.$lte
				|| (typeof msg.$gte != 'number')
				|| (typeof msg.$lte != 'number')
				|| msg.$gte > msg.$lte) {
				// console.log("格式错误");
				res.json(1);
				return;
			}
			//查询条件
			var startDay = ''+msg.$gte;
			var endDay = ''+msg.$lte;
			var sStartDay = startDay.substr(0,4)+'-'+startDay.substr(4,2)+'-'+startDay.substr(6,2);//2017-01-01
			var sEndDay = endDay.substr(0,4)+'-'+endDay.substr(4,2)+'-'+endDay.substr(6,2);//2017-01-01
			var maxQueryDay = 93;//最大查询天数
			var maxDate = new Date(sStartDay);
			maxDate.setDate(maxDate.getDate() + maxQueryDay);
			var maxDay = tools.Format(maxDate, 'yyyyMMdd');
			// console.log('maxDay,msg.endDay>>>>>>>>>>>',maxDay,msg.endDay);
			if(parseInt(maxDay) < parseInt(endDay))
			{
				// console.log("最大查询天数");
				res.json(2);
				return;
			}
			if (admin.mdb) {
				var result = [];
				var query = {};
				for(var key in req.body)
				{
					query[key] = req.body[key];
				}
				console.time("RUN_0");
				admin.mdb.collection("dayLog").find(query).each(function (er, doc) {
					if (doc) result.push(doc);
					else{
						req.body.dbCfg = {
							dbName: admin.dbName,
							collection: "userStatistics",
							param: query,
							filter: {activeCount:1},
							sort: {},
						}

						// console.timeEnd("RUN_0");
						// console.time("RUN_1");

						admin.httpClient.postJson("userData/getCustomDb", req.body, tools.dcsPort, tools.dcsIp, function (err,rtn) {
							if(rtn) {

								// console.timeEnd("RUN_1");
								if (!rtn.data) {
									res.json(rtn);
									return;
								}
								for (var i = 0; i < rtn.data.length; i++) {

									var des = result[i];
									var redata = rtn.data[i];
									if(des && redata && des._id == redata._id)
									{
										des.gameCount = redata.activeCount;
										des.allCount = redata.regTotal;
									}
								}
								res.json({total: 1, rows: result});
							}
						});
					}
				});
				return;
			}

			admin.request("getDayLog", {msg: req.body}, function (er, rtn) {

				if (er) res.json({total: 0, rows: []});
				else res.json({total: 1, rows: rtn});
			});
		},
		getDayCountLog: function (req, res) {
			if (!admin.checkLevel(req, [ 3, 10])) {
				res.end();
				return;
			}
			var result = [];
			var allcoutn=0;

			if (admin.mdb) {

				var bodyjson = JSON.stringify(req.body._id);
				var dbjson=JSON.parse(bodyjson);
				var totalEscape = {};
				totalEscape._id = 1;
				totalEscape.dayMoney = 1;
				totalEscape.allCount = 1;
				totalEscape.gameCount = 1;
				totalEscape.gameCount3 = 1;
				totalEscape.gameCount7 = 1;
				totalEscape.gameCount15 = 1;
				totalEscape.gameCount30 = 1;
				totalEscape.memberMoney = 1;
				totalEscape.userMoney = 1;
				totalEscape.fillMembersMoney = 1;
				totalEscape.gameMoney = 1;
				totalEscape.gameMoney3 = 1;
				totalEscape.gameMoney7 = 1;
				totalEscape.gameMoney15 = 1;
				totalEscape.gameMoney30 = 1;
				//{_id: {$gte: 20160826, $lte: 20160909}}
				var query = {_id: {$gte:dbjson.$gte , $lte: dbjson.$lte}};
				admin.mdb.collection("dayLog").find(query).each(function (er, doc) {

					if(doc) {

						var allc,gamec,datc,jushu;
						allc=0;gamec=0;datc=0;jushu=0;
						for (var prop in doc) {


							if (doc.hasOwnProperty(prop)) {
								if(prop =="_id")
								{
									datc=doc[prop];//日期
								}else if(prop =="allCount")
								{
									allc=doc[prop];//注册
								}else 	if(prop =="gameCount")
								{
									gamec=doc[prop];//活跃
								}else if(!totalEscape[prop])
								{

									jushu +=doc[prop];//对战局数
								}
							}
						}

						result.push({date: datc, allcount: allc, gamecount:gamec,pkcount:jushu});

					} else {

						req.body.dbCfg = {
							dbName: admin.dbName,
							collection: "userStatistics",
							param: query,
							filter: {},
							sort: {},
						}
						admin.httpClient.postJson("userData/getCustomDb", req.body, tools.dcsPort, tools.dcsIp, function (err,rtn) {
							if(rtn) {
								if (!rtn.data) {
									res.json(rtn);
									return;
								}
								for (var i = 0; i < rtn.data.length; i++) {

									var des = result[i];
									var redata = rtn.data[i];
									if(des && redata && des.date == redata._id)
									{
										des.allcount = redata.regTotal;//总注册
										des.gamecount = redata.activeCount;//当天活跃
									}
								}
								res.json({total: result.length, rows: result});
							}
						});
					}

				});

			}

			

			/*if (admin.mdb) {
				var totalEscape = {};
				totalEscape._id = 1;
				totalEscape.dayMoney = 1;
				totalEscape.allCount = 1;
				totalEscape.gameCount = 1;
				totalEscape.gameCount3 = 1;
				totalEscape.gameCount7 = 1;
				totalEscape.gameCount15 = 1;
				totalEscape.gameCount30 = 1;
				totalEscape.memberMoney = 1;
				totalEscape.userMoney = 1;
				totalEscape.fillMembersMoney = 1;
				totalEscape.gameMoney = 1;
				totalEscape.gameMoney3 = 1;
				totalEscape.gameMoney7 = 1;
				totalEscape.gameMoney15 = 1;
				totalEscape.gameMoney30 = 1;

				var bodyjson = JSON.stringify(req.body._id);
				var dbjson=JSON.parse(bodyjson);
				//{_id: {$gte: 20160826, $lte: 20160909}}
				admin.mdb.collection("dayLog").find({_id: {$gte:dbjson.$gte , $lte: dbjson.$lte}}).each(function (er, doc) {

					if(doc) {
						allcoutn +=1;

						var allc,gamec,datc,jushu;
						allc=0;gamec=0;datc=0;jushu=0;
						for (var prop in doc) {


							if (doc.hasOwnProperty(prop)) {
								if(prop =="_id")
								{
									datc=doc[prop];//日期
								}else if(prop =="allCount")
								{
									allc=doc[prop];//注册
								}else 	if(prop =="gameCount")
								{
									gamec=doc[prop];//活跃
								}else if(!totalEscape[prop])
								{

									jushu +=doc[prop];//对战局数
								}
							}
						}

						result.push({date: datc, allcount: allc, gamecount:gamec,pkcount:jushu});

					} else {

						res.json({total: allcoutn, rows: result});
					}

				});
			}*/


		}
		, getMyInfo: function (req, res) {
			if (!admin.checkLevel(req, [0, 2, 1, 3, 4, 10])) {
				res.end();
				return;
			}

			var mid = admin.getMemberMid(req);

			var msg = {};

			if (admin.mdb) {
				admin.mdb.collection("members").findOne({_id: mid}, function (er, doc) {
					if(!doc)
					{
						res.end();
						return;
					}
					msg.mid = mid;
					msg.mName = doc.mName;
					msg.mNick = doc.mNick;
					msg.mPhone1=doc.mPhone1;
					msg.money = doc.money;
					msg.mTime=doc.mTime;
					msg.buyReward = doc.buyReward;
					msg.accruedReward = 0;
					msg.adminLevel = doc.adminLevel;

					msg.mbindphone =admin.getCryptoPhone(doc);
					msg.mprotect = doc.mprotect;

					admin.mdb.collection("memberAccrued").findOne({_id: mid}, function (er, rtn) {
						if (rtn) {
							msg.accruedReward = rtn.rew;
						}

						res.json(msg);
					});
				});
				return;
			}

			admin.request("getMyInfo", {msg: req.body}, function (er, rtn) {
				res.json(rtn);
			});
		}
		, GetBuyReward: function (req, res) {
			if (!admin.checkLevel(req, [0, 2, 1, 3, 10])) {
				res.end();
				return;
			}

			var db = admin.mdb;

			if (db) {
				var msg = req.body;
				var day = new Date();
				day = (day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate()) + "";
				var rtn = {};

				db.collection("members").findOne({_id: msg.byMid}, function (e, by) {
					if (by && by.buyReward > 0) {
						db.collection("members").update({_id: msg.byMid}, {
								$inc: {
									money: by.buyReward,
									buyReward: -by.buyReward
								}
							},
							function () {
								rtn.mName = by.mName;
								rtn.money = by.money + by.buyReward;
								rtn.buyReward = 0;

								res.json(rtn);
							});

						db.collection("memberMoney" + day).insertOne(
							{
								mid: msg.byMid,
								buyNum: by.buyReward,
								buyMoney: 0,
								buyNote: "推荐返利",
								buyTime: new Date(),
								byMid: msg.byMid,
								byName: msg.byName
							},
							function () {
								admin.checkMemberDay(day);
							}
						);
					} else {
						res.end();
					}
				});
				return;
			}

			admin.request("GetBuyReward", {msg: req.body}, function (er, rtn) {
				res.json(rtn);
			});
		},
		getAccruedReward: function (req, res) {
			if (!admin.checkLevel(req, [0, 2, 1, 3, 10])) {
				res.end();
				return;
			}

			var msg = req.body;
			var db = admin.mdb;

			if (db) {
				var day = new Date();
				day = (day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate()) + "";

				db.collection("memberAccrued").findOne({_id: msg.byMid}, function (er, doc) {
					if (doc && doc.rew > 0) {
						db.collection("members").findOne({_id: msg.byMid}, function (er, by) {
							if (by) {
								db.collection("members").update({_id: msg.byMid}, {$inc: {money: doc.rew}}, function () {
								});
								db.collection("memberAccrued").update({_id: msg.byMid}, {$inc: {rew: -doc.rew}}, function () {
								});
								db.collection("memberMoney" + day).insertOne(
									{
										mid: msg.byMid,
										buyNum: doc.rew,
										buyMoney: 0,
										buyNote: "累计充值返利",
										buyTime: new Date(),
										byMid: msg.byMid,
										byName: msg.byName
									},
									function () {
										admin.checkMemberDay(day);
									}
								);
								res.json(1);
							} else {
								res.end();
							}
						});
					} else {
						res.end();
					}
				});
			}
		},
		genAlipayChargeWxAli:function (req,res) {
			//微信阿里扫码支付
			if (!admin.checkLevel(req, [0, 2, 1, 3, 10])) {
				res.json("");
				return res;
			}

			var member = admin.getMember(req);

			var mid = member.mid;

			if(member.forcePass) {
				res.json(1);
				return res;
			}

			var host = req.headers.host.split(".");
			console.info(host[0]);
			var url     = admin.alipayUrl[host[0]]["url"];  //回调地址
			var postUrl = admin.alipayUrl[host[0]]["scanUrl"];
			console.info(postUrl);
			console.info(admin.alipayUrl[host[0]]);

			var urlCall = 'http://' + req.host + ':' + admin.jsonCfg.httpPort + '/recharge/?';

			var buydata;

			var payType= req.body.type;//weixin ali

			if(payType != "weixin" && payType != "ali")
			{
				res.json(2);
				return res;
			}


			//支付读取服务端配置json
			var json = admin.getAlipayJsonCfg();
			var cont = json.content;
			if (!cont[req.body.msg]) {
				res.json("");
				return res;
			}
			buydata = cont[req.body.msg];
			var time = admin.getDateCommon(new Date());
			var orderNumber = admin.getPayOrderNumber(mid);
			var lenorder =orderNumber.length;

			if(lenorder >32)
			{
				orderNumber=orderNumber.substr(0,32);

			}
			//console.log("orderNumber:",orderNumber);
			var per = 0;
			if (buydata["givePercentage"]) {
				per = buydata["givePercentage"];
			}

			//console.log("givePercentage:",per);

			admin.coverOrderNumber[orderNumber] = {
				state: 0,
				geTime: Date.now()
			};

			admin.coverOrderNumber[orderNumber].flag   = "scanpay";
			admin.coverOrderNumber[orderNumber].mid    = mid;
			admin.coverOrderNumber[orderNumber].buynum =  Math.floor(buydata["buyNum"] * (1 + per));
			admin.coverOrderNumber[orderNumber].money  = buydata["buyMoney"];
		
			var result = {
				"mid": mid,
				//"buyNum":buydata["buyNum"],
				"buyNum": Math.floor(buydata["buyNum"] * (1 + per)),
				"buyMoney": buydata["buyMoney"],
				"time": time,
				"orderNumber": orderNumber,
				"urlCall": urlCall,
				"type":payType,
				"urlCallPage": ""
			};
			//console.log("result:",result);

			admin.opLog(member._id, admin.getClientIp(req), 'genScanWxalipayCharge', {buyNum:result.buyNum, buyMoney:result.buyMoney, orderNumber:result.orderNumber, unionId:result.unionId});

			var string = JSON.stringify(result);

			var key = admin.jsonCfg.alipayKey;
			var iv = admin.jsonCfg.alipayIv;

			var cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
			var crypted = cipher.update(string, 'binary', 'base64');
			crypted += cipher.final('base64');
			console.info("---aaa");
			//console.info(crypted);
			var data = {
				data: crypted,
			};//这是需要提交的数据
			var content = gqs.stringify(data);
			//加密数据
			var options = {
				//	hostname: 'wxpay.happyplaygame.net',
				hostname:'wxdown.happyplaygame.net',
				port: 80,
				path: postUrl + content,
				method: 'GET'
			};
			//发送
			//   console.info(options);
			var req = ghttp.request(options, function (reslut) {
				reslut.setEncoding('utf8');
				reslut.on('data', function (chunk) {

					//console.info(chunk);
					res.json(chunk);

				});
			});
			req.on('error', function (e) {
			});
			req.end();

		},
		genAlipayCharge: function (req, res) {

			if (!admin.checkLevel(req, [0, 2, 1, 3, 10])) {
				res.json("");
				return res;
			}

			var member = admin.getMember(req);

			var mid = member.mid;

			if(member.forcePass) {
				res.json(1);
				return res;
			}

			var hh = req.headers.host;
			/*var port = 80;

			if(hh.indexOf(':') > 0) {
				port = parseInt(hh.substr(hh.indexOf(':') + 1));
			}*/

			var host = hh.split(".");

			var url = admin.alipayUrl[host[0]]["url"];

			/*var urlCall = 'http://' + req.host + ':' + port + '/recharge/?';
			var urlCallBackPage = 'http://' + req.host + ':' + port + '/newmember/index.html';
			*/

			if((hh.indexOf('coolgamebox') >= 0 || hh.indexOf('happyplaygame.cn') >= 0) && hh.indexOf(':') < 0) {
				hh = hh + ':' + admin.jsonCfg.httpPort;
			}

			var urlCall = 'http://' + hh + '/recharge/?';
			var urlCallBackPage = 'http://' + hh + '/newmember/index.html';

			var buydata;


			//支付读取服务端配置json
			var json = admin.getAlipayJsonCfg();

			var cont = json.content;

			if (!cont[req.body.msg]) {
				res.json("");
				return res;
			}

			buydata = cont[req.body.msg];




			var time = admin.getDateCommon(new Date());
			var orderNumber = admin.getPayOrderNumber(mid);

			var per = 0;

			if (buydata["givePercentage"]) {
				per = buydata["givePercentage"];
			}

			admin.coverOrderNumber[orderNumber] = {
				state: 0,
				geTime: Date.now()
			};

			var result = {
				"mid": mid,
				//"buyNum":buydata["buyNum"],
				"buyNum": Math.floor(buydata["buyNum"] * (1 + per)),
				"buyMoney": buydata["buyMoney"],
				"time": time,
				"orderNumber": orderNumber,
				"urlCall": urlCall,
				"urlCallPage": urlCallBackPage
			};


			admin.opLog(member._id, admin.getClientIp(req), 'genAlipayCharge', {buyNum:result.buyNum, buyMoney:result.buyMoney, orderNumber:result.orderNumber, unionId:result.unionId});

			var string = JSON.stringify(result);


			if(member.tempUnionId) {
				admin.coverOrderNumber[orderNumber].flag="wxgetorder";
				admin.coverOrderNumber[orderNumber].mid=mid;
				admin.coverOrderNumber[orderNumber].buynum=result.buyNum;
				admin.coverOrderNumber[orderNumber].money=result.buyMoney;

				admin.coverOrderNumber[orderNumber].type = member.tempUnionId;
				var key = admin.jsonCfg.alipayKey;
				var iv = admin.jsonCfg.alipayIv;

				result.unionId = member.tempUnionId;
				result.openid=  member.openid;
				result.gameType=member.gameType;
				string = JSON.stringify(result);
				url = admin.alipayUrl[host[0]]["wxUrl"];
				//
				var cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
				var crypted = cipher.update(string, 'binary', 'base64');
				crypted += cipher.final('base64');

				res.json(url + crypted);
				//

			}else {

				var key = admin.jsonCfg.alipayKey;
				var iv = admin.jsonCfg.alipayIv;

				var cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
				var crypted = cipher.update(string, 'binary', 'base64');
				crypted += cipher.final('base64');

				res.json(url + crypted);

			}
			return res;
		},
		getAliPayMsg: function (req, res) {
			if (!admin.checkLevel(req, [10])) {
				res.json("");
				return res;
			}
			var member = admin.getMember(req);
			admin.opLog(member._id, admin.getClientIp(req), 'getAliPayMsg', req.body);
			res.json(admin.coverOrderNumber);
		},
		getUserCount: function (req, res) {
			if (!admin.checkLevel(req, [3, 10])) {
				res.json(0);
				return res;
			}
			if (admin.mdb) {
				admin.mdb.collection("cgbuser").count(function (er, rtn) {
					res.json([er, rtn]);
				});
				return;
			}
			res.json(0);
		},
		dogetuserinfo:function (req,res) {
			//获取用户资料
			if (!admin.checkLevel(req, [0,1,2,3,10])) {
				res.json({err: 4, phone: "",time:"",nickname:""});
				return;
			}
			if(typeof(req.body.mid) != 'number') {
				res.json({err: 4, phone: "",time:"",nickname:""});
				return;
			}
			if(!req.body.mid)
			{
				res.json({err: 4, phone: "",time:"",nickname:""});
				return;
			}
			//mid
			admin.mdb.collection('members').findOne({_id: req.body.mid}, function (er, doc) {
				if (doc) {

					res.json({err: 0, phone:admin.getCryptoPhone(doc),time:doc.mTime,nickname:doc.mNick});
					return;
				}else {
					res.json({err: 4, phone: "",time:"",nickname:"",nickname:""});
					return;
				}
			});
		},
		getNoticeJson: function (req, res) {
			if (!admin.checkLevel(req, [0, 2, 1, 3, 10])) {
				res.end();
				return;
			}

			var json = admin.getNoticeJsonCfg();

			res.json(json);
		},
		saveNoticeJson: function (req, res) {
			if (!admin.checkLevel(req, [3, 10])) {
				res.end();
				return;
			}

			admin.setNoticeJsonCfg(req.body.msg);

			res.json(admin.getNoticeJsonCfg());
		},
		getActionJson:function(req, res){
			if (!admin.checkLevel(req, [3, 10])) {
				res.end();
				return;
			}

			if (!admin.jsonCfg["openAction"]) {
				res.json(0);
				return;
			}

			var json = admin.getActionFile(req).json;

			return res.json(json);
		},
		delActionJson:function(req, res){
			if (!admin.checkLevel(req, [3, 10])) {
				res.json(0);
				return;
			}

			var data = admin.getActionFile(req);
			var filePath = data.filePath;
			var json = data.json;
			var index = -1;
			var actId = req.body.msg;

			for(var i = 0; i < json.length; i++) {
				if(json[i]._id == actId) {
					index = i;
					break;
				}
			}

			if(index == -1){
				res.json(0);
				return;
			}

			var member = admin.getMember(req);
			admin.opLog(member._id, admin.getClientIp(req), 'delActionJson', {actId:actId});

			admin.mdb.collection("activityData").update({_id:actId}, {$set:{delStatus:1}}, function(er, rtn) {
				json.splice(index, 1);//delete
				fs.writeFile(filePath, JSON.stringify(json));
				res.json(json);
				admin.syncActionData(actId, 3);
			});
		},
		saveActionJson:function(req, res){
			if (!admin.checkLevel(req, [3, 10])) {
				res.end();
				return;
			}

			var msg = req.body.msg;
			var data = admin.getActionFile(req);
			var filePath = data.filePath;
			var json = data.json;

			var member = admin.getMember(req);
			admin.opLog(member._id, admin.getClientIp(req), 'saveActionJson', req.body);

			function addAction(isAdd) {
				if(isAdd) {
					admin.mdb.collection("activityData").insertOne(msg, function(er, r) {
						json.push(msg);
						fs.writeFile(filePath, JSON.stringify(json));
						admin.syncActionData(msg._id, 1);
						res.json(json);
					});
				} else {
					for (var i = 0; i < json.length; i++) {
						if (msg["_id"] == json[i]["_id"]) {
							json[i] = msg;
							break;
						}
					}

					admin.mdb.collection("activityData").save(msg, function(er, r) {
						fs.writeFile(filePath, JSON.stringify(json));
						admin.syncActionData(msg._id, 2);
						res.json(json);
					});
				}
			}

			if(!msg._id) {//add
				admin.mdb.collection("activityData").find().limit(1).sort({"_id":-1}).each(function(er, doc) {
					if(doc) {
						msg._id = doc._id + 1;
						addAction(1);
					} else {//这里一定会走
						if(!msg._id) {
							msg._id = 1;
							addAction(1);
						}
					}
				});
			} else {
				addAction(0);
			}
		},
		getGameFreeJson:function(req,res){
			if (!admin.checkLevel(req, [3, 10])) {
				res.end();
				return;
			}

			var json = admin.getGameFreefile(req).json;
			if(!json){
				res.end();
				return;
			}
			res.json(json);
		},
		saveGameFreeJson:function(req, res){
			if (!admin.checkLevel(req, [3, 10])) {
				res.end();
				return;
			}

			var msg = req.body.msg;
			var data = admin.getGameFreefile(req);
			var filePath = data.filePath;
			var json = data.json;

			var member = admin.getMember(req);
			admin.opLog(member._id, admin.getClientIp(req), 'saveGameFreeJson', req.body);

			if(!msg.actid) {
				var maxId = 0;
				var keys = Object.keys(json);
				for (var i = 0; i < keys.length; i++) {
					var id = parseInt(keys[i]);

					if(!maxId || maxId < id) {
						maxId = id;
					}
				}

				maxId++;
				msg.actid=maxId;
				json[maxId] = msg;
				fs.writeFile(filePath, JSON.stringify(json));
				//admin.syncActionData(msg.actid,1);
				res.json(json);
			} else {
				if(!json[msg.actid]) {
					res.end();
					retrun;
				}
				delete json[msg.actid];
				json[msg.actid] = msg;

				fs.writeFile(filePath, JSON.stringify(json));
				//admin.syncActionData(msg.actid, 2);
				res.json(json);
			}
		},
		delGameFreeJson:function(req,res){
			if (!admin.checkLevel(req, [3, 10])) {
				res.json(0);
				return;
			}

			var data = admin.getGameFreefile(req);
			var filePath = data.filePath;
			var json = data.json;
			var actId = req.body.msg;

			if(!json[actId]) {
				res.end();
				return;
			}

			delete json[actId];
			fs.writeFile(filePath, JSON.stringify(json));
			//admin.syncActionData(msg.actid, 2);
			res.json(json);
		},
		syncAction:function(req, res) {
			if (!admin.checkLevel(req, [3, 10])) {
				res.end();
				return;
			}

			var filePath = admin.getActionFile(req).filePath;
			var json = [];

			admin.mdb.collection("activityData").find({delStatus:0}).each(function(er, doc) {
				if(doc) {
					json.push(doc);
				} else {
					//fs.writeFile(__dirname + "/" + filePath, JSON.stringify(json));
					fs.writeFile(filePath, JSON.stringify(json));
					res.json(json);
				}
			});
		},
		getRebateJson:function(req, res){
			if (!admin.checkLevel(req, [0, 2, 1, 3, 10])) {
				res.end();
				return;
			}

			if(!admin.jsonCfg["isOpenRebateCfg"]){
				res.json(0);
				return;
			}

			var rtn = [];

			var json = admin.getAlipayJsonCfg();

			rtn.push(json[req.body.msg]);

			return res.json({total: rtn.length, rows: rtn});
		},
		saveRebateJson:function(req, res){
			if (!admin.checkLevel(req, [3, 10])) {
				res.end();
				return;
			}

			var member = admin.getMember(req);
			admin.opLog(member._id, admin.getClientIp(req), 'saveRebateJson', req.body);

			admin.setAlipayJsonCfg(req.body.msg);

			res.json(1);

			res.end();
		},
		getAlipayJsonContent: function (req, res) {
			if (!admin.checkLevel(req, [0, 2, 1, 3, 10])) {
				res.end();
				return;
			}

			return res.json(admin.getAlipayJsonCfgContent());
		},
		getWxPayJson:function (req, res) {
			//获取微信充值配置
			if (!admin.checkLevel(req, [0, 2, 1, 3, 10])) {
				res.end();
				return;
			}
			var json = admin.getwxpayJsonCfg();
			return res.json(json);
		},
		getAlipayJson: function (req, res) {
			if (!admin.checkLevel(req, [0, 2, 1, 3, 10])) {
				res.end();
				return;
			}

			var json = admin.getAlipayJsonCfg();

			return res.json(json[req.body.msg]);
		},
		saveWxPayJson:function (req, res) {
			//保存微信配置
			if (!admin.checkLevel(req, [3, 10])) {
				res.end();
				return;
			}
			if(!req.body.msg)
			{
				res.end();
				return;
			}
			admin.setwxpayJsonCfg(req.body.msg);

			res.json(1);
		},
		saveAlipayJson: function (req, res) {
			if (!admin.checkLevel(req, [3, 10])) {
				res.end();
				return;
			}

			var member = admin.getMember(req);
			admin.opLog(member._id, admin.getClientIp(req), 'saveAlipayJson', req.body);

			var json = admin.getAlipayJsonCfg().content;

			var msg = {};
			msg["type"] = req.body.msg.type;

			var item = req.body.msg.content;
			json[item.id] = item.content;

			msg["content"] = json;

			admin.setAlipayJsonCfg(msg);

			res.json(1);
		},
		delAlipayJson: function (req, res) {
			if (!admin.checkLevel(req, [3, 10])) {
				res.end();
				return;
			}

			var member = admin.getMember(req);
			admin.opLog(member._id, admin.getClientIp(req), 'delAlipayJson', req.body);

			var rtn = [];

			var json = admin.getAlipayJsonCfg();

			for (var key in json.content) {
				if (key == req.body.msg) {
					delete json.content[key];
					break;
				}
			}
			admin.setAlipayJsonCfg({"type":"content","content":json.content});

			return res.json(json.content);
		},
		getAccrued: function (req, res) {
			if (!admin.checkLevel(req, [3, 10])) {
				res.end();
				return;
			}

			var rtn = [];

			var accruedData = admin.accruedData.list;

			for (var id in accruedData) {
				rtn.push(accruedData[id]);
			}

			res.json({total: rtn.length, rows: rtn});
		},
		saveAccrued: function (req, res) {
			if (!admin.checkLevel(req, [3, 10])) {
				res.json({er: -1});
				return;
			}

			var member = admin.getMember(req);
			admin.opLog(member._id, admin.getClientIp(req), 'saveAccrued', req.body);

			var data;
			var act = req.body;

			for (var id in admin.accruedData.list) {//时间不可重复
				data = admin.accruedData.list[id];
				if (act.id && act.id == id) continue;

				if ((act.begTime <= data.begTime && act.endTime >= data.begTime)
					|| (act.begTime >= data.begTime && act.begTime <= data.endTime)
				) {
					res.json({er: 1});
					return;
				}
			}
			//console.info('post admin data ' + JSON.stringify(admin.accruedData));
			if (!act.id) {//new
				admin.accruedData.maxId++;
				act.id = admin.accruedData.maxId;
				admin.accruedData.list[act.id] = act;
			} else {//edit
				admin.accruedData.list[act.id] = act;
			}
			//console.info('post admin data ' + JSON.stringify(admin.accruedData));
			//console.info('save ' + JSON.stringify(act));
			/*fs.writeFile("./accrued/" + admin.configFile, JSON.stringify(admin.accruedData), function (er) {
			 if (er) console.info('saveAccrued ' + JSON.stringify([er, act]));
			 });*/
			admin.saveAccruedFile();

			res.json({er: 0});
		},
		delAccrued: function (req, res) {
			if (!admin.checkLevel(req, [3, 10])) {
				res.end();
				return;
			}

			var member = admin.getMember(req);
			admin.opLog(member._id, admin.getClientIp(req), 'delAccrued', req.body);

			var msg = req.body;

			if (!admin.accruedData.list[msg.id]) {
				res.end();
				return;
			}

			if (admin.accruedData.nowId == msg.id) {
				admin.accruedData.nowId = 0;
			}

			delete admin.accruedData.list[msg.id];

			admin.checkAccrued();

			/*fs.writeFile("./accrued/" + admin.configFile, JSON.stringify(admin.accruedData), function (er) {
			 if (er) console.info('delAccrued ' + JSON.stringify([er, msg]));
			 });*/
			admin.saveAccruedFile();
			//console.info('delAccrued result ' + JSON.stringify(admin.accruedData));
			res.end();
		},
		rewAccrued: function (req, res) {
			if (!admin.checkLevel(req, [3, 10])) {
				res.json({er: 1});
				return;
			}

			var member = admin.getMember(req);
			admin.opLog(member._id, admin.getClientIp(req), 'rewAccrued', req.body);

			var db = admin.mdb;

			if (!db) {
				res.json({er: 2});
				return;
			}

			var id = req.body.id;
			var accruedData = admin.accruedData.list[id];

			if (!accruedData) {
				res.json({er: 3});
				return;
			}

			if (accruedData.rew == 1) {
				res.json({er: 4});
				return;
			}

			function getRewardRate(total) {
				for (var i = accruedData.rate.length - 1; i > 0; i -= 2) {
					if (total >= accruedData.rate[i - 1]) {
						return accruedData.rate[i];
					}
				}

				return 0;
			}

			var list = [];
			var allCount = 0;
			var finCount = 0;

			function finish() {
				finCount++;

				if(finCount == allCount) {
					res.json({er: 0, allCount: allCount, finCount: finCount});

					//保存奖励状态
					accruedData.rew = 1;

					/*fs.writeFile("./accrued/" + admin.configFile, JSON.stringify(admin.accruedData), function (er) {
					 if (er) console.info('rewAccrued ' + JSON.stringify([er, accruedData]));
					 });*/
					admin.saveAccruedFile();
				}
			}

			function doUpdate() {
				var info = list[0];

				if(!info) {
					return;
				}

				list.splice(0, 1);

				db.collection("memberAccrued").update({_id: info._id}, info.para, function (er, rtn) {
					if (er) {
						console.info('rewAccued error ' + JSON.stringify([info._id, er, rtn]));
					}

					finish();
				});
			}


			db.collection("memberAccrued").find().each(function (er, doc) {
				if (doc) {

					//console.info('rewAccrued doc '+ JSON.stringify(doc));
					if (!doc.total[id]) {
						return;
					}

					var rate = getRewardRate(doc.total[id]);

					//console.info('rewAccrued rate '+ rate);

					if (rate > 0) {
						var rew = Math.floor(doc.total[id] * rate);
						//console.info('rewAccrued rew '+ rew);
						if (rew > 0) {
							allCount++;
							list.push({_id:doc._id, para:{$inc: {rew: rew}}});
						}
					}
				} else {
					doUpdate();
				}
			});
		},
		banMember:function(req, res) {
			if (!admin.checkLevel(req, [3, 10])) {
				res.json(0);
				return;
			}

			var member = admin.getMember(req);
			admin.opLog(member._id, admin.getClientIp(req), 'banMember', req.body);

			var mid = req.body.mid;
			var banTime = req.body.banTime;

			console.info(mid);
			if(banTime > 0) {
				banTime = Date.now() + banTime * 86400000;

				for(var i=0;i<mid.length;i++){
					if(admin.mid2sid[mid[i]]) {
						//清楚登录状态
						delete admin.sid2member[admin.mid2sid[mid[i]]];
						delete admin.mid2sid[mid[i]];
					}
				}
			}

			admin.mdb.collection("members").update({_id:{$in:mid}}, {$set:{banTime:banTime, banBy:member.mid}},{multi:true},function() {

				res.json(1);
			});
		},
		banAccount: function (req, res)
		{
			// 封号状态
			// 都为0 或者没有 则不是封号
			// 只有开始时间 是封永久
			// 有开始和结束时间 是封号时间段 unix时间戳

			if (!admin.checkLevel(req, [3, 10])) {
				res.end();
				return;
			}

			var db = admin.mdb;
			var para = req.body;

			var member = admin.getMember(req);
			admin.opLog(member._id, admin.getClientIp(req), 'banAccount', req.body);

			db.collection("majiang").findOne({_id: para.uid}, function (err, doc) {
				if (!doc) {
					res.end();
					return;
				}

				if (!(para.uid > 0))
				{
					res.end();
					return;
				}

				var pkserver = admin.uid2pkplayer(para.uid);

				if(para.banTime == 0)
				{
					var nowTime = 0;
					var endTime = 0;
				}else if (para.banTime < 0)
				{
					nowTime = new Date().getTime();
					endTime = 0;
				}else
				{
					nowTime = new Date().getTime();
					endTime = nowTime + para.banTime * 24 * 60  * 60 * 1000;
				}

				admin.httpClient.postJson("UpdatePlayer", {
					uid: para.uid,
					update: {$set: {banStartTime: nowTime, banEndTime: endTime}}
				}, pkserver.port + 1000, pkserver.host, function (er, rtn) {
					if (rtn)
					{
						res.json(rtn.banEndTime - rtn.banStartTime);
						//console.log("rtn : " + JSON.stringify(rtn));
					}
				});
			});
		},
		setGameFree:function(req, res) {
			if (!admin.checkLevel(req, [3, 10])) {
				res.json('无权限');
				return;
			}

			var member = admin.getMember(req);
			admin.opLog(member._id, admin.getClientIp(req), 'setGameFree', req.body);

			var msg = req.body;

			delete msg.byMid;
			delete msg.byName;

			for(var i = 0, len = admin.pkplayer.length; i < len; i++) {
				var pkserver = admin.pkplayer[i];

				admin.httpClient.postJson("SetFreeAct", msg, pkserver.port + 1000, pkserver.host, function (er, rtn) {});
			}

			res.json(0);
		},
		getOpLog:function(req, res) {
			if (!admin.checkLevel(req, [10])) {
				res.end();
				return;
			}

			//var member = admin.getMember(req);
			//admin.opLog(member._id, admin.getClientIp(req), 'getMember', req.body);

			if(admin.mdb) {
				var limit = 50;
				var msg = req.body;
				var page = msg.page;
				var count = msg.count;
				var para = msg.para;

				if(typeof(para) != 'object') {
					res.end();
					return;
				}

				var day = para.day;
				delete para.day;
				var skip = (page - 1) * limit;

				if(count) {
					admin.mdb.collection("opLog" + day).count(para, function(er, r) {
						res.json(r);
					});
				} else {
					var rtn = [];
					admin.mdb.collection("opLog" + day).find(para).skip(skip).limit(limit).each(function (er, doc) {
						if (doc) rtn.push(doc);
						else {
							res.json(rtn);
						}
					});
				}
			}
		},
		unbanPhone:function(req, res) {
			if (!admin.checkLevel(req, [3, 10])) {
				res.end();
				return;
			}

			var msg = req.body;

			if(typeof(msg.mid) != 'number') {
				res.end();
				return;
			}

			var db = admin.mdb;
			var member = admin.getMember(req);
			admin.opLog(member._id, admin.getClientIp(req), 'unbanPhone', {mid:msg.mid});

			if (db) {
				db.collection("members").findOne({_id:msg.mid}, function(er, doc) {
					if(doc) {
						if(doc.adminLevel && member.adminLevel != 10) {
							if(member.adminLevel <= doc.adminLevel) {
								res.end();
								return;
							}
						}

						db.collection("members").update({_id: msg.mid}, {$set: {mbindphone:0}}, function (er, rtn) {
                            if(admin.mid2sid[msg.mid]) {
                                delete admin.sid2member[admin.mid2sid[msg.mid]];
                                delete admin.mid2sid[msg.mid];
                            }
						});
						res.json(1);
					}
				});

				//return;
			}
		},
		/**
		 * 会员消耗明细
		 */
		getUserUseList:function(req,res){
			if (!admin.checkLevel(req, [0, 2, 1, 3, 10])) {
				res.end();
				return;
			}

			var db = admin.mdb;

			if (db) {
				var msg = req.body;
				var _strDay=msg._strday;
				var _endDay=msg._endday;
				var rtn = [];
				var total=0;

				if(_endDay-_strDay>8*24*60*60*1000){
					res.end();
					return;
				}

				var userList = {};
				function initUserList(uid){
					if(!userList[uid]) {
						userList[uid] = {};
						userList[uid].userID = 0;
						userList[uid].buyDiaNum = 0; //购买数量
						userList[uid].useDiaNum = 0;//消耗数量
					}
				}
				function requireDays(){
					if(parseInt(_strDay)<parseInt(_endDay)){

						var day=admin.getFormatDate(_strDay);
						db.collection("userMoney" + day).find({byMid: msg.mid ? msg.mid : msg.byMid}, {_id: 0, uid: 1, buyNum: 1, byName: 1}).each(function (er, doc ) {
							if(doc){
								if (doc.uid){
									var uid = doc.uid;
									initUserList(uid);
									userList[uid].userID = doc.uid;
									userList[uid].buyDiaNum += doc.buyNum;
								}
							}
							else
							{
								db.collection("gameLog" + day).find({},{_id:0,uid1:1,money:1}).each(function(rq,rs){
									if (rs){
										if(rs.uid1)
										{
											var uid = rs.uid1;
											//initUserList(uid);
											if (userList[uid]){
												userList[uid].useDiaNum += rs.money;
											}
										}

									}
									else{
										var arr = Object.keys(userList);
										//循环去掉 冒号前对象名
										//var userdianum =[];
										for(var p in userList){
											rtn.push(userList[p]);  //将对象值存入数组
										}
										/*res.json({total: arr.length, rows: userdianum});*/
										/*rtn.push(userdianum);*/
										total+=arr.length;
									}
								});
								_strDay=parseInt(_strDay)+24*60*60*1000;
								requireDays();
							}
						});
					}else{
						res.json({total:total,rows:rtn});
					}
				}
				requireDays();
			}
		}//========================此接口结束========================
	};
	return rtn;
}
