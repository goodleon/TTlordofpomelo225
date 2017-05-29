/**
 * Created by lhq on 2016/9/6 0006.
 */

module.exports = function(dataServer) {
    return {
        getReward:function(req, res) {
            var msg = req.body;
            var actId = msg.actId;
            dataServer.doLog('compensate getReward', msg);
            var actData = dataServer.activityCache[actId];

            if(!actData) {
                res.json({er:dataServer.predefineConfig.erType.erNoAct});
                return;
            }

            if(dataServer.predefineConfig.actType.compensate != actData.actType) {
                res.json({er:dataServer.predefineConfig.erType.erAct});
                return;
            }

            actData = actData.actData;

            var day = new Date();
            day = (day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate());

            if(day < actData.beginDay || day > actData.endDay) {
                res.json({er:dataServer.predefineConfig.erType.erActNotOpen});
                return;
            }

            var rtn = {};

            rtn.er = dataServer.predefineConfig.erType.ok;
            rtn.reward = actData.rewards;
            res.json(rtn);
        }


    }
}