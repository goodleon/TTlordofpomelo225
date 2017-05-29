/**
 * Created by lhq on 2016/10/08 0001.
 * 统计会员/玩家剩余钻石并写入dayLog memberMoney userMoney
 */

var conf = require('../config/' + process.argv[2] + '.json');

var MongoClient = require('mongodb').MongoClient;

var memberCount = 0;
var userCount = 0;

var memberMoney = 0;
var userMoney = 0;

MongoClient.connect(conf.mongodbUrl,conf.mongodbPara,function(err, db) {
    if(!db) {
        console.info('db er ' + JSON.stringify(err));
        return;
    }

    console.info('connect to : ' + conf.mongodbUrl);

    var day = new Date();
    day = day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate();

    function updatedb() {
        db.collection("dayLog").update({_id:day}, {$set:{memberMoney:memberMoney, userMoney:userMoney}}, {upsert:true}, function(er, rtn) {
            db.close();
            console.info('dayLog update finish : ' + JSON.stringify({er:er, rtn:rtn}));
        });
    }

    function countMemberMoney() {
        db.collection("members").find().each(function (er, m) {
            if (m) {
                if(m.money && (!m.adminLevel || m.adminLevel == 2)) {
                    memberMoney += m.money;
                }

                memberCount++;
            } else {
                console.info('memberMoney : ' + memberMoney + ' , memberCount : ' + memberCount);
                countUserMoney();
            }
        });
    }

    function countUserMoney() {
        db.collection("majiang").find().each(function (er, u) {
            if (u) {
                if(u.money) {
                    userMoney += u.money;
                }

                userCount++;
            } else {
                console.info('userMoney : ' + userMoney + ' , userCount : ' + userCount);
                updatedb();
            }
        });
    }

    countMemberMoney();
});
