/**
 *
 */

/*
module.exports = function(cb) {
    var admin = this;
    // var masterConfig = require('../mjserver/game-server/config/master.json');
    var admin = this;
    var jsonCfg = {
        host:"10.28.88.165",
        id:'test',
    }
    var mdbUrl = 'mongodb://' + jsonCfg.host + ':27017/' + jsonCfg.id;

    require('mongodb').MongoClient.connect(mdbUrl, {server: {poolSize: 3, auto_reconnect: true}}, function(err, db) {
        if(db) {
            console.log('mongodb open : ' + mdbUrl);
            admin.dataCenterDb = db;
            cb(900);
        } else {
            console.error('activityWeb can not connect to mongodb : ' + mdbUrl);
        }
    });
}*/


module.exports = function(cb) {
    var admin = this;
    admin.dataCenterDb = {};
    // var masterConfig = require('../mjserver/game-server/config/master.json');
    var admin = this;
    var jsonCfg = {
        host:"10.28.88.165",
        id:'test',
    }
    var dbIp = 'mongodb://' + jsonCfg.host + ':27017/';
    /*
    var mdbUrl = dbIp + jsonCfg.id;
    require('mongodb').MongoClient.connect(mdbUrl, {server: {poolSize: 3, auto_reconnect: true}}, function(err, db) {
        if(db) {
            console.log('mongodb open : ' + mdbUrl);
            admin.dataCenterDb[jsonCfg.id] = db;
            cb(900);
        } else {
            console.error('activityWeb can not connect to mongodb : ' + mdbUrl);
        }
    });*/
    admin.connectDB = function (dbName, endF) {
        var url  = dbIp + dbName;
        console.log('admin.connectDB : ' + url);
        require('mongodb').MongoClient.connect(url, {server: {poolSize: 3, auto_reconnect: true}}, function(err, db) {
            if(db) {
                console.log('mongodb open : ' + url);
                admin.dataCenterDb[dbName] = db;
                !endF||endF(900);
            } else {
                console.error('activityWeb can not connect to mongodb : ' + url);
            }
        });
    }
    admin.connectDB('test', cb);
}