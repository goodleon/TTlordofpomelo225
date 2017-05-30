module.exports = function(app, opts) { return new ServerClass(app, opts); };

function ServerClass(app, opts) {
    var dirs = __dirname.split(require('path').sep)
    console.info("###### " + dirs[dirs.length - 1]);
    app.set(dirs[dirs.length - 1], this, true);
    this.app = app;
    this.ReloadCode();
}
ServerClass.prototype.ReloadCode = function() {
    console.error('reload login @' + this.app.serverId);
    delete require.cache[require.resolve('./ServerCode.js')];
    require('./ServerCode.js').call(this, this.app, this, ServerClass);
}
ServerClass.prototype.afterStart = function(cb) {
    console.error('ServerClass afterStart ' + this.app.getServerId());
    process.nextTick(cb);
}