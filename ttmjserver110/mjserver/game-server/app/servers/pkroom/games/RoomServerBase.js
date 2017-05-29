module.exports = function(app,server,gameid,Player,Table,TableGroup,TableManager,Game) 
{
	//var httpClient=require("./httpClient")(app);
	delete require.cache[require.resolve('../../Result')];var Result=require("../../Result")
	var gameLog=[];function GLog(log){ app.FileWork(gameLog,"/root/mjserver/log.txt",log)}
	Table.prototype.base=function(group,tableid)
	{
		this.group=group;
		
		var mgr=group.mgr; var game=mgr.game; var rcfg=mgr.rcfg;
		
		this.tableid=tableid;
		this.channel= app.channelService.getChannel( game.gameid+"/"+rcfg.roomid+'/'+ group.groupid+"/"+tableid, true);;
		this.players={};
		this.dirty={};
		this.initTable();
		//一个特殊的table用来匹配
		if(rcfg.startType=="matchStart"&&tableid==1)
		{
			var tb=this;
			this.SetInterval(function(){tb.MatchStartCheck()},5000);
			group.less[tableid]=this;
		}
	}
    Table.prototype.roomCfg=function()
	{
		return this.group.mgr.rcfg;
	}
    Table.prototype.gameCfg=function()
	{
		return this.group.mgr.game.gcfg;
	}
	Table.prototype.endVipTable = function(msg, next) {
		var ids = msg.uids;
		var server;
		var failData = [];
		var servers = {};

		for(var i = 0; i < ids.length; i++) {
			server = app.GetServerBuyUid("pkplayer", ids[i]);

			if(server) {
				if(!servers[server.id]) {
					servers[server.id] = server;
				}
			} else {
				app.FileWork(failData, 'tableEndVipTable.log', {uid: ids[i], tableid: msg.tableid, serverId: app.serverId});
			}
		}

		for(var key in servers) {
			server = servers[key];
			app.httpClient.postJson("EndVipTable", msg, server.port + 1000, server.host,next);
		}
	}
	Table.prototype.httpUpdatePlayer=function(uid,update,serverId,cb)
	{
		var server=app.GetServerBuyUid("pkplayer",uid);
		app.httpClient.postJson("UpdatePlayer",{uid:uid,update:update},server.port+1000,server.host,cb);
	}
	Table.prototype.Destroy=function()
	{
		if(Object.keys(this.players).length==0)
		{
			this.channel.destroy();
			delete this.group.all[this.tableid];
			console.info("destroy table "+this.tableid);
		}
	}
	Table.prototype.AllPlayerCheck=function(f)
	{
		for(var uid in this.players)
		{
			var pl=this.players[uid];
			if(!f(pl)) return false;
		}
		return true;
	}
	Table.prototype.FindAllPlayer=function(f)
	{
		var rtn=[];
		for(var uid in this.players)
		{
			var pl=this.players[uid];
			if(f(pl)) rtn.push(pl);
		}
		return rtn;
	}
	Table.prototype.GetAllPlayerUid=function()
	{
		//GLog("7777777777Table.prototype.GetAllPlayerUid");
		var rtn=[];
		for(var uid in this.players)
		{
			rtn.push(uid);
		}
		return rtn;
	}
	Table.prototype.getPlayer=function(uid){return this.players[uid];}
	Table.prototype.PlayerPtys=function(func)
	{
		var players={};
		for(uid in this.players)
		{
			var pl=this.players[uid];
			players[uid]=func(pl);
		}
		return players;
	}	
	Table.prototype.collectPlayer=function()
	{
		var fds=arguments;
		var players={};
		for(uid in this.players)
		{
			var pl=this.players[uid];
			var info={};
			for(var i=0;i<fds.length;i++)
			{
				info[fds[i]]=pl[fds[i]];
			}
			players[pl.uid+'']=info;
		}
		return players;
	}
	Table.prototype.randomPlayer=function()
	{
		var uids=Object.keys(this.players);
		if(uids.length>0) return this.players[uids[Math.floor(Math.random()*uids.length)]];
		return null;
	}
	
	Table.prototype.CheckPlayerCount=function(f){ var rtn=0; for(var uid in this.players){ if(f(this.players[uid])) rtn++; }   return rtn; }
	Table.prototype.AllPlayerRun=function(f){for(var uid in this.players)f(this.players[uid])}
	Table.prototype.PlayerCount=function(){	var rtn=0;	for(var uid in this.players) rtn++;	return rtn;}
	Table.prototype.SetTimer=function()
	{
		if(!this.delayTimer) this.delayTimer={}; var delayTimer=this.delayTimer;
		if(delayTimer.timerId){ clearTimeout(delayTimer.timerId); delayTimer.timerId=null;}
		delayTimer.args=Array.prototype.slice.call(arguments);
		delayTimer.next=-2;
		function timerFunc()
		{
			if(delayTimer.next>=0) delayTimer.args[delayTimer.next+1]();
			if(delayTimer.args.length==0) return;
			delayTimer.next+=2;
			if(delayTimer.next<delayTimer.args.length)
			 delayTimer.timerId=setTimeout( timerFunc,delayTimer.args[delayTimer.next]);
		    else delayTimer.timerId=null;
		}
		timerFunc();
	}
	Table.prototype.SetInterval=function(fun,inteval)
	{
		setInterval(fun,inteval);
	}
	//init notify notify ...
	Table.prototype.FullStartCheck=function()
	{
			this.group.CheckTableNum(this,1);
			var rcfg=this.roomCfg();
			if(this.IsFull())
			{
				//console.info("full");
				var tb=this;
				tb.SetTimer( 
				   1000, function(){if(tb.IsFull()) tb.willStart(); }
				  ,4000, function(){if(tb.IsFull()) tb.startGame(); }
				);
			}
			else if(this.PlayerCount()==1)//第一个玩家开启npc timer
			{
				var tb=this;
				tb.SetTimer( 
				5000,function()	{
					if(!tb.IsFull()&&tb.PlayerCount()>0)
					{
						tb.group.CheckTableNum(tb,2);
						tb.initNpcs();
					}
					else tb.SetTimer();
				}
				,1000,function(){ tb.willStart()      }
				,4000,function(){ if(tb.PlayerCount()>0) tb.startGame();  }
				
				);
			}
	}
	Table.prototype.MatchStartCheck=function()
	{
		var rcfg=this.roomCfg();
		var full=rcfg.full;
		if(this.IsFull())
		{
			//console.info("MatchStartCheck "+this.PlayerCount());
			var allPlayer=[];
			for(var uid in this.players)
			{
				allPlayer.push(this.players[uid]);
				allPlayer.sort(function(a,b){ return a[rcfg.matchField]-b[rcfg.matchField]; });
				if(Math.random()>0.5)
				{
					for(var i=0;i+full<allPlayer.length;i+=full)
					{
						var table=this.group.GetEmptyTable();
						for(var j=0;j<full;j++)
						{
							var pl=allPlayer[i+j];
							this.RemovePlayer(pl);
							table.AddPlayer(pl,pl.joinMsg);
							table.channel.add(pl.uid,pl.fid);
						}
						table.NotifyAll("initSceneData",table.initSceneData());
						table.FullStartCheck();
					}
				}
				else
				{
					for(var i=allPlayer.length;i-full>=0;i-=full)
					{
						var table=this.group.GetEmptyTable();
						for(var j=0;j<full;j++)
						{
							var pl=allPlayer[i-j-1];
							this.RemovePlayer(pl);
							table.AddPlayer(pl,pl.joinMsg);
							table.channel.add(pl.uid,pl.fid);
						}
						table.NotifyAll("initSceneData",table.initSceneData());
						table.FullStartCheck();
					}
				}
			}
			this.group.dumpTable();
		}
	}
    Table.prototype.CanAddPlayer=function(pl){return true;}
	Table.prototype.AddPlayer=function(pl,msg,rtn)
	{
		if(this.CanAddPlayer(pl))
		{
			var tablePL=this.players[pl.uid];
			if(tablePL)
			{
			   this.Disconnect(tablePL);
			   this.Reconnect(tablePL,pl,msg,msg.sinfo);
			   return tablePL;	
			}
			pl=new Player(pl);
			
			this.players[pl.uid]=pl;
			pl.tid=this.tableid;
			pl.table=this;
			var mgr=this.group.mgr; var game=mgr.game; var rcfg=mgr.rcfg;
			//console.info(game.gameid+" "+JSON.stringify(rcfg)+" "+this.tableid+" table addplayer "+pl.uid);
			if(rcfg.startType=="matchStart"&&this.tableid==1)//add
			{
				console.log(" rcfg.startType==matchStart table addplayer "+pl.uid);
			}
			else
			{
				this.initAddPlayer(pl,msg);
				this.channel.add(pl.uid,pl.fid);
				pl.notify("initSceneData",this.initSceneData(pl));
				if(this.IsFull())
				{
					this.startGame();
				}
				
			}
			if( rcfg.startType=="fullStart")this.FullStartCheck();
			else this.group.CheckTableNum(this,1);
			this.group.dumpTable();
			return pl;
		}
		else
		{
			console.log("=======>Table.prototype.AddPlayer CanAddPlayer error uid ="+ pl.uid+",tb = "+this.tableid);
		}
		rtn.result=Result.roomFull;
		return null;
	}
	Table.prototype.CanLeaveGame=function(pl)
	{
		return true;
	}
	Table.prototype.willStart=function()
	{
		this.NotifyAll("willStart",{at:Date.now()+4000})
	}
	Table.prototype.firstPlayer=function()
	{
		for(var uid in this.players) return this.players[uid];
		return null;
	}
	Table.prototype.RemovePlayer=function(pl)
	{
		if(this.players[pl.uid]==pl)
		{
			var mgr=this.group.mgr; var game=mgr.game; var rcfg=mgr.rcfg;

			delete this.players[pl.uid];
			delete pl.table;
			
			//console.info(game.gameid+" "+rcfg.roomid+" "+this.tableid+" table removeplayer "+pl.uid);
			if(rcfg.startType=="matchStart"&&this.tableid==1)//remove
			{
				//GLog('=========>Table.prototype.RemovePlayer matchStart this.tableid = 1');
			}
			else
			{
				this.channel.leave(pl.uid,pl.fid);
				this.group.CheckTableNum(this,0);
				this.cleanRemovePlayer(pl);
			}
			return true;
		}
		return false;
	}
	Table.prototype.LeaveGame=function(uid,next)
	{
		//GLog("333333333Table.prototype.LeaveGame  uid = "+uid);
		var pl=this.players[uid];
		if(pl)
		{
			//GLog("enter Table.prototype.LeaveGame ok");
			var mgr=this.group.mgr; var game=mgr.game; var rcfg=mgr.rcfg;

			var server = app.GetServerBuyUid("pkplayer", uid);
			//GLog("Table.prototype.LeaveGam  server id ="+server.id);
			app.rpc.pkplayer.Rpc.LeaveCoin(server.id, uid, function (err, ret)
			{
				//GLog("app.rpc.pkplayer.Rpc.LeaveCoin   ok ~~~~~~~~~~~~");
				next(null,{result:Result.Success,msg:"KickLeaveGame", uid:uid});
			})
			return true;
		}
		next(null,{result:Result.Fail,msg:"KickLeaveGame", uid:uid});
		return false;
	}
	Table.prototype.IsEmpty=function()	{	var rtn=true;	for(var uid in this.players) {  rtn=false; break;}; return rtn;	}
	Table.prototype.IsFull=function()
	{
		var rcfg=this.roomCfg();
		//console.log("is full ? " + this.PlayerCount() + " "+ JSON.stringify(rcfg));
		return this.PlayerCount()>=rcfg.full;
	}
	Table.prototype.NotifyAll=function(cmd,msg)
	{
	    this.channel.pushMessage(cmd,msg);
	}
	
	TableGroup.prototype.mergeLess=function()
	{
		
	}
	TableGroup.prototype.dumpTable=function(){
		
				console.info("a:"+Object.keys(this.all)+" e:"+Object.keys(this.empty)+" l:"+Object.keys(this.less)+" f:"+Object.keys(this.full));

	}
	TableGroup.prototype.CheckTableNum=function(tb,isAdd)
	{
		//private room
		if(typeof(tb.tableid)=='string')
		{
			//console.info(tb.tableid+" "+isAdd+" "+tb.PlayerCount());
			//GLog('TableGroup.prototype.CheckTableNum------>tb.tableid string = '+tb.tableid);
			return;
		}
		var rcfg=tb.roomCfg();
		if(tb.IsEmpty())
		{
			//GLog('TableGroup.prototype.CheckTableNum------>IsEmpty true, tbid = '+tb.tableid);
			delete this.full[tb.tableid];
			delete this.less[tb.tableid];
			this.empty[tb.tableid]=tb;
			if(tb.resetEmpty) tb.resetEmpty();
			else tb.initTable();
			//console.info(tb.tableid +" empty");
		}
		else if(tb.IsFull()||isAdd==2)
		{
			//GLog('TableGroup.prototype.CheckTableNum------>IsFull='+ tb.IsFull()+', tbid = '+tb.tableid+',isAdd = '+ isAdd);
			delete this.empty[tb.tableid];
			delete this.less[tb.tableid];
			this.full[tb.tableid]=tb;
			//console.info(tb.tableid +" full");
		}
		else if(isAdd==1||  (isAdd==0 && rcfg.removeLess) ) 
		{
			//GLog('TableGroup.prototype.CheckTableNum--!!!---->IsFull='+ tb.IsFull()+', tbid = '+tb.tableid+',isAdd = '+ isAdd);
			delete this.empty[tb.tableid];
			delete this.full[tb.tableid];
			this.less[tb.tableid]=tb;
			//console.info(tb.tableid +" less");
		}

		//GLog('TableGroup.prototype.CheckTableNum------>this.dumpTable()= ');
		this.dumpTable();
	}
	
	TableGroup.prototype.base =function(mgr,groupid)
	{
		this.mgr=mgr;
		this.less={},
		this.empty={},
		this.full={},
		this.all={},
		
		this.roomCount=0;
		this.groupid=groupid;
	}
	TableGroup.prototype.GetEmptyTable=function()
	{
		var table=null;
		var emp=Object.keys(this.empty);
		if(emp.length==0)
		{
			table=new Table(this,++this.roomCount);
			this.all[table.tableid]=table;
		}
		else
		{
			table=this.empty[ emp[ Math.floor(Math.random()*emp.length) ] ];
		}
		return table;
	}
	TableGroup.prototype.AddPlayer=function(pl,msg,rtn)
	{

			var table=null;
			if(msg.tableid)
			{
				table=this.all[msg.tableid];
				if(!table) 
				{
					if(msg.canCreate) 
					{
						this.all[msg.tableid]=table=new Table(this,msg.tableid);
						table.createPara=msg.createPara;
					}
				}	
			}
			else
			{
				var les=Object.keys(this.less);
				if(les.length==0)
				{
                    table=this.GetEmptyTable();
				}
				else
				{	
					table=this.less[ les[ Math.floor(Math.random()*les.length) ] ];
				}
			}
			if(!table)
			{
				rtn.result=Result.roomNotFound; 
				pl=null;
		    }
			else
			{
				//pkplayer挂掉导致 房主自己不能创建相同id房间
				if(msg.canCreate&&!table.CanAddPlayer(pl)) 
				{
					var pkplayers=server.pkplayers;
					table.AllPlayerRun(function(p){
						if(p.table==table)
					    {
							delete pkplayers[p.uid];
						}
					});
					table.players={};
					table.Destroy();
					this.all[msg.tableid]=table=new Table(this,msg.tableid);
					table.createPara=msg.createPara;
				}
				
				pl=table.AddPlayer(pl,msg,rtn);
				
			}
			return pl;
		
	}
	TableGroup.prototype.RemovePlayer=function(pl)
	{
		var table=this.all[pl.tid];
		if(!table) return false;
		return table.RemovePlayer(pl);
	}
	TableGroup.prototype.GetAllPlayer=function(pl)
	{
		//GLog("66666666666TableGroup.prototype.GetAllPlayer");
		var table=this.all[pl.tid];
		if(!table) return null;
		return table.GetAllPlayerUid();
	}

	TableManager.prototype.GetAllPlayer=function(pl)
	{
		//GLog("5555555555TableManager.prototype.GetAllPlayer");
		var group=this.group;
		if(pl.tgp) group=this.groups[pl.tgp];
		if(group)
		{
			return group.GetAllPlayer(pl);
		}
		return null;
	}
	TableManager.prototype.base=function(game,rcfg)
	{
		this.game=game;
		this.rcfg=rcfg;
		this.group=new TableGroup(this,'');
		this.groups={};
		
	}
	TableManager.prototype.AddPlayer=function(pl,msg,rtn)// add to default group ,  add to room match , add to group match , add to other group
	{
		var group=this.group;
		if(msg.groupid)
		{
			group=this.groups[msg.groupid];
			if(!group)  this.groups[msg.groupid]=group=new TableGroup(this,msg.groupid);
		}
		pl=group.AddPlayer(pl,msg,rtn) ;
		if( pl )
		{
			if(msg.groupid) pl.tgp=msg.groupid;
		}
		return pl;
	},
	TableManager.prototype.RemovePlayer=function(pl)
	{
		var group=this.group;
		if(pl.tgp) group=this.groups[pl.tgp];
		if(group)
		{
			return group.RemovePlayer(pl);
		}
		return false;
	}
	TableManager.prototype.GetALlPlayer=function(pl)
	{
		var group=this.group;
		if(pl.tgp) group=this.groups[pl.tgp];
		if(group)
		{
			return group.GetAllPlayer(pl);
		}
		return null;
	}
	Player.prototype={
		
		base:function(info){this.info=info;},
		get uid(){ return this.info.uid; },
		get fid(){ return this.info.fid; },
		get sid(){ return this.info.sid; },
		get did(){ return this.info.did; },
		
		set fid(val){ this.info.fid=val; },
		set sid(val){ this.info.sid=val; },
		
		notify:function(route,msg){
			app.channelService.pushMessageByUids(route,msg,[{ uid: this.uid, sid: this.fid }]);
		}
	}
	
	Game.prototype.base=function()
	{
		this.gameid=gameid;
		var gcfg=this.gcfg=require('./'+gameid+'/GameCfg')(app,server,gameid);
		this.rooms={};
		for(var id in gcfg.rooms)
		{
			var rcfg=gcfg.rooms[id];
			rcfg.roomid=id;
			this.rooms[id]=new TableManager(this,rcfg);
		}
		console.error("game create "+gameid+" @ "+app.serverId);
	}
	Game.prototype.AddPlayer=function(pl,msg,rtn)
	{
		//pl=new Player(pl);//wrap data 
		//pl.joinMsg=msg;
		var mgr=this.rooms[msg.roomid];
		if(mgr)
		{
			//if( mgr.AddPlayer(pl,msg,rtn) ) return pl;
			pl=mgr.AddPlayer(pl,msg,rtn);
		}
		else rtn.result=Result.roomNotFound;
		//console.error(app.serverId+" "+ gameid+" AddPlayer " + " rooms" + rtn.result);
		return pl;
	}
	Game.prototype.RemovePlayer=function(pl)
	{
		var mgr=this.rooms[pl.roomid];
		if(mgr)
		{
			return mgr.RemovePlayer(pl);
		}
		//console.error(__filename+" RemovePlayer "+pl.uid);
		return false;
	}
	Game.prototype.GetAllPlayer=function(pl)
	{
		//GLog("333333Game.prototype.GetAllPlayer romid = "+pl.roomid);
		var mgr=this.rooms[pl.roomid];
		if(mgr)
		{
			return mgr.GetAllPlayer(pl);
		}
		//GLog("444444Game.prototype.GetAllPlayer mgr null");
		return null;
	}
}