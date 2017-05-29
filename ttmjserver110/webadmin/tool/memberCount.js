/**
 * Created by lhq on 2016/11/21 0021.
 * 统计每日充值会员数量
 */

var conf = require('../config/' + process.argv[2] + '.json');

var MongoClient = require('mongodb').MongoClient;

MongoClient.connect(conf.mongodbUrl,conf.mongodbPara,function(err, db) {
    if(!db) {
        console.info('db er ' + JSON.stringify(err));
        return;
    }

    console.info('connect to : ' + conf.mongodbUrl);

    var num = 31;
    var day = new Date();

    var totalEscape = {};
    totalEscape._id = 1;
    totalEscape.dayMoney = 1;
    totalEscape.allCount = 1;
    totalEscape.gameCount = 1;
    totalEscape.gameCount3 = 1;
    totalEscape.gameCount7 = 1;
    totalEscape.gameCount15 = 1;
    totalEscape.gameCount30 = 1;
    totalEscape.memberMoney = 1;
    totalEscape.userMoney = 1;
    totalEscape.fillMembersMoney = 1;
    totalEscape.gameMoney = 1;
    totalEscape.gameMoney3 = 1;
    totalEscape.gameMoney7 = 1;
    totalEscape.gameMoney15 = 1;
    totalEscape.gameMoney30 = 1;

    console.info('日期\t充值人数\t活跃\t三日活跃\t七日活跃\t十五日活跃\t30日活跃\t注册数\t充值总额\t钻石总额');

    function countMemberMoney() {
        var count = 0;
        var money = 0;
        var rmb = 0;
        var members = {};

        num--;
        day.setDate(day.getDate() - 1);
        var dd = day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate();

        db.collection("memberMoney" + dd).find().each(function (er, doc) {
            if (doc) {
                if(doc.buyMoney && doc.buyMoney > 0) {
                    if(!members[doc.mid]) {
                        members[doc.mid] = 1;
                        count++;
                    }

                    rmb += doc.buyMoney;
                    money += doc.buyNum;
                }
            } else {
                db.collection("dayLog").findOne({_id:dd}, function(er, rtn) {
                    var totals = 0;
                    var allCount = 0;
                    var gameCount = 0;
                    var gameCount3 = 0;
                    var gameCount7 = 0;
                    var gameCount15 = 0;
                    var gameCount30 = 0;

                    if(rtn) {
                        var keys = Object.keys(rtn);

                        for(var i = 0; i < keys.length; i++) {
                            var key = keys[i];

                            if(!totalEscape[key]) {//结算总数
                                totals += rtn[key];
                            }
                        }

                        allCount = rtn.allCount;
                        gameCount = rtn.gameCount;
                        gameCount3 = rtn.gameCount3 ? rtn.gameCount3 : 0;
                        gameCount7 = rtn.gameCount7 ? rtn.gameCount7 : 0;
                        gameCount15 = rtn.gameCount15 ? rtn.gameCount15 : 0;
                        gameCount30 = rtn.gameCount30 ? rtn.gameCount30 : 0;
                    }

                    console.info(dd + '\t' + count + '\t' + totals + '\t' + gameCount + '\t' + gameCount3 + '\t' + gameCount7 + '\t' + gameCount15 + '\t' + gameCount30 + '\t' + allCount + '\t' + rmb + '\t' + money);

                    if(num > 0) {
                        countMemberMoney();
                    } else {
                        console.info('count finish');
                        db.close();
                    }
                });
            }
        });
    }

    countMemberMoney();
});

