/**
 * Created by HJF on 2016/12/1 0001.
 * 多个进程跑登录数据
 */
var dbUrl = process.argv[2]
var collectionsString = process.argv[3]
var midx = process.argv[4]
var collections = collectionsString.split(",");
var index = 0;
// console.log(typeof (collections)+collections.length+"--- collections:"+collections);

var obj = {};
var startTalk = function (msg) {
    var obj = {};
    var MAX_HOUR = 24; //时间段
    var timeObj = {};
    var tempObj = {len:0};
    var filterWord = msg.filterWord;
    var type = msg.type;
    var today = null;

    require('mongodb').MongoClient.connect(dbUrl, function (er, db){

        if(!db)
        {
            console.log("mongodb连接失败:startTalk");
            return;
        }
        var getCollectionInfo = function(collName)
        {
            if(type == 1)
            {
                today = collName.replace("loginLog","");//登录
            }
            else if(type == 2)
            {
                today = collName.replace("gameLog","");//活跃
            }
            console.log("today:"+today);

            var tt = 'times_'+today;
            timeObj[tt] = [];
            for(var i = 0; i < MAX_HOUR; i++)
            {
                timeObj[tt].push(0);
            }

            function setObj(uid, hour) {
                if(!uid || Number(uid) < 10000)return;
                if(!obj[uid])
                {
                    obj[uid] = {};
                    obj[uid][today] = 1;
                    tempObj[uid] = [today];
                    tempObj.len++;
                    if(hour >= 0)
                    {
                        timeObj[tt][hour]++;
                    }
                }
                else if(!obj[uid][today])
                {
                    obj[uid][today] = 1;
                    if(!tempObj[uid])
                    {
                        tempObj[uid] = [today];
                    }else
                    {
                        tempObj[uid].push(today);
                    }
                    tempObj.len++;
                }

            }

            db.collection(collName).find(filterWord).each(function (er, doc)
            {
                if (doc && doc.time)
                {
                    //过滤冗余数据 分段发送
                    if(type == 1)//登录数据
                    {
                        // data.push({uid: doc.uid, time: doc.time});
                        var hour = new Date(doc.time).getHours();
                        setObj(doc.uid, hour);
                    }
                    else if(type == 2)//活跃数据
                    {
                        var td = {
                            uid1:doc.uid1,
                            uid2:doc.uid2,
                            uid3:doc.uid3,
                            uid4:doc.uid4,
                            uid5:doc.uid5,
                        };
                        var hour = new Date(doc.time).getHours();
                        for(var uid in td){
                            setObj(td[uid], hour);
                        }
                        // console.log("tempObj:"+JSON.stringify(tempObj));
                    }

                    if(tempObj.len >= 100000)
                    {
                        process.send({data:tempObj});
                        tempObj = {len:0};
                    }

                }

                if (!doc)
                {
                    if(++index < collections.length){
                        getCollectionInfo(collections[index]);
                    }
                    else
                    {
                        console.log("0 index : "+ index+", len:"+collections.length);
                        db.close();
                        process.send({endCode:200, data:tempObj},function (msg)
                        {
                            process.disconnect();
                        });
                        // process.send({endCode:200, data:tempObj, times:timeObj});
                    }
                }
            });
        }
        getCollectionInfo(collections[index]);

    });
}

process.on('message', function(m) {
    // console.log('CHILD got message:', m);
    startTalk(m);
});