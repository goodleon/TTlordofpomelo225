module.exports = function(app) {
    console.info("++++++++++++++++:RPC dir" + __dirname);
    var dirs = __dirname.split(require('path').sep)
    return app.get(dirs[dirs.length - 2]);
};