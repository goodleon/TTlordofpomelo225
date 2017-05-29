/**
 * Created by lhq on 2016/8/19 0019.
 */

module.exports = function(dataServer) {

    return {
        doTurntable:function(req, res) {
            var msg = req.body;
            var actId = msg.actId;
            var freeTimes = msg.freeTimes;
            var payTimes = msg.payTimes;
            dataServer.doLog('turntable', msg);
            var actData = dataServer.activityCache[actId];

            if(!actData) {
                res.json({er:dataServer.predefineConfig.erType.erNoAct});
                return;
            }

            if(dataServer.predefineConfig.actType.turntable != actData.actType) {
                res.json({er:dataServer.predefineConfig.erType.erAct});
                return;
            }

            actData = actData.actData;

            var day = new Date();
            var wday = day.getDay();
            var hm = day.getHours() * 100 + day.getMinutes();
            day = (day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate());

            if(day < actData.beginDay || day > actData.endDay) {
                res.json({er:dataServer.predefineConfig.erType.erActNotOpen});
                return;
            }

            if(hm < actData.startTime || hm > actData.endTime) {
                res.json({er:dataServer.predefineConfig.erType.erActNotOpen});
                return;
            }

            var i, weekOpen = false;

            if(actData.weekDay) {
                for(i = 0; i < actData.weekDay.length; i++) {
                    if(actData.weekDay[i] == wday) {
                        weekOpen = true;
                        break;
                    }
                }

                if(!weekOpen) {
                    res.json({er:dataServer.predefineConfig.erType.erActNotOpen});
                    return;
                }
            }

            var payCost = 0;

            if(actData.timesFree <= freeTimes) {
                if(actData.timesPay <= payTimes) {
                    res.json({er:dataServer.predefineConfig.erType.erTimesLimit});
                    return;
                }

                if(payTimes >= actData.payCost.length) {
                    payCost = actData.payCost[actData.payCost.length - 1];
                } else {
                    payCost = actData.payCost[payTimes];
                }
            }

            var randWeight = Math.floor(Math.random() * actData.totalWeight);
            var reward, index;

            for(i = 0; i < actData.rewards.length; i++) {
                if(randWeight < actData.rewards[i][2]) {
                    reward = actData.rewards[i];
                    index = i;
                    break;
                }
            }

            var rtn = {};

            if(reward) {
                rtn.er = dataServer.predefineConfig.erType.ok;
                rtn.reward = reward;
                rtn.index = index;
                rtn.payCost = payCost;
            } else {
                rtn.er = dataServer.predefineConfig.erType.ok;
                rtn.payCost = payCost;
            }

            res.json(rtn);
        }
    }
}