module.exports = function(pomelo,app,SessionRoute,DirectRoute) 
{
    var pkplayerData = require ('./pkplayerData');
    app.load (pkplayerData,{});
    app.route('pkplayer',DirectRoute);

    var RoomData = require ('../pkroom/pkroomData');
    app.load (RoomData,{});
    app.route('pkroom',DirectRoute);


    var MatcherData = require ('../matcher/matcherData');
    app.load (MatcherData,{});
    app.route('matcher',DirectRoute);

    var LeaderClass=require ('../leader/ServerClass');
    app.load (LeaderClass,{});

}