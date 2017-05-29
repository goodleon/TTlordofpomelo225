/**
 * Created by hjf on 2016/12/25.
 * 执行： node memberMoney.js
 */

var fs = require('fs');
var cp = require("child_process");
var tools = require("../tools")();
var projName = tools.dbname;
var dbServer = tools.dbServer;

cp.exec('mkdir -p ' + projName);
var keyword = 'mid,buyNum,buyMoney,buyTotal,buyTime,buyNote,buyType,byMid,byName,orderNumber,aliOrderNum,byMoney,memberMoney';
function runStatic() {
    var str = "";
    var cmd = 'mongoexport --csv -h '+dbServer+' -f '+keyword+' -d '+projName+' -c memberMoney'+str+' -o ./'+projName+'/memberMoney'+str+'.csv';
    console.log("memberMoney：", cmd);
    cp.exec(cmd, function (error, stdout, stderr) {
        if (error) {
            console.log(error.stack);
            console.log('Error code: ' + error.code);
            console.log('Signal received: ' + error.signal);
        }
    });
}

runStatic();