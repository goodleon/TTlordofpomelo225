module.exports=function(gapp,hport, hhost){
	
	console.info(gapp.serverId+" "+hport);
	
	var express = require('express');//引入express 核心模块？
	var bodyParser = require('body-parser');//body解析xml
	var fs=require('fs');

	var app = express();//用express创建一个新的程序
	app.use( bodyParser.json() );

	var aServer=this;
	
	function AddWebHandler(type,path,js)
	{
		if(typeof js=='function')
		{
			app[type](path,js);
		}
		else 
		{
			for(var pty in js)
			{
				AddWebHandler(type,path+"/"+pty,js[pty]);
			}
		}
	}

	AddWebHandler("post","",
		{
			CheckPlayer:function(req, res) {
				var unionId = req.body.unionId;
				var type = req.body.type;

				if(typeof unionId != 'string' || typeof type != 'string') {
					res.json({er:1});
					return;
				}

				gapp.login.CheckPlayer(unionId, type, function(er, pl) {
					if(!er) {
						res.json({er:0, pl:pl});
					} else {
						res.json({er:2});
					}
				});
			},
			NewPlayer:function(req, res){
				gapp.login.verifyPlayer(req.body,function(er,newp){
					 if(!er&&newp&&newp.length>0)
					 {
						 res.json(newp);
					 }
					 else
					 {
						 res.sendStatus(403);
					 }
				});
			},
			reqGuestID:function(req,res)
			{
				gapp.login.reqGuestID({fromHttp:true},null,function(er,newp){
					 if(!er&&newp)
					 {
						 res.json(newp);
					 }
					 else
					 {
						 res.sendStatus(403);
					 }
				});
			}
			,getMemberByIDPass:function(req, res)
			{
				if(aServer.zjhAdmin)
				{
					aServer.zjhAdmin.clientHandler(null,{cmd:"getMemberByIDPass",msg:req.body,crossServer:true},function(er,rtn){
						 if(!er&&rtn)
						 {
							 res.json(rtn);
						 }
						 else
						 {
							 console.info("id pass not found"); 
							 res.sendStatus(403);
						 }
					});
				}
				else
				{ 
			        console.info("zjhAdmin not found"); 
			        res.sendStatus(403);
				}
			}
			,LoginReward:function(req, res)
	        {
				gapp.login.LoginReward(req.body, function(er, pl) {
					if(!er) {
						res.json({er:0});
					} else {
						res.json({er:3});
					}
				});
			}

		}
	);
	//在给定的主机和端口上监听请求，这个和node的文档http.Server#listen()是一致的
	app.listen( hport, hhost);
	
	return aServer;

}



