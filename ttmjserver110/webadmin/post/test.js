module.exports=function(admin)
{
	var fs=require('fs');
	var os=require('os');
	var cp =require('child_process');
	require('./linq/linq.min');
	var PAM = new require('./PAM');
	var pam = new PAM();

	var ip;

	var exec=cp.exec;
	var fileList = [];
	//pam.KillNodeWithoutSelf();
	function walk(path){
		  var dirList = fs.readdirSync(path);
		 
		  dirList.forEach(function(item){
			if(fs.statSync(path + '/' + item).isFile()){
			  fileList.push(path + '/' + item);
			}
		  });
		 
		  dirList.forEach(function(item){
			if(fs.statSync(path + '/' + item).isDirectory()){
			  walk(path + '/' + item);
			}
		  });
	}
	function runCmd(cmd,para,opt,endf,errf)
	{
		admin.opLog(0, ip, 'runCmd', {cmd:cmd, para:para, opt:opt});
		    var tagbuf=new Buffer(0);
			var tagproc=cp.spawn(cmd,para,opt);
			tagproc.stdout.on('data',function(data){tagbuf = Buffer.concat([tagbuf,data]);});
            tagproc.stdout.on('end',function(){
				endf(tagbuf.toString());
			});
			tagproc.stdout.on('error',function(){
				errf("error");
			});
	}

	var rtn= {
		contentNum:function (req, res)
		{
			admin.opLog(0, admin.getClientIp(req), 'contentNum', {});
			pam.sendCommand(null, "echo aaaaaaaaaa", '/root/mjserver/command' ,function (resObj, serverOkNum, ips )
			{
				res.json(JSON.stringify(serverOkNum));
			}, function (currentIP, serverErrorNum, ips)
			{
				res.json(JSON.stringify(serverErrorNum));
			});
		},
		autoRestart: function (req, res)
		{
			admin.opLog(0, admin.getClientIp(req), 'autoRestart', {});
			pam.sendCommand(null, "bash autoRestart", '/root/mjserver/command' ,function (resObj, serverOkNum, ips )
			{
				console.log("resObj: " + JSON.stringify(resObj));
				console.log("serverOkNum: " + serverOkNum);
				res.json(JSON.stringify(resObj));
			}, function (currentIP, serverErrorNum, ips)
			{
				console.log("currentIP: " + currentIP);
				console.log("serverErrorNum: " + serverErrorNum);
				res.json(JSON.stringify(currentIP));
			});
		},
	    DoPull:function(req, res)
		{
			//if(["git.hapyyplaygame.net","git.game-yes.com"].indexOf(req.host)<0){
			//	res.end();
			//	return;
			//}

			if(!admin.openTest){
				res.end();
				return;
			}

			ip = admin.getClientIp(req);

			runCmd( 'git',['pull'],{cwd:__dirname+"/../../"+req.body.proj},
			function(str){res.json(str);},
			function(str){res.json(str);}  );
		},
		DoPush:function (req, res) {
			//if(["git.hapyyplaygame.net","git.game-yes.com"].indexOf(req.host)<0){
			//	res.end();
			//	return;
			//}

			if(!admin.openTest){
				res.end();
				return;
			}

			var desc = req.body.file;
			var msg="";
			for(var i = 0; i < desc.length; i++){
				msg += desc[i] + " ";
			}

			ip = admin.getClientIp(req);

			runCmd( 'bash',['pushConfig', req.body.proj, msg],{cwd:"/root/mjserver/command/"},
				function(str){res.json(str);},
				function(str){res.json(str);}  );
		},
	    DoCheckout:function(req, res)
		{
			//if(["git.hapyyplaygame.net","git.game-yes.com"].indexOf(req.host)<0){
			//	res.end();
			//	return;
			//}

			if(!admin.openTest){
				res.end();
				return;
			}

			ip = admin.getClientIp(req);

			runCmd( 'git',['checkout', '.'],{cwd:__dirname+"/../../"+req.body.proj},
			function(str){res.json(str);},
			function(str){res.json(str);}  );
		},
		getAllValueName:function(req, res){
			//if(["git.hapyyplaygame.net","git.game-yes.com"].indexOf(req.host)<0){
			//	res.end();
			//	return;
			//}

			if(!admin.openTest){
				res.end();
				return;
			}

			ip = admin.getClientIp(req);

			runCmd( 'bash',['getAllValueName'],{cwd:"/root/mjserver/command/"},
				function(str){res.json(str);},
				function(str){res.json(str);}  );
		},
		getAlluncaught:function(req, res){
			//if(["git.hapyyplaygame.net","git.game-yes.com"].indexOf(req.host)<0){
			//	res.end();
			//	return;
			//}
			
			if(!admin.openTest){
				res.end();
				return;
			}

			fileList = [];
			walk('/root/webadmin/public/uncaught');
			res.json(fileList);
			
		},
		getAlllogs:function(req, res){
			//if(["git.hapyyplaygame.net","git.game-yes.com"].indexOf(req.host)<0){
			//	res.end();
			//	return;
			//}

			if(!admin.openTest){
				res.end();
				return;
			}
			fileList = [];
			walk('/root/webadmin/public/logs');
			res.json(fileList);
		},
		getFoldersList:function(req, res)
		{
			//if(["git.hapyyplaygame.net","git.game-yes.com"].indexOf(req.host)<0){
			//	res.end();
			//	return;
			//}

			if(!admin.openTest){
				res.end();
				return;
			}

			ip = admin.getClientIp(req);

			runCmd( 'bash',['getCatalog', req.body.proj],{cwd:"/root/mjserver/command/"},
				function(str){res.json(str);},
				function(str){res.json(str);}  );
		},
		switchBranches: function (req, res)
		{
			//if(["git.hapyyplaygame.net","git.game-yes.com"].indexOf(req.host)<0){
			//	res.end();
			//	return;
			//}

			if(!admin.openTest){
				res.end();
				return;
			}

			var msg = req.body.msg;
			ip = admin.getClientIp(req);

			runCmd( 'git',['checkout', msg["branch"]],{cwd:__dirname+"/../../"+msg["proj"]},
				function(str){res.json(str);},
				function(str){res.json(str);}  );
		},
		getBranches: function (req, res)
		{
			//if(["git.hapyyplaygame.net","git.game-yes.com"].indexOf(req.host)<0){
			//	res.end();
			//	return;
			//}

			if(!admin.openTest){
				res.end();
				return;
			}

			ip = admin.getClientIp(req);

			runCmd( 'git',['branch', '-a'],{cwd:__dirname+"/../../"+req.body.proj},
				function(str){res.json(str);},
				function(str){res.json(str);}  );
		},
		ReloadServerSelf:function(req, res){
			if(!admin.openTest){
				return;
			}
			admin.opLog(0, admin.getClientIp(req), 'ReloadServerSelf', req.body);
			return;

			if(req.body.onlyCode==0)
			{
				admin.request("reloadAll",{},function(er,rtn){	});
				res.json("reload room");
			}
			else if(req.body.onlyCode==1)
			{
				exec("/root/mjserver/stop.sh",function(error, stdout, stderr){
					res.json(error+" "+stdout+" "+stderr);
				});
			}
			else if(req.body.onlyCode==2)
			{
				exec("/root/mjserver/apple.sh",{cwd:"/root/mjserver/"},function(error, stdout, stderr){
					res.json(error+" "+stdout+" "+stderr);
				});
			}
		},
		ReloadServer:function(req, res)
		{
			//if(["git.hapyyplaygame.net","git.game-yes.com"].indexOf(req.host)<0){
			//	res.end();
			//	return;
			//}

			if(!admin.openTest){
				res.end();
				return;
			}
			admin.opLog(0, admin.getClientIp(req), 'ReloadServer', req.body);
			if(req.body.onlyCode==0)
			{
				admin.request("reloadAll",{},function(er,rtn){	});
				res.json("reload room");
			}
			else if(req.body.onlyCode==1)
			{
				exec("bash /root/mjserver/stop.sh",function(error, stdout, stderr){
					res.json(error+" "+stdout+" "+stderr);		
				});
			}
			else if(req.body.onlyCode==2)
			{
				exec("bash /root/mjserver/apple.sh",{cwd:"/root/mjserver/"},function(error, stdout, stderr){
					res.json(error+" "+stdout+" "+stderr);		
				});
			}
		},
        testCards:function(req, res)
	    {
			//if(["git.hapyyplaygame.net","git.game-yes.com"].indexOf(req.host)<0){
			//	res.end();
			//	return;
			//}

			if(!admin.openTest){
				res.end();
				return;
			}
			admin.opLog(0, admin.getClientIp(req), 'testCards', req.body);

			res.end();
			admin.request("testCards",{uid:req.body.uid,cards:req.body.cards},function(er,rtn){res.json(er+" "+rtn);	});
		},
        killSelf:function(req, res)
		{
			//if(["git.hapyyplaygame.net","git.game-yes.com"].indexOf(req.host)<0){
			//	res.end();
			//	return;
			//}

			if(!admin.openTest){
				res.end();
				return;
			}

			admin.opLog(0, admin.getClientIp(req), 'killSelf', req.body);

			res.json(process.pid);
			setTimeout(function(){process.kill(process.pid);},1000);
		}
	}	
	return rtn;

}

