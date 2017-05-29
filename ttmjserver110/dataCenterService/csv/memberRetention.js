/**
 * Created by hjf on 2016/12/25.
 * 执行： node memberRetention.js
 */

var fs = require('fs');
var cp = require("child_process");
var tools = require("../tools")();
var projName = tools.dbname;
var dbServer = tools.dbServer;


cp.exec('mkdir -p ' + projName);
var keyword = '_id,count,dailyLiving';
function runStatic() {
    var str = "";
    var cmd = 'mongoexport --csv  -h '+dbServer+' -f '+keyword+' -d '+projName+' -c memberRetention'+str+' -o ./'+projName+'/memberRetention'+str+'.csv';
    // var cmd = 'mongoexport --csv  -h '+dbServer+' -d '+projName+' -c memberRetention'+str+' -o ./'+projName+'/memberRetention'+str+'.csv';
    console.log("memberRetention：", cmd);
    cp.exec(cmd, function (error, stdout, stderr) {
        if (error) {
            console.log(error.stack);
            console.log('Error code: ' + error.code);
            console.log('Signal received: ' + error.signal);
        }
    });
}

runStatic();