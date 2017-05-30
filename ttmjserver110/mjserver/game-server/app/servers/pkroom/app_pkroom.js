module.exports = function(pomelo, app, SessionRoute, DirectRoute) {
    var ComponentData = require('./pkroomData');
    app.load(ComponentData, {});

    var pkplayerData = require('../pkplayer/pkplayerData');
    app.load(pkplayerData, {});
    app.route('pkplayer', DirectRoute);

    var LeaderClass = require('../leader/ServerClass');
    app.load(LeaderClass, {});

    if (app.isFrontend()) {
        app.set('connectorConfig', {
            connector: pomelo.connectors.hybridconnector,
            heartbeat: 3,
            useDict: true,
            useProtobuf: true
        });


        function logoutCB() {};
        app.logout = function(session, isActive, next) {
            //console.error( (isActive?'active':'passive')+ ' logout '+session.uid+' @ '+app.serverId);

        }

        //passive logout by close tcp
        app.event.on('close_session', function(session) { app.logout(session, false); });
    }



}