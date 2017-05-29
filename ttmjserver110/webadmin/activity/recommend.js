/**
 * Created by lhq on 2016/8/26 0026.
 */

module.exports = function(dataServer) {
    return {
        getReward:function(req, res) {
            var msg = req.body;
            var actId = msg.actId;
            var count = msg.count;
            var index = msg.index;
            dataServer.doLog('newbie getReward', msg);
            var actData = dataServer.activityCache[actId];

            if(!actData) {
                res.json({er:dataServer.predefineConfig.erType.erNoAct});
                return;
            }

            if(dataServer.predefineConfig.actType.recommend != actData.actType) {
                res.json({er:dataServer.predefineConfig.erType.erAct});
                return;
            }

            actData = actData.actData;

            if(index >= actData.rewards.length) {
                res.json({er:dataServer.predefineConfig.erType.erRewardIndex});
                return;
            }

            if(count < actData.rewards[index][2]) {
                res.json({er:dataServer.predefineConfig.erType.erRecommendCount});
                return;
            }

            var rtn = {};

            rtn.er = dataServer.predefineConfig.erType.ok;
            rtn.reward = actData.rewards[index];
            res.json(rtn);
        },

        addRecommend:function(req, res) {//是否能够添加的判断
            dataServer.doLog('addRecommend', req.body);
            var msg = req.body;
            var count = msg.count;
            var playNum = msg.playNum;
            var keys = Object.keys(dataServer.activityCache);
            var actData, actId;

            for(var i = 0, len = keys.length; i < len; i++) {
                actId = keys[i];
                actData = dataServer.activityCache[actId];

                if(actData.actType == dataServer.predefineConfig.actType.recommend) {
                    actData = actData.actData;
                    if(count >= actData.maxNum) {
                        res.json({er:dataServer.predefineConfig.erType.erRecommendCount});
                        return;
                    }

                    if(playNum < actData.playNum) {
                        res.json({er:dataServer.predefineConfig.erType.erPlayNum});
                        return;
                    }

                    res.json({er:dataServer.predefineConfig.erType.ok, maxNum:actData.maxNum});
                    return;
                }
            }

            res.json({er:dataServer.predefineConfig.erType.erNoAct});
        }


    }
}