/**
 * Created by HJF on 2016/11/23
 * 操作客服数据
 */

module.exports = function (admin)
{
    var tools=require('../tools')();
    var rtn = {
        getCustomerData: function (req, res) {
            if (!admin.checkLevel(req, [1, 3, 10])) {
                res.json({err: 1});  // 权限错误
                return;
            }
            //console.info(JSON.stringify(req.body));
            var info = req.body;

            if ((typeof info.date != 'string') || !admin.mdb || typeof info.type != 'number' || typeof info.mid != 'number') {
                res.json({err: 2});  // 数据错误
                return;
            }

            var member = admin.getMember(req);
            var i, month, day;
            var wherePara = {};
            var key, date, wDay;
            var tbList, cData, lData,cDataList,lDataList;
            date = new Date(info.date);

            if (member.adminLevel == 1) {//查询自己
                wherePara._id = member.mid + "";
                tbList = {};
                month = date.getFullYear() * 100 + (date.getMonth() + 1);
                tbList['achievement' + month] = {};
            } else if (info.mid) {//查询单个人
                wherePara._id = info.mid + "";
                tbList = {};
                month = date.getFullYear() * 100 + (date.getMonth() + 1);
                tbList['achievement' + month] = {};
                /*wherePara._id = info.mid + "";
                tbList = {};
                month = date.getFullYear() * 100 + (date.getMonth() + 1);
                tbList['achievement' + month] = {};//当月全部

                if (info.type == 3) {//按周显示
                    date.setDate(1);//1号
                    wDay = date.getDay();
                    date.setDate(-(wDay + 7 - 2));//上一周的起始时间 周一
                    month = date.getFullYear() * 100 + (date.getMonth() + 1);
                    tbList['achievement' + month] = {};
                    day = month * 100 + date.getDate();

                    for (i = 0; i < wDay + 7 - 1; i++) {
                        tbList['achievement' + month][day + i] = 1;
                    }

                    date.setMonth(date.getMonth() + 2);//下个月
                    date.setDate(1);
                    wDay = date.getDay();

                    if (wDay != 1) {//1号是周一，就不理了
                        month = date.getFullYear() * 100 + (date.getMonth() + 1);
                        tbList['achievement' + month] = {};
                        day = month * 100 + date.getDate();

                        if (wDay == 0) {
                            wDay = 1;
                        } else {
                            wDay = 7 - wDay + 1;
                        }

                        for (i = 0; i < wDay; i++) {
                            tbList['achievement' + month][day + i] = 1;
                        }
                    }
                } else {//按日显示
                    month = date.getFullYear() * 100 + (date.getMonth() + 1);
                    tbList['achievement' + month] = {};
                    date.setDate(0);//上个月最后一天
                    month = date.getFullYear() * 100 + (date.getMonth() + 1);
                    tbList['achievement' + month] = {};
                    day = month * 100 + date.getDate();
                    tbList['achievement' + month][day] = 1;
                }*/
            } else {//查询全部列表
                if (info.type == 1) {//日
                    month = date.getFullYear() * 100 + (date.getMonth() + 1);
                    day = month * 100 + date.getDate();

                    cDataList = {};
                    cDataList[day] = 1;
                    cData = {};
                    cData['achievement' + month] = {};
                    cData['achievement' + month][day] = 1;
                    cData['achievement' + month]['name'] = 1;
                    //console.log("当 天 -------- "+JSON.stringify(cDataList));
                    //console.log();
                    date.setDate(date.getDate() - 1);//前一天
                    month = date.getFullYear() * 100 + (date.getMonth() + 1);
                    day = month * 100 + date.getDate();
                    lDataList = {};
                    lDataList[day] = 1;

                    lData = {};

                    if (!lData['achievement' + month]) {
                        lData['achievement' + month] = {};
                    }

                    lData['achievement' + month][day] = 1;
                    lData['achievement' + month]['name'] = 1;

                    //console.log("前1天 -------- "+JSON.stringify(lDataList));
                    //console.log();
                } else if (info.type == 2) {//3日
                    date.setDate(date.getDate() - 1);
                    month = date.getFullYear() * 100 + (date.getMonth() + 1);
                    day = month * 100 + date.getDate();

                    cDataList = {};


                    cData = {};
                    for (i = 0; i < 3; i++) {//计算当前三天
                        date.setDate(date.getDate() + 1);
                        month = date.getFullYear() * 100 + (date.getMonth() + 1);
                        day = month * 100 + date.getDate();

                        if (!cData['achievement' + month]) {
                            cData['achievement' + month] = {};
                        }
                        cDataList[day] = 1;
                        cData['achievement' + month][day] = 1;
                        cData['achievement' + month]['name'] = 1;
                    }
                    //console.log("当前三天 -------- "+JSON.stringify(cDataList));
                    //console.log();

                    date.setDate(date.getDate() - 2);//回到当前
                    lDataList = {};
                    lData = {};

                    for (i = 0; i < 3; i++) {//计算前三天
                        date.setDate(date.getDate() - 1);
                        month = date.getFullYear() * 100 + (date.getMonth() + 1);
                        day = month * 100 + date.getDate();
                        lDataList[day] = 1;
                        if (!lData['achievement' + month]) {
                            lData['achievement' + month] = {};
                        }

                        lData['achievement' + month][day] = 1;
                        lData['achievement' + month]['name'] = 1;
                    }
                    //console.log("前三天 -------- "+JSON.stringify(lDataList));
                    //console.log();
                } else if (info.type == 3) {//周
                    wDay = date.getDay();

                    if (wDay == 0) {
                        wDay = 7;//周日
                    }

                    date.setDate(date.getDate() - wDay);//上个周日
                    cDataList = {};

                    cData = {};

                    for (i = 0; i < 7; i++) {//取本周
                        date.setDate(date.getDate() + 1);
                        month = date.getFullYear() * 100 + (date.getMonth() + 1);
                        day = month * 100 + date.getDate();

                        if (!cData['achievement' + month]) {
                            cData['achievement' + month] = {};
                        }
                        cDataList[day] = 1;
                        cData['achievement' + month][day] = 1;
                        cData['achievement' + month]['name'] = 1;
                    }
                    //console.log("本周 -------- "+JSON.stringify(cDataList));
                    //console.log();
                    date.setDate(date.getDate() - 14);
                    lDataList = {};
                    lData = {};

                    for (i = 0; i < 7; i++) {//取上周
                        date.setDate(date.getDate() + 1);
                        month = date.getFullYear() * 100 + (date.getMonth() + 1);
                        day = month * 100 + date.getDate();

                        if (!lData['achievement' + month]) {
                            lData['achievement' + month] = {};
                        }

                        lDataList[day] = 1;

                        lData['achievement' + month][day] = 1;
                        lData['achievement' + month]['name'] = 1;
                    }
                    //console.log("上周 -------- "+JSON.stringify(lDataList));
                    //console.log();
                } else {//月
                    month = date.getFullYear() * 100 + (date.getMonth() + 1);
                    cData = {};
                    cData['achievement' + month] = {};



                    date.setDate(date.getDate() - 1);//前一天
                    month = date.getFullYear() * 100 + (date.getMonth() + 1);
                    day = month * 100 + date.getDate();
                    //console.log(day);
                    date.setDate(1);
                    var cDataStart = month * 100 + date.getDate();
                    var cDataStart = cDataStart.toString();
                    //cDataStart = cDataStart.substr(0,4)+'-'+cDataStart.substr(4,2)+'-'+cDataStart.substr(6,2);//2017-01-01本月开始
                    //console.log('---本月开始时间 -------- '+cDataStart);


                    var cDataEnd = new Date(date.getFullYear(),date.getMonth() + 1,0);
                    var cDataEnd = tools.Format(cDataEnd, 'yyyyMMdd');
                    var cDataEnd = cDataEnd.toString();
                    //cDataEnd = cDataEnd.substr(0,4)+'-'+cDataEnd.substr(4,2)+'-'+cDataEnd.substr(6,2);//2017-01-01本月结束
                    //console.log("---本月结束时间 --------"+cDataEnd);
                    var cDataList = arrData(cDataStart,cDataEnd);
                    //console.log("本月 -------- "+JSON.stringify(cDataList));
                    //console.log();


                    date.setMonth(date.getMonth() - 1);//上个月
                    month = date.getFullYear() * 100 + (date.getMonth() + 1);
                    lData = {};
                    lData['achievement' + month] = {};
                    
                    date.setDate(1);
                    var lDataStart = month * 100 + date.getDate();
                    var lDataStart = lDataStart.toString();
                    //lDataStart = lDataStart.substr(0,4)+'-'+lDataStart.substr(4,2)+'-'+lDataStart.substr(6,2);//上月开始
                    //console.log('---上月开始时间 -------- '+lDataStart);

                    var lDataEnd = new Date(date.getFullYear(),date.getMonth() + 1,0);
                    var lDataEnd = tools.Format(lDataEnd, 'yyyyMMdd');
                    var lDataEnd = lDataEnd.toString();
                    //lDataEnd = lDataEnd.substr(0,4)+'-'+lDataEnd.substr(4,2)+'-'+lDataEnd.substr(6,2);//上月结束
                    //console.log("---上月结束时间 --------"+lDataEnd);
                    var lDataList = arrData(lDataStart,lDataEnd);
                    //console.log("上月 -------- "+JSON.stringify(lDataList));
                    //console.log();
                }
            }


            function arrData(stime,etime){
                var stime = stime.substr(0,4)+'-'+stime.substr(4,2)+'-'+stime.substr(6,2);//2017-01-01开始时间
                var etime = etime.substr(0,4)+'-'+etime.substr(4,2)+'-'+etime.substr(6,2);//2017-01-01结束时间

                var arr = {};
                var s_time = Date.parse(stime); //本周开始时间
                var e_time = Date.parse(etime); //本周结束时间
                while (s_time <= e_time){
                    var date = new Date(s_time);
                    var day = tools.Format(date, 'yyyyMMdd');
                    s_time = s_time + 24*60*60*1000;
                    arr[day]=1; //本周查询字段
                }
                return arr;
            }

            var result;
            // console.log('info',JSON.stringify(info));
            //("tbList ==== " + JSON.stringify(tbList));
            //console.info("cData ==== " + JSON.stringify(cData));
            //console.info("lData ==== " + JSON.stringify(lData));

            function queryTBData() {
                if(i >= len) {
                    //console.info("i === " + i);
                    res.json({err: 0, type: info.type, mid: info.mid, data: result});
                    return;
                }

                key = keys[i];

                //console.info('tb 7== ' + key, wherePara);
                //console.info('para 7== ' + JSON.stringify(tbList[key]));
                //console.log("--------------------------------kkkkkkkkkkkkkkkkkkkk--------------------------");

                admin.mdb.collection(key).find(wherePara, tbList[key]).each(function (er, doc) {
                    if (doc) {
                       // console.info("doc === " + JSON.stringify(doc));
                        for(var k in doc) {
                            if(doc[k].buyIds) delete doc[k].buyIds;
                            if(doc[k].sellIds) delete doc[k].sellIds;
                            if(doc[k].userIds) {
                                var ids = Object.keys(doc[k].userIds);
                                var len = ids.length;
                                var count = 0;

                                for(var ii = 0; ii < len; ii++) {
                                    count += doc[k].userIds[ids[ii]];
                                }

                                doc[k].userCount = len;
                                doc[k].sellCount = count;
                                delete doc[k].userIds;
                            }
                        }

                        result = doc;//fix me
                    } else {
                        i++;
                        queryTBData();
                    }
                });
            }

            var keys, len;

            if(tbList) {
                keys = Object.keys(tbList);
                len = keys.length;
                i = 0;
                result = {};
                queryTBData();
            }

            function countMember(dd, doc) {
                var id;

                if(doc.buyIds){
                    for(id in doc.buyIds) {
                        if(!dd.buyIds[id]) {
                            dd.buyIds[id] = 1;
                            dd.buyMem++;
                        }
                    }
                }

                if(doc.sellIds){
                    for(id in doc.sellIds) {
                        if(!dd.sellIds[id]) {
                            dd.sellIds[id] = 1;
                            dd.sellMem++;
                        }
                    }
                }

                if(doc.userIds){
                    for(id in doc.userIds) {
                        if(!dd.userIds[id]) {
                            dd.userIds[id] = 1;
                            dd.userCount++;
                        }
                        dd.sellCount += doc.userIds[id];
                    }
                }

            }

            function initData(){
                var dd = {};
                dd.buyMem = 0;
                dd.sellMem = 0;
                dd.userCount = 0;
                dd.sellCount = 0;

                dd.buyIds = {};
                dd.sellIds = {};
                dd.userIds = {};

                if (member.adminLevel == 10) {
                    dd.buyMoney = 0;
                    dd.buyNum = 0;
                    dd.sellNum = 0; // ----- 更正 卖出数量 --- 钻
                    dd.sellMoney = 0; //------新添加  （更正 卖出数量 --- 元）
                }

                return dd;
            }


            function initDatas(){
                var dd = {};
                dd.buyMem = 0;
                dd.sellMem = 0;
                dd.userCount = 0;
                dd.sellCount = 0;

                dd.buyIds = {};
                dd.sellIds = {};
                dd.userIds = {};

                if (member.adminLevel == 10) {
                    dd.buyMoney = 0;
                    dd.buyNum = 0;
                    dd.sellNum = 0; // ----- 更正 卖出数量 --- 钻
                    dd.sellMoney = 0; //------新添加  （更正 卖出数量 --- 元）
                }

                return dd;
            }


            function queryCData() {
                if(i >= len) {
                    keys = Object.keys(lData);
                    len = keys.length;
                    i = 0;
                    queryLData();
                    return;
                }

                key = keys[i];
                //console.info('cData -- tb == ' + key);
                // console.log("cData - where == " + JSON.stringify(wherePara));
                //console.log('cData - Key ====' + JSON.stringify(key));
                //console.info('cData - para == ' + JSON.stringify(cData));

                admin.mdb.collection(key).find(wherePara, cData[key]).each(function (er, doc) {
                    if (doc) {
                        //console.info("doc === " + JSON.stringify(doc));
                        var mid = doc._id;
                        var dd = result[mid];

                        if (!dd) {
                            result[mid] = {};
                            result[mid].cData = initData();
                            result[mid].lData = initData();
                            dd = result[mid].cData;
                        } else dd = result[mid].cData;

                        delete doc._id;
                        // dd.name = doc.name||'-';
                        if(doc.name)
                        {
                            dd.name = doc.name;
                        }
                        //for (var k in doc) {
                        //    countMember(dd, doc[k]);
                        //
                        //    if(!dd.memberCount || doc[k].memberCount > dd.memberCount)
                        //    {
                        //        dd.memberCount = doc[k].memberCount;
                        //    }
                        //
                        //    if (member.adminLevel == 10) {
                        //        dd.buyMoney += doc[k].buyMoney;
                        //        dd.buyNum += doc[k].buyNum;
                        //        dd.sellNum += doc[k].sellNum;
                        //        dd.sellMoney += doc[k].sellMoney;
                        //    }
                        //}


                        for (var v in cDataList){
                            if (doc[v]) {
                                countMember(dd, doc[v]);
                                if (!dd.memberCount || doc[v].memberCount > dd.memberCount) {
                                    dd.memberCount = doc[v].memberCount;
                                }

                                if (member.adminLevel == 10) {
                                    dd.buyMoney += doc[v].buyMoney;
                                    dd.buyNum += doc[v].buyNum;
                                    dd.sellNum += doc[v].sellNum;
                                    dd.sellMoney += doc[v].sellMoney;
                                }
                            }
                        }


                    } else {
                        i++;
                        queryCData();
                    }
                });
            }

            if(cData) {
                keys = Object.keys(cData);
                len = keys.length;
                i = 0;
                result = {};
                queryCData();
            }

            function queryLData() {

                //console.info("i === " + i);
                if(i >= len) {
                    var data = [];
                    var all = {};
                    all.mid = '合计';
                    all.curBuyMem = 0;
                    all.lastBuyMem = 0;
                    all.buyUp = 0;
                    all.curSellMem = 0;
                    all.lastSellMem = 0;
                    all.sellUp = 0;
                    all.curUserCount = 0;
                    all.lastUserCount = 0;
                    all.curSellCount = 0;
                    all.lastSellCount = 0;
                    all.userUp = 0;
                    all.countUp = 0;

                    all.mCount = 0;

                    if(member.adminLevel == 10) {
                        all.curBuyMoney = 0;
                        all.lastBuyMoney = 0;
                        all.curBuyNum = 0;
                        all.lastBuyNum = 0;
                        all.curSellNum = 0;
                        all.lastSellNum = 0;
                        all.curSellMoney = 0; //本期卖出总额 -- 钻
                        all.lastSellMoney = 0;//上期买出总额 -- 钻
                    }

                    var curIds = {};
                    var lastIds = {};

                    function countUser(ff, dd) {
                        var id;

                        if(dd.cData.userIds) {
                            ff.curUserCount = dd.cData.userCount;
                            ff.curSellCount = dd.cData.sellCount;

                            for(id in dd.cData.userIds) {
                                if(!curIds[id]) {
                                    curIds[id] = 1;
                                    all.curUserCount++;
                                }
                            }
                        }

                        if(dd.lData.userIds) {
                            ff.lastUserCount = dd.lData.userCount;
                            ff.lastSellCount = dd.lData.sellCount;

                            for(id in dd.lData.userIds) {
                                if(!lastIds[id]) {
                                    lastIds[id] = 1;
                                    all.lastUserCount++;
                                }
                            }
                        }

                        ff.userUp = ff.curUserCount - ff.lastUserCount;
                        all.userUp = all.curUserCount - all.lastUserCount;
                        ff.countUp = ff.curSellCount - ff.lastSellCount;
                        all.curSellCount += dd.cData.sellCount;
                        all.lastSellCount += dd.lData.sellCount;
                        all.countUp += ff.countUp;
                    }

                    //console.log('=== result  ====', JSON.stringify(result));

                    for(var id in result) {
                        var dd = result[id];
                        var ff = {};

                        ff.mid = id;

                        ff.mCount = dd.cData.memberCount;
                        ff.name = dd.name||dd.cData.name;

                        // console.log("member.adminLevel,ff.mid,dd.name,dd.cData.name,dd.cData.memberCount,", member.adminLevel,ff.mid,dd.name,dd.cData.name,dd.cData.memberCount);
                        all.mCount += ff.mCount;

                        ff.curBuyMem = dd.cData.buyMem;
                        ff.lastBuyMem = dd.lData.buyMem;
                        ff.buyUp = dd.cData.buyMem - dd.lData.buyMem;

                        all.curBuyMem += ff.curBuyMem;
                        all.lastBuyMem += ff.lastBuyMem;
                        all.buyUp += ff.buyUp;

                        ff.curSellMem = dd.cData.sellMem;
                        ff.lastSellMem = dd.lData.sellMem;
                        ff.sellUp = dd.cData.sellMem - dd.lData.sellMem;

                        all.curSellMem += ff.curSellMem;
                        all.lastSellMem += ff.lastSellMem;
                        all.sellUp += ff.sellUp;

                        countUser(ff, dd);

                        if(member.adminLevel == 10) {

                            ff.curBuyMoney = dd.cData.buyMoney;
                            ff.lastBuyMoney = dd.lData.buyMoney;

                            all.curBuyMoney += ff.curBuyMoney;
                            all.lastBuyMoney += ff.lastBuyMoney;

                            ff.curBuyNum = dd.cData.buyNum;
                            ff.lastBuyNum = dd.lData.buyNum;

                            all.curBuyNum += ff.curBuyNum;
                            all.lastBuyNum += ff.lastBuyNum;

                            ff.curSellNum = dd.cData.sellNum;
                            ff.lastSellNum = dd.lData.sellNum;

                            all.curSellNum += ff.curSellNum;
                            all.lastSellNum += ff.lastSellNum;

                            ff.curSellMoney = dd.cData.sellMoney;
                            ff.lastSellMoney = dd.lData.sellMoney;

                            all.curSellMoney += ff.curSellMoney;
                            all.lastSellMoney += ff.lastSellMoney;
                        }

                        data.push(ff);
                    }

                    data.push(all);

                    res.json({err: 0, type: info.type, mid: info.mid, data: data});
                    return;
                }

                key = keys[i];
                //console.info('lData -- tb == ' + key);
                //console.log("lData -- where" + JSON.stringify(wherePara));
                //console.info('lData -- para == ' + JSON.stringify(lData[key]));
                admin.mdb.collection(key).find(wherePara, lData[key]).each(function (er, doc) {
                    if (doc) {
                        //console.info("doc === " + JSON.stringify(doc));
                        var mid = doc._id;
                        var dd = result[mid];

                        if (!dd) {
                            result[mid] = {};
                            result[mid].cData = initData();
                            result[mid].lData = initData();
                            dd = result[mid].lData;
                        } else dd = result[mid].lData;

                        delete doc._id;
                        if(doc.name&&!result[mid].name)
                        {
                            result[mid].name = doc.name;
                        }
                        //for (var k in doc) {
                        //    countMember(dd, doc[k]);
                        //    countMember
                        //    //fix会员数量比本期充值人数小的bug; modify by hjf 2017-01-19
                        //    // if(!result[mid].cData.memberCount) {
                        //    if(!result[mid].cData.memberCount || doc[k].memberCount > result[mid].cData.memberCount){
                        //        result[mid].cData.memberCount = doc[k].memberCount;
                        //    }
                        //
                        //    if (member.adminLevel == 10) {
                        //        dd.buyMoney = doc[k].buyMoney;
                        //        dd.buyNum = doc[k].buyNum;
                        //        dd.sellNum = doc[k].sellNum;
                        //        dd.sellMoney = doc[k].sellMoney;
                        //    }
                        //}

                        for (var v in lDataList){
                            if (doc[v]){
                                countMember(dd, doc[v]);
                                if(!result[mid].cData.memberCount || doc[v].memberCount > result[mid].cData.memberCount){
                                    result[mid].cData.memberCount = doc[v].memberCount;
                                }

                                if (member.adminLevel == 10) {
                                    dd.buyMoney += doc[v].buyMoney;
                                    dd.buyNum += doc[v].buyNum;
                                    dd.sellNum += doc[v].sellNum;
                                    dd.sellMoney += doc[v].sellMoney;
                                }
                            }
                        }

                        //console.log(dd);
                        //console.log("-----------------------------------------------------------------------------");

                    } else {
                        i++;
                        queryLData();
                    }
                });
            }
        },
        getCustomerStatistics:function (req, res)
        {
            if (!admin.checkLevel(req, [1, 3, 10]))
            {
                res.json({er: 1});  // 权限错误
                return;
            }

            var info = req.body;
            if (!('month' in info) ||  !admin.mdb)
            {
                res.json({er: 2});  // 数据错误
                return;
            }
            var month = info.month;//201612
            var startDate = month+"01";
            var dayOfMonth = (new Date(month.substr(0,4), month.substr(4,2), 0)).getDate();
            var endDate = ""+month+dayOfMonth;
            //console.log("日期为：", startDate, endDate);
            var command = {_id:{$lte:Number(endDate), $gte:Number(startDate)}};
            var result = [];
            var level = admin.getLevel(req);
            admin.mdb.collection('customerDayLog').find(command).sort({_id:-1}).each(function (er, doc)
            {
                if (doc)
                {
                    if(level != 10 && doc.buyMoney)
                    {
                        delete doc.buyMoney;//10级才显示[充值额度]
                    }
                    result.push(doc);
                }
                if (!doc)
                {
                    res.json({total: result.length, rows: result});
                }
            });

        }
    };

    return rtn;
};
