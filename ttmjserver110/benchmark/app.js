/**
 *       Filename:  app
 *    Description:
 *         Author:  liuyoubin@happyplaygame.net
 *        Created:  2017年05月04日 15:48
 *     Copyright (c) 2017, happyplaygame.net All Rights Reserved
 */

var Pomelo = require("pomelo-nodejsclient-websocket");

for (var i = 0; i < 1000; i++) {
    mock();
}

function mock() {
    var pomelo = new Pomelo();
    //localhost 10.1.10.4 test 114.55.254.218
    pomelo.init({ host: "121.43.188.86", port: 15010 }, function() {

        pomelo.on("mjhand", function(data) {
            console.log(pomelo.uid + " start game");
            clearTimeout(pomelo.waitStart);
        });

        pomelo.on("roundEnd", function(data) {
            console.log(pomelo.uid + " end game");

            var winCoin = data.seqData.players[pomelo.uid].winCoinOne;
            pomelo.coin = pomelo.coin + winCoin;

            var route = "pkplayer.handler.LeaveGame"
            pomelo.request(route, {},
                function(err, data) {
                    if (data.code === 500) {
                        console.error(pomelo.uid + " leave game failed")
                        return;
                    }
                    console.log(pomelo.uid + " leave game success");
                    if (pomelo.coin < 2000) {
                        console.log(pomelo.uid + " no money, coin:" + pomelo.coin);
                        pomelo.disconnect();
                        mock();
                        return;
                    }
                    replay(pomelo);
                    return;
                });
        });

        var route = 'login.handler.reqGuestID';
        pomelo.request(route, {}, function(err, data) {
            if (data.code === 500) {
                console.error("requestId failed")
                return;
            }
            var uid = data.mail;
            var code = data.code;
            pomelo.uid = uid;

            var route = 'pkcon.handler.doLogin';
            pomelo.request(route, {
                "code": code,
                "mail": uid,
                "resVersion": "3.7.1",
                "app": { "appid": "com.coolgamebox.scmj", "os": "Android" },
                "geogData": { "latitude": "39.986261", "longitude": "116.480651" },
                "__route__": "pkcon.handler.doLogin"
            }, function(err, data) {
                if (data.code === 500) {
                    console.error("verify failed")
                    return;
                }
                console.log(pomelo.uid + " login success:")
                pomelo.coin = data.pinfo.coin;
                retable(pomelo);
                //replay(pomelo);
            });

        });
    });
}

function replay(pomelo) {

    var route = "pkplayer.handler.CreateVipTable"

    pomelo.request(route, {
            "round": "round1",
            "canEatHu": false,
            "withWind": false,
            "canEat": false,
            "noBigWin": false,
            "maxWin": 256,
            "with3": false,
            "zimofan": true,
            "yaojiu": true,
            "zhuanyu": true,
            "blood": true,
            "doubleCarHouse": false,
            "coinRoomCreate": true,
            "fight3p": false,
            "menqing": true,
            "gshdianpao": false,
            "gshzimo": true,
            "tiandihu": false,
            "deyangType": false,
            "fight2p": false,
            "xiaohu": false,
            "fight2pDoubleCard": false,
            "fight3pWith3": false,
            "yesBigWin": false,
            "jiaxinwu": false,
            "yitiaolong": false,
            "wanZhou": false,
            "xuezhandd": false,
            "yaojidai": false,
            "zhuanGen": false,
            "coinType": 1,
            "playType": 1,
            "isTrust": 10,
            "__route__": "pkplayer.handler.CreateVipTable"
        },
        function(err, data) {
            if (data.code === 500) {
                console.error(pomelo.uid + " create table failed")
                return;
            }

            var tableid = data.vipTable;
            console.log(pomelo.uid + " create table " + tableid)
            var route = "pkplayer.handler.JoinGame"
            pomelo.request(route, { "roomid": "symj1", "tableid": tableid, "__route__": "pkplayer.handler.JoinGame" },
                function(err, data) {
                    if (data.code === 500) {
                        console.error(pomelo.uid + " join table failed")
                        return;
                    }
                    console.log(pomelo.uid + " join table " + tableid);
                    var route = "pkroom.handler.tableMsg"

                    setTimeout(
                        pomelo.notify(route, { "cmd": "MJPlayReady", "yes": true, "__route__": route }),
                        parseInt(Math.random() * 10000)
                    );


                    pomelo.waitStart = setTimeout(function() {
                        var route = "pkplayer.handler.LeaveGame"
                        pomelo.request(route, {},
                            function(err, data) {
                                if (data.code === 500) {
                                    console.error(pomelo.uid + " leave game failed")
                                    return;
                                }
                                console.log(pomelo.uid + " leave game success");
                                replay(pomelo);
                            });

                    }, 10000);

                });
        });
}

function retable(pomelo) {
    var route = "pkplayer.handler.CreateVipTable"

    pomelo.request(route, {
            "round": "round1",
            "canEatHu": false,
            "withWind": false,
            "canEat": false,
            "noBigWin": false,
            "maxWin": 256,
            "with3": false,
            "zimofan": true,
            "yaojiu": true,
            "zhuanyu": true,
            "blood": true,
            "doubleCarHouse": false,
            "coinRoomCreate": true,
            "fight3p": false,
            "menqing": true,
            "gshdianpao": false,
            "gshzimo": true,
            "tiandihu": false,
            "deyangType": false,
            "fight2p": false,
            "xiaohu": false,
            "fight2pDoubleCard": false,
            "fight3pWith3": false,
            "yesBigWin": false,
            "jiaxinwu": false,
            "yitiaolong": false,
            "wanZhou": false,
            "xuezhandd": false,
            "yaojidai": false,
            "zhuanGen": false,
            "coinType": 1,
            "playType": 1,
            "isTrust": 10,
            "__route__": "pkplayer.handler.CreateVipTable"
        },
        function(err, data) {
            if (data.code === 500) {
                console.error(pomelo.uid + " create table failed")
                return;
            }

            var tableid = data.vipTable;
            console.log(pomelo.uid + " create table " + tableid)
            var route = "pkplayer.handler.JoinGame"
            pomelo.request(route, { "roomid": "symj1", "tableid": tableid, "__route__": "pkplayer.handler.JoinGame" },
                function(err, data) {
                    if (data.code === 500) {
                        console.error(pomelo.uid + " join table failed")
                        return;
                    }
                    console.log(pomelo.uid + " join table " + tableid);

                    var route = "pkplayer.handler.LeaveGame"
                    pomelo.request(route, {},
                        function(err, data) {
                            if (data.code === 500) {
                                console.error(pomelo.uid + " leave game failed")
                                return;
                            }
                            console.log(pomelo.uid + " leave game success");
                            retable(pomelo);
                        });
                });
        });
}
//return;