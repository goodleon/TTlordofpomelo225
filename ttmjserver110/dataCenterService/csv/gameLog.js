/**
 * Created by hjf on 2016/12/25.
 * 执行： node gameLog.js 'gzmj'
 */

 var fs = require('fs');
var cp = require("child_process");
var projName = process.argv[2];


var Format = function(obj, fmt)
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
}
//从头开始跑的逻辑
var date = new Date('2016-10-27');
var today = Format(new Date(),'yyyyMMdd');
today = parseInt(today);

cp.exec('mkdir -p ' + projName);
function runStatic() {
    var str = Format(date, 'yyyyMMdd') + "";

    if (parseInt(str) >= today) {
        console.info('static end');
        return;
    }

    var cmd = 'mongoexport --csv -f uid1,uid2,uid3,uid4,winall1,winall2,winall3,winall4,money,time -d '+projName+' -c gameLog'+str+' -o ./'+projName+'/gameLog'+str+'.csv';
    console.log("gameLog：", cmd);
    cp.exec(cmd, function (error, stdout, stderr) {
        if (error) {
            console.log(error.stack);
            console.log('Error code: ' + error.code);
            console.log('Signal received: ' + error.signal);
        }
        date.setDate(date.getDate() + 1);
        runStatic();
    });
}

runStatic();