/**
 * Created by lhq on 2016/8/24 0024.
 */

module.exports = function(dataServer) {
    return {
        update:function(req, res) {
            var actId = req.body.actId;
            var type = req.body.type;
            dataServer.doLog('update', req.body);

            if(type == 1 || type == 2) {//add / update
                dataServer.loadActData(actId);
            } else {//delete
                delete dataServer.activityCache[actId];

                dataServer.doLog('update', Object.keys(dataServer.activityCache).length);
            }
            res.json(0);
        }
    }
}