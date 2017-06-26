module.exports = function(app, opts) { return new ComponentData(app, opts); };

function ComponentData(app, opts) {
    var segs = __dirname.split(require('path').sep);
    //segs=,Users,goodleon,Documents,workspace_pomelo,TTlordofpomelo225,ttmjserver110,mjserver,game-server,app,servers,pkroom
    //sType=pkroom
    var sType = segs[segs.length - 1]; //获得服务器类型
    app.set(sType, this, true);
    this.app = app;
    this.ReloadCode();
}
ComponentData.prototype.ReloadCode = function() {
    console.error('reload ' + this.name + ' @' + this.app.serverId);
    delete require.cache[require.resolve('./pkroomCode.js')];
    require('./pkroomCode.js').call(this, this.app, this, ComponentData);
}
ComponentData.prototype.afterStart = function(cb) {
    console.error(this.name + ' afterStart ' + this.app.getServerId());

    process.nextTick(cb);
}