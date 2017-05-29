/**
 * Created by lhq on 2016/8/26 0026.
 */

module.exports = function(dataServer) {
    return {
        getReward:function(req, res) {
            var msg = req.body;
            var actId = msg.actId;
            var createTime = msg.createTime;
            dataServer.doLog('newbie getReward', msg);
            var actData = dataServer.activityCache[actId];

            if(!actData) {
                res.json({er:dataServer.predefineConfig.erType.erNoAct});
                return;
            }

            if(dataServer.predefineConfig.actType.newbie != actData.actType) {
                res.json({er:dataServer.predefineConfig.erType.erAct});
                return;
            }

            actData = actData.actData;

            var validTime = actData.validTime * 60 * 60 * 1000;
            var cTime = (new Date(createTime)).getTime();
            dataServer.doLog('newbie', [validTime, cTime, validTime + cTime, Date.now()]);
            if(validTime + cTime < Date.now()) {
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