/**
 * Created by HJF on 2016/11/21 0021.
 * 导入数据库
 * @param {string} dbUrl: 地址
 * @param {string} newDbName: 新数据库名
 * @param {string} importPath: 文件夹名
 * @param {string} dir: 文件路径
 */
module.exports = function(dbUrl, newDbName, importPath, dir, endF, errF) {

    var fs = require('fs');
    var cp = require('child_process');
    handleImportDb(dbUrl, newDbName, importPath, dir);
    /**
     * handleImportDb 导入数据库
     * @param {string} url: 地址
     * @param {string} dbName: 新数据库名
     * @param {string} pathName: 文件夹
     */
    function handleImportDb(url, dbName, pathName, dir) {
        //mongorestore -h 127.0.0.1 -d test ynmj
        var cmd = "cd " + dir + "&&mongorestore -h " + url + " -d " + dbName + " " + pathName;
        // console.log("2cmd:"+cmd);
        cp.exec(cmd, function(error, stdout, stderr) {
            if (error) {
                !errF || errF(error);
            } else {
                !endF || endF("" + cmd);
            }
        });
    }

};