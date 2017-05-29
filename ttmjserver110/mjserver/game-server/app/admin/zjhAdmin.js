module.exports = function(opts) {
  return new Module(opts);
}
var httpClient=require("./httpClient")(null);
var exec = require('child_process').exec;
var fs=require('fs');
var heapdump = require('heapdump');
var gameLog=[];function GLog(app,log){	app.FileWork(gameLog,__dirname+"/log.txt",log)}
var moduleId = "zjhadmin";
module.exports.moduleId = moduleId;


function httpUpdatePlayer(app,uid,update,serverId,cb)
{
	//console.info('http in before ' + JSON.stringify({uid:uid, update: update, serverId:serverId}));
	var server=app.GetServerBuyUid("pkplayer",uid);
	httpClient.postJson("UpdatePlayer",{uid:uid,update:update},server.port+1000,server.host,cb);
}

var addMoneyTime={};

var maxMemberID=-1;

function Module(opts) 
{
  this.app = opts.app;

  this.interval=60;//second
  this.type='push';
  
  this.report={};

  console.error('registerAdmin '+this.app.serverId);

  var app=this.app;
  if(!app.mongoClient&&app.isMaster())
  {
	  var url = 'mongodb://'+app.getMaster().host+':27017/'+app.getMaster().id;
	  if(app.getMaster().mdbUrl) url=app.getMaster().mdbUrl;
	  
	  require('mongodb').MongoClient.connect(url,{ server: { poolSize: 3 , auto_reconnect:true }} ,
	  function(er,db){
		  GLog(app,["connect to mongo ",er]);
		  app.mongoClient=db;
		  
		  function max(table,fd,minVal,cb)
		  {
			  var rtn=minVal;
			  var sortPara={}; sortPara[fd]=-1;
			  var cursor =db.collection(table).find( ).sort(sortPara).limit(1);
			  cursor.each(function(err, doc)
			  { 
				  if(doc!=null) rtn=doc._id;  
				  else cb(null,rtn);			  
			  })
			  
		  }
		  if(app.isMaster())
		  max("members","mid",0,function(er,rtn){	 maxMemberID=rtn; 
                console.info("maxMemberID "+maxMemberID);
		  });
		  
	  });
  }
 
    //创建后台http服务器和客户端 
	if(app.isMaster()&&!app.accountServer&&app.getMaster().accountServer)
	{
	   app.accountServer=new require("../servers/login/account/accountServer.js")(app,app.getMaster().accountServer+1);
	}
	if(app.accountServer) app.accountServer.zjhAdmin=this;
	if(app.getMaster().accountClient&&!app.accountClient)
	{
	   app.accountClient=require("../servers/login/account/accountClient.js")(app);
	}
}


//handle master -> server msg





