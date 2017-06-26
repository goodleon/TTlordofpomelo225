var express = require('express');//引入express 核心模块？
var bodyParser = require('body-parser');//body解析xml
var fs=require('fs');//文件模块 文件系统读写功能
var cookieParser = require('cookie-parser');//中间插件
var Admin=new require('./admin');//	 ./xxx.js相对路径之当前目录 ../xxx.js相对路径之上级目录
var admin=new Admin();

var ghttp=require("http");
var gqs = require('querystring');
var crypto=require('crypto');
var app = express();//用express创建一个新的程序
app.use(cookieParser());//处理每一个请求的cookie
var smsCheckTimes = 5;//验证码尝试次数
var smsTryTimes = 6;
var smsOnceTime = 2 * 60 * 1000;//单次验证码有效期 2mins
var smsTimeLimit = 60 * 60 * 1000;//一小时内只能验证6次，ali限制是7次
//将手机的全局声明修改到admin.js

var oneDayMsec = 86400000;
var timeZone = 28800000;
var nowTime = Date.now();
var dayZero = Math.floor((nowTime + timeZone) / oneDayMsec) * oneDayMsec - timeZone;//凌晨8点减去8个小时
var diffMsec = oneDayMsec - (nowTime - dayZero) - 60000;//23:59:00
var nextTime = nowTime + diffMsec;
admin.doLog('web start 111', {now:nowTime, dayZero:dayZero, diff:diffMsec, timeout:nowTime+diffMsec}, 'interday.log');
//diffMsec = 1000;
//oneDayMsec = 2000;
//只需要一个服务器触发
function interDay() {
	admin.doLog('interDay function', 'interday called 222', 'interday.log');
	if (admin.mdb && admin.balanceIndex == 0) {
		var diff = Date.now() - nextTime;//修正延时的毫秒
		setTimeout(interDay, oneDayMsec - diff);//next day 23:59:00

		var day = new Date(nextTime);
		var dayTime = nextTime;
		nextTime += oneDayMsec;
		day = (day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate());
		admin.doLog('interDay find', {day:day, nextTime:nextTime, diff:diff}, 'interday.log');
		var allCount = 0;
		var gameCount = {};

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
				admin.doLog('interday update', {day: day, allCount: allCount, gameCount: gameCount}, 'interday.log');
				admin.mdb.collection("dayLog").update({_id: day}, {
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
				}, {upsert:true}, function () {});
			}
		}

		function getGameCount(days) {
			if(days == 0) {
				var resultId = [];
				admin.mdb.collection("majiangLog").find({lastGameDay:day}).each(function (er, doc){ //查询活跃用户
					if(doc){
						var uid = doc._id;
						resultId.push(uid);
					}else{
						userInfo[days] = resultId;
						userInfoMoney(days);
					}
				});
			} else {
				var dd = new Date(dayTime);
				dd.setDate(dd.getDate() - days);
				dd = (dd.getFullYear() * 10000 + (dd.getMonth() + 1) * 100 + dd.getDate());

				var resultId = [];
				admin.mdb.collection("majiangLog").find({lastGameDay:{$gt:dd}}).each(function (er, doc){ //查询活跃用户
					if(doc){
						var uid = doc._id;
						resultId.push(uid);
					}else{
						userInfo[days] = resultId;
						userInfoMoney(days);
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

				admin.mdb.collection("majiang").find({uid:{$in:resultId}}).each(function (er, doc1) {  //根据活跃用户ID查询余钻
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

		admin.mdb.collection("cgbuser").count(function (er, rtn) {
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
}

if(admin.balanceIndex == 0) {
	setTimeout(interDay, diffMsec);//this day 23:59:59
	admin.doLog('interDay start', 'start time 333 out', 'interday.log');
}

function loginCheck(member, req, res, next) {
	next();
}

function adminCheck(member, req, res, next) {
	if(!admin.IsAdmin(member) || member.fromHtml != 10) {
		res.redirect("/login.html");
	} else {
		//console.info(req.url+" "+req.url.indexOf("/admin/"));
		if(req.url.indexOf("/admin/")>=0&&req.body) {
			if(!req.body.byMid&&req.url.indexOf("/saveMember")<0&&req.url.indexOf("/getMembers")<0) {
				req.body.byMid=member.mid;
				req.body.byName=member.mName;
			}
		}
		next();
	}
}
function managerCheck(member, req, res, next) {
	if(!admin.IsManager(member) || member.fromHtml != 3){
		res.redirect("/login.html");
	} else {
		if(req.url.indexOf("/manager/")>=0&&req.body) {
			req.body.byMid=member.mid;
			req.body.byName=member.mName;
		}
		next();
	}
}

function memberManagerCheck(member, req, res, next) {
	if(!admin.IsMemberManger(member)) {
		res.redirect("/login.html");
	} else {
		if(req.url.indexOf("/memberui/") >= 0 && req.body) {
			req.body.byMid=member.mid;
			req.body.byName=member.mName;
		}
		next();
	}
}

function memberCheck(member, req, res, next) {
	if(!admin.IsMember(member)){
		res.redirect("/login.html");
	} else {
		//console.info("240");
		if((req.url.indexOf("/memberui/") >= 0 || req.url.indexOf("/newmember/") >= 0) && req.body){
			req.body.byMid=member.mid;
			req.body.byName=member.mName;
		}
		next();
	}
}

function checkSpecialStatus(member, res) {
	if(!member)	{//没有登录
		res.redirect("/login.html");
		return false;
	}

	if(member.tempSmsCheck == 1) {//绑定手机
		res.redirect("/phonebind.html");
		return false;
	}

	if(member.tempSmsCheck == 2) {//手机验证
		var myphone = admin.getCryptoPhone(member);
		res.redirect("/phoneidenty.html?p=" + myphone);
		return false;
	}

	if(member.forcePass) {//强制修改密码
		res.redirect("/qzxgmm.html");
		return false;
	}

	return true;
}

function byMidFill(req, res, next)
{
	//admin.doLog('', {url:req.url, para:req.body});
	if(!req.cookies.sessionID) {
		res.end();
	} else {
		var member=admin.sid2member[req.cookies.sessionID];

		if(!checkSpecialStatus(member, res)) {
			return;
		}

		if(req.url.indexOf("/admin/getMembers")>=0&&member.adminLevel!=10) {
			if(req.body.adminLevel && req.body.adminLevel < member.adminLevel) {

			}
			else {
				req.body.adminLevel={$not:{$gte:member.adminLevel}};
			}

			//req.body.adminLevel={$not:{$eq:10}};
		}

		if(!req.body.byMid &&
			req.url.indexOf("/saveMember")<0 &&
			req.url.indexOf("/getMembers")<0 &&
			req.url.indexOf("/getDayLog")<0 &&
			req.url.indexOf("/getMembersCount")<0)//req.url.indexOf("/getMyMembersCount")<0
		{
			if(req.url.indexOf("getMyMembers")>=0)
			{
				req.body.isManager = member.adminLevel == 1;
			}

			req.body.byMid=member.mid;
			req.body.byName=member.mName;

		}

		next();
	}
}

function loginAlready(req, res, next) {

	console.info("loginAlready req.cookies=" + JSON.stringify(req.cookies));
	if(req.cookies.sessionID) {
        var member = admin.sid2member[req.cookies.sessionID];

        if(!member) {
			console.info("loginAlready !member");
            next();
            return;
        }

		if(!checkSpecialStatus(member, res)) {

			console.info("loginAlready  !checkSpecialStatus(member, res)");
			return;
		}

        if(!member.adminLevel) {
			console.info("loginAlready !member.adminLevel=" + !member.adminLevel);
            member.adminLevel = 0;
        }

        switch(member.adminLevel) {
            case 0:
            case 2:
            {
                res.redirect("/newmember/index.html");
                break;
            }
            default:
                break;
        }
	}else {
		console.info("loginAlready else");
	}

	next();
}
app.use( bodyParser.json() );

function checkIpWhiteList() {
    function getClientIp(req) {
        return req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;
    }

    return function (req, res, next) {
        if (!admin.jsonCfg.GrowthIpWhiteList || typeof admin.jsonCfg.GrowthIpWhiteList != "object") {
            res.json({err: "check white list fail"});
            return;
        }

        var clientIp = getClientIp(req);
        if (admin.jsonCfg.GrowthIpWhiteList[clientIp]) {
            next();
        } else {
            res.json({err: "check white list fail"});
            return;
        }
    };
}
function CheckLevel(id, levels) {
	return function (req,res,next) {
		if(admin.checkLevel(req, levels)){
			if(!req.cookies.sessionID) {
				res.redirect("/login.html");
				return;
			}

			var member = admin.sid2member[req.cookies.sessionID];

			if(!checkSpecialStatus(member, res)) {
				return;
			}

			switch (id) {
				case 10:
					adminCheck(member, req,res,next);
					break;
				case 3:
					managerCheck(member, req,res,next);
					break;
				case 1:
					memberManagerCheck(member, req, res, next);
					break;
				case 2:
					memberCheck(member, req, res, next);
					break;
				case 4:
					loginCheck(member, req,res,next);
					break;
				default:
					break;
			}
		} else {
			res.redirect("/login.html");
		}
	}
}

function testCheck(req, res, next){
	if(admin.openTest) {
		next();
	} else {
		res.end();
	}
}

//网页权限管理

//10-adminui 10
// 3-manager 3
// 1 memberui/manager 1
// 2 memberui/member  0/2 2:addMember
// 4-watchui
// 4-researcherui

app.all('/login.html',loginAlready);
//app.all('/newlogin.html',loginAlready1);

//app.all('/qwefasdfsakjnfjkadsf.html',loginAlready);
app.all('/growth/*', checkIpWhiteList());

//app.all('/phoneidenty.html', CheckLevel(4, [4, 3, 10]));//loginCheck
app.all('/adminui/*', CheckLevel(10, [10]));//adminCheck
app.all('/manager/*', CheckLevel(3, [3, 10]));//managerCheck

//优先级匹配
app.all('/memberui/manager.html', CheckLevel(1, [1, 3, 10]));
app.all('/memberui/*',CheckLevel(2, [0, 2, 1, 3, 10]));//memberCheck
app.all('/newmember/*',CheckLevel(2, [0, 2, 1, 3, 10]));//memberCheck

app.all('/watchui/*', CheckLevel(4, [4, 3, 10]));//loginCheck
app.all('/researcherui/*', CheckLevel(4, [4, 3, 10]));//loginCheck

app.all('/admin/*', byMidFill);

app.all('/test/test.html', testCheck);

//ALL以匹配所有的HTTP动词，也就是说它可以过滤所有路径的请求
// app.all('/adminui/*',CheckLevel);
// app.all('/manager/*',CheckLevel);
// app.all('/memberui/*',CheckLevel);
// app.all('/watchui/*',CheckLevel);
// app.all('/login.html',CheckLevel);
// app.all('/qwefasdfsakjnfjkadsf.html',CheckLevel);

//使用./public提供静态文件服务，用express.static()中间件
//express.static 是Express内置的唯一一个中间件 是基于serve-static开发的，负责托管Express应用内的静态资源
//USE express调用中间件的方法，它返回一个函数.path默认为'/'
//USE不仅可以调用中间件，还可以根据请求的网址，返回不同的网页内容
app.use(express.static(__dirname + '/public'));

//post 处理指定页面的post请求
//app.post(path, function(req, res))
//想要使用 body 需要安装中间件 npm install body-parser . npm install multer
// 调用
// var bodyParser = require(‘body-parser’);
// var multer = require(‘multer’);
// …
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(multer());

//redirect 允许网址的重定向 跳转到指定的url并且可以指定status默认为302方式
//根据指定url来重定向，可以域内路径、网页间跳转也可以跳转至不同域名
//res.redirect([status, url]); res.redirect("login");

function AddWebHandler(type,path,js)
{
	if(typeof js=='function')
	{
		app[type](path,js);
	}
	else
	{
		for(var pty in js)
		{
			AddWebHandler(type,path+"/"+pty,js[pty]);
		}
	}
}

function Reload()
{
	var types=["post","get","dayTask"];
	for(var i=0;i<types.length;i++)
	{
		var dirPath=__dirname+"/"+types[i];

		if(fs.existsSync(dirPath) && fs.statSync(dirPath ).isDirectory())
		{
			var lst=fs.readdirSync(dirPath);
			for(var j=0;j<lst.length;j++)
			{
				if(fs.statSync(dirPath+"/"+lst[j]).isFile())
				{
					delete require.cache[require.resolve("./"+types[i]+"/"+lst[j])];
					var handler=require("./"+types[i]+"/"+lst[j])(admin);
					var nojs=lst[j].substr(0,lst[j].length-3);
					AddWebHandler(types[i],"/"+nojs,handler)
				}
			}
		}
	}
}

Reload();

//GET 根据请求路径来处理客户端发出的GET请求
//app.get(path, [callback(request, response)])

app.get('/online', function(req, res) {
	var keys = Object.keys(admin.sid2member);
	res.json(keys.length)
});



app.get('/reload',function(req, res){
	res.end();
	Reload();
});

/*
 app.get('/wxgetorder',function(req, res) {
 var str = req.url.split("?");
 var key = admin.wxpaykey;
 var iv = admin.wxpayiv;
 var decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
 var dec = decipher.update(str[1], 'base64', 'binary');
 dec += decipher.final('binary');

 var data = JSON.parse(dec);
 if (admin.getuserorderwx) {
 admin.getuserorderwx(data, res);
 return;
 }

 });*/
app.get('/rechargeCheck',function(req, res){
	res.json( admin.coverOrderNumber );
});

app.get('/recharge',function(req, res){
	var ips=admin.getClientIp(req);

	//console.info('ips ==>',ips);
	var ifind=0;
	//console.info('req.url ==>',req.url);

	var str = req.url.split("?");

	var key = admin.jsonCfg.alipayKey;
	var iv = admin.jsonCfg.alipayIv;
	var decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
	var dec = decipher.update(str[1], 'base64', 'binary');
	dec += decipher.final('binary');
	var data = JSON.parse(dec);
	console.info('data ==>',data);

	var host ="";// data["urlCall"].split("//");
	var host_ = "";//host[1].split(".");
	var bymid ="";
	if(data['flag'])
	{
		bymid=admin.alipayUrl[data['urlCall']]["byMid"];
		ifind=admin.jsonCfg.wxchargeip.indexOf(ips); //鏌ユ壘鏈夋病鏈夊搴旂殑ips
		//console.info('bymid ==>',bymid);
		/*if(ifind < 0){
			res.json(" state == no this ips");
			return;
		}*/
	}else
	{
		host  = data["urlCall"].split("//");
		host_ = host[1].split(".");
		bymid = admin.alipayUrl[host_[0]]["byMid"];
		/*ifind=admin.jsonCfg.aibeichargeip.indexOf(ips); //鏌ユ壘鏈夋病鏈夊搴旂殑ips
		if(ifind < 0){
			res.json(" state == no this ips");
			return;
		}*/
	}
	/*
	 for(var key in admin.coverOrderNumber){
	 if(admin.coverOrderNumber[key].state == 1){
	 if(Date.now() - admin.coverOrderNumber[key].geTime >= 30 * 60 * 1000){
	 //console.info("----- delete orderNumber over 1 minus ----- " + admin.coverOrderNumber[data["orderNumber"]]);
	 delete admin.coverOrderNumber[key];
	 }
	 }
	 }*/

	// for(var key in admin.coverOrderNumber){
	// 	console.info("------------key " + key + " orcer number " + JSON.stringify(admin.coverOrderNumber[key]));
	// }

	var orderNumber = admin.coverOrderNumber[data["orderNumber"]];
	if (orderNumber) {
		if (orderNumber.state == 0) {
			//console.info("================ success success success success success success");
			orderNumber.state = 1;
		}
		else if (orderNumber.state == 1) {
			//console.info("--------------- return 000000000000000000 orderNumber is payed");
			res.json(" state == 1");
			return;
		}
	}
	else {
		

		res.json(" not exist");
		return;
	}

	var msg = {
		"mid": parseInt(data["mid"]),
		"buyNum": parseInt(data["buyNum"]),
		"buyMoney": parseInt(data["buyMoney"]),
		"buyNote": "支付宝充值",
		"channel":"1",//支付宝
		"buyType": "1",
		"byMid": bymid,
		"byName": "changhao",
		"orderNumber": data["orderNumber"],
		"aliOrderNum": data["aliOrderNum"]
	};


	if(orderNumber.flag =="wxgetorder") {
		msg.buyNote = '微信支付充值';
		msg.channel ='2'; //微信支付
		msg.mid=orderNumber.mid;
		msg.buyNum=orderNumber.buynum;
		msg.buyMoney=orderNumber.money;
		msg.aliOrderNum = data.aliOrderNum;
		admin.opLog(0, ips, 'wxPayUser', msg);
	}else if(orderNumber.flag =="scanpay") {
		msg.buyNote = '扫码支付';
		msg.channel ='3'; //扫码支付
		msg.mid=orderNumber.mid;
		msg.buyNum=orderNumber.buynum;
		msg.buyMoney=orderNumber.money;
		msg.aliOrderNum = data.aliOrderNum;
		admin.opLog(0, ips, 'wxPayUser', msg);
	}else {
		msg.buyNote = '爱贝支付充值';
		msg.channel ='4'; //爱贝支付
		msg.aliOrderNum = data.aiBeiOrderNum;
	}

	if(orderNumber)
	{
		if(orderNumber.buynum != msg.buyNum || orderNumber.money != msg.buyMoney)
		{
			// 写log. 支付宝, 钱数不对应的差值
			admin.doLog('aliOrderNumber: ' + msg.orderNumber, {
					'originBuyNum': orderNumber.buynum, 'nowBuyBuyNum' : msg.buyNum,
					'originBuyMoney' : orderNumber.money,
					'nowBuMoney' : msg.buyMoney, 'mid': msg.mid, 'byMid':msg.byMid, 'orderNumber':msg.orderNumber},
				'moneyBugs.txt');
		}
	}


	if (admin.addMemberMoney) {
		admin.addMemberMoney(msg, res);
		return;
	}


	console.info('msg ==>',msg);

	admin.request("addMemberMoney", {msg: msg},
		function (er, rtn) {
			if (!er && msg.buyMoney && msg.buyMoney > 0) {
				admin.addAccrued(msg.mid, msg.buyNum);
			}
			res.json(rtn);

		}
	);

});



app.get('/balanceLogin', function(req, res) {
	if(admin.jsonCfg.balanceNum && admin.jsonCfg.balanceNum > 1) {
		var str = req.url.split("?");
		//console.info(JSON.stringify(str));
		if (str.length == 2) {
			var msg = {};
			msg.balanceStr = str[1];
			msg.host = req.host;
			admin.doLogin(msg, res, req, true);//false from login.js doLogin, true from adminWeb.js balanceLogin
		} else {
			res.redirect("/login.html");
		}
	} else {
		res.redirect("/login.html");
	}
});

app.get('/setOpenTest', function(req, res) {
	var str = req.url.split("?");

	admin.opLog(0, admin.getClientIp(req), 'setOpenTest', {});

	if(str.length != 2 || str[1] != admin.jsonCfg.openTest) {
		res.end();
		return;
	}

	if(admin.openTest) {
		admin.openTest = false;
	} else {
		admin.openTest = true;
	}

	res.json(1);
});

//在给定的主机和端口上监听请求，这个和node的文档http.Server#listen()是一致的
app.listen( admin.jsonCfg.httpPort );
app.listen( 80 );


process.on('uncaughtException', function (err) {
	console.log("uncaughtException:" + err.errmsg + "\nstack:" + err.stack);
});

//创建一个express应用程序
// var express = require('express');
// var app = express();
// app.get('/', function(req,res){
// 	res.send('hello world');
// });
// app.listen(3000);

//设置view路径和模板
//app.set('views', __dirname + '/views');设置views的文件夹
//app.set('view engine', 'jade');设置express.js所使用的render engine
//设置view文件夹，即模板文件夹，__dirname是node.js里面的全局变量，即取得执行的js所在的路径，另外，
//__filename是目前执行的js文件名
