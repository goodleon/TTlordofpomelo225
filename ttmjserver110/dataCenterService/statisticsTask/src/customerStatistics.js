/**
 * Created by HJF on 2016/12/15 0015.
 * 客服统计基础数据
 * members + opLog20170101 + memberMoney20161109 + userMoney20161109 ==> customerDayLog
 */


module.exports = function (dbUrl, day, endMsg, errMsg)
{
    if(typeof day != 'string') {
        console.info('typeof day  must be string !!');
        !errMsg || errMsg('typeof day  must be string !!');
        return;
    }
    if(day.length != 8){
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

        var allCustomers = {};
        function initCustomers(tDay) {
            if(allCustomers[tDay])return;
            allCustomers[tDay] = {};
            allCustomers[tDay].regCount = 0;//注册人数
            allCustomers[tDay].loginCount = 0;//登录人数
            allCustomers[tDay].buyUserCount = 0;//充值人数
            allCustomers[tDay].buyCount = 0;//充值次数
            allCustomers[tDay].buyMoney = 0;//充值额度

            allCustomers[tDay].sellUserCount = 0;//销售人数
            allCustomers[tDay].sellCount = 0;//销售次数
            allCustomers[tDay].sellMoney = 0;//销售额度
            allCustomers[tDay].fillMembersMoney  = 0;//客服补钻
            allCustomers[tDay].userMoney = 0;//客服钻石余额

            allCustomers[tDay].sumRegCount = 0;//总注册人数

            allCustomers[tDay].recommendCount = 0;//推荐会员人数
            allCustomers[tDay].sellNum = 0;//销售钻石额度
            allCustomers[tDay].buyNum = 0;//买入钻石

        }

        //注册人数
        var reg = {};
        function getCustomers() {
            //查询某一天
            var startDate = day.substr(0,4) + '-' + day.substr(4,2)+ '-' + day.substr(6,2);
            var endDate = tools.dateAddDays(startDate, 1);
            var mTime = {$gte: new Date(startDate), $lt: new Date(endDate)};
            // console.log("endDate:", startDate, endDate);
            // console.log("mTime:", mTime);
            db.collection('members').find({'adminLevel':1}).each(function (err, doc) {
                if(doc)
                {

                    //去重
                    if(!reg[doc._id])
                    {
                        reg[doc._id] = 1;
                        initCustomers(day);
                        if(doc.money > 0)
                        {
                            allCustomers[day].userMoney += doc.money;//钻石余额
                        }

                        if(doc.mTime)
                        {
                            var tDay = tools.Format(new Date(doc.mTime),"yyyyMMdd");
                            if(tDay == day)
                            {
                                if (doc.byMid)
                                {
                                    allCustomers[day].recommendCount++; //推荐人数
                                }
                                allCustomers[day].regCount++; //注册人数
                            }
                        }



                    }
                }
                if(!doc)
                {
                    eventEmitter.emit('getOpLog');
                }
            });

        }

        //登录人数(去重mid)
        function getOpLog()
        {
            var login = {};
            db.collection('opLog'+day).find({"type" : "login"}).each(function (err, doc) {
                if(doc&&doc.mid)
                {
                    if(reg[doc.mid])
                    {
                        login[doc.mid] = 1;
                    }
                }
                if(!doc)
                {
                    initCustomers(day);
                    allCustomers[day].loginCount = Object.keys(login).length;//登录人数
                    getMemberMoney();
                }
            });
        }

        //充值销售人数
        var buyObj = {};
        var sellObj = {};
        function setData(id, doc)
        {
            var mid = id;
            var buyNum = doc.buyNum > 0 ? doc.buyNum : 0;
            var buyMoney = doc.buyMoney > 0 ? doc.buyMoney : 0;
            var byMid = doc.byMid;
            if(mid != byMid)//排除返利
            {
                //充值
                if(reg[mid])
                {
                    if(!buyObj[mid])
                    {
                        buyObj[mid] = {};
                        buyObj[mid].buyNum = 0;
                        buyObj[mid].buyMoney = 0;
                        buyObj[mid].buyCount = 0;
                    }
                    buyObj[mid].buyNum += buyNum;
                    buyObj[mid].buyMoney += buyMoney;
                    buyObj[mid].buyCount++;
                    // if(buyNum>0 || buyMoney>0)
                    // {
                    //     console.log("JSON.stringify(doc)",JSON.stringify(doc));
                    // }
                }
                //销售
                if(reg[byMid])
                {
                    if(!sellObj[byMid])
                    {
                        sellObj[byMid] = {};
                        sellObj[byMid].sellNum = 0;
                        sellObj[byMid].sellMoney = 0;
                        sellObj[byMid].sellCount = 0;
                    }
                    sellObj[byMid].sellNum += buyNum;
                    sellObj[byMid].sellMoney += buyMoney;
                    sellObj[byMid].sellCount++;
                    // if(buyNum>0 || buyMoney>0)
                    // {
                    //     console.log("JSON.stringify(doc)",JSON.stringify(doc));
                    // }
                }
            }
        }
        function updateData() {

            initCustomers(day);
            for(var key in buyObj)
            {
                var data = buyObj[key];
                allCustomers[day].buyUserCount++;//充值人数
                allCustomers[day].buyCount += data.buyCount;//充值次数
                allCustomers[day].buyMoney += data.buyMoney;//充值额度
                allCustomers[day].buyNum += data.buyNum;//充值钻石额度
            }

            for(var key in sellObj)
            {
                var data = sellObj[key];
                allCustomers[day].sellUserCount++;//销售人数
                allCustomers[day].sellCount += data.sellCount;//销售次数
                allCustomers[day].sellMoney += data.sellMoney;//销售额度
                allCustomers[day].sellNum += data.sellNum;//销售钻石额度
            }
            // console.log("allCustomers",JSON.stringify(allCustomers));
        }

        function getMemberMoney() {
            db.collection("memberMoney"+day).find().each(function (err,doc) {
                if(doc)
                {
                    setData(doc.mid,doc);
                }
                else
                {
                    getUserMoney();
                }
            })
        }
        function getUserMoney() {
            db.collection("userMoney"+day).find().each(function (err,doc) {
                if(doc)
                {
                    setData(doc.uid,doc);
                }
                else
                {
                    updateData();
                    eventEmitter.emit('setCustomerDayLog');
                }
            })
        }




        //写入表
        function setCustomerDayLog()
        {
            // console.log(allCustomers);
            if(allCustomers[day])
            {
                allCustomers[day].sumRegCount = allCustomers[day].regCount; //注册人数
                var ytdat=day.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3");
                var preDate = new Date(ytdat);

               // console.log(preDate);

                preDate.setDate(preDate.getDate() - 1);//前一天
                ytdat = tools.Format(preDate, 'yyyyMMdd');

                db.collection('customerDayLog').find({_id:Number(ytdat)}).each(function(errs,docs){
                    if(docs){

                        if(docs.sumRegCount){
                            allCustomers[day].sumRegCount += docs.sumRegCount; //注册人数
                        }
                    }
                    if(!docs)
                    {
                        db.collection('customerDayLog').update({_id:Number(day)}, {$set:allCustomers[day]}, {upsert:true},function (err, doc) {
                            db.close();
                            if(err)
                            {
                                !errMsg || errMsg(day+', '+err);
                                // console.log("customerDayLog 写入失败");
                            }
                            else
                            {
                                !endMsg || endMsg("customerDayLog 写入成功 " + day);
                                // console.log("customerDayLog 写入成功 " + day);
                            }
                        });
                    }
                });

            }
            else
            {
                db.close();
                !errMsg || errMsg(day+" 无数据, 写入失败");
            }
        }


        getCustomers();
        eventEmitter.on('getOpLog', getOpLog);
        eventEmitter.on('setCustomerDayLog', setCustomerDayLog);

    });
}




/*
 客服统计基础数据
 1:重头开始跑
 node customerStatistics.js 1
 2:跑指定日期
 node customerStatistics.js 20161201
 3:跑前一天
 node customerStatistics.js
 */
var tools = require("./tools")();
const customerStatistics = require('./customerStatistics.js');
var date = null;
var today = null;
if(process.argv.length == 3 && process.argv[2] == 1) {
    //从头开始跑的逻辑
    date = new Date('2016-7-1');
    // date = new Date('2017-5-3');
    today = tools.Format(new Date(),'yyyyMMdd');
    today = parseInt(today);
    function runStatic() {
        var str = tools.Format(date, 'yyyyMMdd') + "";

        if (parseInt(str) >= today) {
            console.info('static end');
            return;
        }

        customerStatistics(tools.url, str, function (msg) {
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
    customerStatistics(tools.url, process.argv[2], function (msg) {
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
    customerStatistics(tools.url, day, function (msg) {
        console.info(msg);
    }, function (msg) {
        console.info(msg);
    });
}
