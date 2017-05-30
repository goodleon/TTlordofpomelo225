module.exports = function(app, opts) { return new LoginData(app, opts); };

function LoginData(app, opts) {
    app.set("login", this, true);
    this.app = app;
    this.ReloadCode();
    var login = this;
    if (this.app.serverType == 'login') {
        app.mongodbReady = function() {
            login.mongodbReady();
        }
    }
}
LoginData.prototype.ReloadCode = function() {
    console.error('reload login @' + this.app.serverId);
    delete require.cache[require.resolve('./LoginCode.js')];
    require('./LoginCode.js').call(this, this.app, this, LoginData);
};
LoginData.prototype.afterStart = function(cb) {
    console.error('LoginData afterStart ' + this.app.getServerId());
    process.nextTick(cb);
};