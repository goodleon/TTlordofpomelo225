module.exports = function(app) {
    var dirs = __dirname.split(require('path').sep)
    return app.get(dirs[dirs.length - 2]);
};