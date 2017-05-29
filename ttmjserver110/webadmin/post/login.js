module.exports=function(admin)
{
	var cp = require('child_process');
	var ghttp = require('http');
	var gquerystring = require('querystring');
	var AliMNS = require("ali-mns");
	
	var exec = cp.exec;
	var loginBan = {};
	var loginCheck = {};
	var onceCheckTimes = 3;
	var onceBanTime = 5 * 60 * 1000;//5分钟

	function banIp(ip) {
		if(ip == '0') {
			return;
		}

		var cmd = "firewall-cmd --permanent --add-rich-rule='rule family=ipv4 source address=\"";
		cmd += ip + "\" drop'";
		//console.info('cmd : ' + cmd);
		exec(cmd, function(error, stdout, stderr) {
			admin.doLog('', {ip:ip, error:error, stdout:stdout, stderr:stderr}, "banIp");

			if(stdout != 'success\n') {
				//console.info('fail');
				loginBan[ip] = 0;//三次后继续尝试封禁
			}
		});
	}

	function doLoginCheck(mid, mPass, ip, type) {
		//admin.doLog('doLoginCheck', {mid:mid, ip:ip, type:type, checkData:loginCheck[ip]});
		if(type == 1) {//验证
			if (typeof(mid) != 'number') {
				return false;
			}

			if (typeof(mPass) != 'string') {
				return false;
			}

			if(admin.jsonCfg.whiteList && admin.jsonCfg.whiteList[ip]) {//白名单
				return true;
			}

			//同一个ip只能存在一个请求
			if(!loginCheck[ip]) {
				loginCheck[ip] = {};
				loginCheck[ip].cnt = 0;
				loginCheck[ip].time = 0;
				loginCheck[ip].status = 1;
				return true;
			} else if(loginCheck[ip].status) {
				return false;//有一个请求在了
			} else if(loginCheck[ip].cnt >= onceCheckTimes) {//到了次数才判断时间
				if(loginCheck[ip].time >= Date.now()) {//封禁时间内
					return Math.ceil((loginCheck[ip].time - Date.now()) / (60 * 1000));
				} else {//封禁到时间了
					loginCheck[ip].cnt = 0;
					loginCheck[ip].time = 0;
					loginCheck[ip].status = 1;
					return true;
				}
			} else {
				loginCheck[ip].status = 1;
				return true;
			}
		} else if(type == 2) {//增加失败次数
			if(!loginCheck[ip]) {
				return;
			}

			loginCheck[ip].cnt++;
			loginCheck[ip].status = 0;

			if(loginCheck[ip].cnt >= onceCheckTimes) {
				loginCheck[ip].time = Date.now() + onceBanTime;
				var day = new Date();
				day = (day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate()) + "";
				admin.doLog('', {mid:mid, ip:ip}, 'ccAttack' + day);

				if(!loginBan[ip]) {
					loginBan[ip] = 0;
				}

				loginBan[ip]++;

				if(loginBan[ip] == onceCheckTimes) {
					banIp(ip);
				}
			}
		} else {//成功则删除
			if(!loginCheck[ip]) {
				return;
			}

			delete loginCheck[ip];

			if(loginBan[ip]) {
				delete loginBan[ip];
			}
		}
	}

	function loginInner(req, res) {
		var ip = admin.getClientIp(req);
		var dbIp = ip.split('.');
		dbIp = dbIp.join('_');
		var msg = req.body;
		var banMins;

		banMins = doLoginCheck(msg.mid, msg.mPass, ip, 1);

		if(typeof(banMins) == 'number') {
			res.json({banMins:banMins});
			return;
		}

		if(!banMins) {
			res.json(0);
			return;
		}




		if(admin.mdb) {
			if(!msg.crossServer) {//跳转会造成2次加密
				msg.mPass = admin.cryptoMemberPass(msg.mPass);
			}

			//console.info(JSON.stringify(msg));
			//负载分担登录方式

			msg.host = req.host;
			//console.info("login msg "+JSON.stringify(msg));
			admin.mdb.collection('members').findOne({_id: msg.mid}, function (er, doc) {
				if (doc) {
					doc.tempIp = dbIp;
					if(doc.banTime) {
						var now = Date.now();

						if(doc.banTime > now) {
							var days = Math.ceil((doc.banTime - now) / 86400000);
							res.json({banDays:days});
							doLoginCheck(msg.mid, msg.mPass, ip, 2);//失败，累计次数，并清理ip状态
							return;
						}
					}

					if (doc.mPass == msg.mPass && (doc.adminLevel > 0 || !msg.gameid || (doc.gameids && doc.gameids.indexOf(msg.gameid) >= 0))) {
						if (msg.crossServer) {
							res.json(doc);
						} else {
							msg.doc = doc;
							admin.doLogin(msg, res, req, false);//false from login.js doLogin, true from adminWeb.js balanceLogin
						}
						doLoginCheck(msg.mid, msg.mPass, ip, 3);//成功，清理内存
					} else {
						doLoginCheck(msg.mid, msg.mPass, ip, 2);//失败，累计次数，并清理ip状态
						res.json(0);
					}
				} else {
					if (admin.jsonCfg && admin.jsonCfg.memberFrom) {
						msg.crossServer = true;
						var mFrom = admin.jsonCfg.memberFrom;
						admin.httpClient.postJson(mFrom.path, msg, mFrom.port, mFrom.host, function (he, hr) {
							if (hr) {
								delete hr.tempIp;//防止insert 写入没用的数据

								if(hr.banDays) {//封禁
									res.json({banDays:hr.banDays});
									doLoginCheck(msg.mid, msg.mPass, ip, 2);//失败，累计次数，并清理ip状态
									return;
								}

								if(hr.banMins) {
									res.json({banMins:hr.banMins});
									doLoginCheck(msg.mid, msg.mPass, ip, 2);//失败，累计次数，并清理ip状态
									return;
								}

								hr.buyTotal = 0;
								if (!(hr.adminLevel > 0))    hr.money = 0;
								admin.mdb.collection('members').insert(hr, function () {
									hr.tempIp = dbIp;
									msg.doc = hr;
									admin.doLogin(msg, res, req, false);//false from login.js doLogin, true from adminWeb.js balanceLogin
									doLoginCheck(msg.mid, msg.mPass, ip, 3);//成功清理内存
								});
							} else {
								doLoginCheck(msg.mid, msg.mPass, ip, 2);//失败，累计次数，并清理ip状态
								res.json(0);
							}
						});
					} else {
						doLoginCheck(msg.mid, msg.mPass, ip, 2);//失败，累计次数，并清理ip状态
						res.json(0);
					}
				}
			});
		} else {
			doLoginCheck(msg.mid, msg.mPass, ip, 2);//失败，累计次数，并清理ip状态
			res.json(0);
		}
	}

	//手机验证
	var smsCheckTimes = 5;//验证码尝试次数
	var smsTryTimes = 6;
	var smsOnceTime = 2 * 60 * 1000;//单次验证码有效期 2mins
	var smsTimeLimit = 60 * 60 * 1000;//一小时内只能验证6次，ali限制是7次
	var findPassCache = {};//找回密码的临时数据
	var accountAliMNS = null;
	var mnsAliMNS = null;

	/*
		手机验证返回码含义：
		0成功

		发送验证码
		1 未绑定手机
		2 输入信息有误
		3 请求频繁	附带剩余等待时间
		4 1小时限制	附带剩余等待时间
		5 手机号码与绑定手机不相同
		6 手机被绑定
		7 玩家不存在
		8 请重新登录

		验证码验证
		1 没有验证信息
		2 输入信息错误
		3 验证码错误
		4 验证码过期
	 	5 请重新登录
	 	6 尝试次数过多

		手机验证码类型：
		1 绑定手机
		2 登录验证
		3 忘记密码
		4 修改手机
		5 保护开关
	 */


	function sendSms(doc, phone, type, res,mobiletype) {
		// private method for UTF-8 encoding

		var data = admin.smsPhoneCache[phone];
		var time = Date.now();

		if(!data) {
			data = {};
			data.count = 0;
		//	admin.doLog('sendSms', data);
		} else {
		//	admin.doLog('sendSms', data);
			//每次验证都要判断是不是超过了一个小时，超过，就重置次数
			if(time > data.limitTime) {
				data.count = 0;
			}

			if(data.count >= smsTryTimes) {
				//满6次需要等待1小时
				res.json({er:4, time:data.limitTime - time});
				return;
			}

			if(time <= data.onceTime) {
				//有效期内，不能重复请求
				res.json({er:3, time:data.onceTime - time});
				return;
			}
		}

		var num = "";

		for(var i = 0; i < 6; i++) {
			num += Math.floor(Math.random() * 10);
		}
		//添加海外处理
		//key 	是 	API 帐号
		//secret 	是 	API 密码
		//from 	否 	部分国家支持自定义显示发送人号码，也称为SenderID，最多支持11个字符。因为不同国家的相关政策规则不同，如果需使用该参数请预先咨询您的客服人员，以确保您的发送成功率；
		//to 	是 	发送目标号码，格式为国家区号直接接手机号码，区号和手机号码均不能以0开头，如8618050006000，86为中国区号，18050006000为手机号码；
		//text 	是 	发送内容，需通过URLEncode方式进行UTF-8编码转换。如需简单测试可通过 http://www.url-encode-decode.com/ 进行文本编码转换；

		//请求示例：http://api.paasoo.com/json?key=API_KEY&secret=API_SECRET&from=PaaSoo&to=8615884401340&text=Hello+world
		if(mobiletype != undefined && mobiletype !=86)//发送国外的号码
		{

			//fix bug 首先检查手机号码格式的正确性
		    //http://clientsms.paasoo.com/api/validnumber?key=API_KEY&secret=API_SECRET&countryCode=86&nationalNumber=1859261596
			//格式正确：true
			//格式错误：false

			var checkdata= {
				key: admin.jsonCfg.smsWxyKey,
				secret: admin.jsonCfg.smsWxySecret,
				countryCode: mobiletype,
				nationalNumber: phone
			}				
			var content = gquerystring.stringify(checkdata);
			var options = {
				hostname: 'clientsms.paasoo.com',
				port: 80,
				path: '/api/validnumber?' + content,
				method: 'GET'
			};

			var req = ghttp.request(options, function (resq) {
				resq.setEncoding('utf8');
				resq.on('data', function (chunk) {
					
					if(chunk =="false")
					{
						res.json({er: 10});
						return ;
					}
					//检查号码格式通过才进行短信发送

					var message="";
					if(mobiletype == 1 )
					{

						message="[PPgame]Verification Code:"+num;
					}else
					{
						message="[PPgame]Verification Code:"+num;
					}
					var descode=message;
					var data = {
						key: admin.jsonCfg.smsWxyKey,
						secret:admin.jsonCfg.smsWxySecret,
						to:mobiletype+phone,
						from:"pipigame",
						text:descode
					};
					var content = gquerystring.stringify(data);
					var options = {
						hostname: 'api.paasoo.com',
						port: 80,
						path: '/json?' + content,
						method: 'GET'
					};
					var req = ghttp.request(options, function (resq) {
						resq.setEncoding('utf8');
						resq.on('data', function (chunk) {
							var stasd= JSON.parse(chunk);
							//成功：{"status":"0","messageid":"4b7368321"}
							if(Number(stasd.status) == 0)
							{//success
								data.mid = doc._id;
								data.code = num;
								data.mobilecode=mobiletype;
								//data.count++;//请求次数，每小时清0
								data.onceTime = time + smsOnceTime;//单次有效期2分钟
								data.type = type;
								data.check = 0;//尝试次数
								data.phone = phone;

								if (data.count == 1) {//只有第一次重置
									data.limitTime = time + smsTimeLimit;//6次后1小时的限制
								}
								admin.opLog(doc._id, doc.ip, 'sendSms', data);
								admin.smsPhoneCache[phone] = data;//如果是新建的map，不成功不赋值
								res.json({er: 0});

							}else {
								//fail

								res.json({er: 2});
							}
						});
					});
					req.on('error', function (e) {
						res.json({er: 2});
					});
					req.end();

				});
			});
			req.on('error', function (e) {
				res.json({er: 2});
			});
			req.end();


		}else
		{
			console.log("admin.jsonCfg.smsPlatform",admin.jsonCfg.smsPlatform);
			//阿里云mns
			if(admin.jsonCfg.smsPlatform == 1)
			{
				/*
				 阿里云信息服务API官方文档: https://help.aliyun.com/document_detail/27497.html?spm=5176.2020520115.0.0.LObTZO
				 第三方SDK: https://github.com/aliyun/aliyun-mns-nodejs-sdk
				 遇到的问题：https://github.com/InCar/ali-mns/issues/24
				 npm install -g ali-mns

				 */
				if(!accountAliMNS)
				{
					var aliCfg = {
						accountId:admin.jsonCfg.aliMns.accountId,//http(s)://1950307137601974.mns.cn-hangzhou.aliyuncs.com/  阿里主题中Endpoint的ID
						keyId: admin.jsonCfg.aliMns.keyId,//阿里消息服务所用的密钥ID
						keySecret: admin.jsonCfg.aliMns.keySecret,//阿里消息服务所用的密钥值
						topicName: admin.jsonCfg.aliMns.topicName,//阿里消息服务主题名称
						setGA:admin.jsonCfg.aliMns.setGA,//Google统计分析
					};
					accountAliMNS = new AliMNS.Account(aliCfg.accountId, aliCfg.keyId, aliCfg.keySecret);
					accountAliMNS.setGA(aliCfg.setGA);
					mnsAliMNS = new AliMNS.Topic(aliCfg.topicName, accountAliMNS);
				}
				if(!mnsAliMNS)
				{
					res.json({er: 2, msg: "mnsAliMNS error"});
					return;
				}
				var attrs = {
					DirectSMS: JSON.stringify(
						{
							FreeSignName:admin.jsonCfg.aliMns.FreeSignName,//短信签名
							TemplateCode:admin.jsonCfg.aliMns.TemplateCode,//短信模板
							Type:admin.jsonCfg.aliMns.Type,//单发
							Receiver:phone,//接收人的手机号 13416503454 17071487674 15232583691
							SmsParams:JSON.stringify({name:num}),//短信具体参数: key为短信模板->短信内容的key
						}
					)
				};

				console.log("mnsAliMNS num,phone",num,phone);
				mnsAliMNS.publishP("ali-mns",true,null,attrs/*,{ forever: true }*/).then(function (log) {
					console.log("log>>>",log);

					data.mid = doc._id;
					data.code = num;
					data.mobilecode=mobiletype;
					data.count++;//请求次数，每小时清0
					data.onceTime = time + smsOnceTime;//单次有效期2分钟
					data.type = type;
					data.check = 0;//尝试次数
					data.phone = phone;

					if (data.count == 1) {//只有第一次重置
						data.limitTime = time + smsTimeLimit;//6次后1小时的限制
					}
					admin.opLog(doc._id, doc.ip, 'sendSms', data);
					admin.smsPhoneCache[phone] = data;//如果是新建的map，不成功不赋值
					res.json({er: 0});
				}, function (err) {
					console.log("err>>>",err);
					res.json({er: 2});
				});
			}
			else
			{
				admin.smsClient.execute('alibaba.aliqin.fc.sms.num.send', {
					'extend': '',
					'sms_type': 'normal',
					'sms_free_sign_name': admin.jsonCfg.sign_name,
					'sms_param': "{name:'" + num + "'}",
					'rec_num': phone,
					'sms_template_code': admin.jsonCfg.templatecode
				}, function (error, response)
				{

					if (error) {
						if (error.code == 15) {//如果内存丢失，这里判断次数满
							res.json({er: 4, time: smsTimeLimit});
						} else {
							res.json({er: 2});
						}
					} else if (response.result.err_code != 0) {
						res.json({er: 2});
					} else {
						data.mid = doc._id;
						data.code = num;
						data.mobilecode=mobiletype;
						data.count++;//请求次数，每小时清0
						data.onceTime = time + smsOnceTime;//单次有效期2分钟
						data.type = type;
						data.check = 0;//尝试次数
						data.phone = phone;

						if (data.count == 1) {//只有第一次重置
							data.limitTime = time + smsTimeLimit;//6次后1小时的限制
						}
						admin.opLog(doc._id, doc.ip, 'sendSms', data);
						admin.smsPhoneCache[phone] = data;//如果是新建的map，不成功不赋值
						res.json({er: 0});
						//admin.doLog('sendSms ok', data);
					}

				});
			}


		}

	}
	function checkSmsWx(phone, smsCode, type) {
		if(!phone) {
			return 1;
		}
		var data = admin.smsPhoneCache[phone];
		if(!data) {
			return 1;
		}
		data.check++;
		if(data.check > smsCheckTimes) {
			return 6;
		}
		if(data.code == '0') {
			return 1;
		}
		if(type != data.type) {
			return 2;
		}
		if(data.code != smsCode) {
			return 3;
		}

		if(Date.now() > data.onceTime) {
			return 4;
		}
		//admin.opLog(phone, "wxsms", 'checkSms', data);
		data.code = '0';//验证成功后清除验证码，防止反复使用
		return 0;
	}
	function checkSms(doc, smsCode, type) {
		var phone = doc.tempPhone;

		if(!phone) {
			phone = doc.mbindphone;
		}

		if(!phone) {
			return 1;
		}

		var data = admin.smsPhoneCache[phone];

		if(!data) {
			return 1;
		}
		//admin.doLog('checkSms', data);
		if(doc._id != data.mid) {
			return 1;
		}

		data.check++;

		if(data.check > smsCheckTimes) {
			return 6;
		}

		if(data.code == '0') {
			return 1;
		}

		if(type != data.type) {
			return 2;
		}

		if(data.code != smsCode) {
			return 3;
		}

		if(Date.now() > data.onceTime) {
			return 4;
		}

		admin.opLog(doc._id, doc.ip, 'checkSms', data);
		data.code = '0';//验证成功后清除验证码，防止反复使用
		return 0;
	}
	
	return {
		doWxLogin:function(req, res){//微信登录
			req.body.fromHtml = 1;//member
			req.body.types=1;
			loginInner(req, res);
		},
		doLogin:function(req, res)//登录
		{

			req.body.fromHtml = 1;//member
			loginInner(req, res);
		}
		,dl7ac3198fd3049cf71bae: function (req, res) {
			req.body.fromHtml = 3;//manager
			loginInner(req, res);
		}
		,dlaf911cc79debcb029c3c: function (req, res) {
			req.body.fromHtml = 10;//admin
			loginInner(req, res);
		},
		doWxGetSms:function (req, res) {//微信获取验证码
			
			
			var phones=Number(req.body.tel);
			if(!phones || typeof(phones) != 'number') {
				res.json({er:2});
				return;
			}
			//手机查询
			admin.mdb.collection("members").findOne({mbindphone:phones}, function(er, doc) {
				if(doc) {
					res.json({er:6});
				} else {
					sendSms("", phones, 1, res,1);
				}
			});

			//绑定手机的验证


		}
		,dld56b699830e77ba53855: function (req, res)
		{
			req.body.fromHtml = 4; // Observer
			loginInner(req, res);
		}
		,doGetSms:function (req, res) {//发送验证码 //添加国家号
			//admin.doLog('doGetSms', req.body);
			var type = req.body.type;
			var mobilecode=req.body.mobilecode;//国家号
			var time = Date.now();
			var phone, mid, member;

			if(!type || typeof(type) != 'number') {
				res.json({er:2});
				return;
			}

			switch (type) {
				case 1:
					phone = req.body.mobile;

					if(!phone || typeof(phone) != 'number') {
						res.json({er:2});
						return;
					}

					member = admin.getMember(req);

					if(!member) {
						res.json({er:8});
						return;
					}

					if(!admin.checkSmsOpen(member)) {
						res.json({er:-1});
						return;
					}

					if(member.mbindphone) {//已经绑定了手机
						res.json({er:2});
						return;
					}

					if(member.tempPhone) {//输入过手机
						var data = admin.smsPhoneCache[member.tempPhone];

						if(data && time <= data.onceTime) {
							//上次的验证码未过有效期
							res.json({er:3, time:data.onceTime - time});
							return;
						}

						if(data && data.mid != member._id) {//别人申请了验证码
							res.json({er:2});
							return;
						}
					}

					admin.mdb.collection("members").findOne({mbindphone:phone}, function(er, doc) {
						if(doc) {
							res.json({er:6});
						} else {
							member.tempPhone = phone;

							sendSms(member, phone, type, res,mobilecode);

						}
					});
					break;
				case 2:
				case 4:
				case 5:
					member = admin.getMember(req);

					if(!member) {
						res.json({er:8});
						return;
					}

					if(!admin.checkSmsOpen(member)) {
						res.json({er:-1});
						return;
					}

					phone = member.mbindphone;

					if(!phone) {
						res.json({er:1});
					}



					admin.mdb.collection("members").findOne({_id:member._id}, function(er, doc) {
						if (doc) {
							sendSms(member, phone, type, res,doc.mobilecode);
						}
					});

					break;
				case 3:
					mid = req.body.mid;
					phone = req.body.mobile;

					if(!mid || typeof(mid) != 'number') {
						res.json({er:2});
						return;
					}

					if(!phone || typeof(phone) != 'number') {
						res.json({er:2});
						return;
					}

					admin.mdb.collection("members").findOne({_id:mid}, function(er, doc) {
						if(doc) {
							if(!admin.checkSmsOpen(doc)) {
								res.json({er:-1});
								return;
							}
							if(!doc.mbindphone)
							{
								res.json({er:1});//未绑定
							}else if(phone != doc.mbindphone) {
								res.json({er:5})
							} else {
								findPassCache[mid] = doc;

								sendSms(doc, phone, type, res,doc.mobilecode);

							}
						} else {
							res.json({er:7});
						}
					});
					break;
				default:
					res.json({er:2});
					return;
			}
		}
		,doCheckSms:function(req, res) {//校验验证码
			//admin.doLog('doCheckSms', req.body);
			var type = req.body.type;
			
			var code = req.body.mcode;
			var phone, mid, member, rtn, pass;


			if(!type || typeof(type) != 'number') {
				res.json(2);
				return;
			}

			if(typeof(code) != 'string') {
				res.json(2);
				return;
			}

			switch (type) {
				case 1://绑定手机号码
					var mobilecode=req.body.mobilecode;//国家号
					phone = req.body.mobile;
					if(!phone || typeof(phone) != 'number') {
						res.json(2);
						return;
					}
					member = admin.getMember(req);
					if(!member) {
						res.json(5);
						return;
					}

					if(!admin.checkSmsOpen(member)) {

						res.json({er:-1});
						return;
					}

					if(member.mbindphone) {//已经绑定了手机

						res.json(2);
						return;
					}



					if(phone != member.tempPhone) {

						res.json(2);
						return;
					}

					rtn = checkSms(member, code, type);

					if(rtn) {

						res.json(rtn);
						return;
					}
					req.mobilecode=mobilecode;
					admin.enterWeb(member, res, req);
					break;
				case 2:
					member = admin.getMember(req);

					if(!member) {
						res.json(2);
						return;
					}

					if(!admin.checkSmsOpen(member)) {
						res.json({er:-1});
						return;
					}

					rtn = checkSms(member, code, type);

					if(rtn) {
						res.json(rtn);
						return;
					}
                    //短信验证后发放设备cookie
                    var deviceId = Date.now() + 1 + Math.floor(Math.random()*10000);
                    var randChar = ['i', 'n', 'm', 'i8', 'ug', 'kv', 'ddg'];
                    var index = Math.floor(Math.random() * randChar.length);
                    var did = admin.cryptoMemberPass(randChar[index] + deviceId);
                    res.cookie('deviceID', did, { maxAge: 3600000*24*2 });

                    if(admin.uid2deviceCookie[member._id]) {
                        var oldDeviceId = admin.uid2deviceCookie[member._id];
                        delete admin.deviceCookie2uid[oldDeviceId];
                    }
                    admin.deviceCookie2uid[did] = member._id;
                    admin.uid2deviceCookie[member._id] = did;

					admin.enterWeb(member, res, req);
					break;
				case 3:
					mid = req.body.mid;
					pass = req.body.pass;

					if(!mid || typeof(mid) != 'number') {
						res.json({er:2});
						return;
					}

					if(typeof(pass) != 'string') {
						res.json({er:2});
						return;
					}

					member = findPassCache[mid];

					if(!member) {
						res.json(2);
						return;
					}

					if(!admin.checkSmsOpen(member)) {
						res.json({er:-1});
						return;
					}

					rtn = checkSms(member, code, type);

					if(rtn) {
						res.json(rtn);
						return;
					}

					delete findPassCache[mid];
					pass = admin.cryptoMemberPass(pass);

					admin.mdb.collection("members").update({_id: mid}, {$set: {mPass: pass, forcePass: 0}}, function (er, r) {
						var ip = admin.getClientIp(req);
						doLoginCheck(mid, pass, ip, 3);//成功，清理内存
						res.json(0);
					});
					break;
				case 4:
					//修改手机
					phone = req.body.mobile;

					if(!phone || typeof(phone) != 'number') {
						res.json({er:2});
						return;
					}
					var mobilecode=req.body.mobilecode;
					member = admin.getMember(req);

					if(!member) {
						res.json(2);
						return;
					}

					if(!admin.checkSmsOpen(member)) {
						res.json({er:-1});
						return;
					}

					rtn = checkSms(member, code, type);

					if(rtn) {
						res.json(rtn);
						return;
					}
					
					//绑定手机号的国家号mobilecode
					admin.mdb.collection("members").findOne({mbindphone:phone}, function(er, doc) {
						if(doc) {
							res.json(7);//手机已绑定
						} else {//绑定手机号的国家号mobilecode
							admin.mdb.collection("members").update({_id: member._id}, {$set: {mbindphone: phone,mobilecode:mobilecode}}, function (er, r) {
								member.mbindphone = phone;
								member.mobilecode = mobilecode;

								res.json(0);
							});

						}
					});

					break;
				case 5:
					member = admin.getMember(req);

					if(!member) {
						res.json(2);
						return;
					}

					if(!admin.checkSmsOpen(member)) {
						res.json({er:-1});
						return;
					}

					rtn = checkSms(member, code, type);

					if(rtn) {
						res.json(rtn);
						return;
					}

					var status = member.mprotect;

					if(status) {
						status = 0;
					} else {
						status = 1;
					}

					admin.mdb.collection("members").update({_id: member._id}, {$set: {mprotect: status}}, function (er, r) {
						member.mprotect = status;
						res.json(0);
					});
					break;
				default:
					res.json(2);
					break;
			}
		}
		,doLogout:function(req, res)
		{
			var oldSid=req.cookies.sessionID;
			var tempUnionid=0;
			if(oldSid)
			{
               var member=admin.sid2member[oldSid];
               if(member)
			   {
				   if(member.tempUnionId)
				   {
					 tempUnionid=1;
				   }
				   delete admin.sid2member[oldSid];
				   delete admin.mid2sid[member.mid];
				   admin.opLog(member._id, admin.getClientIp(req), 'doLogout', req.body);
			   }				   
		    }
			if(tempUnionid == 1){
				res.json(1);
			}else{
				res.json(0);
			}
		},
		updateJson:function (req, res) {
			if(admin.jsonCfg.balanceNum && admin.jsonCfg.balanceNum > 1) {
				var file = req.body.file;
				if (!file) {
					res.json({er:1, port: admin.jsonCfg.httpPort});
					return;
				}

				if(file.indexOf('.json') < 1) {
					res.json({er:2, port: admin.jsonCfg.httpPort});
					return;
				}

				admin.updateJson(file);
				res.json({er:0, port: admin.jsonCfg.httpPort});
				return;
			}
			res.json({er:-1, port: admin.jsonCfg.httpPort});
		},
		changeMyPass: function (req, res) {
			if (!admin.checkLevel(req, [0, 2, 1, 3, 4, 10])) {
				res.json(1);
				return;
			}

			var db = admin.mdb;
			var member = admin.getMember(req);
			admin.opLog(member._id, admin.getClientIp(req), 'changeMyPass', {});

			if (db) {
				var msg = req.body;
				msg.oldPass = admin.cryptoMemberPass(msg.oldPass);
				msg.newPass = admin.cryptoMemberPass(msg.newPass);
				db.collection("members").findOne({_id:member._id}, function(er, doc) {
					if(er || !doc) {
						res.json(2);
						return;
					}

					if(doc.mPass != msg.oldPass) {
						res.json(3);
						return;
					}

					db.collection("members").update({_id: member._id}, {$set: {mPass: msg.newPass, forcePass:0}}, function (er, rtn) {
						if(er) {
							res.json(4);
							return;
						}

						delete admin.sid2member[req.cookies.sessionID];
						delete admin.mid2sid[member.mid];
						res.json(0);//修改密码后强制重新登录
					});
				});

				return;
			}

			res.json(5);
		}
	}	
}
