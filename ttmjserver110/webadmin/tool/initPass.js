/**
 * Created by lhq on 2016/9/2 0002.
 */

var conf = require('../config/' + process.argv[2] + '.json');

var MongoClient = require('mongodb').MongoClient;

var crypto = require('crypto');

var mid = parseInt(process.argv[3]);

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

    db.collection("members").findOne({_id:mid}, function(er, m) {
        if(m) {

            var mPass = '123456';
            mPass = cryptoMemberPass(mPass);
            var para = {mPass:mPass};
            para.forcePass = 1;

            db.collection("members").update({_id:m._id}, {$set:para}, function() {
                console.info('member password inti success : ' + mid);
                db.close();
            });
        } else {
            console.info('member not found : ' + mid);
            db.close();
        }
    });
});