var serverHandler=
{
	kickCon:function(agent, msg, cb) 
	{
	   if(this.app.serverType=='pkcon')
	   {
		  //var connector=this.app.components.__connector__;
		  //var server = this.app.components.__server__;
		  var session = this.app.components.__session__;
		  if(session)
		  {  
			 session.service.kickBySessionId(msg.sid,function(){});
		  }
	   }
	}
	,sessionList:function(agent, msg, cb) 
	{ 
		if(this.app.isFrontend())
		{
		  //var connector=this.app.components.__connector__;
		  //var server = this.app.components.__server__;
		  var session = this.app.components.__session__;
		  if(session)
		  {  
			 var rtn=[];
			 var sessions=session.service.sessions;
			 for(var sid in sessions)
			 {
				var ss=sessions[sid];
				var s=this.app.CopyPtys(ss,{},['id','uid','settings']);
				rtn.push(s);
			 }
			 cb(null,rtn);
			 return;
		  }
		}
		cb(null,null);
	}
	,loginList:function(agent, msg, next) 
	{ 
		var login= this.app.login;
		next(null,login.idplayers);
	}
    ,loginRemove:function(agent, msg, next) 
	{ 
		var login= this.app.login;
		var pl=login.idplayers[msg.uid];
		if(pl)
		{
			delete login.idplayers[msg.uid];
			if(pl.email&&pl.email.length>0)
			{
				delete login.mailplayers[pl.email];
			}
		}
	}

,pkplayerLogout:function(agent, msg, next) 
{
	var online= this.app.pkplayer.online;
	var pl=online[msg.uid];
	if(pl)
	{
		//this.app.pkplayer.doLogoutForce(msg.uid);
		var server=app.GetServerBuyUid("pkplayer",uid);
		httpClient.postJson("forceLogout",{uid:uid},server.port+1000,server.host,cb);
	}

	if(next) next(null,null);
}	
,pkplayerList:function(agent, msg, next) 
{ 
    var rtn=[];
    var online= this.app.pkplayer.online;
	for(var uid in online)
	{
		var pl=online[uid];
		if(uid==msg.uid)
		rtn.push({
				actionNum:pl.action.length,
				actionName:pl.actionName,
				fid:pl.fid,sid:pl.sid,ingame:pl.ingame
			   ,pinfo:pl.pinfo	, vipTable:pl.vipTable
		});
		

	}
	next(null,rtn);
}

,pkplayerAppend:function(agent, msg, next) 
{ 
    var rtn=0;
    var online= this.app.pkplayer.online;
	for(var uid in online)
	{
		var pl=online[uid];
		if(pl.appEnd!=msg.appEnd)
		{
			pl.appEnd=msg.appEnd;
			rtn++;
		}
	}
	next(null,[ {num:rtn} ]);
}

,pkroomServer:function(agent, msg, next)
{
	next(null,this.app.GetCfgServers('pkroom'));
}
,pkplayerListAction:function(agent, msg, next) 
{ 
    var rtn=[];
    var online= this.app.pkplayer.online;
	for(var uid in online)
	{
		var pl=online[uid];
		if(pl.action.length>1) 
		{
			if(pl.action.length>3) 
			rtn.push({
					actionNum:pl.action.length,
					actionName:pl.actionName,
					fid:pl.fid,sid:pl.sid,ingame:pl.ingame
				   ,pinfo:pl.pinfo	, vipTable:pl.vipTable
			});
		}

	}
	next(null,rtn);
}

,pkroomList:function(agent, msg, next) 
{ 
    var rtn=[];
    var online= this.app.pkroom.pkplayers;
	for(var uid in online)
	{
		var pl=online[uid];
		if(!msg.tableid||pl.table.tableid==msg.tableid)
		{
			var obj={};
			for(var pty in pl)
			{
				if(pty!='table') obj[pty]=pl[pty];
			}
			rtn.push(obj);
		}
	}
	next(null,rtn);
}
,pktableList:function(agent, msg, next) 
{ 
   var rtn=[];
   var games=this.app.pkroom.games;
   for(var g in games)
   {
	    
	   var gm=games[g];
	   var rooms=gm.rooms;
	   for(var r in rooms)
	   {
		   var group=rooms[r].group;
		   for(var tid in group.all)
		   { 
	          var tb={};
			  var table=group.all[tid];
			  if(!msg.tableid||msg.tableid==table.tableid)
			  {
				  var ptys=msg.ptys;
				  for(var i=0;i<ptys.length;i++)
				  {
					  tb[ptys[i]]=table[ptys[i]];
				  }
				  rtn.push(tb);
			  }
		   }
	   }
   }
   next(null,rtn);
}

,endRoom:function(agent, msg, next) 
{ 
   var rtn=[];
   var games=this.app.pkroom.games;
   for(var g in games)
   {
	    
	   var gm=games[g];
	   var rooms=gm.rooms;
	   for(var r in rooms)
	   {
		   var group=rooms[r].group;
		   for(var tid in group.all)
		   { 
	          var tb={};
			  var table=group.all[tid];
			  if(msg.tableid==table.tableid)
			  {
				  if(msg.Destroy)
				  {
					  if(table.Destroy) table.Destroy();
				  }
				  else if(table.EndTable) table.EndTable();
			  }
		   }
	   }
   }
   next(null,rtn);
}
,newCard:function(agent, msg)
{
   var rtn=[];
   var games=this.app.pkroom.games;
   for(var g in games)
   {
	   var gm=games[g];
	   var rooms=gm.rooms;
	   for(var r in rooms)
	   {
		   var group=rooms[r].group;
		   for(var tid in group.all)
		   { 
	          var tb={};
			  var table=group.all[tid];
			  if(msg.tableid==table.tableid)
			  {
				  if(table.TryNewCard)	  table.TryNewCard();
			  }
		   }
	   }
   }
   
	
}
,vipTableList:function(agent, msg, next) 
{
	var vipTable=this.app.pkplayer.vipTable;
	if(msg.tableid)
	{
		var rtn={}; rtn[msg.tableid]=vipTable[msg.tableid];
		next(null,rtn);
	}
	else next(null,vipTable);
}

,reloadAll: function(agent, msg, cb) 
{ 
    var serverTypes=["login","pkcon","pkplayer","pkroom"];
	for(var i=0;i<serverTypes.length;i++)
	{
		var code=this.app[serverTypes[i]];
		if(code) code.ReloadCode();
	}
},
testCards: function(agent, msg, cb) 
{ 
    var pkroom=this.app.pkroom;
	if(pkroom)
	{
		console.info("test cards");
		if(!this.app.testCards) this.app.testCards=[];
		if(msg.cards.length>0)	this.app.testCards[msg.uid]=msg.cards;
		else delete this.app.testCards[msg.uid];
	}
}
,heapdump:function(agent, msg) 
{ 
  heapdump.writeSnapshot(this.app.serverId+'_'+ Date.now() + '.heapsnapshot');
}
,reloadAdmin:function(agent, msg, cb) 
{
   var cso= this.app.isMaster()?this.app.components['__master__'].master.masterConsole:
                                this.app.components['__monitor__'].monitor.monitorConsole;
	  delete require.cache[require.resolve('./zjhAdmin.js')];
	  cso.disable(moduleId);
	  cso.register( moduleId, require('./zjhAdmin')({app: this.app}) );
	  cso.enable(moduleId);

}
,doLogout:function(agent, msg, cb) 
{
   if(this.app.auth&&this.app.serverType=='auth')
   this.app.auth.doLogout(false,msg.uid,msg.sid,msg.fid,{},false,function(e,r){ if(cb) cb(e,r);  });
}
,removeServer:function(agent, msg, cb)
{
	var canStop=false;
	if(this.app.serverType=='auth')
	{
	   if(this.app.auth.canStop()) canStop=true;
	}
	else if(this.app.serverType=='zjh')
	{
	   if(this.app.zjh.canStop()) canStop=true;
	}
	else if(this.app.serverType=='connector')
	{
	   if(this.app.connector.canStop()) canStop=true;
	}
	if(canStop) exec('pomelo stop  -u admin -p 1qaz2wsx3edc -P '+this.app.getMaster().port+' '+this.app.serverId,function(err,rtn){ cb(err,rtn); });
	else cb(null,canStop);	
}
,addUserMoney:function(agent, msg, cb)
{
	var msg=msg.msg;
	var app=this.app;
	var uid=msg.uid;
	var serverId=app.GetServerBuyUid("pkplayer",uid);
	if(serverId)
	{
		serverId=serverId.id;
		if(serverId==app.serverId)
		{
			app.pkplayer.UpdatePlayer("majiang",uid,{$inc:{money:msg.buyNum}},cb);
		}
	}
}	
,setUserMoney:function(agent, msg, cb)
{
	this.app.pkplayer.UpdatePlayer("majiang",msg.uid,{$set:{money:msg.num}},cb);
}
	
}
















