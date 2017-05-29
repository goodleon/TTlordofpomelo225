/**
 * Created by HJF on 2016/11/22 0022.
 * 用户登录/活跃留存
 * @param {string} dbUrl mongodbUrl
 * @param {string} day  1:从头开始跑数据 2016-12-16|new Date(new Date() - 1*24*60*60*1000):只跑某一天数据  null:前一天
 * cgbuser + loginLog20170101 + gameLog20170101 ==> userStatistics
 */
var allUsers = {};
var allTimes = {};
module.exports = function(dbUrl, day, endF, errF)
{

    var startTime = new Date();
    var isRunAll = day == 1;
    if(day == 1)
    {
        day = new Date('2016-7-1');//从头开始
    }
    else if(!day)
    {
        day = new Date(new Date() - 1*24*60*60*1000);//采集昨天
        allUsers = {};
        allTimes = {}
    }
    else
    {
        day = new Date(day);//指定日期
        allUsers = {};
        allTimes = {}
    }
    var MAX_DAY = isRunAll ? 1 : 30;
    var tools = require("./../tools")();
    var today = tools.Format(day, "yyyyMMdd");
    var registerCollection = "cgbuser";         //注册Collection
    var loginCollection = "loginLog" + today;     //登录Collection: loginLog20161128
    var activeCollection = "gameLog" + today;     //活跃Collection: gameLog20161128
    var userStatistics = "userStatistics";  //统计用户留存
    var loginLogIndexes = [];   //整个登录index
    var loginLogfilter = {'type' : 'doLogin'};//过滤登录
    var gameLogIndexes = [];   //整个活跃index
    var gameLogfilter = {};//过滤活跃
    var MAX_GROUP = 10;
    var obj = {};
    var MAX_HOUR = 24; //时间段
    var timeObj = {};
    var tempObj = {len:0};
    var events = require('events');
    var eventEmitter = new events.EventEmitter();
    var regTotal = 0, loginTotal = 0,activeTotal = 0, vipTableTotal = 0; //注册、登录、活跃总人数,开房间总数
    var writeLen = 0;
    var KEY_ACTIVE = "_active";
    var iToday = Number(today);
    var vipTableArr = [];//房间数量
    var vipTableCount = 0;
    for(var i = 0; i < MAX_HOUR; i++)
    {
        vipTableArr.push(0);
    }

    if(today.length != 8)
    {
        !errF || errF(day + ", ERROR!!!");
        return;
    }
    // console.log('dbUrl',dbUrl);
    require('mongodb').MongoClient.connect(dbUrl, function (er, db)
    {

        if(!db)
        {
            !errF || errF(dbUrl+"connect ERROR!!!");
            return;
        }

        function filterUid(uid)
        {
            return uid > 10000;
        }

        var tt = 'times_'+today;
        function initTimeObj()
        {

            timeObj[tt] = {};
            for(var i = 0; i < MAX_HOUR; i++)
            {
                timeObj[tt][i]={};
            }
        }

        function closeDb()
        {
            db.close();
        }

        function initAllUsers(uid)
        {
            if(allUsers[uid])return;
            allUsers[uid] = {};
            allUsers[uid].registerTime = null; //注册时间
            allUsers[uid].loginTime = [];    //登录时间
            allUsers[uid].activeTime = [];   //活跃时间
        }

        function initAllTimes(day) {
            if(allTimes[day])return;
            allTimes[day] = {};
            allTimes[day].loginTimes = [];    //登录时间段
            allTimes[day].activeTimes = [];   //活跃时间段
        }
        //1、注册数据
        var getRegisterInfo = function()
        {
            var command = {};
            var timer = 1*24*60*60*1000;
            if(!isRunAll)
            {
                //当天-次日-3天-7天-15天-30天
                // var strDay = today.substr(0,4)+'-'+today.substr(4,2)+'-'+today.substr(6,2);
                var strDay = today.substr(0,4)+'-'+today.substr(4,2)+'-'+today.substr(6,2)+' 00:00:00';//改成跟dayLog一致每天23:59:59采集注册数据
                var nextday = new Date(strDay);
                nextday.setMilliseconds(nextday.getMilliseconds() - 1000);//改成跟dayLog一致每天23:59:59采集注册数据
                nextday.setDate(nextday.getDate() + 1);
                var day = new Date(strDay);
                var day1 = {sendTime: {$gte: new Date(day), $lt: nextday}};
                var day2 = {sendTime: {$gte: new Date(day-1*timer), $lt: new Date(day)}};
                var day3 = {sendTime: {$gte: new Date(day-2*timer), $lt: new Date(day-1*timer)}};
                var day7 = {sendTime: {$gte: new Date(day-6*timer), $lt: new Date(day-5*timer)}};
                var day15 = {sendTime: {$gte: new Date(day-14*timer), $lt: new Date(day-13*timer)}};
                var day30 = {sendTime: {$gte: new Date(day-29*timer), $lt: new Date(day-28*timer)}};
                command = {$or:[day1,day2,day3,day7,day15,day30]};
            }

            // console.log("注册数据--- command:"+JSON.stringify(command));
            db.collection(registerCollection).find(command, {sendTime:1}).each(function (er, doc) {
                if (doc&&doc._id&&doc.sendTime) {
                    var uid = doc._id;
                    //改成跟dayLog一致每天23:59:59采集注册数据
                    var sendTime = new Date(doc.sendTime)//'Sun Jan 08 2017 00:03:49 GMT+0800 (CST)'
                    var rTime = tools.Format(sendTime, 'yyyyMMdd');

                    //GMT2UTC
                    // var sendTime = new Date(doc.sendTime)//'Sun Jan 08 2017 00:03:49 GMT+0800 (CST)'
                    // var tDay = new Date(sendTime.getUTCFullYear(),sendTime.getUTCMonth(),sendTime.getUTCDate());
                    // var rTime = tools.Format(tDay, 'yyyyMMdd');
                    // console.log('uid',uid);
                    // console.log("注册数据--- rTime:"+rTime+", doc.sendTime:"+doc.sendTime);
                    initAllUsers(uid);
                    allUsers[uid].registerTime = rTime;
                }

                if (!doc) {

                    // console.log("注册数据---", JSON.stringify(allUsers));
                    // console.log("注册数据--->>>>", Object.keys(allUsers).length);
                    if(isRunAll)
                    {
                        getSystemIndexInfo();
                    }
                    else
                    {
                        getLoginInfo();
                    }
                }
            });
        }


        function setObj(uid, hour) {
            if(!uid)return;
            if(!obj[uid])
            {
                obj[uid] = {};
                obj[uid][today] = 1;
                tempObj[uid] = [today];
                tempObj.len++;
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
            if(hour >= 0)
            {
                timeObj[tt][hour][uid] = 1;
            }

        }

        var setLoginAllTimes = function (docs) {
            for(var key in docs)
            {
                initAllTimes(key);
                // allTimes[key].loginTimes = docs[key];    //登录时间段
                var hours = docs[key];
                for(var h in hours)
                {
                    var keys = Object.keys(hours[h]);
                    // console.log('keys.length ====> ', h, keys.length);
                    allTimes[key].loginTimes.push(keys.length);
                }

                // console.log('allTimes[key].loginTimes ', allTimes[key].loginTimes);
            }
            // console.log('allTimes: ', JSON.stringify(allTimes));
        }

        var setLoginInfo = function(docs)
        {
            if(!docs || docs.len <= 0)return;
            // console.info(' docs: '+JSON.stringify(docs));
            for(var uid in docs)
            {
                initAllUsers(uid);
                allUsers[uid].loginTime = allUsers[uid].loginTime.concat(docs[uid]);
            }
        }
        var setActiveAllTimes = function (docs) {
            for(var key in docs)
            {
                initAllTimes(key);
                // allTimes[key].activeTimes = docs[key];    //活跃时间段
                var hours = docs[key];
                for(var h in hours)
                {
                    var keys = Object.keys(hours[h]);
                    // console.log('keys.length ====> ', h, keys.length);
                    allTimes[key].activeTimes.push(keys.length);
                }

                // console.log('allTimes[key].activeTimes: ', allTimes[key].activeTimes);
            }
            // console.log('活跃时间段: ', JSON.stringify(allTimes));
            // console.log('活跃时间段docs: ', JSON.stringify(docs));
        }
        var setActiveInfo = function (docs) {
            // console.info('1 docs: '+JSON.stringify(docs));
            if(!docs || docs.len <= 0)return;
            for(var uid in docs)
            {
                initAllUsers(uid);
                allUsers[uid].activeTime = allUsers[uid].activeTime.concat(docs[uid]);
            }
        }

        //2、登录数据(每日跑)
        var getLoginInfo = function()
        {
            initTimeObj();
            obj = {};
            tempObj = {len:0};
            db.collection(loginCollection).find(loginLogfilter).each(function (er, doc)
            {
                if(doc && doc.uid)
                {
                    // console.log("doc=======", JSON.stringify(doc));
                    var hour = new Date(doc.time).getHours();
                    setObj(doc.uid, hour);

                    // tools.wLog('loginCollection', JSON.stringify(doc),'loginCollection');
                }
                if (!doc)
                {
                    // console.log("登录时间", loginCollection,ttt, JSON.stringify(timeObj));
                    setLoginInfo(tempObj);
                    setLoginAllTimes(timeObj);
                    getActiveInfo();
                }
            });
        }
        // 3、活跃数据(每日跑)
        var getActiveInfo = function()
        {
            initTimeObj();
            obj = {};
            tempObj = {len:0};
            //活跃统计
            db.collection(activeCollection).find(gameLogfilter).each(function (er, doc)
            {
                if(doc)
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
                    // console.log('活跃td：', JSON.stringify(td));
                    vipTableArr[hour]++;
                    vipTableCount++;
                }

                if (!doc)
                {
                    // console.log('活跃：', JSON.stringify(tempObj));
                    setActiveInfo(tempObj);
                    setActiveAllTimes(timeObj);
                    getAllusersInfo();
                }
            });
        }



        //1、收集登录信息(从头开始跑)
        var getSystemIndexInfo = function () {
            db.collection("system.indexes").find({}).each(function (er, doc)
            {
                if (doc && doc.ns)
                {
                    var currentName = doc.ns.split('.')[1];
                    if(currentName.indexOf("loginLog") >= 0){
                        loginLogIndexes.push(currentName);
                    }
                    else if(currentName.indexOf("gameLog") >= 0){
                        gameLogIndexes.push(currentName);
                    }

                }
                if (!doc)
                {

                    eventEmitter.emit('getLoginInfoByFork', MAX_GROUP);
                    // getLoginInfoByFork(MAX_GROUP);
                }
            });
        }
        /***
         * 2、登录数据(从头开始跑)
         * @param {num} 一个进程跑收集num组数据
         */
        var getLoginInfoByFork = function (num)
        {
            if(loginLogIndexes.length <= 0)
            {
                getGameLoginInfoByFork(MAX_GROUP);
                return;
            }
            loginLogIndexes = tools.unique(loginLogIndexes);
            loginLogIndexes.sort();
            // console.log(loginLogIndexes.length + ", loginLogIndexes:"+loginLogIndexes);

            var allDay = [];
            for(var count = 0; count < loginLogIndexes.length; count ++)
            {
                // today = new Date(today.getTime() + 1*24*60*60*1000);
                // console.log(tools.Format(today,'yyyyMMdd'));
                var day = loginLogIndexes[count];
                if(!allDay[count%num])
                {
                    allDay[count%num] = [];
                }
                allDay[count%num].push(day);
            }

            // console.log("allDay:"+allDay);
            var cp = require("child_process");
            var allDayLen = allDay.length;
            var allDayIndex = 0;
            var allData = [];
            console.log("init "+allDayIndex+", "+allDayLen);
            for(var i = 0; i < allDayLen; i++) {
                var cdate = allDay[i];
                (function (midx, mdate, loginLogfilter) {
                    var newProcess = cp.fork(__dirname + '/loginLogTask.js', [dbUrl, mdate, midx]);
                    newProcess.type = midx;
                    newProcess.on('message', function (doc)
                    {
                        // console.log(JSON.stringify(doc));
                        if(doc.data)
                        {
                            allData.push(doc.data);
                        }
                        if(doc.endCode == 200)
                        {
                            // console.log("loginLogIndex "+allDayIndex+", "+allDayLen);


                            setLoginAllTimes(doc.times);
                            if(++allDayIndex >= allDayLen)
                            {

                                // console.log("allData" +JSON.stringify(allData));
                                console.log("登录统计 "+allData.length);
                                for(var i = 0; i < allData.length; i++){
                                    console.log("登录统计中 "+i);
                                    setLoginInfo(allData[i]);
                                }
                                // getGameLoginInfoByFork(MAX_GROUP);

                                eventEmitter.emit('getGameLoginInfoByFork', MAX_GROUP);
                            }
                        }
                        /*if(doc.endCode == 200)
                        {
                            if(++allDayIndex >= allDayLen)
                            {
                                console.log("登录采集完成 "+allDayIndex);
                                getGameLoginInfoByFork(MAX_GROUP);
                            }
                        }
                        else
                        {
                            setLoginInfo(doc);
                        }*/
                    });
                    newProcess.send({filterWord:loginLogfilter, type:1});
                })(i, cdate, loginLogfilter)
            }

        }

        /***
         * 3、活跃数据(从头开始跑)
         * @param {num} 一个进程跑收集num组数据
         */
        var getGameLoginInfoByFork = function (num)
        {
            if(gameLogIndexes.length <= 0)
            {
                getAllusersInfo();
                return;
            }
            gameLogIndexes = tools.unique(gameLogIndexes);
            gameLogIndexes.sort();
            // console.log(gameLogIndexes.length + ", gameLogIndexes:"+gameLogIndexes);

            var allDay = [];
            for(var count = 0; count < gameLogIndexes.length; count ++)
            {
                // today = new Date(today.getTime() + 1*24*60*60*1000);
                // console.log(tools.Format(today,'yyyyMMdd'));
                var day = gameLogIndexes[count];
                if(!allDay[count%num])
                {
                    allDay[count%num] = [];
                }
                allDay[count%num].push(day);
            }

            // console.log("allDay:"+allDay);
            var cp = require("child_process");
            var allDayLen = allDay.length;
            var allDayIndex = 0;
            console.log("----init "+allDayIndex+", "+allDayLen);
            var allData = [];
            for(var i = 0; i < allDayLen; i++) {
                var cdate = allDay[i];
                (function (midx, mdate, gameLogfilter) {
                    var newProcess = cp.fork(__dirname + '/loginLogTask.js', [dbUrl, mdate, midx]);
                    newProcess.type = midx;
                    newProcess.on('message', function(doc)
                    {
                        if(doc.data)
                        {

                            // console.log("len "+doc.data.length);
                            allData.push(doc.data);
                        }
                        if(doc.endCode == 200)
                        {

                            setActiveAllTimes(doc.times);
                            console.log("gameLogIndex "+allDayIndex+", "+allDayLen);
                            if(++allDayIndex >= allDayLen)
                            {
                                console.log("活跃统计："+allData.length);
                                for(var i = 0; i < allData.length; i++){
                                    console.log("活跃统计中 "+i);
                                    setActiveInfo(allData[i]);
                                }
                                console.log("活跃采集完成 "+allDayIndex);
                                // getAllusersInfo();
                                eventEmitter.emit('getAllusersInfo');
                            }
                        }
                        /*if(doc.endCode == 200)
                        {
                            if(++allDayIndex >= allDayLen)
                            {
                                console.log("活跃采集完成 "+allDayIndex);
                                getAllusersInfo();
                            }
                        }
                        else
                        {
                            setActiveInfo(doc);
                        }*/
                    });
                    newProcess.send({filterWord:gameLogfilter, type:2});
                })(i, cdate, gameLogfilter)
            }

        }




        //4、通过1和2得到每个用户 每天登录 和 活跃数据
        var getAllusersInfo = function ()
        {

            // console.log("每个用户 每天登录 和 活跃数据 : " + JSON.stringify(allUsers));
            // tools.wLog('allUsers', JSON.stringify(allUsers),'allUsers');
            var info = {};//时间信息
            var keys = Object.keys(allUsers);
            //写入数据库数据
            var init = function (time)
            {
                if(info[time]) return;
                info[time] = {};             //登录日期
                info[time].regCount = 0;	 //注册人数
                info[time].loginCount = 0;   //登录人数
                info[time].activeCount = 0;  //活跃人数
                info[time].vipTableCount = 0;  //房间数量
                // info[time].loginTimes = [];   //登录时间段人数
                // info[time].activeTimes = [];  //活跃时间段人数
            }

            //注册时间、登录时间、活跃时间
            var timeStatistics =  function(rTime, lTime, aTime)
            {
                for(var count = 0; count < lTime.length; count++)
                {

                    var time = lTime[count];	//登录时间
                    if(rTime)
                    {
                        init(rTime);
                        if (!info[rTime][time]) {
                            info[rTime][time] = 0;
                        }
                        info[rTime][time]++;		//注册用户在这一天的登录次数
                        info[rTime].loginCount++; 	//登录人数

                    }
                    init(time);
                    if (!info[time][time]) {
                        info[time][time] = 0;
                    }
                    info[time][time]++;		//注册用户在这一天的登录次数
                    info[time].loginCount++; 	//登录人数
                    var day = 'times_'+time;
                    if(allTimes[day] && allTimes[day].loginTimes)
                    {
                        info[time].loginTimes = allTimes[day].loginTimes;
                        delete allTimes[day].loginTimes;
                    }
                }

                // console.log(rTime + " 活跃len " + aTime.length);
                for(var count = 0; count < aTime.length; count++)
                {

                    var time = aTime[count];
                    var actTime = time + KEY_ACTIVE;	//活跃时间
                    if(rTime)
                    {
                        init(rTime);
                        if (!info[rTime][actTime]) {
                            info[rTime][actTime] = 0;
                        }
                        info[rTime][actTime]++;		//注册用户在这一天的活跃次数
                        info[rTime].activeCount++; 	//活跃人数


                    }
                    init(time);
                    if (!info[time][actTime]) {
                        info[time][actTime] = 0;
                    }
                    info[time][actTime]++;		//注册用户在这一天的活跃次数
                    info[time].activeCount++; 	//活跃人数
                    var day = 'times_'+time;
                    // console.log("day : " + day);
                    if(allTimes[day] && allTimes[day].activeTimes)
                    {
                        info[time].activeTimes = allTimes[day].activeTimes;
                        delete allTimes[day].activeTimes;
                        // console.log('activeTimes: ', time, JSON.stringify(info[time].activeTimes));
                    }

                }
            }


            // console.log("keys.length : " + keys.length);
            for(var count = 0; count < keys.length; count++)
            {
                var uid = keys[count];
                var userInfo = allUsers[uid];
                var rTime = userInfo.registerTime;
                if(rTime)
                {
                    init(rTime);
                    info[rTime].regCount++;		//注册人数
                    timeStatistics(rTime, userInfo.loginTime, userInfo.activeTime);
                }

            }

            //因为增量写注册、登录、活跃总人数，如果基础数据中断，今天也必须写数据！
            init(today);
            // console.log("before----info:"+JSON.stringify(info[today]));
            var todayData = info[today];
            todayData.vipTableTime = vipTableArr;
            todayData.vipTableCount = vipTableCount;
            regTotal += todayData.regCount;
            loginTotal += todayData.loginCount;
            activeTotal += todayData.activeCount;
            vipTableTotal += todayData.vipTableCount;
            // console.log('活跃时间段allTimes: ', JSON.stringify(allTimes));

            // console.log("----info:"+JSON.stringify(info));
            writeAllUsers(info);

        }

        // 5、每天统计写数据库
        function writeAllUsers(info)
        {
            var times = Object.keys(info);
            var i = 0;
            writeLen = times.length;
            function save() {
                if(i >= writeLen) {
                    eventEmitter.emit('setUserStatistics');
                    return;
                }

                var time = times[i];
                var para = {};
                var iTime = Number(time);
                if(iTime == iToday)
                {
                    //更新今天注册活跃登录数据
                    para.$set = info[time];
                }
                else
                {
                    //只更新1-3-7-30天的活跃和登录数据
                    para.$set = {};
                    para.$set[today] = info[time][today]||0;
                    para.$set[today+KEY_ACTIVE] = info[time][today+KEY_ACTIVE]||0;
                    // console.log('1-3-7-30天 para',iTime,JSON.stringify(para));
                }
                var findPara = {};
                findPara[time] = 1;
                // console.log('update时间段',time);
                db.collection(userStatistics).findOne({_id:iTime}, findPara, function (er, r) {
                    db.collection(userStatistics).update({_id:iTime}, para, {upsert:true}, function (er, rtn) {
                        i++;
                        // console.log('para',JSON.stringify(para),i,iTime);
                        save();
                    });
                });
            }
            save();

        }
        // 6、统计注册、登录、活跃总人数
        function setUserStatistics()
        {
            var yesterday = tools.Format(new Date(day - 1*24*60*60*1000), "yyyyMMdd");
            // console.log("yesterday", yesterday, today);
            db.collection('userStatistics').findOne({_id:Number(yesterday)}, {regTotal:1,loginTotal:1,activeTotal:1,vipTableTotal:1},function (er, doc) {

                if (doc&&doc._id) {
                    if(doc.regTotal)
                    {
                        regTotal += doc.regTotal;
                    }
                    if(doc.loginTotal)
                    {
                        loginTotal += doc.loginTotal;
                    }
                    if(doc.activeTotal)
                    {
                        activeTotal += doc.activeTotal;
                    }
                    if(doc.vipTableTotal)
                    {
                        vipTableTotal += doc.vipTableTotal;
                    }
                    // console.log("regTotal", regTotal, loginTotal,activeTotal);
                }
                db.collection('userStatistics').update({_id:iToday},
                    {$set:{regTotal:regTotal, loginTotal:loginTotal, activeTotal:activeTotal, vipTableTotal:vipTableTotal}},
                    function (er, rtn) {
                        // console.info(dbUrl+', 操作结束'+' i = '+i+' len = '+len);
                        closeDb();
                        console.info('time: '+(new Date() - startTime));
                        endF(dbUrl+', writeLen = '+writeLen+", 写入成功: "+today);
                    });
            });
        }


        eventEmitter.on('getLoginInfoByFork', getLoginInfoByFork);
        eventEmitter.on('getGameLoginInfoByFork', getGameLoginInfoByFork);
        eventEmitter.on('getAllusersInfo', getAllusersInfo);
        eventEmitter.on('setUserStatistics', setUserStatistics);
        getRegisterInfo();
    });
}