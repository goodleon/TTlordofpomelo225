var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/test';
MongoClient.connect(url, function(err, db) {
    if (err) {

    } else {
        var num = 0;
        var cursor = db.collection('2016-04-14').find();
        cursor.each(function(err, doc) {
            if (doc != null) num++;
            else console.info(num);
        });
    }
});