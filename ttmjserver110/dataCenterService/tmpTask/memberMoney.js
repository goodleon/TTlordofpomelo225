/**
 * Created by HJF on 2017/04/27 0022.
 * 跨时间段统计0、2级会员充值、充钻
 * memberMoney20161014 --> xxx.csv
 */
module.exports = function(start,end,dbName)
{
    if(typeof start != 'string' || typeof end != 'string') {
        console.info('typeof day  must be string !!');
        return;
    }
    if(start.length != 8 || end.length != 8){
        console.info('day\'s format invaid !!');
        return;
    }

    var tools = require("./../tools")();
    var fs = require('fs');
    var serverInfo = require('./../config.json');
    // console.log("dbName>>>>>>>>>>>>>",dbName);
    dbName = dbName||tools.dbname;
    var dbUrl = 'mongodb://' + tools.dbServer +':' +serverInfo.db.port + '/' + dbName;
    if(tools.mdbUrl)
    {
        dbUrl = tools.mdbUrl;
    }
    var sStart = start.substr(0,4)+'-'+start.substr(4,2)+'-'+start.substr(6,2);
    var sEnd = end.substr(0,4)+'-'+end.substr(4,2)+'-'+end.substr(6,2);
    var date = new Date(sStart);
    var today = parseInt(end);
    console.log('sStart, sEnd, dbUrl', sStart, sEnd, dbUrl);
    var savePath = __dirname+"/tmpLogs/";
    tools.exec('rm -f '+savePath+'*',function () {
        // console.log('rm -f ./logs/* 成功');
    },function () {
        console.log('rm -f .'+savePath+' 失败');
    });
    var wLog = function (log, fileName)
    {
        if (!fs.existsSync(savePath))
        {
            try
            {
                fs.mkdirSync(savePath);
            }
            catch (err)
            {
            }
        }
        fs.appendFile(savePath + fileName, log+"\n", function () {});
    };
    //容错&&指数转int
    function indexToInt(num,day)
    {
        var tNum = 0;
        if(typeof num == 'number' && num > 0)
        {
            tNum = parseInt(Number(num));
            //容错
            if(tNum > 100000000)
            {
                console.log("容错 day,num,tNum",day,num,tNum);
                tNum = 500000;

            }
        }
        return tNum;
    }

    require('mongodb').MongoClient.connect(dbUrl, function (er, db)
    {

        if(!db)
        {
            console.log(dbUrl+" connect ERROR!!!");
            return;
        }
        var midObj = {};
        db.collection("members").find({adminLevel:{$nin:[1,3,10]}},{mName:1,mbindphone:1}).each(function (err, doc) {
            if(doc)
            {
                var uid = doc._id;
                if(uid)
                {
                    if(!midObj[uid])
                    {
                        midObj[uid] = {};
                    }
                    midObj[uid].name = doc.mName;
                    midObj[uid].phone = doc.mbindphone;
                    midObj[uid].buyMoney = 0;
                    midObj[uid].buyNum = 0;
                }
            }
            else
            {
                // console.log("Object.keys(midObj).length",Object.keys(midObj).length);
                runStatic();
            }
        });
        function userInfo() {

            console.info('==========统计============', dbName,start, end);
            // var name = (serverInfo.server[dbName].cn||dbName)+".csv";
            var name = dbName + ".csv";//en
            var FLAG = ",\t";
            var index = 0;
            wLog("序号"+FLAG+"ID"+FLAG+"名字"+FLAG+"手机号"+FLAG+"充值金额"+FLAG+"钻石数量",name);
            var objKeys = Object.keys(midObj);
            objKeys = objKeys.sort(function (a,b) {
                return midObj[b].buyMoney  - midObj[a].buyMoney;
            });
            var buyMoney = 0;
            var buyNum = 0;
            for(var i = 0; i < objKeys.length; i++){
                var uid = objKeys[i];
                var obj = midObj[uid];
                if(obj.buyMoney > 0)//buyMoney > 0的统计
                {
                    index++;
                    var content = ""+index+FLAG
                        +uid+FLAG
                        +obj.name+FLAG
                        +obj.phone+FLAG
                        +obj.buyMoney+FLAG
                        +obj.buyNum+FLAG;
                    buyMoney += obj.buyMoney;
                    buyNum += obj.buyNum;
                    wLog(content,name);
                }
            }
            var content2 = "合计"+FLAG
                +""+FLAG
                +""+FLAG
                +""+FLAG
                +buyMoney+FLAG
                +buyNum+FLAG;
            wLog(content2,name);
            console.info('>>>>>>>>>已写入 '+savePath+name);

        }
        function runStatic() {
            var day = tools.Format(date, 'yyyyMMdd');

            if (parseInt(day) > today) {
                userInfo();
                db.close();
                return;
            }

            var memberMoneyDay = 'memberMoney'+day;
            db.collection(memberMoneyDay).find({},{mid:1, buyMoney:1, buyNum:1}).each(function (err, doc) {
                if(doc)
                {
                    var uid = doc.mid;
                    if(uid&&midObj[uid])
                    {
                        midObj[uid].buyMoney += indexToInt(doc.buyMoney,day);
                        midObj[uid].buyNum += indexToInt(doc.buyNum,day);
                    }
                }
                else
                {
                    date.setDate(date.getDate() + 1);
                    runStatic();
                }
            });

        }

    });
}


/*
 1:跑指定日期和项目
 node memberMoney.js '20161201' '20161231' 'scmj'
 2:跑指定日期 项目读hostname
 node memberMoney.js '20161201' '20161231'
*/

// console.log("process.argv>>>>>>>>>>>>>",process.argv);
var memberMoney = require('./memberMoney.js');
var start = process.argv[2];
var end = process.argv[3];
var dbName = process.argv[4];
memberMoney(start,end,dbName);