//master->monitor
Module.prototype.monitorHandler = function(agent, msg, cb) 
{
   if(!msg)//定时报告
   {
      var rpcinfo={};
	  var prox=this.app.components.__proxy__;
	  if(prox)
	  {
		  var mbxs=prox.client._station.mailboxes;
		  for(var sid in mbxs)
		  {
		     var mbx=mbxs[sid];
			 rpcinfo[sid]=Object.keys(mbx.requests).length;
		  }
	  }
      var report={serverId:agent.id,sqlinfo:this.app.sqlinfo,sqlok:this.app.sqlok,sqlerr:this.app.sqlerr,
       rpcinfo:rpcinfo
	  };
	  for(var k in report.sqlinfo)
	  {
	     var n0=report.sqlinfo[k];
	     var n1=report.sqlok[k];  if(!n1) n1=0;
	     var n2=report.sqlerr[k]; if(!n2) n2=0;
		 if(n0>n1 && ((n0-n1)>n2%1000000) )
		 {
		    report.sqlerr[k]=Math.floor(n2/1000000)*1000000+(n0-n1);
		 }
	  }
	  var app=this.app;
	  switch(app.serverType)
      {
		  case "pkplayer":
		      var pkplayer=app.pkplayer;
			  if(pkplayer)
			  {
				  report.report={ online:0,	 vipTable: Object.keys(pkplayer.vipTable).length };
				  for(var uid in pkplayer.online)
				  {
					  var pl=pkplayer.online[uid];
					  if(pl.fid) report.report.online++;
				  }
			  }
		  break;
	      case "pkroom":
		      var pkroom=app.pkroom;
			  if(pkroom)
			  {
				  report.report={ inroom:Object.keys(pkroom.pkplayers).length }
			  }
		  break;
		  case "login":
		      var login=app.login;
			  if(login)
			  {
				  report.report={idplayers:Object.keys(login.idplayers).length,mailplayers:Object.keys(login.mailplayers).length };
			  }
		  break;
	      case "pkcon":
          case "matcher":
		  
		  break;
		  
		  
			/*
			case 'connector':
			  if(!app.connector){ console.error('!app.connector '+app.serverId);  return;}
			  report['report']=app.connector.conReport();
			break;
			case 'auth':
			  if(!app.auth){ console.error('!app.auth'); return;}
			  report['report']=app.auth.authReport();
			break;
			case 'zjh':
			  if(!app.zjh){  console.error('!app.zjh'); return;}
			  report['report']=app.zjh.zjhReport();
			break; */
		
		
	  }	  
      agent.notify(moduleId, report);
   }
  else
  {
     var func=serverHandler[msg.cmd];
     if(func) func.call(this,agent,msg,cb);
     else switch(msg.cmd)
	 {
	     //cast command
	 	 case 'testcast':
		 {
		    this.app.channelService.broadcast('connector','testcast',{});
		 }
		 break;


		 
		
	    case "":
		{
		    
			//if(cb) cb(null,null);
		}
		break;
	 
       
		

		

	    

		 case 'reload':
		 {
		    if(this.app.zjh)this.app.zjh.ReloadCode();
		    if(this.app.connector)this.app.connector.ReloadCode();
		    if(this.app.auth)this.app.auth.ReloadCode();
			cb(null,{});
		 }
		 break;
		 case 'switchServer':
		     {
			    this.app.zjh.switchServer(msg);
				cb(null,{});
			 }
			 break;

	     break;
		 case 'zjhcfgs':
		  {
		       cb(null, {cfgs:this.app.auth.allCfgs });
		  }
		  break;
         case 'cfgs':
             {
                 var cfgs = this.app.zjh.cfgs;
                 var rooms = this.app.zjh.rooms;
				 var less={};
                 Object.keys(cfgs).forEach(function(cid)
                 {
				     var rm=rooms[cid];
				     if(!rm) return;
					 var num=[];
					 if(rm.cfg.actjoin>0)
					 {
					    rm.rooms.forEach(  function(mgr){     

						   mgr.less.forEach( function(id){  num.push(mgr.all[id].round.joinNum);  } );
						   num.push('|');

						});
					 }
                     else
					 {
					    rm.less.forEach( function(id){  num.push(rm.all[id].round.joinNum);  } );
					 }
					 less[rm.cfg.id]=num;
                 });

                 cb(null, {cfgs:cfgs,less:less });
             }
             break;
         case 'rooms':
             {
                 var rtn = [];
				 var less=[];
				 var cfg=this.app.zjh.cfgs[msg.idx]
                 var rooms = this.app.zjh.rooms[msg.idx];
				 
				 function AddToReturn(mgr)
				 {
					   less.push('wait',Object.keys(mgr.wait));
					   less.push('less'); mgr.less.forEach(function(id)  { var rd=mgr.all[id].round;  less.push( id+"_"+rd.joinNum+"_"+rd.watchNum);  } ); 
					   less.push('empty');mgr.empty.forEach(function(id){ var rd=mgr.all[id].round;  less.push( id+"_"+rd.joinNum+"_"+rd.watchNum);  } ); 
					   less.push('full');
					   
					   mgr.all.forEach(function(rm) { 
					      rtn.push(rm.round); 
						  if(rm.isFull()) {  less.push( rm.roomSlot()+"_"+rm.round.joinNum+"_"+rm.round.watchNum); }
					   });
				 }
				 
				 if(cfg.actjoin>0)
				 {
				    rooms.rooms.forEach(AddToReturn);
				 }
				 else if (msg.ids) msg.ids.forEach(function (id) {   rtn.push(rooms.all[id].round );  });
				 else AddToReturn(rooms);
                 cb(null,{rooms:rtn,less:less});
             }
             break;
         case 'lessrooms':
             {
                 var rtn = [];
				 var cfg=this.app.zjh.cfgs[msg.idx]
                 var rooms = this.app.zjh.rooms[msg.idx];
				 if(cfg.actjoin>0)
				 {
				 }
				 else
				 {
				    rooms.less.forEach( function (id) {   rtn.push(rooms.all[id].round );  } )
				    
				 }
                 cb(null,rtn);
             }break;
          case 'lessnum':
		  {
		         var rtn = [];
				 var cfg=this.app.zjh.cfgs[msg.idx]
                 var rooms = this.app.zjh.rooms[msg.idx];
				 if(cfg.actjoin>0)
				 {
				 }
				 else
				 {
				    var num={};
				    rooms.less.forEach( function (id) {   num[id]=rooms.all[id].round.joinNum;  } );
					
				    if(rooms.less.length>0) rtn.push(num);
				 }
		          cb(null,rtn);
		  }break;
			 
			 

	 }
  }
  
  //var serverId = agent.id;
  //var time = new Date(). toString();
  //agent.notify(moduleId, {serverId: serverId, time: time});
  
  
  
}

