
/**
 * Created by Fanjiahe on 2016/11/15 0015.
 */

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
var dbServer = host;
var db = info[hostname].id;
var url = 'mongodb://' + dbServer + ':27017/' + db;

if(info[hostname].mdbUrl) url=info[hostname].mdbUrl;
// console.log("url:"+url);

module.exports = function ()
{
	var cp = require('child_process');
	var fs = require('fs');
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


	var runCmd = function (cmd, para, opt, endF, errF)
	{
		var tagBuf = new Buffer(0);
		var tagProcess = cp.spawn(cmd, para, opt);
		tagProcess.stdout.on('data', function (data)
		{
			tagBuf = Buffer.concat([tagBuf, data]);
		});
		tagProcess.stdout.on('end', function ()
		{
			endF(tagBuf.toString());
		});
		tagProcess.stdout.on('error', function ()
		{
			errF("error");
		});
	};


	/**
	 * 执行linux命令
	 * @param {string} cmd 命令
	 * @param {function} endF 成功时的回调
	 * @param {function} errF 失败时的回调
	 * */
	var exec = function (cmd, endF, errF)
	{
		wLog('exec', cmd, 'exec');
		cp.exec(cmd, function (err, output, stderr)
		{
			if (err)
			{
				!errF || errF(err);
			}
			else
			{
				endF(output);
			}
		});
	};


	/**
	 * 文件下载
	 * @param {string} savePath 保存路径
	 * @param {string} downloadUrl 下载地址
	 * @param {function} endF 成功时的回调
	 * @param {function} errF 失败时的回调
	 * */
	var downloadFile = function (savePath, downloadUrl, endF, errF)
	{
		//30s超时2次连接
		var cmd = "wget  -T 30 -t 2 -q -P "+ savePath + " " + downloadUrl;
		// console.log('==== downloadFile: ' + cmd);
		exec(cmd,function (str)
		{
			// console.log("downloadFile success: "+downloadUrl);
			!endF || endF(str);
		}, function (err)
		{

			// console.log("!!! download failed: "+downloadUrl);
			wLog('downloadFailed', {downloadUrl:downloadUrl, errMsg:err}, 'downloadFile');
			!errF || errF(err);
		});

	};

	/**
	 * 写log
	 * @param {string} title 前缀标题
	 * @param {object|string} log 日志内容
	 * @param {string} fileName 文件名
	 * @static
	 * */
	var wLog = function (title, log, fileName)
	{
		var date = new Date().Format('yyyy-MM-dd hh:mm:ss:SSSS');
		var str = title + ': ' + date + '  ' + JSON.stringify(log) + '\n';

		if (!fs.existsSync("./logs/"))
		{
			try{
				fs.mkdirSync("./logs/");

			}
			catch (err)
			{

			}
		}
		fs.appendFile("./logs/" + (fileName || title), str,null,function () {
			
		});
	};

	/**
	 * 显示并记录log
	 * @param {string} title 前缀标题
	 * @param {object|string} log 日志内容
	 * @param {string} fileName 文件名
	 * */
	var sLog = function (title, log, fileName)
	{
		var date = new Date();
		var wDate = date.Format('yyyy-MM-dd hh:mm:ss:SSSS');
		var str = title + ': ' + wDate + '  ' + JSON.stringify(log) + '\n';

		if (arguments.length == 1)
		{
			var today = date.Format('yyyy-MM-dd');
			str = JSON.stringify(title) + ': ' + wDate + '\n';
			fileName = today;
			log = '';
		}

		console.log(str);
		wLog(title, log, fileName);
	};



	/**
	 * 压缩tar.gz文件
	 * @param {string} fileName 压缩后的文件名
	 * @param {string} dirName 路径
	 * @param {function} endF 成功时的回调
	 * @param {function} errF 失败时的回调
	 * */
	var compressedFile = function (fileName, dirName, endF, errF)
	{
		var path = __dirname + "/../../";
		exec('cd ' + path + '&&tar zcf ' + fileName + " " + dirName,
			function (str)
			{
				!endF || endF(str);
			},
			function (err)
			{
				wLog('compressedFile', {name: path, errMsg:err}, 'compressedFile');
				!errF || errF(err);
			}
		);
	};


	/**
	 * 解压tar.gz文件
	 * @param {string} srcName: 待解压文件
	 * @param {string} dirName: 目标解压路径
	 * @param {string} desName: 目标名
	 * @param {function} endF 成功时的回调
	 * @param {function} errF 失败时的回调
	 */
	var extractFile = function (srcName, dirName, desName, endF, errF)
	{
		//tar --use-compress-program=pigz -xvpf file.tgz
		// var tarCmd = "cd " + dirName + "&&tar xzvf " +　srcName　+ " -C " + desName;
		var tarCmd = "cd " + dirName + "&&tar --use-compress-program=pigz -xvpf " +　srcName　+ " -C " + desName;
		// console.log("extractFile: "+tarCmd);
		exec(tarCmd,
			function (str)
			{
				!endF || endF(str);
			},
			function (err)
			{
				wLog('extractFile', {name:dirName, errMsg:err}, 'extractFile');
				!errF || errF(err);
			}
		);
	};

	var obj = {
		runCmd: runCmd,
		exec: exec,
		downloadFile: downloadFile,
		wLog: wLog,
		sLog: sLog,
		compressedFile: compressedFile,
		extractFile: extractFile,
		url : url,
		mdbUrl:info[hostname].mdbUrl,
		dbname:db,
		dbServer:dbServer,
		Format : function(obj, fmt)
		{
			var o = {
				"M+": obj.getMonth() + 1,
				"d+": obj.getDate(),
				"h+": obj.getHours(),
				"m+": obj.getMinutes(),
				"s+": obj.getSeconds(),
				"q+": Math.floor((obj.getMonth() + 3) / 3),
				"S": obj.getMilliseconds()
			};
			if (/(y+)/.test(fmt)) {
				fmt = fmt.replace(RegExp.$1, (obj.getFullYear() + "").substr(4 - RegExp.$1.length));
			}
			for (var k in o) {
				if (new RegExp("(" + k + ")").test(fmt)) {
					fmt =
						fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
				}
			}
			return fmt;
		},
		dateOffset : function(date, day)
		{
			day = day || 0;
			var cDate = (typeof  date == 'string') ? new Date(date) : date;
			cDate.setDate(cDate.getDate() + day);
			return Number(cDate.Format('yyyyMMdd'));
		},
		cut : function (str, rules, separator)
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
		},
		/*
		 * 检测对象是否是空对象(不包含任何可读属性)。 //如你上面的那个对象就是不含任何可读属性
		 * 方法只既检测对象本身的属性，不检测从原型继承的属性。
		 */
		isOwnEmpty : function(obj) {
			for (var name in obj) {
				if (obj.hasOwnProperty(name)) {
					return false;
				}
			}
			return true;
		},
		/**
		 * 数组去重
		 * */
		unique : function (array)
		{
			if(array.constructor != Array)
			{
				console.log("只能接收数组类型！！");
				return array;
			}
			var n = {}, r = []; //n为hash表，r为临时数组
			for (var i = 0; i < array.length; i++) //遍历当前数组
			{
				if (!n[array[i]]) //如果hash表中没有当前项
				{
					n[array[i]] = true; //存入hash表
					r.push(array[i]); //把当前数组的当前项push到临时数组里面
				}
			}
			return r;
		},
		/*
		 日期加n天
		 @param {string} dataStr 20161110或2016-11-10
		 @param {number} dayCount 往后几天
		 @param {number} rFormat 返回格式 ''返回20161110 '-'返回2016-11-10
		 */
		dateAddDays:function(dataStr,dayCount, rFormat)
		{
			if(typeof dataStr != 'string' || (dataStr.length != 8 && dataStr.length != 10))
			{
				console.log('typeof dataStr != \'string\' || dataStr.length != 8 && dataStr.length != 10   ', typeof dataStr, dataStr.length);
				return dataStr;
			}
			var strdate = dataStr; //日期字符串
			if(strdate.length == 8)
			{
				strdate = dataStr.substr(0,4) + '-' + dataStr.substr(4,2) + '-' + dataStr.substr(6,2);
			}
			// console.log('strdate  ', strdate);

			var isdate = new Date(strdate);  //把日期字符串转换成日期格式
			isdate = new Date((isdate/1000+(86400*dayCount))*1000);  //日期加1天
			var month = isdate.getMonth()+1;
			var day = isdate.getDate();
			month = month <= 9 ? "0"+month : month;
			day = day <= 9 ? "0"+day : day;
			if(rFormat == undefined || typeof rFormat != 'string')
			{
				rFormat = '-';
			}
			var pdate = isdate.getFullYear()+rFormat+month+rFormat+day;   //把日期格式转换成字符串
			return pdate;
		},
		/*
		 * json排序
		 * @param {string} filed: 排序字段
		 * @param {bool} rev: 从小到大
		 * @param {function} primer: parseInt
		 */
		jsonSort : function (filed, rev, primer) {
			rev = (rev) ? -1 : 1;
			return function (a, b) {
				a = a[filed];
				b = b[filed];
				if (typeof (primer) != 'undefined') {
					a = primer(a);
					b = primer(b);
				}
				if (a < b) { return rev * -1; }
				if (a > b) { return rev * 1; }
				return 1;
			}
		},
	};

	return obj;
};