function stringHash(str) {
    var hash = 0;
    if (str.length == 0) return hash;
    for (i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    if (hash < 0) hash = -hash;
    return hash;
}

var mdb = null,
    rclient = null,
    lids = ["login_0",
        "login_1",
        "login_2",
        "login_3",
        "login_4",
        "login_5",
        "login_6",
        "login_7",
        "login_8",
        "login_9",
        "login_a",
        "login_b",
        "login_c"
    ];


function loadPlayer(skp, lmt) {
    var loadNum = 0,
        loadNum2 = 0;
    mdb.collection("cgbuser").find().skip(skp).limit(lmt).each(function(er, doc) {
        if (doc) {
            loadNum++;
            if (doc.email && doc.openid && doc.unionid) {
                loadNum2++;
                doc.email = doc.unionid + "@weixin";
                if (doc.lType == 'fb') doc.email = doc.unionid + "@facebook";
                var hname = lids[stringHash(doc.unionid) % (lids.length - 1) + 1];
                rclient.hset(hname, doc.email, JSON.stringify(doc));
            }
        } else {
            console.info(skp + " loadNum " + loadNum + " " + loadNum2);
            if (loadNum >= lmt) {
                setTimeout(function() {
                    loadPlayer(skp + lmt, lmt);
                }, Math.floor(2000 * Math.random()));
            }
        }
    });
}

// redis ����
var redis = require('redis');
require('mongodb').MongoClient.connect("mongodb://" + process.argv[2] + ":27017/" + process.argv[3],
    function(er, db) {
        if (!db) return;
        mdb = db;
        var client = redis.createClient('6379',

            "6a12890d4f584e7e.m.cnsza.kvstore.aliyuncs.com"

            //process.argv[4]

        );
        // redis ���Ӵ���
        client.on("error", function(error) {
            console.log(error);
        });
        client.auth("jxlw921JXLW");
        client.select(0, function(error) {
            if (error) {
                console.log(error);
            } else {
                rclient = client;
                loadPlayer(1323200, 2000);
            }
        });
    });