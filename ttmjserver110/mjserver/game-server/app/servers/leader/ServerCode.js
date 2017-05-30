module.exports = function(app, server, serverClass) {
    var fs = require('fs');

    if (!server.leader) {
        server.leader = {};
    }
    var leader = server.leader;
    if (!server.games) { server.games = {}; }
    var games = server.games;
    // 记录gamid 对应的gameCfg
    (function() {
        //var gamesPath=__dirname+"/games/";
        var gamesPath = __dirname + "/../pkroom/games/";
        var lst = fs.readdirSync(gamesPath);
        for (var i = 0; i < lst.length; i++) {
            if (fs.statSync(gamesPath + lst[i]).isDirectory()) {
                var gameid = lst[i];
                var gameCfg = require("../pkroom/games/" + lst[i] + "/GameCfg")(app, server, gameid);
                games[gameid] = gameCfg;
            }
        }
    })();

    // 删除旧数据, 填充新的
    //算法优化问题
    serverClass.prototype.updateLeader = function(gameid, pty, pinfo, next) {
        var leadKey = gameid + "/" + pty;
        console.info("updateLeader " + leadKey + " " + pinfo.uid + " " + pinfo[pty]);
        var lead = leader[leadKey];
        if (!lead) {
            leader[leadKey] = lead = {
                map: {},
                array: []
            }
        }
        var map = lead.map;
        var array = lead.array;
        var oldPinfo = map[pinfo.uid];
        if (oldPinfo) {
            delete map[pinfo.uid];
            var idx = array.indexOf(oldPinfo);
            if (idx >= 0) array.splice(idx, 1);
        }
        map[pinfo.uid] = pinfo;
        array.push(pinfo);
        array.sort(function(a, b) { return b[pty] - a[pty]; });
        next(null, null);

    };

    //; 根据leadKey 获取lead
    serverClass.prototype.getLeader = function(msg, session, next) {
        var rtn = { array: [], start: msg.start, total: 0 };
        var lead = leader[msg.leadKey];
        if (lead) {
            var array = lead.array;
            rtn.total = array.length;
            for (var i = 0; i < msg.num; i++) {
                if (i + msg.start < array.length) {
                    rtn.array.push(array[i + msg.start]);
                }
            }
        } else {
            console.info("not found in " + Object.keys(leader));

        }
        next(null, rtn);
    };

    serverClass.prototype.GameRpc = function(gameid, cmd, msg, next) {
        var game = games[gameid];
        if (game && game[cmd]) {
            game[cmd](msg);
        }
        next(null, null);
    };



    function testLeadData() {
        for (var i = 0; i < 10; i++) {
            server.updateLeader("matchbattle", "fightPower", { uid: i, fightPower: i * 10 }, function() {});
        }
        console.dir(leader["matchbattle/fightPower"].array);
    }
    //if(app.serverId=="leader") testLeadData();


};