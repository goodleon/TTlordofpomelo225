module.exports = function(pomelo, app, SessionRoute, DirectRoute) {
    var gameLog = [];

    function GLog(log) {
        //return;
        app.FileWork(gameLog, __dirname + "/log.txt", log);
    }

    var ComponentData = require('./pkconData');
    app.load(ComponentData, {});
    var LoginData = require('../login/LoginData');
    app.load(LoginData, {});
    //app.route('login',SessionRoute( 'login' ) );

    var PKPlayer = require('../pkplayer/pkplayerData');
    app.load(PKPlayer, {});

    app.route('pkplayer', SessionRoute('pkplayer'));
    app.route('pkroom', SessionRoute('pkroom'));


    var loginServers = app.GetCfgServers('login');

    app.route('login', function(para, msg, app, cb) {
        //forwardMessage para is session
        if (msg.args[0].route == "login.handler.reqGuestID") {
            cb(null, loginServers[0].id);
            //GLog(["reqGuestID",loginServers[0].id,msg]);
        } else if (para) {
            cb(null, para);
            //GLog(["para",para,msg]);
        } else if (msg.method == "verifyPlayer" && loginServers.length > 1) {
            var rtn = null;
            if (msg.args[0].unionid) {
                var hash = app.stringHash(msg.args[0].unionid);
                rtn = loginServers[1 + hash % (loginServers.length - 1)].id;
            } else rtn = loginServers[1 + Math.floor((loginServers.length - 1) * Math.random())].id;
            cb(null, rtn);
            //GLog(["verifyPlayer",rtn,msg]);
        } else {
            cb(null, loginServers[0].id);
            //GLog(["masterLogin",loginServers[0].id,msg]);
        }

    });


    app.set('connectorConfig', {
        connector: pomelo.connectors.hybridconnector,
        heartbeat: 3,
        useDict: true,
        useProtobuf: true
    });


    function logoutCB() {};
    app.logout = function(session, isActive, next) {
        //console.error( (isActive?'active':'passive')+ ' logout '+session.uid+' @ '+app.serverId);
        if (session.uid != null &&
            session.get("pkplayer")) {
            app.rpc.pkplayer.Rpc.doLogout(session,
                session.uid,
                session.id,
                session.frontendId,
                session.settings,
                isActive,
                next ? next : logoutCB);
        }
    }

    //passive logout by close tcp
    app.event.on('close_session', function(session) { app.logout(session, false); });

    app.event.on(
        'remove_servers',
        function(svrs) {
            for (var i = 0; i < svrs.length; i++) {
                var svr = app.getServerFromConfig(svrs[i]);
                if (!svr) {

                } else if (svr.serverType == 'master') {

                } else if (svr.serverType == 'pkcon') {

                } else if (svr.serverType == 'pkplayer') {

                } else if (svr.serverType == 'pkroom') {

                }
                //console.error(app.serverId,'remove_server',JSON.stringify(svr));
            }

        }
    );


}