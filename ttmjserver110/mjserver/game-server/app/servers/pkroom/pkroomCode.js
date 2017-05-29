module.exports = function(app,server,serverClass)
{
	var fs=require('fs');
	if(!server.games)  server.games={}; var games=server.games;
	var gameLog=[];function GLog(log){ app.FileWork(gameLog,"/root/mjserver/log.txt",log)}

	//reloadGame 
	(function ()
	{
	   var gamesPath=__dirname+"/games/";
	   var lst=fs.readdirSync(gamesPath);
	   for(var i=0;i<lst.length;i++)
	   {
		   if(fs.statSync(gamesPath+lst[i]).isDirectory())
		   {
			   var gameid=lst[i];
			   var oldGame=games[gameid];
			   if(oldGame)
			   {
				   delete require.cache[require.resolve('./games/'+gameid+'/GameCfg')];
				   oldGame.gcfg=require('./games/'+gameid+'/GameCfg')(app,server,gameid);
				   oldGame.ReloadCode();
			   }
			   else
			   {
				  // var gameCode=fs.readdirSync(gamesPath+lst[i]);
				   //for(var j=0;j<gameCode.length;j++)
				   {
					   //if(gameCode[j].indexOf('Data_')==0)
					   {
						   var game=require( //"./games/"+lst[i]+"/GameType"
							"./games/GameType"
						   )(app,server,lst[i]);	   
						   games[game.gameid]=game;	   
						   console.info(" load game "+game.gameid);
						   //break;
					   }
				   } 
			   }
		   }
		}	  
	})();


	if(app.serverType=="pkroom"&&!server.httpServer)
	{
		//delete require.cache[require.resolve('./http/httpServer.js')];
		server.httpServer=new require("./games/httpServer.js")(app,server);
	}

	server.webFunc = {
		ReloadCode:function(req, res)
		{
			if(server.ReloadCode)
			{
				server.ReloadCode();
				res.json("reload ok");
			}
			else res.json("reload fail");
		}
	};
	
	if(!server.pkplayers)
	{
		server.pkplayers={};
	}
	var pkplayers=server.pkplayers;

	function SessionPlayer(session)
	{
		var pl=pkplayers[session.uid];
		if(pl&&pl.fid==session.frontendId&&pl.sid==session.id) return pl;
		else if(pl)
		{
			//console.error('session not match '+pl.uid+" "+pl.fid+" "+pl.sid+" "+session.frontendId+" "+session.id);
		}
		return null;
	}
	
	
	delete require.cache[require.resolve('../Result')];var Result=require('../Result');
	serverClass.prototype.JoinGame=function(pl,msg,sinfo,next)
	{
		delete pl.unionid;
		delete pl.loginCode;
		delete pl.openid;
		delete pl.email;

		console.info("--pkroomCode--serverClass.prototype.JoinGame" + JSON.stringify(msg) +", server id ="+app.serverId+",uid ="+pl.uid);
		var oldPl=pkplayers[pl.uid];
		if(oldPl&&oldPl.tid!=msg.tableid)
		{
			var oldTab = oldPl.table;
			if(oldTab)
			{
				console.log("--------->serverClass.prototype.JoinGame  oldTb remove player before = "+oldTab);
				oldTab.RemovePlayer(oldPl);//这里remove了table导致下面报错，提前保存table
				oldTab.Destroy();
			}
			delete pkplayers[uid];
			oldPl=null;
		}
		if(!oldPl)
		{

			pl.sid=sinfo.sid;
			pl.fid=sinfo.fid;
			pl.did=sinfo.did;
			var game=games[msg.gameid];
            var rtn={result:Result.Success};
			msg.sinfo=sinfo;
			pl=game.AddPlayer(pl,msg,rtn);
			if(pl)
			{
				console.log("--------->serverClass.prototype.JoinGame  AddPlayer uid =  "+pl.uid+",tb id ="+msg.tableid);
				pkplayers[pl.uid]=pl;
				pl.gameid=msg.gameid;
				pl.roomid=msg.roomid;
				next(null,rtn);
			}
			else
			{
				console.log("--------->serverClass.prototype.JoinGame  AddPlayer error = pl null, tb id ="+msg.tableid);
				next(null,rtn);
			}
		}
		else if(oldPl.table)//true  //oldPl.fid==null  降低要求
		{
			oldPl.table.Reconnect(oldPl,pl,msg,sinfo);
			next(null,{result:Result.Success});
		}
		else next(null,{result:Result.alreadyInGame}); 
			
	}
	serverClass.prototype.LeaveGame=function(uid,msg,next)
	{
		console.info("--pkroomCode--serverClass.prototype.LeaveGame" + JSON.stringify(msg) + "|| uid:" + uid);
		//GLog("--pkroomCode--serverClass.prototype.LeaveGame = " + JSON.stringify(msg) + "|| uid:" + uid);

		//console.error(app.serverId+" @@@ LeaveGame "+uid);
		var rtn={result:Result.playerNotFound};
		var pl=pkplayers[uid];
		if(pl)
		{

			var game=games[pl.gameid];
			var members = [];
			members = game.GetAllPlayer(pl);
			rtn.member = members;
			//返回金币场标志，退出可能要通知0号pkplayer
			if(pl.table && pl.table.createPara && pl.table.createPara.coinRoomCreate){
				rtn.coinRoomCreate =true;
			}

			var tbid = pl.table;
			if(msg.isDisconnect && pl.table && pl.table.roomCfg().reconnect)//预先判断pl.table存在防止报错
			{
				//GLog("serverClass.prototype.LeaveGame error~~~~~ keepInGame  uid =" + uid+",reconnect="+pl.table.roomCfg().reconnect+",tbid="+tbid.tableid);
				pl.table.Disconnect(pl,msg);
				rtn.result=Result.keepInGame;
			}
			else if(pl.table && pl.table.CanLeaveGame(pl))//预先判断pl.table存在防止报错
			{
				var game=games[pl.gameid];
				if(game.RemovePlayer(pl,rtn))
				{
					//GLog('------->game.RemovePlayer  ok ,uid = ' + uid +",tb ="+tbid.tableid);
					delete pkplayers[uid];
					rtn.result=Result.Success;
					rtn.pinfo=pl.info;	//commit data back to data server
				}
				else
				{
					//GLog('------->game.RemovePlayer  error uid = ' + uid+",tb ="+tbid.tableid);
					rtn.result=Result.Fail;
				}
			}
			else
			{
				//GLog("pkroom.prototype.LeaveGame error~~~~~ roomInPlayr  uid =" + uid+",disc ="+msg.isDisconnect+",tb id ="+tbid.tableid);
				rtn.result = Result.roomInPlay;
			}
		}

		next(null,rtn);
	}

	serverClass.prototype.httpJoinGame=function(msg,session,next)
	{
		console.info("--pkroomCode--serverClass.prototype.httpJoinGame" + JSON.stringify(msg));
		console.error("httpJoinGame "+JSON.stringify(msg));
		var pl=msg.pinfo; var para=msg.para;
		var sinfo={sid:session.id,fid:session.frontendId,"did":app.GetServerBuyUid("pkplayer",para.uid).id};
		para.canCreate=para.uid==para.createPara.owner;
		para.tableid=para.createPara.vipTable+"";
		session.bind(para.uid);
		this.JoinGame(pl,para,sinfo,next);
	}
	serverClass.prototype.httpLeaveGame=function(msg,session,next)
	{
		console.info("--pkroomCode--serverClass.prototype.httpLeaveGame" + JSON.stringify(msg));

		console.error("httpLeaveGame "+JSON.stringify(msg));
		this.LeaveGame(session.uid,{},next)
	}
	
	serverClass.prototype.tableMsg=function(msg,session,next)
	{
		console.info("--pkroomCode--serverClass.prototype.tableMsg" + JSON.stringify(msg));

		var pl=SessionPlayer(session);
		if(!pl)next(null,{result:Result.playerNotFound});
		else 
		{
			var table=pl.table; var handler=!!table?table[msg.cmd]:null
			if(handler) handler.call(table,pl,msg,session,next)
			else 
			{
				if(table){  msg.uid=pl.uid; delete msg.__route__; table.NotifyAll(msg.cmd,msg); }
				next(null,{result:Result.Fail});
			}
		}
	}
	
	serverClass.prototype.offinePlayers=function(on,off,next)
	{
		console.info("--pkroomCode--serverClass.prototype.offinePlayers" + JSON.stringify(on) + "||" + JSON.stringify(off));

		if(!server.offline)
		{
			server.offline={};
		}
		for(var uid in on)  delete server.offline[uid];
		for(var uid in off) server.offline[uid]=off[uid];
		//console.info(app.serverId+" offinePlayers on:"+Object.keys(on)+" off:"+Object.keys(off)+" "+Object.keys(server.offline));
		next(null,null);
	}

	serverClass.prototype.GetAllRoomPlayer=function(uid,next)
	{
		//GLog("serverClass.prototype.GetAllRoomPlayer  rpc uid ="+uid);
		var pl=pkplayers[uid];
		if(pl)
		{
			var game=games[pl.gameid];
			var rtn = [];
			rtn = game.GetAllPlayer(pl);
			//GLog("serverClass.prototype.GetAllRoomPlayer  uidlen  ="+rtn.length);
			next(null, rtn);
		}
		else {
			//GLog("3783788888========>GetAllRoomPlayer  pl null");
			next(null, null);
		}
	}
}