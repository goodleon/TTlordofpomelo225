/**
 * Created by HJF on 2016/11/29 0029.
 */

var os = require('os');
var fs = require('fs');
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
console.log("url:"+url);


module.exports = function ()
{
    return{
        dcsIp:"106.14.20.195",//dataCenterServer
        dcsPort:900,
        url : url,
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
        * a数组是否包含所有b数组
        * */
        isHaveElement:function(a,b)
        {
            if (a.length < b.length || a.length == 0 || b.length == 0)
                return false;

            for (var i = 0; i < b.length; i++) {
                if (a.indexOf(b[i]) == -1)
                    return false;
            }
            return true;
        },
        /*
         * a数组完全没有b数组
         * */
        isNoElement:function(a,b)
        {
            for(var i = 0; i < b.length; i++)
            {
                if(a.indexOf(b[i]) >= 0)
                    return false;
            }
            return true;
        },
        wLog:function (title, log, fileName)
        {
            var date = this.Format(new Date(),'yyyy-MM-dd hh:mm:ss:SSSS');
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
        }
    }

};