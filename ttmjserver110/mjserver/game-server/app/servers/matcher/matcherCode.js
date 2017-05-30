module.exports = function(app, server, serverClass) {
    var gameLog = [];

    function GLog(log) {
        app.FileWork(gameLog, "/root/mjserver/log.txt", log)
    }

    var Result = require('../Result');


    var fs = require('fs');
    var gameInfo = {};
    if (!server.games) {
        server.games = {};
    }
    var games = server.games;
    (function() {
        //var gamesPath=__dirname+"/games/";
        var gamesPath = __dirname + "/../pkroom/games/";

        var lst = fs.readdirSync(gamesPath);
        for (var i = 0; i < lst.length; i++) {
            if (fs.statSync(gamesPath + lst[i]).isDirectory()) {
                var gameid = lst[i];
                delete require.cache[require.resolve("../pkroom/games/" + gameid + "/GameCfg")];
                var gameCfg = require("../pkroom/games/" + gameid + "/GameCfg")(app, server, gameid);
                games[gameid] = gameCfg;
                gameInfo[gameid] = gameCfg.info;
            }
        }
    })();

    if (!server.coinKey) {
        //coinKey 分两级， 第一级是gameid， 第二级目前是游戏玩法+金币区间
        server.coinKey = {};
        //未满房间的索引， 加速查找效率
        server.coinIndex = {};

        server.players = {};

        for (gid in server.games) {
            server.coinKey[gid] = {};
            server.coinIndex[gid] = {};
            server.players[gid] = {};
        }
    }

    serverClass.prototype.afterStartServer = function() {
        console.info("--matcher--serverClass.prototype.afterStartServer");

    }

    var TableIdleLife = 3600; //seconds
    var CoinRelateRatio = 0.4;
    var WinRelate = 10;

    var CoinTable = function(tid, uid, coin, win, full) {
        this.tid = tid;
        this.uids = {}
        this.uids[uid] = {
            coin: coin,
            win: win
        }
        this.full = full;
        this.uptime = Date.parse(new Date()) / 1000;
    }

    CoinTable.prototype.addPlayer = function(uid, coin, win) {
        this.uids[uid] = {
            coin: coin,
            win: win,
        }
        this.uptime = Date.parse(new Date()) / 1000;
    }

    CoinTable.prototype.removePlayer = function(uid) {
        delete this.uids[uid];
    }

    CoinTable.prototype.expired = function() {
        var ts = Date.parse(new Date()) / 1000;
        var emptyExpired = (ts - this.uptime) > TableIdleLife && this.uids.length == 0;
        if (emptyExpired) {
            return true;
        }

        var unexpectedExpired = (ts - this.uptime) > TableIdleLife * 24; // maybe someone leave failed
        if (unexpectedExpired) {
            return true;
        }
        return false;
    }

    CoinTable.prototype.isFull = function() {
        var keys = Object.keys(this.uids);
        return keys.length === this.full
    }

    CoinTable.prototype.isEmpty = function() {
        var keys = Object.keys(this.uids);
        return keys.length === 0;
    }

    CoinTable.prototype.matchByCoin = function(coin) {
        if (this.uids.length == 0) {
            return false;
        }
        var keys = Object.keys(this.uids);
        for (var i = 0; i < keys.length; i++) {
            var uid = keys[i];

            if ((Math.abs(this.uids[uid].coin - coin) / coin) < CoinRelateRatio) {
                console.log("match by coin success, uid:" + uid + ",coin:" + this.uids[uid].coin + ",target coin:" + coin);
                return true
            }
        }
        return false;
    }

    CoinTable.prototype.matchByDefault = function() {
        var keys = Object.keys(this.uids);
        return keys.length < this.full;
    }

    CoinTable.prototype.matchByWin = function(win) {
        //todo 现在win都是打桩100,暂时关闭
        return false;
        if (this.uids.length == 0) {
            return false;
        }
        var keys = Object.keys(this.uids);
        for (var i = 0; i < keys.length; i++) {
            var uid = keys[i];
            if (Math.abs(this.uids[uid].win - win) < WinRelate) {
                return true
            }
        }
        return false;
    }


    var STRATEGY_DEFAULT = 1;
    var STRATEGY_COIN_MATCH = 2;
    var STRATEGY_WIN_MATCH = 3;

    function match(strategy, msg) {
        var gameid = msg.gameid;
        var coinCategory = msg.coinCategory;
        var tid = 0;

        //从索引中取tid
        var keys = Object.keys(server.coinIndex[gameid][coinCategory]);
        /*
        console.log(strategy + " match , len = "+keys.length+",gameid ="+gameid+
            "server.key:"+JSON.stringify(server.coinKey)+",server.index=" +
            JSON.stringify(server.coinIndex));
*/
        console.log(strategy + " match , len = " + keys.length + ",gameid =" + gameid)
        if (keys.length <= 0) {
            return 0;
        }

        var randBegin = Math.floor(Math.random() * 100) % keys.length;
        for (var k = 0; k < keys.length; k++) {
            randBegin++;
            if (randBegin >= keys.length)
                randBegin = 0;

            tid = keys[randBegin];
            var coinTable = server.coinKey[gameid][coinCategory][tid];

            if (coinTable.expired()) {
                delete server.coinKey[gameid][coinCategory][tid];
                delete server.coinIndex[gameid][coinCategory][tid];
                tid = 0;
                continue;
            }

            if (server.players[msg.gameid][msg.coinCategory][msg.uid]["last_tid"] &&
                server.players[msg.gameid][msg.coinCategory][msg.uid]["last_tid"] == tid) {
                console.log("match last tid:" + tid);
                tid = 0;
                continue;
            }

            if (strategy == STRATEGY_DEFAULT && coinTable.matchByDefault()) {
                coinTable.addPlayer(msg.uid, msg.coin, msg.winRate);
                console.log("match by default strategy")
                break;
            } else if (strategy == STRATEGY_COIN_MATCH && coinTable.matchByCoin(msg.coin)) {
                coinTable.addPlayer(msg.uid, msg.coin, msg.winRate);
                console.log("match by coin strategy");
                break;
            } else if (strategy == STRATEGY_WIN_MATCH && coinTable.matchByWin(msg.win)) {
                console.log("match by win strategy")
                coinTable.addPlayer(msg.uid, msg.coin, msg.winRate);
                break;
            } else {
                tid = 0;
            }

        }
        console.log(strategy + " match end,tid:" + tid)
        return tid;
    }

    function crc32(str) {
        var table = ["00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D"].join(' ');
        var crc = 0;
        var x = 0;
        var y = 0;
        crc = crc ^ (-1);
        for (var i = 0, iTop = str.length; i < iTop; i++) {
            y = (crc ^ str.charCodeAt(i)) & 0xFF;
            x = "0x" + table.substr(y * 9, 8);
            crc = (crc >>> 8) ^ x;
        }
        return crc ^ (-1);
    }

    function genTableId(msg) {
        var tryNum = 3;
        var tid = 0
        while (tryNum > 0) {
            tryNum--;

            var tmpid = crc32("" + msg.ip + msg.uid + new Date().getTime() + Math.floor(8999999 * Math.random()));
            tid = Math.abs(tmpid) % 10000000000
                //金币场vip房间，保持8位
            if (msg.isVIPTable > 0) {
                if (tid < 10000000) { //如果不足8位
                    tid = 10000000 + tid;
                }
                if (tid > 100000000) { //如果超过8位
                    var tidstr = tid + "";
                    tid = parseInt(tidstr.substr(0, 8));
                }
            } else {
                if (tid < 100000000) { //普通金币场至少9位
                    tid = 100000000 + tid;
                }
            }

            if (!server.coinKey[msg.gameid][msg.coinCategory][tid])
                break;
            tid = 0;
        }
        return tid;
    }

    //供pkplayer 调用， 金币场集中化匹配
    serverClass.prototype.FindCoinTable = function(msg, next) {
        console.info("--matcherCode--serverClass.prototype.FindCoinTable" +
            JSON.stringify(msg) +
            ", uid = " + msg.uid);

        var start_ms = (new Date()).getTime();
        var returnNewId = false;
        var gameid = msg.gameid;
        var coinCategory = msg.coinCategory;
        var tid = 0;

        if (!msg.gameid || !msg.coinCategory || !msg.full) {
            next(null, { result: Result.paraError, vipTable: 0 });
            return;
        }
        if (!server.coinKey[msg.gameid][msg.coinCategory]) {
            server.coinKey[msg.gameid][msg.coinCategory] = {};
            server.coinIndex[msg.gameid][msg.coinCategory] = {};
            server.players[msg.gameid][msg.coinCategory] = {};
        }

        if (!server.players[msg.gameid][msg.coinCategory][msg.uid]) {
            server.players[msg.gameid][msg.coinCategory][msg.uid] = {}
        }

        if (msg.isVIPTable == 0) {
            //tid = match(STRATEGY_COIN_MATCH ,msg);
            if (tid == 0) {
                tid = match(STRATEGY_DEFAULT, msg);
            }
        }


        if (tid == 0) {
            returnNewId = true;
            tid = genTableId(msg);
        }

        if (tid == 0) {
            next(null, { result: Result.Fail, vipTable: 0 });
            return;
        }


        server.players[msg.gameid][msg.coinCategory][msg.uid]["last_tid"] = tid;

        server.coinIndex[gameid][coinCategory][tid] = 1;

        var coinTable = server.coinKey[gameid][coinCategory][tid];
        if (!coinTable) {
            coinTable = server.coinKey[gameid][coinCategory][tid] = new CoinTable(tid, msg.uid, msg.coin, msg.winRate, msg.full);
        }

        if (coinTable.isFull()) {
            delete server.coinIndex[gameid][coinCategory][tid];
        }

        next(null, { result: Result.Success, vipTable: tid, newTable: returnNewId });
        var cost = (new Date().getTime()) - start_ms;
        console.log("find_table_cost:" + cost);
        return;

    }

    //某个玩家离开金币场桌
    serverClass.prototype.LeaveCoinTable = function(msg, next) {
            console.info("--matcherCode--serverClass.prototype.LeaveCoinTable" +
                JSON.stringify(msg) + ", uid = " + msg.uid);
            if (!msg.gameid || !msg.uid || !msg.coinCategory || !msg.tid) {
                next(null, { result: Result.paraError });
                return;
            }

            var coinTable = server.coinKey[msg.gameid][msg.coinCategory][msg.tid];
            if (!coinTable) {
                delete server.coinIndex[msg.gameid][msg.coinCategory][msg.tid];
                next(null, { result: Result.Success });
                return;

            }

            coinTable.removePlayer(msg.uid);
            if (coinTable.isEmpty()) {
                delete server.coinKey[msg.gameid][msg.coinCategory][msg.tid];
                delete server.coinIndex[msg.gameid][msg.coinCategory][msg.tid];
            } else {
                //this table can be rematch
                server.coinIndex[msg.gameid][msg.coinCategory][msg.tid] = 1;
            }

            next(null, { result: Result.Success });
            return;
        }
        //关闭金币场桌
    serverClass.prototype.EndCoinTable = function(msg, next) {
        console.info("--matcherCode--serverClass.prototype.EndCoinTable" + JSON.stringify(msg));
        if (!msg.gameid || !msg.coinCategory || !msg.tid) {
            next(null, { result: Result.paraError });
            return;
        }

        var coinTable = server.coinKey[msg.gameid][msg.coinCategory][msg.tid];
        if (coinTable) {
            coinTable.removePlayer(msg.uid)
            if (!coinTable.isEmpty()) {
                console.log("coin table is not empty, but force to be deleted");
            }
        }

        delete server.coinKey[msg.gameid][msg.coinCategory][msg.tid];
        delete server.coinIndex[msg.gameid][msg.coinCategory][msg.tid];

        next(null, { result: Result.Success });
        return;

    }


}