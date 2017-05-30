/**
 * Created by Fanjiahe on 2016/11/15 0015.
 */


var tools = require('./tools')();
var type = process.argv[2];
var ip = process.argv[3];
var port = process.argv[4];

//用户存留
/*var userStatisticsTask = require('./dayTask/userStatisticsTask.js');
userStatisticsTask(type, false);*/

// var downloadUrl = process.argv[5];
// var tarPath = process.argv[6];
// var unTargzPath = process.argv[7];
// var date =  process.argv[8];
// console.log("----- argv : " + JSON.stringify(process.argv));
// console.log("type : " + type);
// console.log("ip : " + ip);
// console.log("port : " + port);
// console.log("path : " + path);
// console.log("pathBackup : " + pathBackup);

// process.on('message', function(m) {
// 	console.log('CHILD got message:', m);
// });
//
// process.send({ pid: process.pid});
//
// tools.runCmd('echo', ['helloWorld'], {}, function (str)
// {
// 	console.log('111111111: ' + str);
// }, function (error)
// {
// 	console.log('222222222: ' + error);
// });
//
// tools.exec('echo HelloWorld', function (str)
// {
// 		console.log('111111111: ' + str);
//
// }, function (error)
// {
// 		console.log('222222222: ' + error);
// });
//
// tools.downloadFile(type + '.tar.gz', ip, function (str)
// {
// 	console.log('111111111: ' + str);
//
// }, function (error)
// {
// 	console.log('222222222: ' + error);
// });
//

// tools.targzFile(type + '.tar.gz', type, function (str)
// {
// 	console.log('targzFile success: ' + str);
//
// }, function (error)
// {
// 	console.log('targzFile error: ' + error);
// });
//
//
// tools.unTargzFile(type, "newDirDdz", "", function (str)
// {
// 	console.log('unTargzFile success: ' + str);
//
// }, function (error)
// {
// 	console.log('unTargzFile error: ' + error);
// });
//  tools.compressedFile(type + '.tar.gz', type, function (str)
//  {
//  	console.log('compressedFile success: ' + str);
//
//  }, function (error)
//  {
//  	console.log('compressedFile error: ' + error);
//  });


//tools.extractFile(type, "newDirDdz", "", function (str)
//{
//	console.log('extractFile success: ' + str);
//
//}, function (error)
//{
//	console.log('extractFile error: ' + error);
//});