// function getIPAdress(){
// 	console.info("ip ---------------");
// 	var interfaces = require('os').networkInterfaces();
// 	for(var devName in interfaces){
// 		var iface = interfaces[devName];
// 		for(var i=0;i<iface.length;i++){
// 			var alias = iface[i];
// 			if(alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal){
// 				console.info(alias.address);
// 				return alias.address;
// 			}
// 		}
// 	}
// }
//
// getIPAdress();

//node.js os模块 获取系统信息的模块 包括操作系统和硬件信息

// var os = require('os');
//
// function getLocalIP() {
// 	var ifaces = os.networkInterfaces();
// 	console.info(ifaces);
// 	for(var iname in ifaces)
// 	{
// 		var net=ifaces[iname];
// 		for(var i=0;i<net.length;i++)
// 		{
// 			var ni=net[i];
// 			if(net[i].family=="IPv4")
// 			{
// 				var ip=net[i].address;
// 				if (ip.indexOf('10.') == 0 || ip.indexOf('172.') == 0 || ip.indexOf('192.') == 0 ||
// 					ip.indexOf('127.') == 0)
// 				{
//
// 				}
// 				else {
// 					console.info("out net ip -- " + ip);
// 					return ip;
// 				}
// 			}
// 			console.log(net[i].family +" "+ net[i].address);
// 		}
// 	}
// }
// getLocalIP();

// function testBase64() {
// 	var b = new Buffer("JavaScript");
// 	var s = b.toString('base64');
// 	console.info("test base64 --- s " + s);
//
// 	//SmF2YVNjcmlwdA==
//
// 	var c = new Buffer("SmF2YVNjcmlwdA==", "base64");
// 	var d = c.toString();
// 	console.info("test end - " + d);
// }
// testBase64();