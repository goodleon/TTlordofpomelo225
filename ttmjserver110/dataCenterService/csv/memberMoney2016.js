/**
 * Created by hjf on 2016/12/25.
 * 执行： node memberMoney2016.js
 */

var fs = require('fs');
var cp = require("child_process");
var tools = require("../tools")();
var projName = tools.dbname;
var dbServer = tools.dbServer;


//从头开始跑的逻辑
var date = new Date('2016-7-1');
var today = tools.Format(new Date(),'yyyyMMdd');
today = parseInt(today);

cp.exec('mkdir -p ' + projName);
var keyword = 'mid,buyNum,buyMoney,buyTotal,buyTime,buyNote,buyType,byMid,byName,orderNumber,aliOrderNum,byMoney,memberMoney';
function runStatic() {
    var str = tools.Format(date, 'yyyyMMdd') + "";

    if (parseInt(str) >= today) {
        console.info('static end');
        return;
    }

    var cmd = 'mongoexport --csv  -h '+dbServer+' -f '+keyword+' -d '+projName+' -c memberMoney'+str+' -o ./'+projName+'/memberMoney'+str+'.csv';
    console.log("memberMoney2016：", cmd);
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