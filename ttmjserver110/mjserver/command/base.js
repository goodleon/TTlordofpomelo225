var spawn = require('child_process').spawn;
var command = spawn('git', ['branch', '-a']);


command.stdout.on('data', function (data) {
	console.log('standard output:\n' + data);
});


command.stderr.on('data', function (data) {
	console.log('standard error output:\n' + data);
});


command.on('exit', function (code, signal) {
	console.log('child process eixt ,exit:' + code);
});