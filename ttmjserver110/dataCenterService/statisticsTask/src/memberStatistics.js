/**
 * Created by HJF on 2016/12/15 0015.
 * memberDayLog 会员统计基础数据
 * memberRetention + opLog20170101 + memberConsumptionRecords201701 + dayLog ==> memberDayLog
 */
module.exports = function (dbUrl, day, endMsg, errMsg)
{
    if(typeof day != 'string') {
        console.info('typeof day  must be string !!');
        !errMsg || errMsg('typeof day  must be string !!');
        return;
    }
    if(day.length != 8) {
        console.info('day\'s format invaid !!');
        !errMsg || errMsg('day\'s format invaid !!');
        return;
    }
    require('mongodb').MongoClient.connect(dbUrl, function (err, db)
    {
        if(err) {
            console.info('db err ' + JSON.stringify(err));
            !errMsg || errMsg(err);
            return;
        }



        var tools = require('./tools.js')();
        var events = require('events');
        var eventEmitter = new events.EventEmitter();
        var month = day.substr(0,6);
        var sDay = day.substr(0,4)+'-'+day.substr(4,2)+'-'+day.substr(6,2);//2017-01-01开始
        var startDay = new Date(sDay+' 00:00:00');
        var endDay = new Date(sDay+' 00:00:00');
        startDay.setDate(startDay.getDate() - 1);
        endDay.setDate(endDay.getDate() + 1);
        // console.log("day, startDay, endDay",day, startDay, endDay);

        var allMembers = {};
        function initMembers(tDay) {
            if(allMembers[tDay])return;
            allMembers[tDay] = {};
            allMembers[tDay].regCount = 0;//注册人数
            allMembers[tDay].buyUserCount = 0;//充值人数
            allMembers[tDay].loginCount = 0;//登录人数
            allMembers[tDay].buyCount = 0;//充值次数
            allMembers[tDay].buyMoney = 0;//充值额度
            allMembers[tDay].buyNum = 0;//买入钻石

            allMembers[tDay].sellNum = 0;//售出的钻石
            allMembers[tDay].sellUserCount = 0;//销售人数
            allMembers[tDay].sellCount = 0;//销售次数
            allMembers[tDay].sellMoney = 0;//销售额度
            allMembers[tDay].fillMembersMoney  = 0;//会员补钻
            allMembers[tDay].userMoney = 0;//用户余额
            allMembers[tDay].memberMoney = 0;//会员余额
            allMembers[tDay].sumRegCount = 0;//注册的总人数
            allMembers[tDay].dayMoney = 0;//用户钻石消耗

            allMembers[tDay].userCount7 = 0;//会员7日活跃人数
            allMembers[tDay].userCount15 = 0;//会员15日活跃人数
            allMembers[tDay].userCount30 = 0;//会员7日活跃人数
            allMembers[tDay].userMoney7 = 0;//会员7日剩余钻石数量
            allMembers[tDay].userMoney15 = 0;//会员15日剩余钻石数量
            allMembers[tDay].userMoney30 = 0;//会员30日剩余钻石数量
        }

        //获取充值人数和注册人数
        function getMemberRetention()
        {
            //使用memberRetention 注册人数和充值人数统计有bug,自己统计
            /*db.collection('memberRetention').find({_id:Number(day)}).each(function (err, doc) {
                if(doc)
                {
                    initMembers(day);

                    //console.log(doc.count +"   ----------------注册人数----------------");

                    allMembers[day].regCount += doc.count; //注册人数
                    if(doc[day])
                    {
                        allMembers[day].buyUserCount += doc[day]; //充值人数
                    }
                }
                if(!doc)
                {
                    eventEmitter.emit('getOpLog');
                }
            });*/
            initMembers(day);
            db.collection('members').count({mTime:{$gt:startDay,$lt:endDay}},function (err, count) {
                allMembers[day].regCount = err?0:count;//注册人数
                var mids = {};
                db.collection('memberMoney'+day).find({},{mid:1}).each(function(err2,doc2)
                {
                    if(doc2)
                    {
                        var mid = doc2.mid;
                        if(mid)
                        {
                            mids[mid] = 1;
                        }
                    }
                    else
                    {

                        allMembers[day].buyUserCount = Object.keys(mids).length; //充值人数
                        eventEmitter.emit('getOpLog');
                    }
                });
            });

        }


        //登录人数(去重mid)
        function getOpLog()
        {
            var reg = {};
            db.collection('opLog'+day).find({"type" : "login"}).each(function (err, doc) {
                if(doc&&doc.mid)
                {
                    if(!reg[doc.mid])
                    {
                        reg[doc.mid] = 1;
                    }
                }
                if(!doc)
                {
                    var keys = Object.keys(reg);
                    initMembers(day);
                    allMembers[day].loginCount = keys.length;
                    console.log("登录人数 ", keys.length);
                    eventEmitter.emit('getUserCntMoney');
                }
            });
            //登录人数（没去重）
            /*db.collection('opLog'+day).find({"type" : "login"}).count(function (err, count) {
                if(allMembers[day])
                {
                    allMembers[day].loginCount = count;
                }
                eventEmitter.emit('getMemberConsumptionRecords');
            });*/
        }

        /**
         * 会员活跃人数及余额 7/15/30  2017-04-17
         */
        function getUserCntMoney(){

        //    console.log("-------------------进入会员活跃统计函数中-------------------");

            /**
             * 会员基础数据
             */
            function infoList(days){
                var startTime = day.substr(0,4)+'-'+day.substr(4,2)+'-'+day.substr(6,2);//2017-01-01开始
                var preDate = new Date(startTime);
                preDate.setDate(preDate.getDate() - days + 1);//前days天 + 1(包含当天)
                var	stiem = tools.Format(preDate, 'yyyy-MM-dd');//时间格式 yyyyMMdd

                var date2 = new Date(stiem); //上周开始

            //    console.log(date2);

                var userInfo = [];

                var info7 = [];
                var info15 = [];
                var info30 = [];
                var userMoney = {};

                //console.log(startData);
                function instDbs(){
                    var startData = tools.Format(date2, 'yyyyMMdd');
                    //判断是否结束循环
                    if(parseInt(startData) > parseInt(day)){
                        infoEnd();
                        return;
                    }

                    /**
                     * 循环开始
                     */
                    function infoStart(){
                        var infoDays = [];
                        db.collection("opLog"+startData).find({type:'genAlipayCharge'}).each(function (er, doc) { //查询活跃会员
                            if(doc){
                                var userId = doc.mid;
                                //	console.log(startData +"*******************************"+userId);
                                infoDays.push(userId);
                            }else{
                                if (days == 7){
                                    info7 =	info7.concat(infoDays);
                                    userInfo[days] = info7;
                                }
                                if (days == 15){
                                    info15 = info15.concat(infoDays);
                                    userInfo[days] = info15;
                                }
                                if (days == 30){
                                    info30 = info30.concat(infoDays);
                                    userInfo[days] = info30;
                                }
                                date2.setDate(date2.getDate() + 1);
                                instDbs();
                            }
                        });
                    }

                    /**
                     * 循环结束-返回数据
                     */
                    function infoEnd(){
                        var userList = userInfo[days];
                        var res = [];
                        var json = {};
                        for(var i = 0; i < userList.length; i++){   //去重
                            if(!json[userList[i]]){
                                res.push(userList[i]);
                                json[userList[i]] = 1;
                            }
                        }
                        //console.log(res[0]);
                        db.collection("members").find({_id:{$in:res}}).each(function (er, doc1) {  //根据活跃会员ID查询余钻
                        //    console.log(doc1);
                            if (doc1){
                                if(!userMoney[days]){
                                    userMoney[days] = 0;
                                }
                                userMoney[days] += doc1.money;
                            }
                            else{

                                initMembers(day);

                                if(!userMoney[days]){
                                    userMoney[days] = 0;
                                }

                                if (days == 7){
                                    allMembers[day].userCount7 = res.length;
                                    allMembers[day].userMoney7 = userMoney[days];
                                }

                                if (days == 15){
                                    allMembers[day].userCount15 = res.length;
                                    allMembers[day].userMoney15 = userMoney[days];
                                }

                                if (days == 30){
                                    allMembers[day].userCount30 = res.length;
                                    allMembers[day].userMoney30 = userMoney[days];
                                    eventEmitter.emit('getMemberConsumptionRecords');
                                }

                            }
                        });

                    }
                    infoStart();
                }
                instDbs()
            }
            infoList(7);
            infoList(15);
            infoList(30);
        //    eventEmitter.emit('getMemberConsumptionRecords');
        }




        //获取充值销售数据
        function getMemberConsumptionRecords()
        {
            var param = {};
            param[day] = 1;
            db.collection('memberConsumptionRecords'+month).find({},param).each(function (err, doc) {
                if(doc && doc[day])
                {
                    var tToday = doc[day];
                    initMembers(day);
                    if(tToday)
                    {
                        if(tToday.buyCount)
                        {
                            allMembers[day].buyCount += tToday.buyCount; //充值次数
                        }
                        allMembers[day].buyMoney += tToday.buyMoney; //充值额度

                        allMembers[day].sellCount += tToday.sellCount;//销售次数
                        if(tToday.sellCount > 0)
                        {
                            allMembers[day].sellUserCount++;//销售人数
                        }
                        allMembers[day].sellMoney += tToday.sellMoney;//销售额度
                        allMembers[day].buyNum += tToday.buyNum;//买入钻石
                        allMembers[day].sellNum += tToday.sellNum;//售出钻石

                    }
                }
                if(!doc)
                {
                    initMembers(day);
                    if(allMembers[day])
                    {
                        eventEmitter.emit('getDayLog');
                    }
                    else
                    {
                        eventEmitter.emit('setMemberDayLog');
                    }
                }
            });
        }

        //获取会员补钻余额
        function getDayLog() {

            db.collection('dayLog').find({"_id": Number(day)}).each(function (err, doc)
            {
                if(doc)
                {
                    if(allMembers[day])
                    {
                        var fillMembersMoney = doc.fillMembersMoney;
                        var userMoney = doc.userMoney;
                        var memberMoney = doc.memberMoney;
                        var dayMoney = doc.dayMoney;

                        if(fillMembersMoney &&　typeof fillMembersMoney == 'number' && fillMembersMoney > 0)//容错处理
                        {
                            allMembers[day].fillMembersMoney  += parseInt(Number(fillMembersMoney));//会员补钻
                        }
                        if(userMoney &&　typeof userMoney == 'number' && userMoney > 0)//容错处理
                        {
                            allMembers[day].userMoney += parseInt(Number(userMoney));//用户余额
                        }
                        if(memberMoney &&　typeof memberMoney == 'number' && memberMoney > 0)//容错处理
                        {
                            allMembers[day].memberMoney += parseInt(Number(memberMoney));//会员余额
                        }
                        if(dayMoney &&　typeof dayMoney == 'number' && dayMoney > 0)//容错处理
                        {
                            allMembers[day].dayMoney += parseInt(Number(dayMoney));//用户钻石消耗
                        }
                    }

                }

                if(!doc)
                {
                    initMembers(day);
                    eventEmitter.emit('setMemberDayLog');
                }

            })
        }

        //写入表
        function setMemberDayLog()
        {
            //console.log(allMembers);

            if(allMembers[day])
            {
                allMembers[day].sumRegCount = allMembers[day].regCount; //注册人数
                var ytdat=day.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3");
                var preDate = new Date(ytdat);
                preDate.setDate(preDate.getDate() - 1);//前一天
                ytdat = tools.Format(preDate, 'yyyyMMdd');
                db.collection('memberDayLog').find({_id:Number(ytdat)}).each(function(errs,docs){
                    if(docs){
                        if(docs.sumRegCount){
                            allMembers[day].sumRegCount += docs.sumRegCount; //注册人数
                        }
                        //console.log(docs.sumRegCount +"--------------------------历史注册总人数");
                        //console.log(allMembers[day].regCount +"---------------------------当前注册人数");
                    }
                    if(!docs)
                    {

                        console.log(allMembers);
                        console.log("-----------------------------------------------------------------");

                        db.collection('memberDayLog').update({_id:Number(day)}, {$set:allMembers[day]}, {upsert:true},function (err, doc) {
                            db.close();
                            if(err)
                            {
                                !errMsg || errMsg(day+', '+err);
                                // console.log("memberDayLog 写入失败");
                            }
                            else
                            {
                                !endMsg || endMsg("memberDayLog 写入成功 " + day);
                                // console.log("memberDayLog 写入成功 " + day);
                            }
                        })
                    }
                });

            }
            else
            {
                db.close();
                !errMsg || errMsg(day+" 无数据, 写入失败");
            }
        }

        getMemberRetention();
        eventEmitter.on('getOpLog', getOpLog);
        eventEmitter.on('getUserCntMoney', getUserCntMoney);
        eventEmitter.on('getMemberConsumptionRecords', getMemberConsumptionRecords);
        eventEmitter.on('getDayLog', getDayLog);
        eventEmitter.on('setMemberDayLog', setMemberDayLog);

    });
}




