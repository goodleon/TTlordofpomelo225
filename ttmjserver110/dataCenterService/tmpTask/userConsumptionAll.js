/*
用户买钻汇总
运行: node userConsumptionAll.js 'scmj'
 */
module.exports = function(hostname, day, endF, errF)
{
    var serverInfo = require('./../config.json');
    var dbIp = serverInfo.db.ip+':'+serverInfo.db.port;
    var dbUrl = "mongodb://"+dbIp+"/"+hostname;
    require('mongodb').MongoClient.connect(dbUrl, function (er, db) {
        if (!db) {
            console.log(dbUrl + "connect ERROR!!!");
            return;
        }
        var allUser = {};
        var total = {
            "buyNum": 0,//充钻人数
            "buyCount": 0,//充钻次数
            "buyDiamonds": 0,//购买钻石
            "userDiamonds": 0,//钻石余额
            "giveDiamonds": 0,//赠送钻石
            "giveCount": 0,//赠送次数
            "giveNum": 0//赠钻人数
        };
        function  initAllUser(month) {
            if(allUser[month])return;
            allUser[month] = {
                "buyNum": 0,//充钻人数
                "buyCount": 0,//充钻次数
                "buyDiamonds": 0,//购买钻石
                "userDiamonds": 0,//钻石余额
                "giveDiamonds": 0,//赠送钻石
                "giveCount": 0,//赠送次数
                "giveNum": 0//赠钻人数
            };
        }
        db.collection('userConsumption').find().each(function (er, doc) {
            if(doc)
            {

                var sDay = doc._id.toString();
                var month = sDay.substr(0,6);
                initAllUser(month);

                if(typeof doc.buyNum != 'number' || isNaN(doc.buyNum))
                {
                    doc.buyNum = 0;
                }
                if(typeof doc.buyCount != 'number' || isNaN(doc.buyCount))
                {
                    doc.buyCount = 0;
                }
                if(typeof doc.buyDiamonds != 'number' || isNaN(doc.buyDiamonds))
                {
                    doc.buyDiamonds = 0;
                }
                if(typeof doc.userDiamonds != 'number' || isNaN(doc.userDiamonds))
                {
                    doc.userDiamonds = 0;
                }
                if(typeof doc.giveDiamonds != 'number' || isNaN(doc.giveDiamonds))
                {
                    doc.giveDiamonds = 0;
                }
                if(typeof doc.giveCount != 'number' || isNaN(doc.giveCount))
                {
                    doc.giveCount = 0;
                }
                if(typeof doc.giveNum != 'number' || isNaN(doc.giveNum))
                {
                    doc.giveNum = 0;
                }
                doc.buyNum = parseInt(doc.buyNum);
                doc.buyCount = parseInt(doc.buyCount);
                doc.buyDiamonds = parseInt(doc.buyDiamonds);
                doc.userDiamonds = parseInt(doc.userDiamonds);
                doc.giveDiamonds = parseInt(doc.giveDiamonds);
                doc.giveCount = parseInt(doc.giveCount);
                doc.giveNum = parseInt(doc.giveNum);

                allUser[month].buyNum += doc.buyNum;
                allUser[month].buyCount += doc.buyCount;
                allUser[month].buyDiamonds += doc.buyDiamonds;
                allUser[month].userDiamonds += doc.userDiamonds;
                allUser[month].giveDiamonds += doc.giveDiamonds;
                allUser[month].giveCount += doc.giveCount;
                allUser[month].giveNum += doc.giveNum;

                total.buyNum += doc.buyNum;
                total.buyCount += doc.buyCount;
                total.buyDiamonds += doc.buyDiamonds;
                total.userDiamonds += doc.userDiamonds;
                total.giveDiamonds += doc.giveDiamonds;
                total.giveCount += doc.giveCount;
                total.giveNum += doc.giveNum;


                /*if(hostname == 'phz' && month == '201607')
                {
                    console.log("赠钻 doc.giveDiamonds, doc.giveCount, doc.giveNum",doc.giveDiamonds, doc.giveCount, doc.giveNum);
                }*/
            }
            else
            {
                var title = "月份,充钻人数,充钻次数,购买钻石,钻石余额,赠送钻石,赠送次数,赠钻人数";
                console.log(hostname);
                console.log(title);
                for(var month in allUser)
                {
                    var data = allUser[month];
                    // console.log(month, data.buyNum, data.buyCount, data.buyDiamonds, data.userDiamonds, data.giveDiamonds, data.giveCount, data.giveNum);
                    console.log(month+','+data.buyNum+','+data.buyCount+','+data.buyDiamonds+','+data.userDiamonds+','+data.giveDiamonds+','+data.giveCount+','+data.giveNum);
                }
                console.log('合计'+','+total.buyNum+','+total.buyCount+','+total.buyDiamonds+','+total.userDiamonds+','+total.giveDiamonds+','+total.giveCount+','+total.giveNum);

                console.log("完成");
                db.close();
            }
        });
    });

}


var userConsumptionAll = require('./userConsumptionAll.js');
userConsumptionAll(process.argv[2]);