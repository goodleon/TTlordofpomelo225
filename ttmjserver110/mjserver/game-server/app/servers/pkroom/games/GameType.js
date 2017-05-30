module.exports = function(app, server, gameid) {
    function Player(info) { this.base(info); }

    function Table(groupid, tableid) { this.base(groupid, tableid) }

    function TableGroup(groupid) { this.base(groupid) }

    function TableManager(game, rcfg) { this.base(game, rcfg) }

    function Game() { this.base() }


    function ReloadCode() {
        delete require.cache[require.resolve('./RoomServerBase')];
        delete require.cache[require.resolve('./' + gameid + "/GameCode")];
        require('./RoomServerBase')(app, server, gameid, Player, Table, TableGroup, TableManager, Game);
        require('./' + gameid + "/GameCode")(app, server, gameid, Player, Table, TableGroup, TableManager, Game);

    };
    ReloadCode();

    var game = new Game();
    game.ReloadCode = ReloadCode;

    return game;
}