/*
会员统计基础数据
1:重头开始跑
node memberStatistics.js 1
2:跑指定日期
node memberStatistics.js 20161201
3:跑前一天
node memberStatistics.js
*/
var tools = require("./tools")();
const memberStatistics = require('./memberStatistics.js');
var date = null;
var today = null;
if(process.argv.length == 3 && process.argv[2] == 1) {
    //从头开始跑的逻辑
    date = new Date('2017-01-01');
    today = tools.Format(new Date(),'yyyyMMdd');
    today = parseInt(today);
    function runStatic() {
        var str = tools.Format(date, 'yyyyMMdd') + "";

        if (parseInt(str) >= today) {
            console.info('static end');
            return;
        }

        memberStatistics(tools.url, str, function (msg) {
            console.info(msg);
            date.setDate(date.getDate() + 1);
            runStatic();
        }, function (msg) {
            console.info(msg);
            date.setDate(date.getDate() + 1);
            runStatic();
        });
    }

    runStatic();
}
else if(process.argv.length == 3 && process.argv[2].length == 8)
{
    //跑指定日期
    memberStatistics(tools.url, process.argv[2], function (msg) {
        console.info(msg);
    }, function (msg) {
        console.info(msg);
    });

}
else
{
    //跑前一天的数据
    today = new Date();
    today.setDate(today.getDate() - 1);
    var day = tools.Format(today, 'yyyyMMdd');
    memberStatistics(tools.url, day, function (msg) {
        console.info(msg);
    }, function (msg) {
        console.info(msg);
    });
}
