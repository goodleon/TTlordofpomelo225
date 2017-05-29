/**配置 
 * @app 
 * @server 
 * @gameid  
 */
module.exports = function(app, server, gameid) {
    return {
        info: {
            round4: 2,
            round8: 3,
            iosiap: { //这里是ios支付的配置
                "com.happy.scmj15": { type: 1, num: 15 }, //钻石
                "com.happy.scmj60": { type: 1, num: 60 }, //钻石
                "com.happy.scmj150": { type: 1, num: 150 }, //钻石
                "com.happy.scmj320": { type: 1, num: 320 }, //钻石
                "com.happy.scmj72000": { type: 2, num: 72000 }, //金币--------
                "com.happy.scmj220000": { type: 2, num: 220000 }, //金币
                "com.happy.scmj380000": { type: 2, num: 380000 }, //金币
                "com.happy.scmj900000": { type: 2, num: 900000 }, //金币
                "com.happy.scmj1750000": { type: 2, num: 1750000 }, //金币
                "com.happy.scmj4150000": { type: 2, num: 4150000 } //金币
            },
            ioscoiniap: { //这里是微信支付的配置
                "com.happy.scmj72000": { type: 2, num: 72000 }, //金币
                "com.happy.scmj220000": { type: 2, num: 220000 }, //金币
                "com.happy.scmj380000": { type: 2, num: 380000 }, //金币
                "com.happy.scmj900000": { type: 2, num: 900000 }, //金币
                "com.happy.scmj1750000": { type: 2, num: 1750000 }, //金币
                "com.happy.scmj4150000": { type: 2, num: 4150000 } //金币
            }
        },
        rooms: {
            symj1: { name: "symj1", scene: "", full: 2, type: "symj", removeLess: true, reconnect: true, vip: true },
            symj2: { name: "symj2", scene: "", full: 2, type: "symj", removeLess: true, reconnect: true, vip: false },
            scmj1: { name: "scmj1", scene: "", full: 2, type: "scmj" }
        },
        viptable: {
            round4: { round: 4, money: 2 },
            round8: { round: 8, money: 3 },
            round1: { round: 1, money: 0 },
            round9999: { round: 9999, money: 0 }
        },
        initData: {
            coin: 5000 * 1000,
            money: 24
        },
        //表示金币厂玩家开局数量
        full4create: function(para) // para是创建房间的参数
            {
                return 4;
            },
        minVersion: "1.05" //(热更的版本)低于这个版本，不能创建房间和加入房间
    }
}