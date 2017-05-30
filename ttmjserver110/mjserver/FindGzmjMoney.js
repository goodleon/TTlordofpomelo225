    var mdb = null;

    function loadPlayer(skp, lmt) {
        var loadNum = 0;
        var id2num = {};
        mdb.collection("userMoney20160720").find({ buyTime: { $gt: new Date(2016, 6, 20, 5) } }).each(
            function(er, doc) {
                if (doc) {
                    id2num[doc.uid] = doc.buyNum;
                    loadNum++;
                } else {
                    mdb.close();
                    console.info(JSON.stringify(id2num));
                }
            });
    }

    // redis 链接
    require('mongodb').MongoClient.connect("mongodb://" + process.argv[2] + ":27017/" + process.argv[3],
        function(er, db) {
            if (!db) return;
            mdb = db;
            loadPlayer(0, 2000);
        });