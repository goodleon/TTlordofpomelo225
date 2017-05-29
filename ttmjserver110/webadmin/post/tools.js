module.exports = function (admin)
{
	var fs = require('fs');
	var json2xls = require('json2xls');
    var crypto = require('crypto');

	var  levelFloder = {
		1:"memberui",
		3:"manager",
		4:"researcherui",
		10:"adminui"
	};


	function randomString(len) {
		len = len || 32;
		var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
		var maxPos = $chars.length;
		var pwd = '';
		for (var i = 0; i < len; i++) {
			pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
		}
		return pwd;
	}

	//test.cgbuser

	var rtn = {
		// 下载excel文件  json转excel
		downloadExcelFile:function (req,res)
		{
			if (!admin.checkLevel(req, [1, 3, 4,10])) {
				res.end();
				return;
			}

			var msg = req.body;
			var data = msg.data;
			if(data && data.length)
			{
				var xls = json2xls(data);
				var name = randomString(32) + '.xlsx';
				var floder = levelFloder[admin.getLevel(req)];
				var fileName = './public/' + floder + '/temp/' + name;

				if (!fs.existsSync('./public/' + floder + '/temp/'))
				{
				    fs.mkdirSync('./public/' + floder + '/temp/');
				}

				if (!fs.existsSync(fileName)) {
					fs.writeFileSync(fileName, xls, 'binary');
				}
				//fs.writeFileSync(fileName, xls, 'binary');
				res.json('/'+ floder +'/temp/' + name);
			}
			else
			{
				res.end();
			}
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
		genInternalSign: function(objInput, $key) {
            arrInput = Object.keys(objInput);
            arrInput.sort();
            var strInput = "";
            for (var i = 0; i< arrInput.length; i++) {
                strInput += '&' + arrInput[i] + "=" + objInput[arrInput[i]];
            }

            //trim '&'
            strInput = strInput.replace(/(\&*$)/g,"").replace(/(^&*)/g,"");
            strInput = encodeURIComponent(strInput)

            var genSign = crypto.createHmac('sha1', $key).update(strInput).digest("hex");
            return genSign;
		},
		genGrowthSign: function(objInput, uri) {
            arrInput = Object.keys(objInput);
            arrInput.sort();
            var strInput = "";
            for (var i = 0; i< arrInput.length; i++) {
                strInput += '&' + arrInput[i] + "=" + objInput[arrInput[i]];
            }

            //trim '&'
            strInput = strInput.replace(/(\&*$)/g,"").replace(/(^&*)/g,"");

            strInput = uri + "&" + strInput;
            strInput = encodeURIComponent(strInput)
            
            var access_key = "";
	    if (admin.jsonCfg.growthKey) {
                access_key = admin.jsonCfg.growthKey;
	    }
            genSign = crypto.createHmac('sha1', access_key).update(strInput).digest("hex");
            return genSign;
        }
	};
	return rtn;
};
