var adminClient = require('pomelo-admin').adminClient;
var crypto = require('crypto');

module.exports = function()
{
	var fs=require('fs');
	var TopClient = require( './topClient' ).TopClient;

	var jsonCfg = {
		"httpPort":88,
		"gamePort":3005,
		"gameHost":"127.0.0.1",
		"gamePass":"1qaz2wsx3edc"
	}

	jsonCfg = require("./config/" + process.argv[2]);

	this.smsClient = new TopClient({
		'appkey' : jsonCfg.smsAppkey,
		'appsecret' : jsonCfg.smsAppsecret,
		'REST_URL' : 'http://gw.api.taobao.com/router/rest'
	});

	this.smsPhoneCache = {};

	var username = jsonCfg.masterUsername;
	var password = jsonCfg.masterPassword;
	var moduleid = jsonCfg.masterModuleid;
	this.httpClient = require('./httpClient')();
	var client = null;

	var sessionID = Date.now();
	//配置文件
	var cfgServers={};
	this.openTest = false;

	this.doLog = function(t, m, file) {
		var str = new Date();

		str += '(' + Date.now() + '):' + t;
		if(m) str += '\n' + JSON.stringify(m) + '\n';
		if(file) {
			if (!fs.existsSync("./logs/")) {
				fs.mkdirSync("./logs/");
			}
			fs.appendFile("./logs/" + file, str);
		} else {
			console.info(str);
		}
	}

	var master = require('../mjserver/game-server/config/master.json');
	var servers=require('../mjserver/game-server/config/servers.json');
	cfgServers=servers;//load servers json
	var alipayJsonContent = [];

	this.getAlipayJsonCfgContent = function () {
		return alipayJsonContent;
	}

	function setAlipayJsonContent() {
		var result = [];

		result.push({"value": "-1", "text": "请选择充值金额", "selected":true});

		var data_ = alipayJsonCfg.content;
		for(var key in data_){
			var cell = {};

			cell["value"] = key;

			var text = "";

			for(var ke in data_[key]){
				var buyNum=0;
				var givePercentage=0
				if(ke == "buyNum"){
					text += data_[key][ke] + "钻石" + "   "
					buyNum=data_[key][ke];
				}
				else if(ke == "buyMoney"){
					text += data_[key][ke] + "元" + "   ";
				}
				else if(ke == "givePercentage"){
					if(data_[key][ke] > 0){
						text += "赠送" + 100 * data_[key][ke] + "%"+"钻石"+"  ";
						givePercentage=data_[key][ke];
					}
				}

			}

			cell["text"] = text;

			result.push(cell);
		}

		alipayJsonContent = result;
	}

	var noticeJsonCfg = {};//公告

	this.getNoticeJsonCfg = function () {
		return noticeJsonCfg;
	}

	this.setNoticeJsonCfg = function (msg) {
		var admin = this;

		noticeJsonCfg.content = msg;

		fs.writeFile("./notice.json", JSON.stringify(noticeJsonCfg), function(er){
			//console.info(er);
			if(er) return;
			if(admin.jsonCfg.balanceNum && admin.jsonCfg.balanceNum > 1) {
				for (var i = 0; i < admin.jsonCfg.balanceNum; i++) {
					if (i == admin.balanceIndex) {
						continue;
					}

					var port = admin.jsonCfg.httpPort - admin.balanceIndex + i;
					var host = 'localhost';//fix me,当webadmin服务器分布在不同的ip上，需要用req.host
					admin.httpClient.postJson("login/updateJson", {file: './notice.json'}, port, host, function () {
					});
				}
			}
		});
	}

	var alipayJsonCfg = {};
	var wxpayJsonCfg={};
	var wxUserPayJsonCfg={};


	this.getWxProductInfoDetial=function (msg) {

		return wxUserPayJsonCfg.content[msg];
	}

	this.getWxUserPayJsonCfg= function () {
		return wxUserPayJsonCfg;
	}
	this.setWxUserPayJsonCfg = function(msg){
		var admin = this;
		var file = "./wxconfig/default.json";
		fs.writeFile(file, JSON.stringify(msg), function (er)
		{
			wxUserPayJsonCfg=msg;
			if (!er && admin.jsonCfg.balanceNum && admin.jsonCfg.balanceNum > 1) {
				for (var i = 0; i < admin.jsonCfg.balanceNum; i++) {
					if (i == admin.balanceIndex) {
						continue;
					}
					var port = admin.jsonCfg.httpPort - admin.balanceIndex + i;
					var host = 'localhost';//fix me
					admin.httpClient.postJson("login/updateJson", {file: file}, port, host, function () {
					});
				}
			}

		});

	}
	this.getwxpayJsonCfg= function () {
		return wxpayJsonCfg;
	}
	this.setwxpayJsonCfg = function(msg){
		var admin = this;
		var file = "./wxconfig/localhost.json";

		fs.writeFile(file, JSON.stringify(msg), function (er)
		{
			wxpayJsonCfg=msg;
			if (!er && admin.jsonCfg.balanceNum && admin.jsonCfg.balanceNum > 1) {
				for (var i = 0; i < admin.jsonCfg.balanceNum; i++) {
					if (i == admin.balanceIndex) {
						continue;
					}

					var port = admin.jsonCfg.httpPort - admin.balanceIndex + i;
					var host = 'localhost';//fix me
					admin.httpClient.postJson("login/updateJson", {file: file}, port, host, function () {
					});
				}
			}

		});


	}
	this.getAlipayJsonCfg= function () {
		return alipayJsonCfg;
	}

	this.setAlipayJsonCfg = function(msg){
		var admin = this;
		if(process.argv.length>=3&&process.argv[2].indexOf(".json")>0){
			alipayJsonCfg[msg.type]=msg.content;

			var file = "./alipay/"+process.argv[2];

			fs.writeFile(file, JSON.stringify(alipayJsonCfg), function (er) {
				if (!er && admin.jsonCfg.balanceNum && admin.jsonCfg.balanceNum > 1) {
					for (var i = 0; i < admin.jsonCfg.balanceNum; i++) {
						if (i == admin.balanceIndex) {
							continue;
						}

						var port = admin.jsonCfg.httpPort - admin.balanceIndex + i;
						var host = 'localhost';//fix me
						admin.httpClient.postJson("login/updateJson", {file: file}, port, host, function () {
						});
					}
				}

				if(msg.type == "content"){
					setAlipayJsonContent();
				}
			});
		}
	}

	if(process.argv.length>=3&&process.argv[2].indexOf(".json")>0)
	{
		this.configFile = process.argv[2];

		this.mjId = process.argv[2].substr(0,process.argv[2].indexOf('.'));
		this.masterCfg = master[this.mjId];

		jsonCfg=require("./config/" + process.argv[2]);

		noticeJsonCfg=require("./notice.json");

		alipayJsonCfg=require("./alipay/"+process.argv[2]);

		wxpayJsonCfg=require("./wxconfig/localhost.json");

		wxUserPayJsonCfg=require("./wxconfig/default.json");

		setAlipayJsonContent();

		this.pkplayer=servers[this.mjId].pkplayer;

		this.uid2pkplayer=function(uid)
		{
			return this.pkplayer[uid%this.pkplayer.length];
		}

		this.loginServer = servers[this.mjId].login;

		this.accruedData = require('./accrued/' + process.argv[2]);

		this.balanceIndex = 0;
		//负载均衡
		if(jsonCfg.balanceNum && jsonCfg.balanceNum > 1 && process.argv.length>=4) {
			this.balanceIndex = parseInt(process.argv[3]);

			if(this.balanceIndex >= jsonCfg.balanceNum) {
				console.error('adminWeb listen too much port ' + (jsonCfg.httpPort + this.balanceIndex));
				return;
			}

			jsonCfg.httpPort += this.balanceIndex;
		}

		if(this.configFile == 'localhost.json') {//测试环境默认开启test页面
			this.openTest = true;
		}

		//后期为统一数据库配置使用
		/*if(this.configFile == 'localhost.json' && process.argv.length>=5) {

		 if(!master[mjId]) {
		 console.error('adminWeb can not find master config ' + mjId);
		 return;
		 }

		 //根据第五个参数重置jsonCfg的数据
		 jsonCfg.httpPort = jsonCfg[mjId];
		 jsonCfg.gamePort = master[mjId].port;
		 jsonCfg.gameHost = master[mjId].host;
		 jsonCfg.mongodbUrl = 'mongodb://'+master[mjId].host+':27017/'+master[mjId].id;
		 if(master[mjId].mdbUrl) jsonCfg.mongodbUrl=master[mjId].host.mdbUrl;

		 }*/
	}

	function NewClient()
	{
		password=jsonCfg.gamePass;
		client=	new adminClient({	username: username,	password: password,	md5: true	});
		client.connect('browser-' + Date.now(),jsonCfg.gameHost, jsonCfg.gamePort
			, function(err)
			{
				if(err)
				{
					console.error(err);
				} else
				{
					console.info('admin console connected.');
				}
			});
	}

	NewClient();

	this.jsonCfg=jsonCfg;

	this.gameType={
		git:{
			rebate:{
				basic:{sca:0.3, recommend:0, recharge:0},
				firstLevel:{sca:0.4, recommend:4, recharge:1000},
				secondLevel:{sca:0.5, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.3, recommend:0, recharge:0},
				firstLevel:{sca:0.4, recommend:4, recharge:1000},
				secondLevel:{sca:0.5, recommend:10, recharge:1000}
			}
		},
        zhuzhouphz:{//株洲phz
            rebate:{
                basic:{sca:0.16, recommend:0, recharge:0},
                firstLevel:{sca:0.2, recommend:4, recharge:1000},
                secondLevel:{sca:0.24, recommend:10, recharge:1000}
            },
            rebate2:{
                basic:{sca:0.16, recommend:0, recharge:0},
                firstLevel:{sca:0.2, recommend:4, recharge:1000},
                secondLevel:{sca:0.24, recommend:10, recharge:1000}
            }
        },
		hnyymj:{//岳阳
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		psz:{//品三种，热血海南
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		ylgymj:{//弈乐贵阳
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		dzpk:{//德州
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		ljmj:{//辽宁麻将
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		hbmj:{//河北麻将
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		gsmj:{//甘肃麻将
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		nxmj:{//宁夏麻将
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		shmj:{//上海麻将
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		gxphz:{//广西跑胡子
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		henmj:{//河南麻将
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		ahmj:{//安徽麻将
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		xynmmj:{//内蒙麻将
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		hanmj:{//海南麻将
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		ynmj:{//云南麻将
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		fjmj:{//福建麻将
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		jsmj:{//江苏麻将
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		phz:{//跑胡子
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		symj:{//湖南麻将
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		scmj:{//0.16 0.2 0.24->0.3 0.4 0.5//四川麻将
			rebate:{
				basic:{sca:0.3, recommend:0, recharge:0},
				firstLevel:{sca:0.4, recommend:4, recharge:1000},
				secondLevel:{sca:0.5, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.3, recommend:0, recharge:0},
				firstLevel:{sca:0.4, recommend:4, recharge:1000},
				secondLevel:{sca:0.5, recommend:10, recharge:1000}
			}
		},
		jxmj:{//江西麻将
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		sxmj:{//陕西麻将
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		gzmj:{//贵州麻将
			rebate:{
				basic:{sca:0.2, recommend:0, recharge:0},
				firstLevel:{sca:0.3, recommend:4, recharge:1000},
				secondLevel:{sca:0.4, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.2, recommend:0, recharge:0},
				firstLevel:{sca:0.3, recommend:4, recharge:1000},
				secondLevel:{sca:0.4, recommend:10, recharge:1000}
			}
		},
		pdk:{//跑得快
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		ddz:{//斗地主
			rebate:{
				basic:{sca:0.3, recommend:0, recharge:0},
				firstLevel:{sca:0.4, recommend:4, recharge:1000},
				secondLevel:{sca:0.5, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.3, recommend:0, recharge:0},
				firstLevel:{sca:0.4, recommend:4, recharge:1000},
				secondLevel:{sca:0.5, recommend:10, recharge:1000}
			}
		},
		gxmj:{//广西麻将
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		kwx:{//卡五星
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		zjmj:{//浙江麻将
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		gdmj:{//广东麻将
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		sdmj:{//山东麻将
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		},
		shxmj:{//山西麻将
			rebate:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			},
			rebate2:{
				basic:{sca:0.16, recommend:0, recharge:0},
				firstLevel:{sca:0.2, recommend:4, recharge:1000},
				secondLevel:{sca:0.24, recommend:10, recharge:1000}
			}
		}
	};
	this.wxpaykey=   "A1p04nrhfuZ74NMnthfiQ98ZXCe6ytAA";
	this.wxpayiv=    "A1p04nrhfuZ74NMn";

	this.alipayUrl={
		paypal:{
			url:"http://139.129.209.150:8080/trade.php?",
			//url:"http://120.26.234.220/index.php?",
			//url:"http://139.129.209.150:8080/index.php?",
			//url:"http://alipay.happyplaygame.net/index.php?",
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:135790
		},
        zhuzhouphz:{//株洲phz
            //url:"http://120.26.234.220/index.php?",
            url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
            wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
            paypalUrl:"http://paypal.happyplaygame.net/pay.php",
            byMid:13520189350
        },
		hnyymj:{//岳阳
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		psz:{//品三张，热血海南
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		ylgymj:{//弈乐贵阳
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		dzpk:{//德州扑克
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		ljmj:{//辽宁
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		git:{
			url:"http://payment.happyplaygame.net/trade.php?",
			//url:"http://120.26.234.220/index.php?",
			//url:"http://139.129.209.150:8080/index.php?",
			//url:"http://alipay.happyplaygame.net/index.php?",
			//scanUrl:"http://wxpay.happyplaygame.net/scanpay/pay.php?",
			scanUrl:"http://wxdown.happyplaygame.net/scanpay/gitpay.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			byMid:135790
		},
		hbmj:{//河北麻将
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		gsmj:{//甘肃麻将
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		nxmj:{//宁夏麻将
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		shmj:{//上海麻将
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		gxphz:{//广西跑胡子
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		henmj:{//河南麻将
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		ahmj:{//安徽麻将
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		xynmmj:{//内蒙麻将
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		hanmj:{//海南麻将
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		ynmj:{//云南麻将
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		jxmj:{//江西麻将
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		fjmj:{//福建麻将
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		jsmj:{//江苏麻将
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		gzmj:{//贵州麻将
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay2.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		ddz:{//斗地主
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay2.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		scmj:{//四川麻将
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay2.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		}
		,
		phz:{//跑胡子
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		symj:{//湖南麻将

			//url:"http://120.26.234.220/index.php?",
			url:"http://payment.happyplaygame.net/trade.php?", //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		pdk:{//跑得快
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		sxmj:{//陕西麻将
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		gdmj:{//广东麻将
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		sdmj:{//山东麻将
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		gxmj:{//广西麻将
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		kwx:{//卡五星
			//url:"http://120.26.234.220/index.php?",
			url:"http://payment.happyplaygame.net/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			scanUrl:"http://wxdown.happyplaygame.net/scanpay/pay.php?",
			byMid:13520189350
		},
		zjmj:{//浙江麻将
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		},
		shxmj:{//山西麻将
			//url:"http://120.26.234.220/index.php?",
			url:"http://139.129.209.150:8080/trade.php?",  //爱贝支付
			wxUrl:"http://wxpay.happyplaygame.net/agentpay/trade.php?",
			paypalUrl:"http://paypal.happyplaygame.net/pay.php",
			byMid:13520189350
		}
	};
	//sessionid到memberid的映射
	this.sid2member={

	}
	//memberid到sessionid的映射
	this.mid2sid={

	}
	this.deviceCookie2uid = {

	}
	this.uid2deviceCookie = {

	}


	this.coverOrderNumber = {};
	this.IsAdmin=function(member)
	{
		//return  member.adminLevel>2;
		return member.adminLevel == 10;
	}
	this.IsManager=function(member)
	{
		//return  member.adminLevel>=1;
		return (member.adminLevel == 3 || member.adminLevel == 10);
	}
	this.IsMemberManger = function(member){
		return (member.adminLevel >= 1 && member.adminLevel != 2);
	}
	this.IsMember = function (member) {
		return member.adminLevel >= 0;
	}
	this.request=function(cmd,msg,cb)
	{
		msg.cmd=cmd;
		if(cb) client.request(moduleid, msg,cb);
		else client.notify(moduleid, msg);
	}
	this.checkLevel = function(req, levels)
	{
		//console.error(req.url+" | "+member.mid+" "+member.mName)

		//console.info(req.url + "---checkLevel--- " + JSON.stringify(req.body));

		//console.info('checklevel : ' + req.cookies.sessionID);

		if (req.cookies.sessionID){

			var sessionID = req.cookies.sessionID;
			var member = this.sid2member[sessionID];

			if (member){
				for(var i = 0; i < levels.length; i++){
					if(levels[i] == member.adminLevel){
						return true;
					}
				}
			}
		}

		return false;
	};
	this.getLevel = function (req)
	{
		if (req.cookies.sessionID){

			var sessionID = req.cookies.sessionID;
			var member = this.sid2member[sessionID];
			return  member.adminLevel;
		}
		return false;
	};

	this.getMember = function(req) {
		var sessionID = req.cookies.sessionID;

		if(!sessionID) {
			return 0;
		}

		return admin.sid2member[sessionID];
	}

	this.getMemberMid = function (req) {
		var sessionID = req.cookies.sessionID;


		var member = this.sid2member[sessionID];
		if(member){
			return member.mid;
		}
		return "";
	}
	this.getPayOrderNumber = function (id) {
		var admin = this;
		var date = new Date();
		var year = date.getFullYear();
		var month = date.getMonth() + 1;
		var day = date.getDate();
		var hour = date.getHours();
		var min = date.getMinutes();
		var sec = date.getSeconds();

		var cur = "";

		cur += year;

		if(month < 10)cur += "0";

		cur += month;

		if(day < 10)cur += "0";

		cur += day;

		if(hour < 10)cur += "0";

		cur += hour;

		if(min < 10)cur += "0";

		cur += min;

		if(sec < 10)cur += "0";

		cur += sec;

		return id + cur + (1000000 + Math.floor(Math.random() * 8000000));
	}

	this.getDateCommon = function (date) {
		var year = date.getFullYear();
		var month = date.getMonth() + 1;
		var day = date.getDate();
		var hour = date.getHours();
		var min = date.getMinutes();
		var sec = date.getSeconds();

		var cur = "";

		cur += year + "-";

		if (month < 10)cur += "0";

		cur += month + "-";

		if (day < 10)cur += "0";

		cur += day + " ";

		if (hour < 10)cur += "0";

		cur += hour + ":";

		if (min < 10)cur += "0";

		cur += min + ":";

		if (sec < 10)cur += "0";

		cur += sec;

		return cur;
	}
	this.getFormatDate=function(date){
		var date= new Date(date);
		//yyyymmdd
		var year = 0;
		var month = 0;
		var day = 0;
		year = date.getFullYear();
		month = date.getMonth() + 1;
		day = date.getDate();

		var cur = "";
		cur += year;

		if(month >= 10){
			cur += month;
		}
		else {
			cur += "0" + month;
		}

		if(day >= 10){
			cur += day;
		}
		else {
			cur += "0" + day;
		}

		return cur;
	}
	//check activity
	this.checkAccrued = function() {
		var admin = this;
		var data;
		var nowDate = new Date();
		nowDate = nowDate.getFullYear() * 10000 + (nowDate.getMonth() + 1) * 100 + nowDate.getDate();

		if(admin.accruedData.nowId > 0) {
			data = admin.accruedData.list[admin.accruedData.nowId];

			if(data) {
				if(nowDate >= data.begTime && nowDate <= data.endTime) {
					return admin.accruedData.nowId;
				} else {
					admin.accruedData.nowId = 0;
				}
			} else {
				admin.accruedData.nowId = 0;
			}
		}

		for(var id in admin.accruedData.list) {
			data = admin.accruedData.list[id];

			if(nowDate >= data.begTime && nowDate <= data.endTime) {
				admin.accruedData.nowId = id;
				return id;
			}
		}

		admin.accruedData.nowId = 0;
		return 0;
	}
	//add activity
	this.addAccrued = function(mid, money) {
		var admin = this;
		//console.info('addAccrued ' + JSON.stringify({mid:mid, money:money}));
		if(admin.mdb) {
			var id = this.checkAccrued();

			//test
			//id = 7;
			//console.info('addAccrued id = ' + id);
			if(id == 0) {//没有进行中的活动
				return;
			}

			admin.mdb.collection("memberAccrued").findOne({_id:mid}, function(er, doc) {
				if(er) {
					console.info('addAccrued find error ' + JSON.stringify({mid:mid, money:money, er:er}));
					return;
				}

				if(doc) {//update
					if(doc.total[id]) {
						doc.total[id] += money;
					}
					else {
						doc.total[id] = money;
					}

					admin.mdb.collection("memberAccrued").updateOne({_id:mid}, {$set:{total:doc.total}}, function(er, doc) {
						if(er) {
							console.info('addAccrued update error '+ JSON.stringify({mid:mid, money:money, er:er}));
						}
					});
				} else {//insert
					var total = {};
					total[id] = money;

					var msg = {
						_id : mid,
						total : total,
						rew : 0
					};
					admin.mdb.collection("memberAccrued").insertOne(msg, function(er, rtn) {
						if(er) {
							console.info('addAccrued insert error ' + JSON.stringify({mid:mid, money:money, er:er}));
						}
					});
				}
			});
		}
	}

	function sendweixinorder(res,data) {

		//res.json({status:2,time:0,orderNumber:""});
		var string = JSON.stringify(data);
		var key = admin.wxpaykey;
		var iv = admin.wxpayiv;
		var cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
		var crypted = cipher.update(string, 'binary', 'base64');
		crypted += cipher.final('base64');
		//res.json({status:0,time:0,orderNumber:""});
		res.json(crypted);
		return ;
	}
	this.getuserorderwx = function(msg, res) {
		var userid=Number(msg["gameid"]);
		var moneyadd=Number(msg["moneyadd"]);
		var money=Number(msg["money"]);
		var typegame=msg["type"];
		var bymid = admin.alipayUrl[typegame]["byMid"];
		if(userid == 0 || userid >99999999)
		{
			var result = {
				"status": 2,
				"time": "",
				"orderNumber":""

			};
			sendweixinorder(res,result);
			return ;
		}
		if(bymid == userid)
		{
			var result = {
				"status": 2,
				"time": "",
				"orderNumber":""

			};
			sendweixinorder(res,result);
			//res.json({status:2,time:0,orderNumber:""});
			return ;
		}
		//限制充值的额度
		if(moneyadd <= 0 || moneyadd >=3000)
		{
			var result = {
				"status": 2,
				"time": "",
				"orderNumber":""
			};
			//res.json({status:2,time:0,orderNumber:""});
			sendweixinorder(res,result);
			return ;
		}
		var db = admin.mdb;
		if(db)
		{


			//db.collection("members").find({_id:userid}, function(er, doc) {
			db.collection("members").findOne({_id: userid}, function (er, doc) {


				//	console.info(doc);
				if(!doc || doc._id == null) {
					var result = {
						"status": 0,
						"time": "",
						"orderNumber":""

					};
					sendweixinorder(res,result);
					return ;
				}

				if (doc) {
					var time = admin.getDateCommon(new Date());
					var time_ = admin.getDateOrderNumber(new Date());
					var orderNumber = userid + time_ + (1000000 + Math.floor(Math.random() * 8000000));
					admin.coverOrderNumber[orderNumber] =
					{
						state: 0,
						flag: "wxpay",
						mid: userid,
						buynum: moneyadd,
						money: money,
						geTime: Date.now()
					};


					var result = {
						"status": 1,
						"time": time,
						"orderNumber": orderNumber

					};

					sendweixinorder(res, result);
					return;

				}

			});
		}else {

			var result = {
				"status": 2,
				"time": "",
				"orderNumber":""

			};
			//res.json({status:2,time:0,orderNumber:""});
			sendweixinorder(res,result);
			return ;

		}
	}

	this.addMemberMoney = function(msg, res) {

		var admin = this;
		var db = admin.mdb;

		if(db) {
			//console.info('1');
			var day = new Date();
			day = (day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate()) + "";

			db.collection("members").findOne({_id: msg.byMid}, function (e, by) {
				//console.info('2 ' + JSON.stringify(by));
				if(!by) {
					res.json({er:1});
					return;
				}

				if(by.money < msg.buyNum) {
					res.json({er:2});
					return;
				}

				if((msg.buyNum < 0 || msg.buyMoney < 0) && !(by.adminLevel >= 3)) {
					res.json({er:3});
					return;
				}

				var para = {};

				var addNum = msg.buyNum;

				if(addNum < 0) addNum = 0;

				para.$inc = {money: -addNum};

				db.collection("members").update({_id: msg.byMid}, para, function (er, doc) {
					db.collection("members").findOne({_id: msg.mid}, function (err, m) {
						if(!m) {
							res.json({er:4});
							return;

						}

						if(isNaN(msg.buyNum) || isNaN(msg.buyMoney))
						{
							res.json({er:4});
							return;
						}

						para = {};

						if (msg.buyMoney && msg.buyMoney > 0) {
							para.$set = {lastBuyDay: parseInt(day)};
						}

						para.$inc = {
							money: msg.buyNum,
							buyTotal: msg.buyMoney
						};

						db.collection("members").update({_id: msg.mid}, para, function (er, rtn) {
							if (!er && msg.buyMoney && msg.buyMoney > 0) {
								admin.addAccrued(msg.mid, msg.buyMoney);
							}


							res.json(rtn);
							msg.byMoney = by.money - addNum;//补齐余额
							msg.memberMoney = m.money + msg.buyNum;
							msg.buyTotal = m.buyTotal + msg.buyMoney;
							msg.buyTime = new Date();
							if (rtn && rtn.money) msg.money = rtn.money;
							db.collection("memberMoney" + day).insertOne(msg, function () {
								admin.checkMemberDay(day);
							});
						});
					});
				});
			});
		}
	}

	var memberMoneyDay = 0;

	this.checkMemberDay = function(day) {
		//this.doLog('checkMemberDay', {memberMoneyDay:memberMoneyDay, day:day});
		if(!this.mdb) {
			return;
		}
		//this.doLog('checkMemberDay 1');
		if(memberMoneyDay != day) {
			//this.doLog('checkMemberDay 2');
			memberMoneyDay = day;
			this.mdb.collection("memberMoney" + day).createIndex({"mid":1},{"background":1});
			this.mdb.collection("memberMoney" + day).createIndex({"byMid":1},{"background":1});
			//this.doLog('checkMemberDay 3');
		}
	}

	var weixinMoneyDay = 0;

	this.checkWeixinMoneyDay = function(day) {
		//this.doLog('checkMemberDay', {memberMoneyDay:memberMoneyDay, day:day});
		if(!this.mdb) {
			return;
		}
		//this.doLog('checkMemberDay 1');
		if(weixinMoneyDay != day) {
			//this.doLog('checkMemberDay 2');
			weixinMoneyDay = day;
			this.mdb.collection("weixinMoney" + day).createIndex({"mid":1},{"background":1});
			this.mdb.collection("weixinMoney" + day).createIndex({"byMid":1},{"background":1});
			//this.doLog('checkMemberDay 3');
		}
	}
	var userMoneyDay = 0;
	var userCoinDay = 0;

	this.checkUserDay = function() {
		if(!this.mdb) {
			return;
		}

		var day = new Date();
		day = (day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate()) + "";
		//this.doLog('checkUserDay', {userMoneyDay:userMoneyDay, day:day});
		if(userMoneyDay != day) {
			//this.doLog('checkUserDay 1');
			userMoneyDay = day;
			this.mdb.collection("userMoney" + day).createIndex({"uid":1},{"background":1});
			this.mdb.collection("userMoney" + day).createIndex({"byMid":1},{"background":1});
			//this.doLog('checkUserDay 2');
		}
	}

	this.checkCoinDay = function() {
		if(!this.mdb) {
			return;
		}

		var day = new Date();
		day = (day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate()) + "";
		if(userCoinDay != day) {
			userCoinDay = day;
			this.mdb.collection("userCoin" + day).createIndex({"uid":1},{"background":1});
			this.mdb.collection("userCoin" + day).createIndex({"byMid":1},{"background":1});
		}
	}

	function cb(url, val, res, fromBalance) {
		if(fromBalance) {
			res.redirect(url);
		} else {
			if(!val) {
				res.json(val);
			} else {
				res.json(url);
			}
		}
	}

	function getLoginUrl(doc) {
		var rtn = {};

		if(doc.tempUnionId) {
			rtn.val = 1;
			rtn.url = '/newmember/index.html';
			return rtn;
		}

		switch (doc.fromHtml) {
			case 1://member
				if (doc.adminLevel && doc.adminLevel > 2) {
					rtn.val = 0;
					rtn.url = '/login.html';
					return rtn;
				}

				if (doc.adminLevel == 1) {
					rtn.url = '/memberui/manager.html';
					rtn.val = 1;
				} else {
					rtn.url = '/newmember/index.html';
					rtn.val = 1;
				}
				break;
			case 3://manager
				if (doc.adminLevel != 3) {
					rtn.val = 0;
					rtn.url = '/login.html';
					return rtn;
				}
				rtn.url = '/manager/admin.html';
				rtn.val = 1;
				break;
			case 4://Observer
				if (doc.adminLevel != 4) {
					rtn.val = 0;
					rtn.url = '/login.html';
					return rtn;
				}
				rtn.url = '/researcherui/admin.html';
				rtn.val = 1;
				break;
			case 10://admin
				if (doc.adminLevel != 10) {
					rtn.val = 0;
					rtn.url = '/login.html';
					return rtn;
				}

				rtn.url = '/adminui/admin.html';
				rtn.val = 1;
				break;
			default:
				rtn.val = 0;
				rtn.url = '/login.html';
				break;
		}

		return rtn;
	}

	this.enterWeb = function(doc, res, req, fromBalance) {
		function getMinIp() {
			var maxIpNum = 3;
			var minNum = 0;
			var minIp = 0;
			var keys = Object.keys(doc.ips);

			if(keys.length < maxIpNum) {
				return 0;
			}

			for(var i = 0; i < keys.length; i++) {
				if(!minIp) {
					minIp = keys[i];
					minNum = doc.ips[minIp];
				} else if(minNum > doc.ips[keys[i]]) {
					minIp = keys[i];
					minNum = doc.ips[minIp];
				}
			}

			return minIp;
		}

		delete doc.tempSmsCheck;
		var para = {};

		if(doc.tempIp) {
			if(!doc.ips) {
				doc.ips = {};
				doc.ips[doc.tempIp] = 1;
			} else if(doc.ips[doc.tempIp]) {
				doc.ips[doc.tempIp] += 1;
			} else {
				var ip = getMinIp();

				if(ip) {
					delete doc.ips[ip];
				}

				doc.ips[doc.tempIp] = 1;
			}

			para.ips = doc.ips;
			delete doc.tempIp;
		}

		if(doc.tempPhone) {
			doc.mbindphone = doc.tempPhone;
			para.mbindphone = doc.tempPhone;
			para.mprotect = 1;
			para.mobilecode=req.mobilecode;
			delete doc.tempPhone;
		}

		para.mlogtime = Date.now();
		var rtn = getLoginUrl(doc);

		if(!rtn.val) {
			cb(rtn.url, 0,res, fromBalance);
			return;
		}

		this.mdb.collection("members").update({_id: doc._id}, {$set: para}, function (er, doc) {});
		this.opLog(doc._id, this.getClientIp(req), 'login', para);
		cb(rtn.url, rtn.val, res, fromBalance);
	}

	this.checkSmsOpen = function(doc) {
		//openSmsCheck 0不验证，1全部验证，2验证0与2之外的
		if(!jsonCfg.openSmsCheck || (jsonCfg.openSmsCheck == 2 && (!doc.adminLevel || doc.adminLevel == 2))) {
			return false;
		} else {
			return true;
		}
	}

	this.getCryptoPhone = function(doc) {
		var mbindphone = doc.mbindphone;

		if(!mbindphone || mbindphone == "") {
			return "";
		}

		mbindphone = mbindphone + "";
		var myphone = mbindphone.substr(3, 4);
		return mbindphone.replace(myphone, "****");
	}

	this.doLogin = function(msg, res, req, fromBalance) {
		var admin = this;
		function LoginOK()
		{


			var mid = msg.mid;
			var doc = msg.doc;


			doc.tempFromBalance = fromBalance;

			doc.ip = admin.getClientIp(req);//用.的ip记录，给后续使用
			var loginDiff = 7 * 24 * 60 * 60 * 1000;//7天不登录的需要验证
			var time = Date.now();

			if (admin.configFile == 'localhost.json') {//兼容内网登录
				if (!doc.adminLevel || doc.adminLevel <= 2) {
					msg.fromHtml = 1;
				} else {
					msg.fromHtml = doc.adminLevel;
				}
			}

			doc.fromHtml = msg.fromHtml;
			var rtn = getLoginUrl(doc);

			if(!rtn.val) {
				cb(rtn.url, 0, res, fromBalance);
				return;
			}

			sessionID += 1 + Math.floor(Math.random()*10000);//每次登录随机sessionID
			var randChar = ['i', 'n', 'm', 'i8', 'ug', 'kv', 'ddg'];
			var index = Math.floor(Math.random() * randChar.length);
			var sid = admin.cryptoMemberPass(randChar[index] + sessionID);
			//console.info('sid = ' + sid);
			//映射 mid->sid sid->member
			var oldSid = admin.mid2sid[mid];

			if (oldSid) {
				delete admin.sid2member[oldSid];
			}//每次登录后删除前一次member

			admin.sid2member[sid] = doc;

			if (doc.adminLevel > 0 || doc.adminLevel < 0) {}
			else doc.adminLevel = 0;

			admin.mid2sid[mid] = sid;

            if(0 == doc.adminLevel|| 2 == doc.adminLevel) {
                res.cookie('sessionID', sid, { maxAge: 3600000*8 });
            } else {
                res.cookie('sessionID', sid, { maxAge: 7200000 });
            }

			if(doc.tempUnionId) {//微信用户

				admin.enterWeb(doc, res, req);//进入
				return;
			}

			if(doc.forcePass) {

				cb('/qzxgmm.html', 2, res, fromBalance);//强制修改密码
			} else {
				//进入手机验证流程
				if(req.body.types == 1)//微信进来的登录
				{
					admin.enterWeb(doc, res, req);//进入
					return;
				}
				if(!admin.checkSmsOpen(doc)) {
					admin.enterWeb(doc, res, req);//进入
					return;
				}

				if (!doc.mbindphone) {//没有绑定手机号，没有保护也要绑定手机
					doc.tempSmsCheck = 1;
					cb('/phonebind.html', 3, res, fromBalance);//绑定手机
				} else if(!doc.mprotect && !jsonCfg.forceSmsCheck) {//没有开启保护
					admin.enterWeb(doc, res, req);//进入
				} else if(!doc.mlogtime || !doc.ips || time - doc.mlogtime >= loginDiff || !doc.ips[doc.tempIp]) {
					//超过七天或者非常用IP登录

					var alreadyCheckSms = false;
					if(req.cookies && req.cookies.deviceID && admin.deviceCookie2uid[req.cookies.deviceID]) {
                        alreadyCheckSms = true;
                    }

					if( (0 == doc.adminLevel|| 2 == doc.adminLevel) && alreadyCheckSms) {
						//不效验短信
                        admin.enterWeb(doc, res, req, fromBalance);//进入
					} else {
                        doc.tempSmsCheck = 2;
                        var myphone = admin.getCryptoPhone(doc);
                        cb('/phoneidenty.html?p=' + myphone, 3, res, fromBalance);//手机验证
					}
				} else {
					admin.enterWeb(doc, res, req, fromBalance);//进入
				}
			}
		}

		if(admin.jsonCfg.balanceNum && admin.jsonCfg.balanceNum > 1) {
			if (msg.balanceStr) {
				var decipher = crypto.createDecipher('aes-256-cbc', admin.jsonCfg.balanceKey);
				var dec = decipher.update(msg.balanceStr, 'hex', 'binary');
				dec += decipher.final('binary');
				dec = unescape(dec);
				//admin.doLog('decode', dec);
				var data = JSON.parse(dec);

				//admin.doLog('decode', data);

				if(typeof(data) != 'object') {
					cb('/login.html', 0, res, fromBalance);
					return;
				}

				for (var id in data) {
					msg[id] = data[id];
				}

				delete msg.balanceStr;
			}

			if(!msg.host || !msg.mid || !msg.doc || msg.mid != msg.doc.mid) {
				cb('/login.html', 0, res, fromBalance);
				return;
			}

			var index = msg.mid % admin.jsonCfg.balanceNum;
			var host = 'http://' + msg.host + ':';

			delete msg.host;

			//admin.doLog('index', {index: index, admin: admin.balanceIndex, host: host});

			if (index != admin.balanceIndex) {//redirect
				var string = JSON.stringify(msg);
				string = escape(string);
				var cipher = crypto.createCipher('aes-256-cbc', admin.jsonCfg.balanceKey);
				var crypted = cipher.update(string, 'binary', 'hex');
				crypted += cipher.final('hex');
				var url = host + (admin.jsonCfg.httpPort + index - admin.balanceIndex) + '/balanceLogin?' + crypted;

				//admin.doLog('encode', {str:string, url:url});

				cb(url, url, res, fromBalance);
				return;
			}
		}
		LoginOK();
	}

	this.cryptoMemberPass = function(pass) {
		var sha1 = crypto.createHash('sha1');
		sha1.update(pass);
		sha1.update(admin.jsonCfg.balanceKey);
		return sha1.digest('hex');
	}

	this.updateJson =  function(file) {
		if(file == './accrued/' + this.configFile) {
			delete require.cache[require.resolve(file)];
			this.accruedData = require(file);
			//this.doLog(file, this.accruedData);
		} else if(file == './alipay/' + this.configFile) {
			delete require.cache[require.resolve(file)];
			alipayJsonCfg = require(file);
			setAlipayJsonContent();
			//this.doLog(file, alipayJsonCfg);
		} else if(file == './notice.json') {
			delete require.cache[require.resolve(file)];
			noticeJsonCfg = require(file);
		}else if(file == './wxconfig/localhost.json') {
			delete require.cache[require.resolve(file)];
			wxpayJsonCfg = require(file);
		}else if(file == './wxconfig/default.json') {
			delete require.cache[require.resolve(file)];
			wxUserPayJsonCfg = require(file);
		}
	}

	this.saveAccruedFile = function() {
		var admin = this;
		var file = "./accrued/" + admin.configFile
		fs.writeFile(file, JSON.stringify(this.accruedData), function(er) {
			if(er) {
				console.info('saveAccrued ' + JSON.stringify([er, act]));
			} else if(admin.jsonCfg.balanceNum && admin.jsonCfg.balanceNum > 1) {
				for(var i = 0; i < admin.jsonCfg.balanceNum; i++) {
					if(i == admin.balanceIndex) {
						continue;
					}

					var port = admin.jsonCfg.httpPort - admin.balanceIndex + i;
					var host = 'localhost';//fix me,当webadmin服务器分布在不同的ip上，需要用req.host
					admin.httpClient.postJson("login/updateJson", {file: file}, port, host, function () {});
				}
			}
		});
	}

	this.syncActionData = function(actId, type) {
		var cfg = master[this.mjId];

		if(!cfg.actServer) {
			return;
		}

		var num = cfg.actServer.num;

		if(!num) {
			num = 1;
		}

		var para = {};
		para.actId = actId;
		para.type = type;

		for(var i = 0; i < num; i++) {
			var port = cfg.actServer.port + i;
			var host = cfg.host;//fix me,当webadmin服务器分布在不同的ip上，需要用req.host
			this.httpClient.postJson("update/update", para, port, host, function () {});
		}
	}

	this.getActionFile = function(req) {
		var host = req.host.split(".");
		var mj = host[0];

		var path = "../mjserver/web-server/public/" + mj + "/action.json";
		var filePath = __dirname + "/" + path;

		if (!fs.existsSync(filePath)) {
			fs.writeFileSync(filePath, '[]');
		}

		delete require.cache[require.resolve(path)];

		var json = require(path);

		return {json: json, filePath: filePath};//post/admin.js use path
	}
	this.getGameFreefile = function(req) {
		var host = req.host.split(".");
		var mj = host[0];

		var path = "../mjserver/web-server/public/" + mj + "/gamefree.json";
		var filePath = __dirname + "/" + path;

		if (!fs.existsSync(filePath)) {
			fs.writeFileSync(filePath, '{}');
		}

		delete require.cache[require.resolve(path)];

		var json = require(path);

		return {json: json, filePath: filePath};//post/admin.js use path
	}
	this.getClientIp = function(req) {
		var ip = req.headers['x-forwarded-for'];

		if(typeof ip == 'string') {
			if(ip.indexOf(',') > 0) {
				ip = ip.substr(0, ip.indexOf(','));
			}
		} else {
			ip = req.connection.remoteAddress || req.socket.remoteAddress;
		}

		if(!ip) {
			ip = '0.0.0.0';
		}

		return ip;
	}

	var opLogDay = 0;
	//var opLogCache = [];
	//var opLogCacheLimit = 100;//如果缓存，重启怎么办???

	this.opLog = function(mid, ip, type, args) {
		var admin = this;
		var day = new Date();
		day = (day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate()) + "";
		var tb = 'opLog' + day;
		var logData = {};
		logData.mid = mid;
		logData.type = type;
		logData.ip = ip;
		logData.time = Date.now();
		logData.args = args;

		admin.mdb.collection(tb).insertOne(logData, function(er, rtn) {

			if(er) {
				return;
			}
			if(opLogDay != day) {

				opLogDay = day;
				admin.mdb.collection(tb).createIndex({"mid":1},{"background":1});
				admin.mdb.collection(tb).createIndex({"type":1},{"background":1});
				admin.mdb.collection(tb).createIndex({"ip":1},{"background":1});
				admin.mdb.collection(tb).createIndex({"time":1},{"background":1});
			}
		});
	}

	if(jsonCfg.mongodbUrl&&jsonCfg.mongodbPara)
	{
		var admin=this;
		var MongoClient = require('mongodb').MongoClient;
		MongoClient.connect(jsonCfg.mongodbUrl,jsonCfg.mongodbPara,function(err, db)
		{
			if(db)
			{
				admin.mdb=db;
				console.info("db connect to" + jsonCfg.mongodbUrl);
				console.info("webAdmin listen on " + jsonCfg.httpPort);
			}
		});
		var sub = process.argv[2].split('.');//jsonCfg.mongodbUrl.split('/');
		if(sub[0] == 'localhost')
		{
			sub[0] = 'test';
		}
		admin.dbName = sub[0];
		/*MongoClient.connect("mongodb://10.28.88.165:27017/"+sub[sub.length-1],jsonCfg.mongodbPara,function(err, db)
		 {
		 if(db)
		 {
		 admin.dataCenterDb=db;
		 console.info("db connect to 10.28.88.165");
		 console.info("webAdmin listen on " + jsonCfg.httpPort);
		 }
		 });*/
	}
}
