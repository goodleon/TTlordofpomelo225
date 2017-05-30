module.exports = function(app, opts) { return new ComponentData(app, opts); };

function ComponentData(app, opts) {
    var segs = __dirname.split(require('path').sep);
    var sType = segs[segs.length - 1];
    app.set(sType, this, true);
    this.app = app;
    this.ReloadCode();
}
ComponentData.prototype.ReloadCode = function() {
    console.error('reload ' + this.name + ' @' + this.app.serverId);
    delete require.cache[require.resolve('./pkplayerCode.js')];
    require('./pkplayerCode.js').call(this, this.app, this, ComponentData);
}
ComponentData.prototype.afterStart = function(cb) {
    console.error(this.name + ' afterStart ' + this.app.getServerId());
    process.nextTick(cb);
    this.afterStartServer();
}