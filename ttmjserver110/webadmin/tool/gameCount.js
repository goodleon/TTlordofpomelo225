/**
 * Created by lhq on 2016/11/8 0008.
 * 跑活跃人数的测试程序
 */

var conf = require('../config/' + process.argv[2] + '.json');

var MongoClient = require('mongodb').MongoClient;

MongoClient.connect(conf.mongodbUrl,conf.mongodbPara,function(err, db) {
    if (!db) {
        console.info('db er ' + JSON.stringify(err));
        return;
    }

    console.info('connect to : ' + conf.mongodbUrl);

    var day = new Date();
    day = day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate();

    var allCount = 0;
    var gameCount = {};

    function checkGameCount() {
        //0 3 7 15 30
        if (Object.keys(gameCount).length == 5) {
            console.info('interday update\n' + JSON.stringify({day: day, allCount: allCount, gameCount: gameCount}));
            db.collection("dayLog").update({_id: day}, {
                '$set': {
                    allCount: allCount,
                    gameCount: gameCount[0],
                    gameCount3: gameCount[3],
                    gameCount7: gameCount[7],
                    gameCount15: gameCount[15],
                    gameCount30: gameCount[30]
                }
            }, {upsert:true}, function () {db.close()});
            //db.close();//开启写库，需要删除
        }
    }

    function getGameCount(days) {
        if(days == 0) {
            db.collection("majiangLog").count({lastGameDay:day}, function(er, cnt) {
                if (!er) {
                    gameCount[days] = cnt;
                } else {
                    gameCount[days] = 0;
                }

                checkGameCount();
            });
        } else {
            var dd = new Date();
            dd.setDate(dd.getDate() - days);
            dd = (dd.getFullYear() * 10000 + (dd.getMonth() + 1) * 100 + dd.getDate());

            db.collection("majiangLog").count({lastGameDay:{$gt:dd}}, function(er, cnt) {
                if (!er) {
                    gameCount[days] = cnt;
                } else {
                    gameCount[days] = 0;
                }

                checkGameCount();
            });
        }
    }

    db.collection("cgbuser").count(function (er, rtn) {
        if(!er) {
            allCount = rtn;
        }

        getGameCount(0);
        getGameCount(3);
        getGameCount(7);
        getGameCount(15);
        getGameCount(30);
    });
});