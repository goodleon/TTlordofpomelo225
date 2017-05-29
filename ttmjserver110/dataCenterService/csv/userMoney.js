/**
 * Created by hjf on 2016/12/25.
 * 执行： node userMoney.js
 */

var fs = require('fs');
var cp = require("child_process");
var tools = require("../tools")();
var projName = tools.dbname;
var dbServer = tools.dbServer;


cp.exec('mkdir -p ' + projName);
var keyword = 'uid,buyNum,buyMoney,buyNote,buyType,byMid,byName,adminLevel,money,userMoney,buyTime';
function runStatic() {
    var str = "";
    var cmd = 'mongoexport --csv  -h '+dbServer+' -f '+keyword+' -d '+projName+' -c userMoney'+str+' -o ./'+projName+'/userMoney'+str+'.csv';
    console.log("userMoney：", cmd);
    cp.exec(cmd, function (error, stdout, stderr) {
        if (error) {
            console.log(error.stack);
            console.log('Error code: ' + error.code);
            console.log('Signal received: ' + error.signal);
        }
    });
}

runStatic();