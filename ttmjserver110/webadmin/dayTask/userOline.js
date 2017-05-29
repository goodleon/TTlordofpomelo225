/**
 * Created by HJF on 2016/12/23 0023.
 * 用户每天在线分布
 */

module.exports=function(admin) {
    var schedule = require("node-schedule");
    var tools = require('../tools')();

    //每小时统计用户在线人数
    function onlineUser(admin){
        schedule.scheduleJob('0 0 */1 * * *', function()
        {
            var onlineCount = 0;
            var count = 0;
            var pkplayers = admin.pkplayer;
            var today = tools.Format(new Date(), 'yyyyMMdd');
            var hours = new Date().getHours();//小时
            // hours = new Date().getSeconds();//秒
            console.log("pkplayers.length:", pkplayers.length);
            for(var i=0;i<pkplayers.length;i++)
            {
                var pkserver=pkplayers[i];
                admin.httpClient.postJson("GetAudit", {}, pkserver.port + 1000, pkserver.host, function (er, rtn) {
                    if(rtn)
                    {
                        console.log(JSON.stringify(rtn));
                        if(rtn.online > 0)
                        {
                            onlineCount += rtn.online;
                        }
                        if(++count == pkplayers.length)
                        {
                            //{$set:{"online.20":2}}, db: { "_id" : 20160908, "online" : { "20" : 9 } }
                            var para = {$set:{}};
                            para.$set["online."+hours] = onlineCount;
                            console.log("para:", JSON.stringify(para));
                            admin.mdb.collection('userOnline').update({_id:Number(today)}, para, {upsert:true}, function (er, rtn) {

                            });
                        }
                    }
                });
            }

        });
    }

    if(admin)
    {
        onlineUser(admin);
    }
}