/**
 * Created by Fanjiahe on 2016/8/29.
 */
module.exports = function ()
{
	var fs = require('fs');
	var os = require('os');
	var cp = require('child_process');
	require('./linq/linq.min');

	var paFile = '../../aaa.json';
	var pa = null;
	fs.exists(paFile, function(exists) {
		if (exists) {
			require(paFile);
			// serve file
		} else {
			// mongodb
		}
	});

	if(!pa)
	{
		return;
	}

	var allIps = {};
	var ipArray = [];
	var exec = cp.exec;
	var currentPid = process.pid;
	var password = pa.p;
	var retryCountMAX = 10;
	var serverOkIP = [];
	var serverErrorIp = [];
	//var allIps = [];

	var rtn = {
		getContentNum:function (req, res)
		{
			var rtn = {serverOk:serverOkIP, serverError:serverErrorIp};
			res.json(JSON.stringify(rtn));
		},
		contentNum:function (req, res)
		{
			serverOkIP = [];
			serverErrorIp = [];
			//allIps = [];

			sendCommand(null, "echo aaaaaaaaaa", '/root/mjserver/command' ,function (resObj, serverOkNum, ips )
			{
				//allIps = ips;
				serverOkIP.push(resObj);
				console.log("serverOkNum: " + serverOkNum);
				//res.json(JSON.stringify(serverOkNum));
			}, function (currentIP, serverErrorNum, ips)
			{
				serverErrorIp.push(currentIP);
				//serverErrorNumA = serverErrorNum;
				console.log("serverErrorNum: " + serverErrorNum + "   " + currentIP);
				//res.json(JSON.stringify(serverErrorNum));
			});
		},
		autoRestart: function (req, res)
		{
			serverOkIP = [];
			serverErrorIp = [];
			//allIps = [];
			sendCommand(null, "bash autoRestart", '/root/mjserver/command' ,function (resObj, serverOkNum, ips )
			{
				//allIps = ips;
				serverOkIP.push(resObj);
				console.log("serverOkNum: " + serverOkNum);
				//console.log("resObj: " + JSON.stringify(resObj));
				//res.json(JSON.stringify(resObj));
			}, function (currentIP, serverErrorNum, ips)
			{
				serverErrorIp.push(currentIP);
				//console.log("currentIP: " + currentIP);
				console.log("serverErrorNum: " + serverErrorNum);
				//res.json(JSON.stringify(currentIP));
			});
		},
		runCommand: function (req, res)
		{
			serverOkIP = [];
			serverErrorIp = [];
			//allIps = [];

			var index = req.body.id;
			var commandIndex = req.body.command;
			var command = toCommand(commandIndex);

			if(index < 0 || ipArray.length < index)
			{
				res.end(0);
				return;
			}

			//127.0.0.1  ipArray[index]
			sendCommand(["127.0.0.1"], command, '/root/mjserver/command' ,function (resObj, serverOkNum, ips )
			{
				//allIps = ips;
				serverOkIP.push(resObj);
				console.log("resObj: " + JSON.stringify(resObj));
				console.log("serverOkNum: " + serverOkNum);
				res.json((resObj));
			}, function (currentIP, serverErrorNum, ips)
			{
				serverErrorIp.push(currentIP);
				//serverErrorNumA = serverErrorNum;
				console.log("serverErrorNum: " + serverErrorNum + "   " + currentIP);
				res.json(JSON.stringify(serverErrorNum));
			});
		},
		getServerInfo:function (req, res)
		{
			getAllIP(function (data)
			{
				var newData = {};
				newData.rows=[];
				if(data)
				{
					var ips = objCopy(allIps);
					for(var key in ips)
					{
						var tempData = ips[key];
						tempData["IP"] = key;
						newData.rows.push(tempData);
					}
					res.json(JSON.stringify(newData));
				}else
				{
					res.json(JSON.stringify(newData));
				}
			});
		}
	};

	// index to command
	var toCommand = function (index)
	{
		var command = '';
		switch (index)
		{
			case 1:
				command = 'df -h';
				break;
			case 2:
				command = 'ps ax | grep 150 | wc -l';
				break;
			case 3:
				command = 'bash status';
				break;
			case 4:
				command = 'free -h';
				break;
			default:
				break;
		}
		return command;
	};


	// 命令发送
	var sendCommand = function (ip, command, pwd, successFunc, errorFunc)
	{
		if (ip)
		{
			connectAnyServer(ip ,command, pwd, successFunc, errorFunc);
		}else
		{
			connectAllServer(command, pwd, successFunc, errorFunc);
		}
	};

	var getCurrentServer = function (func)
	{
		func(os.hostname());
	};

	function objCopy(obj)
	{
		return JSON.parse(JSON.stringify(obj));
	}
	
	function otoa(obj)
	{
		if (!obj)
		{
			return [];
		}

		var newA = [];
		for (var key in obj)
		{
			newA.push(key);
		}

		return newA;
	}

	function getAllIP(func)
	{
		getCurrentServer(function (serverInfo)
		{
			serverInfo = serverInfo.split("-");
			func(readConfig(serverInfo[0]));
		});
	}

	// 获取配置所有ip
	function getConfigAllIp(data)
	{
		var ips = {};
		for (var key in data)
		{
			if (!data.hasOwnProperty(key))
			{
				continue;
			}
			var typeData = data[key];

			for (var i = 0; i < typeData.length; i++)
			{
				var ip = typeData[i].host;
				var id = typeData[i].id.replace(/[^0-9]/ig,"");    // index
				id=parseInt(id.substr(0,2));
				ips[ip] = {type:key, index: id};
			}
		}

		delete ips["127.0.0.1"];
		allIps = ips;
		//console.log("ips is:" + JSON.stringify(ips));
		ips = otoa(ips);
		ipArray = ips;
		return ips;
	}


	// 通过name获取pid
	function getPidsWithName(name, endFunc, errFunc)
	{
		exec("ps ax | grep " + name + " | awk '{print $1}'", function (err, output)
		{
			if (err)
			{
				!errFunc || errFunc(err);
			}
			if (output.length > 0)
			{
				endFunc(output);
			}
			else
			{
				!errFunc || errFunc(err);
			}
		});
	}

	// 干掉除自己之外所有的pid
	function KillNodeWithoutSelf(pids)
	{
		if(!pids)
		{
			getPidsWithName("node", function (output)
			{
				var pidArray  = output.split("\n");
				pidArray.pop();
				var pidArray2 = "";
				getPidsWithName("admin", function (output)
				{
					pidArray2 = output.split("\n");
					pidArray2.pop();

					var pids = Enumerable.From(pidArray).Except(pidArray2).ToArray();
					KillNodeWithoutSelf(pids);
				});
			});
		}else
		{
			console.log("inter is:" + JSON.stringify(pids));
			var killPids = "kill " + pids.join(" ");
			console.log("+++++" + killPids);
			exec(killPids, function (err, output)
			{
				if (err)
				{
					console.log("error kill");
				}
				else
				{
					console.log("kill ");
				}
			});
		}
	}


	// 批量链接服务器
	function connectAnyServer(ips, command, pwd, sucessFunc, errorFunc)
	{
		console.log("start connectAnyServer ");

		var serverErrNum = 0;
		var serverOkNum = 0;
		var retryCount = 0;

		if(!ips || !ips.length)
		{
			console.log("没有别的ip");
			!errorFunc || errorFunc(null, serverErrNum, ips);
			return;
		}

		if(pwd)
		{
			command = 'cd ' + pwd + '&&' + command;
		}

		var timeout = 100;
		if(ips.length > 10)
		{
			timeout = 10000;
		}

		function tel(ips, i, command)
		{
			if(i >= ips.length)
			{
				return;
			}
			console.log("start telnetServers " + ips[i]);

			if(String(ips[i]) == "127.0.0.1" && (command.indexOf("autoRestart") >= 0))
			{
				KillNodeWithoutSelf();
				command=command.replace("autoRestart","start");
				console.log("teshu command is: " + command);
			}

			telnetServers(String(ips[i]), password , command || "", function (str)
			{
				var newObj = {};
				var newStr = str.split('HelloWorld');
				newStr = newStr[newStr.length-1].split('====:');

				newObj.rtn = newStr[2].split('\r')[0];    // 截取返回值, 判断程序运行最终结果是否正确
				newStr = newStr[0].split('\n');

				newObj.command = newStr[1].split('#')[1];
				newObj.command = newObj.command.trim();
				newObj.command.length = newObj.command.length - 2;

				newStr.splice(0,2);
				newStr.pop();

				newObj.res = newStr.join('\n');
				newObj.ip = ips[i];
				console.log('ok Server: ' + ++serverOkNum);
				!sucessFunc || sucessFunc(newObj, serverOkNum, ips);
				retryCount = 0;
				setTimeout((function (i)
				{
					tel(ips, i+1, command);
				})(i), timeout);

			}, function ()
			{
				console.log("error Server: " + serverErrNum);
				retryCount || ++serverErrNum;
				if(retryCount++ >= retryCountMAX)
				{
					!errorFunc || errorFunc(ips[i], serverErrNum, ips);
					tel(ips, i + 1, command);
					retryCount = 0;
				}else
				{
					tel(ips, i, command);
				}

			});
		}

		tel(ips, 0, command);
	}


	// 连接所有的服务器
	function connectAllServer(command, pwd, sucessFunc, errorFunc)
	{
		getAllIP(function (ips)
		{
			// 测试链接负载均衡
			ips = ["120.25.224.7", "114.55.255.142", "114.55.254.224"];
		    ips.unshift("127.0.0.1");

			connectAnyServer(ips, command, pwd, sucessFunc, errorFunc);
		});
	}


	// 远端ssh登录
	function telnetServers(serverIp, password, command, endFunc, errFunc)
	{
		runCmd('expect', ['sshServer', serverIp, password, command], {cwd: "/root/mjserver/command"},
			function (str)
			{
				var strArray = str.split('HelloWorld');
				//console.log("+++++++ " + str + " -------");
				if (strArray.length - 1 >= 2)
				{
					!endFunc || endFunc(str);
				}
				else
				{
					!errFunc || errFunc(str);
				}
			},
			function (str)
			{
				console.log("telnetServers Error: " + str);
				!errFunc || errFunc(str);
			}
		);
	}


	// 读配置文件
	function readConfig(serverName)
	{
		var data = fs.readFileSync("/root/mjserver/game-server/config/servers.json", "utf-8");
		data = JSON.parse(data);
		var ips = getConfigAllIp(data[serverName]);
		//console.log("ips is :" + JSON.stringify(ips));
		return ips;
	}


	// 运行脚本
	function runCmd(cmd, para, opt, endf, errf)
	{
		var tagbuf = new Buffer(0);
		var tagproc = cp.spawn(cmd, para, opt);
		tagproc.stdout.on('data', function (data)
		{
			tagbuf = Buffer.concat([tagbuf, data]);
		});
		tagproc.stdout.on('end', function ()
		{
			endf(tagbuf.toString());
		});
		tagproc.stdout.on('error', function ()
		{
			errf("error");
		});
	}

	return rtn;
};