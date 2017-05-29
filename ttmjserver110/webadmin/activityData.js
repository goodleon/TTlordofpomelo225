/**
 * Created by lhq on 2016/8/19 0019.
 */

module.exports = function(cb) {
    var mdb;//mongo连接
    this.activityCache = {};//活动数据缓存

    this.doLog = function(t, m) {
        var str = new Date();

        str += ':' + t;
        if(m) str += '\n' + JSON.stringify(m);

    }

    //获取并缓存json config文件
    this.predefineConfig = require('./activityPredefine.json');//预定义的内容

    var masterConfig = require('../mjserver/game-server/config/master.json');

    var balanceIndex = 0;

    if(process.argv.length >= 3) {
        var mjId = process.argv[2];

        var jsonCfg = masterConfig[mjId];

        if(!jsonCfg || !jsonCfg.actServer) {
            console.error('activityWeb can not find config data : ' + mjId);
            return;
        }

        if(process.argv.length >= 4 && jsonCfg.actServer.num && jsonCfg.actServer.num > 1) {
            balanceIndex = parseInt(process.argv[3]);

            if(balanceIndex >= jsonCfg.actServer.num) {
                console.error('activityWeb start too much listen : ' + (jsonCfg.actServer.port + balanceIndex));
                return;
            }
        }
    }

    this.buildActData = function(act) {
        var data;

        if(act.actData.beginTime) {
            data = act.actData.beginTime.split(':');
            act.actData.beginTime = parseInt(data[0]) * 100 + parseInt(data[1]);
        }

        if(act.actData.endTime) {
            data = act.actData.endTime.split(':');
            act.actData.endTime = parseInt(data[0]) * 100 + parseInt(data[1]);
        }

        if(act.actData.rewards && act.actType == this.predefineConfig.actType.turntable) {
            act.actData.totalWeight = 0;
            for(var i = 0; i < act.actData.rewards.length; i++) {
                act.actData.totalWeight += act.actData.rewards[i][2];
                act.actData.rewards[i][2] = act.actData.totalWeight;
            }
        }
    }

    this.loadActData = function(actId) {
        var admin = this;
        mdb.collection('activityData').findOne({_id:actId}, function(er, act) {
            if(act) {
                admin.buildActData(act);
                admin.activityCache[act._id] = act;
                admin.doLog('update', Object.keys(admin.activityCache).length);
            } else {
                admin.doLog('update', 'load ' + actId + 'error');
            }
        });
    }

    var admin = this;
    var mdbUrl = 'mongodb://' + jsonCfg.host + ':27017/' + jsonCfg.id;

    if(jsonCfg.mdbUrl) {
        mdbUrl = jsonCfg.mdbUrl;
    }

    var MongoClient = require('mongodb').MongoClient;
    MongoClient.connect(mdbUrl, {server: {poolSize: 3, auto_reconnect: true}}, function(err, db) {
        if(db) {
            mdb = db;
            admin.doLog("db connect to : " + mdbUrl);
            mdb.collection('activityData').find({delStatus:0}).each(function(er, act) {
                if(act) {
                    admin.buildActData(act);
                    admin.activityCache[act._id] = act;
                } else {
                    admin.doLog('activityData cache end : ' + Object.keys(admin.activityCache).length, admin.activityCache);
                    cb(jsonCfg.host, jsonCfg.actServer.port + balanceIndex);
                }
            });
        } else {
            console.error('activityWeb can not connect to mongodb : ' + mdbUrl);
        }
    });
}