//handle monitor -> master msg
Module.prototype.masterHandler = function(agent, msg) {
  
  if(! msg) //pull
  {
     //agent.notifyAll(moduleId, {testMsg:"testMsg"});
     return;
  }
  else
  {
      this.report[msg.serverId]=msg;
  }

}



var clientHandler={
	getDayData:function(agent, msg, cb)
	{
		msg=msg.msg;
		
		msg.startDate=new Date(msg.startDate);
		msg.startDate.setHours(0,0,0,0);

		msg.endDate=new Date(msg.endDate);
		msg.endDate.setHours(0,0,0,0);
		msg.endDate.setDate(msg.endDate.getDate()+1);
		
		var app=this.app;
		var db=app.mongoClient;
		var dbPlay=db; if(app.mdb&&app.mdb.db) dbPlay=app.mdb.db;
		
		//本段时间注册用户
		var rtn={};
		var rtnNum=0;
		function finish(by)
		{
			rtnNum++;
			if(rtnNum==Object.keys(rtn).length+2)
			{
				cb(null,rtn);
			}
		}
		
		function getPlayNum(dName)
		{
			if(dbPlay)
			dbPlay.collection(dName).count(function(er,num){
				
				 rtn[dName].playNum=num;
				 finish(dName);
			});
			else console.error("no db");
		}
		
		//{date:"d",userTotal:"asd",userToday:"",newPay:"",payRate:"",newIncom:"",payTotal:"",payReal:"",playNum:"",averagePay:"",payNum:"",giftNum:""}

		var ymds=[];
		var startDate=new Date(msg.startDate);
		while(startDate.getTime()!=msg.endDate.getTime())
		{
			var ymd=startDate.Format("yyyy-MM-dd");
			ymds.push(ymd);
			rtn[ymd]={userToday:0,sellToday:0};
			startDate.setDate(startDate.getDate()+1);
			getPlayNum(ymd);
		}
		
		db.collection('cgbuser').find({sendTime:{$gte:msg.startDate ,$lt:msg.endDate}}).each(
		function(err, doc)
		{
			if(doc!=null)
			{
				var ymd=doc.sendTime.Format("yyyy-MM-dd");
				rtn[ymd].userToday++;
			}else
			{
				db.collection('cgbuser').count(function(eer,total){
					for(var i=ymds.length-1;i>=0;i--)
					{
						var ymdData=rtn[ymds[i]];
						ymdData.userTotal=total;
						total-=ymdData.userToday;
					}
					finish("cgbuser");
				});
			} 
		});

		db.collection('memberMoney').find({buyTime:{$gte:msg.startDate ,$lt:msg.endDate}}).each(
		function(err, doc)
		{
			if(doc!=null)
			{
				var ymd=doc.buyTime.Format("yyyy-MM-dd");
				rtn[ymd].sellToday+=doc.buyMoney;
			}else finish("memberMoney");
		});
		
		
	},
	getUserByID:function(agent, msg, cb)
	{
		msg=msg.msg;
		var rtn={};
		var app=this.app;	var db=app.mongoClient;
		db.collection('cgbuser').findOne({_id:msg.uid},{},function(er1,doc1){
			db.collection('majiang').findOne({_id:msg.uid},{},function(er2,doc2){
				 if(doc1||doc2)
				 {
					 if(doc1) app.CopyPtys(doc1,rtn);
					 if(doc2) app.CopyPtys(doc2,rtn);
					 cb(null,rtn);
				 }
				 else cb(null,null);
			});
		});
	},
	getMemberByIDPass:function(agent,msg,cb)
	{
		var app=this.app;	var db=app.mongoClient;
		var crossServer=msg.crossServer;
		msg=msg.msg;
		if(msg.mid>10000000||msg.mid==135790)
		{
			//GLog(app,msg.mid+" log 1");
		}
		db.collection('members').findOne({_id:msg.mid},function(er,doc){
			if(msg.mid>10000000||msg.mid==135790)
			{
				//GLog(app,msg.mid+" log 3 "+er);
			}
			if(doc)
			{
				if(doc.mPass==msg.mPass&&(doc.adminLevel>0||!msg.gameid||(doc.gameids&&doc.gameids.indexOf(msg.gameid)>=0)))
				{
					cb(er,doc);	
				}
				else cb(null,null);
			}
			else if(!crossServer&&app.accountClient)
			{
				//gameid 通过登录界面传进来
				//msg.gameid=app.getMaster().accountClient.gameid;
				app.accountClient.getMemberByIDPass(msg,function(hEr,hDoc){
					 if(hDoc)
					 {
						 if(!hDoc.adminLevel>0) hDoc.money=0;
					     db.collection("members").insertOne(hDoc,function(){
							 cb(null,hDoc);
						 });	 
					 }
					 else cb(null,null);
				});
			}
			else cb(null,null);
			
		});

	}
	,setUserMoney:function(agent,msg,cb)
	{
		cb(null,null);
		var app=this.app;	var db=app.mongoClient;
		db.collection('majiang').find().each(function(er,doc){
			    if(!doc) return;
				var serverId=app.GetServerBuyUid("pkplayer",doc.uid).id;
				agent.request(serverId, moduleId, {cmd:"setUserMoney",uid:doc.uid,num:msg.num}, function(er,rtn){
					
				});
		});
	}
	,addUserMoneyAll:function(agent,msg,cb)
	{
		cb(null,null);
		var app=this.app;	var db=app.mongoClient;
		db.collection('majiang').find().each(function(er,doc){
			    if(!doc) return;
				var serverId=app.GetServerBuyUid("pkplayer",doc.uid).id;
				agent.request(serverId, moduleId, {cmd:"addUserMoney",msg:{uid:doc.uid,buyNum:msg.buyNum}}, function(er,rtn){
					
				});
		});
	},
	asManager:function(agent, msg, cb)
	{
		var app=this.app; var db=app.mongoClient;
		var msg=msg.msg;
		db.collection("members").update({mid:msg.mid},{$set:{ adminLevel:1}},cb);
	}
	,addUserMoney:function(agent, msg, cb)
	{
		var para=msg.msg;

        var day=new Date();  day=(day.getFullYear()*10000+(day.getMonth()+1)*100+day.getDate())+"";
		
		var app=this.app; var db=app.mongoClient;
		if(!para.byMid)
		{
			cb(null,-1);
			return;
		}
		else if(para.byMid<10000000000)
		{
			var lastAddTime=addMoneyTime[para.byMid];
			if(!lastAddTime)
			{
				lastAddTime=0;
			}
			if(Date.now()-lastAddTime<10000)
			{
				cb(null,-1);
				return;
			}
			addMoneyTime[para.byMid]=Date.now();
		}
		
		db.collection("members").findOne({mid:para.byMid},function(e,by){
			if(!by)  
			{ 
		         cb(null,-1); return;
		    }
			if(by.money<para.buyNum) 
			{ 
		         cb(null,-2); return;
		    }
			if((para.buyNum<0||para.buyMoney<0)&&!(para.byMid>10000000000||para.adminLevel>=3))
			{
				cb(null,-3); return;
			}
			if(!(para.uid>0))
			{
				cb(null,-4); 
				GLog(app,[msg,"!(para.uid>0)"]);
				return;
			}
			var serverId=app.GetServerBuyUid("pkplayer",para.uid).id;
			if(para.byMid==13520189350)	GLog(app,[msg,serverId]);
			if(msg.useHttp)
			{
				httpUpdatePlayer(app,para.uid,{$inc:{money:para.buyNum}},serverId,function(er,rtn){
					if(para.byMid==13520189350)	GLog(app,[er,rtn]);
					
					if(rtn&&rtn.money>0)
					{
						db.collection("members").update({mid:para.byMid},{$inc:{money:-para.buyNum}},function(er,doc){
							msg=msg.msg;
							msg.money=by.money-para.buyNum;//于额
							msg.userMoney=rtn.money;
							msg.buyTime=new Date();
							db.collection("userMoney"+day).insertOne(msg,function()
							{
								cb(null,by.money-para.buyNum);
							});

						});
					}
				});
			}
			else
			{
				agent.request(serverId, moduleId, msg, function(er,rtn){
					if(para.byMid==13520189350)	GLog(app,[er,rtn]);
					
					if(rtn&&rtn.money>0)
					{
						db.collection("members").update({mid:para.byMid},{$inc:{money:-para.buyNum}},function(er,doc){
							msg=msg.msg;
							msg.money=by.money-para.buyNum;//于额
							msg.userMoney=rtn.money;
							msg.buyTime=new Date();
							db.collection("userMoney"+day).insertOne(msg,function()
							{
								cb(null,by.money-para.buyNum);
							});
						});
					}
				});
				
			}

		});
	},
	addMemberMoney:function(agent, msg, cb)
	{
		var app=this.app;	var db=app.mongoClient;
		var day=new Date();  day=(day.getFullYear()*10000+(day.getMonth()+1)*100+day.getDate())+"";
		msg=msg.msg;
		db.collection("members").findOne({mid:msg.byMid},function(e,by){
			if(!by)  
			{ 
		       cb(null,null); 
			   return;
			}
			if(by.money<msg.buyNum) 
			{ 
		       cb(null,null); 
			   return;
		    }
			if((msg.buyNum<0||msg.buyMoney<0)&& !(para.adminLevel>=3)) 
			{ 
		       cb(null,null); 
			   return;
		    }
			db.collection("members").update({mid:msg.byMid},{$inc:{money:-msg.buyNum}},function(er,doc){
					db.collection("members").update({mid:msg.mid},{$inc:{money:msg.buyNum,buyTotal:msg.buyMoney}},function(er,rtn){
						 console.info(JSON.stringify([er,rtn]));
						 cb(null,rtn);
						 msg.buyTime=new Date();
						 if(rtn&&rtn.money)	 msg.money=rtn.money;
						 db.collection("memberMoney"+day).insertOne(msg,function(){});
					});
			});
		});
	},
	
	computeMemberReward:function(agent, msg, cb)
	{
		var app=this.app;	var db=app.mongoClient;
		msg=msg.msg;
		var id2m={};
		db.collection("members").find().each(function(er,doc){
			if(doc)
			{
				id2m[doc.mid]=doc;
				doc._rewards=[];
			}
			else
			{
				var finishNum=0;
				function finish()
				{
					finishNum++;
					if(finishNum==Object.keys(id2m).length+1)
					{
						cb(null,null);
					}
				}
				for(var id in id2m)
				{
					var m=id2m[id];
					if(m.mAddByMid)
					{
						var by=id2m[m.mAddByMid];
						by._rewards.push(m.buyTotal);
					}
				}
				for(var id in id2m)
				{
					 var m=id2m[id];
					 var rewards=m._rewards;
					 var buyReward=0;
					 var reward=0.16;
					 var bigNum=0;
					 for(var i=0;i<rewards.length;i++)
					 {
						 if(rewards[i]>=1000)
						 {
							 bigNum++;
						 }
					 }
					 if(bigNum>=4)  reward=0.2;
					 if(bigNum>=10) reward=0.24;
					 for(var i=0;i<rewards.length;i++)
					 {
						buyReward+=Math.floor( rewards[i]*reward );
					 }
					 db.collection("members").update({mid:m.mid},{$inc:{buyReward:buyReward }},function(){
						 finish();
					 });
				}
				db.collection("members").update({},{$set:{buyTotal:0}},{multi:true},function(){
                    finish();
				});
			}
			
		});
	},
	getMyInfo:function(agent, msg, cb)
	{
		var app=this.app;	var db=app.mongoClient;
		msg=msg.msg;
		db.collection("members").findOne({mid:msg.byMid},cb);
	},
	GetBuyReward:function(agent, msg, cb)
	{
		var app=this.app;	var db=app.mongoClient;
		msg=msg.msg;
		var day=new Date();  day=(day.getFullYear()*10000+(day.getMonth()+1)*100+day.getDate())+"";
		db.collection("members").findOne({mid:msg.byMid},function(e,by){
			if(by&&by.buyReward>0)
			{
				db.collection("members").update({mid:msg.byMid},{$inc:{ money:by.buyReward,buyReward:-by.buyReward}},
				   function()
				   {
					   by.money+=by.buyReward;
					   by.buyReward=0;
					   cb(null,by);
				   }
				);
				db.collection("memberMoney"+day).insertOne
				(
					{
						mid:msg.byMid,
						buyNum:by.buyReward,
						buyMoney:0,
						buyNote:"推荐返利",
						buyTime:new Date(),
						byMid:msg.byMid,
						byName:msg.byName
					},
					function(){}
				);
			}
			else cb(null,by);
			
		});
	}
	,getUserBuyList:function(agent, msg, cb)
	{
		var app=this.app;	var db=app.mongoClient;
		msg=msg.msg; var day=msg.day;  if(!day) day="";
		var rtn=[];
		db.collection("userMoney"+day).find({uid:msg.uid}).each(function(er,doc){
			if(doc) rtn.push(doc);
			else cb(null,rtn);
		});
	}
	,getMemberBuyList:function(agent, msg, cb)
	{
		var app=this.app;	var db=app.mongoClient;
		msg=msg.msg;var day=msg.day;  if(!day) day="";
		var rtn=[];
		db.collection("memberMoney"+day).find({mid:msg.mid?msg.mid:msg.byMid}).each(function(er,doc){
			if(doc) rtn.push(doc);
			else cb(null,rtn);
		});
	}
	,getMemberSellList:function(agent, msg, cb)
	{
		var app=this.app;	var db=app.mongoClient;
		msg=msg.msg;   var day=msg.day;    if(!day) day="";
		var rtn=[];
		db.collection("userMoney"+day).find({byMid:msg.mid?msg.mid:msg.byMid}).each(function(er,doc){
			if(doc) rtn.push(doc);
			else cb(null,rtn);
		});
	}
	,getAdminSellList:function(agent, msg, cb)
	{
		var app=this.app;	var db=app.mongoClient;
		msg=msg.msg; var day=msg.day;  if(!day) day="";
		var rtn=[];
		db.collection("memberMoney"+day).find({byMid:msg.mid?msg.mid:msg.byMid}).each(function(er,doc){
			if(doc) rtn.push(doc);
			else cb(null,rtn);
		});
	}
	,changeMemberPass:function(agent, msg, cb)
	{
		var app=this.app;	var db=app.mongoClient;msg=msg.msg;
		db.collection("members").update({mid:msg.mid},{$set:{mPass:msg.mPass}},cb);
	}
	,changeMyPass:function(agent, msg, cb)
	{
		var app=this.app;	var db=app.mongoClient;msg=msg.msg;
		db.collection("members").update({mid:msg.byMid,mPass:msg.oldPass},{$set:{mPass:msg.newPass}},cb);
	}
	,getMembersCount:function(agent, msg, cb)
	{
		var app=this.app;	var db=app.mongoClient;
		msg=msg.msg;
		db.collection("members").count(function(er,rtn){
			cb(null,rtn);
		});
	}
	,getMembers:function(agent, msg, cb)
	{
		var app=this.app;	var db=app.mongoClient;
		msg=msg.msg;
		var skip=msg.skip;    if(!skip)  skip=0;     delete msg.skip;
		var limit=msg.limit;  if(!limit) limit=10000;  delete msg.limit;
		var rtn=[];
		db.collection("members").find(msg).skip(skip).limit(limit).each(function(er,doc){
			if(doc) rtn.push(doc);
			else cb(null,rtn);
		});
	}
	,getDayLog:function(agent, msg, cb)
	{
		var app=this.app;	var db=app.mongoClient;
		if(app.mdb&&app.mdb.db) db=app.mdb.db;
		msg=msg.msg;
		var rtn=[];
        db.collection("dayLog").find(msg).each(function(er,doc){
			if(doc) rtn.push(doc);
			else cb(null,rtn);
		});
	}
	,getMyMembersCount:function(agent, msg, cb)
	{
		var app=this.app;	var db=app.mongoClient;
		msg=msg.msg;
		db.collection("members").count(msg.isManager?{byMid:msg.byMid}:{mAddByMid:msg.byMid},function(er,rtn){
			cb(null,rtn);
		});
	}
	,getMyMembers:function(agent, msg, cb)
	{
		var app=this.app;	var db=app.mongoClient;
		msg=msg.msg;
		var skip=msg.skip;    if(!skip)  skip=0;     delete msg.skip;
		var limit=msg.limit;  if(!limit) limit=10000;  delete msg.limit;
		var rtn=[];
		db.collection("members").find(msg.isManager?{byMid:msg.byMid}:{mAddByMid:msg.byMid}).skip(skip).limit(limit).each(function(er,doc){
			if(doc) rtn.push(doc);
			else cb(null,rtn);
		});
	}
	,
	addMember:function(agent, msg, cb)
	{
		var app=this.app;	var db=app.mongoClient;
		msg=msg.msg;
		if(!msg.mid)
		{
			msg.mid=Math.floor(Math.random()*899999)+100000;	
		} 
		msg._id=msg.mid;
		msg.mAddBy=msg.byName;
		msg.mAddByMid=msg.byMid;
		msg.buyTotal=0;
		msg.buyReward=0;
		msg.money=0;
		msg.mTime=new Date();
		db.collection("members").insertOne(msg,cb);
	},
	saveMember:function(agent, msg, cb)
	{
		var app=this.app;	var db=app.mongoClient;
		var msg=msg.msg; var mid=msg.mid; delete msg.mid;	delete msg.money;
		db.collection("members").update({mid:mid},{$set:msg},cb);
	},
	majiangLog:function(agent, msg, cb)
	{
		var app=this.app;	var db=app.mongoClient;
		var msg=msg.msg;
		db.collection("majiangLog").findOne({_id:msg.uid},cb);
	}
	,serverReport:function(agent, msg, cb)
	{
		 cb(null,this.report);
	}
	,onlineReport:function(agent, msg, cb)
	{
		 var rtn=[];
		 for(var sid in this.report)
		 {
			 var rpt=this.report[sid];
			 if(rpt.report&&rpt.report.online&&rpt.report.vipTable)
			 {
				 rtn.push({sid:sid,online:rpt.report.online,vipTable:rpt.report.vipTable});
			 }
		 }
		 cb(null,rtn);
	}
	,serverList:function(agent, msg, cb)
	{
			//cb(null,{run:self.app.getServers(),cfg:self.app.getServersFromConfig(),cli:[]}); 	
			var self=this;
			var cli=[];
			var dirs=[self.app.getBase()+"/../web-server/public/cfg"]; 
			for(var i=0;i<dirs.length;i++)
			{
			   
			   var lst=fs.readdirSync(dirs[i]);
			   //console.error(lst);
			   for(var j=0;j<lst.length;j++)
			   {
				   var fullpath=dirs[i]+'/'+lst[j];
				   
				   console.error(fullpath);
				   if(fs.statSync(fullpath).isFile())
				   {
					   if(fullpath.indexOf(".cfg")>0)
					   {
						  var js=fs.readFileSync(fullpath,'utf8');
						  js=JSON.parse(js);
						  js.file=fullpath;
						  cli.push(js);
					   }
				   }
				   else dirs.push(fullpath);
				}
			}
		    cb(null,{run:self.app.getServers(),cfg:self.app.getServersFromConfig(),cli:cli}); 	
	},
	addServer:function(agent, msg, cb)
	{
		 var env=this.app.getMaster().port==3005?'development':'production';
		    //exec('pomelo start -d /root/server/game-server -t '+msg.t+' -i '+msg.id,function(err,rtn){ 
			var cmd='pomelo start  -e '+env+'  -t '+msg.t+' -i '+msg.id;
			if(!self.app.getServers()[msg.id])
			 exec(cmd,function(err,rtn){ cb(err,cmd); });
			else
			 cb(null,"running");
	}
}

//handle client -> master msg
Module.prototype.clientHandler = function(agent, msg, cb) 
{  
   var self=this;
   var func=clientHandler[msg.cmd];
   if(func) func.call(this,agent, msg, cb);
   else if (msg.id)
   {
	   if(cb)  agent.request(msg.id, moduleId, msg, cb);
	   else    agent.notify(msg.id, moduleId, msg);
   }
   else
   {
	  agent.notifyAll(moduleId,msg);
   }
   
}

