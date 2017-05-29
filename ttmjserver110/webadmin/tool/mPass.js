/**
 * Created by lhq on 2016/9/1 0001.
 */

var conf = require('../config/' + process.argv[2] + '.json');

var MongoClient = require('mongodb').MongoClient;

var crypto = require('crypto');

var flag = false;

var count = 0;
var cnt = 0;

var mList = [];

var forcePass = false;//强制换密码

function cryptoMemberPass(pass) {
    var sha1 = crypto.createHash('sha1');
    sha1.update(pass);
    sha1.update(conf.balanceKey);
    return sha1.digest('hex');
}

MongoClient.connect(conf.mongodbUrl,conf.mongodbPara,function(err, db) {
    if(!db) {
        console.info('db er ' + JSON.stringify(err));
        return;
    }

    db.collection("members").count(function(e, rtn) {
        count = rtn;
        console.info('mPass convert read count : ' + count);
    });

    function finish() {
        cnt++;

        if(mList.length > 0) {
            updatedb();
            return;
        }

        if(count == cnt) {
            db.close();
            console.info('mPass convert update end : ' + cnt + '/' + count);
        }
    }

    function updatedb() {
        var info = mList[0];

        if(!info) {
            return;
        }

        mList.splice(0, 1);

        db.collection("members").update({_id:info._id}, {$set:info.para}, function() {
            finish();
        });
    }

    db.collection("members").find().each(function(er, m) {
        if(m) {
            var mPass = m.mPass;

            if(typeof(mPass) != 'string') {
                console.info(m._id + ' : ' + mPass + '   error\n');
                //flag = true;
                mPass = '123456';
            }

            mPass = cryptoMemberPass(mPass);
            var para = {mPass:mPass};

            if(forcePass) {
                para.forcePass = 1;
            }

            mList.push({_id: m._id, para:para});
        } else {
            console.info('mPass convert update start : ' + mList.length);
            if(!flag) {
                updatedb();
            }
        }
    });
});
