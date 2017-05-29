


var domain = require('domain').create();
domain.on('error', function(err) 
{
   var fs= require('fs'); 
   var serverid=""; if(domain.pomeloApp) serverid=domain.pomeloApp.serverId;
   fs.appendFileSync('uncaught/'+serverid+"_"+(new Date().Format("yyyy_MM_dd"))+".txt",'\ndomain '+err.stack);
 // Our handler should deal with the error in an appropriate way
});
domain.run(function() 
{

Date.prototype.Format = function (fmt) { //author: meizz 
    var o = {
        "M+": this.getMonth() + 1, //�·� 
        "d+": this.getDate(), //�� 
        "h+": this.getHours(), //Сʱ 
        "m+": this.getMinutes(), //�� 
        "s+": this.getSeconds(), //�� 
        "q+": Math.floor((this.getMonth() + 3) / 3), //���� 
        "S": this.getMilliseconds() //���� 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

Object.defineProperty(global, '__stack', {
  get: function(){
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function(_, stack){ return stack; };
    var err = new Error;
    Error.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
  }
});

Object.defineProperty(global, '__line', {
  get: function(){
    return __stack[2].getLineNumber();
  }
});

var pomelo = require('pomelo');
var app = pomelo.createApp();domain.pomeloApp=app;
var fs= require('fs');

/**
 * Init app for client.
 */
 
 
 
 	var os = require('os');
	var publicIp=null;
	app.getPublicIp=function()
	{
		if(!publicIp)
		{
			var ifaces = os.networkInterfaces();
			for(var iname in ifaces)
			{
				var net=ifaces[iname];
				for(var i=0;i<net.length;i++)
				{
					var ni=net[i];
					if(net[i].family=="IPv4")
					{
						var ip=net[i].address;
						if (ip.indexOf('127.') == 0 ||ip.indexOf('10.') == 0 ||    ip.indexOf('172.') == 0 ||   ip.indexOf('192.') == 0) 
						{
							
						}
						else
						{
							publicIp=ip;
							break;
						}
					}
				}
				if(publicIp) break;
			}
		}
		if(publicIp==null) publicIp="192.168.1.113";
		return publicIp;
	}
 
 
 
 
 

app.set('name', 'server');

app.httpClient = require("./app/admin/httpClient")(null);

//道具配置
app.item = require("./config/item.json");

app.CopyPtys=function(from,to,ptys)
{ 
    if(!to) to={};
	if(!ptys) ptys=Object.keys(from);
	else if(!Array.isArray(ptys))  ptys=ptys.split(',');
    for (var i = 0; i < ptys.length; i++)  to[ptys[i]] = from[ptys[i]];
    return to;
}
app.DeapClone=function(from)
{ 
    return JSON.parse(JSON.stringify(from));
}
app.regEx={
 mail:/^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,3}){1,2})$/,
 uid:/\d+/
}

app.stringHash=function(str)
{
	 var hash = 0;
	 if (str.length == 0) return hash;
	 for (i = 0; i < str.length; i++) {
	 char = str.charCodeAt(i);
	 hash = ((hash<<5)-hash)+char;
	 hash = hash & hash; // Convert to 32bit integer
	}
	if(hash<0) hash=-hash;
	return hash;
}


var cfgServers={};
app.GetServerBuyUid=function(sType,uid)
{
   var dataServers=app.GetCfgServers(sType);
   return dataServers[uid%dataServers.length];
}
app.GetCfgServers=function(sType)
{
   var dataServers=cfgServers[sType];
   if(!dataServers)
   {
      cfgServers[sType]=dataServers=[];
      var allServers=app.getServersFromConfig();
	  for(var svrid in allServers)
	  {
	     var sinfo=allServers[svrid];
		 if(sinfo.serverType==sType) dataServers.push(sinfo);
	  }
	  dataServers.sort(function(a,b){  return (a.id<b.id)?-1:((a.id>b.id)?1:0) });
   }
   return dataServers;
}


app.UpdatePlayer=function(appEnd,uid,batch)
{
	var server=app.GetServerBuyUid("pkplayer",uid);
	if(server)
	{
		app.httpClient.postJson("UpdatePlayer",{uid:uid,update:batch},server.port+1000,server.host,function() {});
		/*serverId=serverId.id;
		if(serverId==app.serverId)
		{
			app.pkplayer.UpdatePlayer(appEnd,uid,batch,function(){})
		}
		else
		{
			app.rpc.pkplayer.Rpc.UpdatePlayer(serverId,appEnd,uid,batch,function(){})
		}*/
	}
}

				 
				 

app.configure(  //'production|development',
 function() 
{
    sType=app.getServerType();

	function DirectRoute(serverid,msg, app, cb){cb(null,serverid);}
	function RandRoute(sType,session)
	{ 
	          var authId= session.get(sType);
			  if(!authId) 
			  {
			     authId=app.get(sType+"Id");
				 if(!authId)
				 {
				    var auths=app.getServersByType(sType);
					authId=auths[ (Math.floor(Math.random()*1000))%auths.length ].id;
				 }
			  }	
			  return authId;		
	}
	function SessionRoute(sType)
	{ 
	   return function(session, msg, app, cb)
	   {
	          var serverid= session.get(sType);
			  if(!serverid&&app.serverType=="pkcon"&&msg.method=="forwardMessage"&&msg.args[0].route=="pkroom.handler.httpJoinGame")
			  {
					var body=msg.args[0].body;
					session.bind(body.para.uid);
					msg.args[0].uid=body.para.uid;
					session.set(sType,body.para.createPara.pkroom);
					serverid= session.get(sType);
					session.push(sType,function(){
					  cb(null,serverid);
					});
					return;
			  }
			  cb(null,serverid);
		}
	}
	if(sType!='master')
	  require ('./app/servers/'+sType+'/app_'+sType)(pomelo,app,SessionRoute,DirectRoute);

	
	    var mysql = require('mysql');
		var pool  = mysql.createPool({
		  connectionLimit : sType=='auth'?100:1,
		  host            : 'localhost',
		  user            : 'zjh',
		  password        : '',
		  multipleStatements:true,
		  database        : app.getCurServer().env=="production"?'auth':'dev'
		});
		 var queryFunc=pool.query;
		 function sqlReturnLog(line,func)
		 {
		    return function(er,ret)
			{
			    if(er)
				{
				   if(!sqlerr[line]) sqlerr[line]=0;
				   sqlerr[line]+=1000000;
				   if( Math.floor( sqlerr[line]/1000000)==1 )
				   {
				      app.syserr("sql",er+" # "+sqlsql[line].sql);
				   }
				}
				else
				{
				   if(!sqlok[line]) sqlok[line]=0;
				   sqlok[line]++;
				}
			    if(func) func(er,ret);
			}
		 }
		app.dbclient=
		{

			 query:function()
			 {
			    var line=__line;
				
				if(!sqlinfo[line]) sqlinfo[line]=0;
				
				sqlinfo[line]++;
				
				var args=arguments;
				  if(typeof(arguments[arguments.length-1])=='function')
				  arguments[arguments.length-1]=sqlReturnLog(line,arguments[arguments.length-1]);
				  else
                  { args=[];
                    for(var i=0;i<arguments.length;i++) args.push(arguments[i]);
					args.push(sqlReturnLog(line));
				  }
				
				var rtn=queryFunc.apply(pool,args);
			    sqlsql[line]=rtn;
				return rtn;
			 
			 }
		}
		
	var _trace={};
    app.utrace=function(uid,t)
	{
	  //app.syserr(uid,t); return;
	  var ts=_trace[uid];
	  if(t)
	  {
		   
		   if(!ts) _trace[uid]=ts=[];
		   ts.push(t);
		   if(ts.length>40) ts.splice(0,5);
	  }
	  else 
	  {  if(!ts) return '';
	     return ts.join('\n');
	  }
	}	
    
	

	
	app.set('proxyConfig',{'retryTimes':0});
		

	app.rpcFilter (
	
	{
	   before:function(tgt,msg,opt,next)
	   {
	     //console.error('before',tgt,JSON.stringify(msg));
		 var route;
		 if(msg.service=='msgRemote') {route=msg.args[0].route; route=route.substr(route.lastIndexOf('.')); }
		 else if(msg.service=='Rpc')    route=msg.method;
		 else if(msg.service=='channelRemote') route='_'+msg.args[0];
	     if(route){ if(!sqlinfo[route])sqlinfo[route]=0; sqlinfo[route]++;  }
		 next(tgt,msg,opt);
	   },
	   after:function(tgt,msg,opt,next)
	   {
	     //console.error('after',tgt,JSON.stringify(msg));
		 var route;
		 if(msg.service=='msgRemote') {route=msg.args[0].route; route=route.substr(route.lastIndexOf('.')); }
		 else if(msg.service=='Rpc') route=msg.method;
		 else if(msg.service=='channelRemote') route='_'+msg.args[0];
		 
	     if(route){ if(!sqlok[route])sqlok[route]=0; sqlok[route]++;  }
	     //for(var i=0;i<arguments.length;i++)	     console.error("rpc after "+arguments[i]+" "+ typeof(arguments[i]));
		 
		 
		 next(tgt,msg,opt);
	   }
	}
	
	
	);
	
	

	app.filter
	(
		   {
			   before:function(msg, session, next)
			   {
			      //console.error(app.serverId+" before "+JSON.stringify(msg));
				  next();
			   },
			   after:function(err, msg, session, resp, next)
			   {
			      //console.error(app.serverId+" after "+msg.__route__+" "+JSON.stringify(resp));
				  
				  
				  next();
			   }
		   }
	);
	
	
	
	
	
	var sqlinfo={ };
	var sqlok={ };
	var sqlerr={ };
	var sqlsql={ };
	
	

	app.sqlinfo=sqlinfo;
	app.sqlok=sqlok;
	app.sqlerr=sqlerr;
	
	app.registerAdmin(require('./app/admin/zjhAdmin'), {app: app} );
	
	
	app.FileWork=function(works,file,line)
	{
	    function appendfile(wh)
	    {   
			var workLen=works.length;
			var lines={}; //batch merge
			for(var i=0;i<workLen;i+=2)
			{
			   var fname=works[i];
		       var line=lines[fname];
		       if(!line) lines[fname]=line=[];
			   line.push(JSON.stringify(works[i+1]),'\n');
			}
			var files=Object.keys(lines);
			var f=0;
			function doAppend(ww)
			{
				if(f<files.length) 
				{
					fs.appendFile(files[f],lines[files[f]].join(''),function(){doAppend(2) });
					f++;
				}
				else
				{
					works.splice(0,workLen);
					if(works.length>0) appendfile(2);
				}
			}
			if(files.length>0) doAppend(1);
	    }
		works.push(file,line);
		if(works.length==2)	appendfile(1);
	},
	
	app.SqlWork=function(works,sql,para)
	{
		function doSql()
	    {
			var workLen=works.length;
			var batchSql='';var batchPara=[];
			for(var i=0;i<workLen;i+=2)
			{
				batchSql+=works[i]+";"
				var p=works[i+1];
				for(var j=0;j<p.length;j++) batchPara.push(p[j]);
				app.dbclient.query( batchSql,batchPara,function(){
				
                   works.splice(0,workLen);
                   if(works.length>0) doSql();			   
				});
			}
		}
		works.push(sql,para);
		if(works.length==2)	doSql();
	}
	
	app.SeqWork=function(works,next,func)
	{
		var work={func:func,next:next};
		works.push(work);
		function trigerWork()
		{
			var wk0=works[0];
			var nextWrap=function()
			{
				if(arguments.length>0)
				{
					wk0.next.apply(null,arguments);
					works.splice(0,1);
				}
				else console.error("re run SeqWork");
				if(works.length>0) trigerWork();
			}
			wk0.func(nextWrap);
		}
		if(works.length==1)	trigerWork();
	}
	
	
	//
	var isWin = /^win/.test(process.platform);
	if(!isWin)app.enable('systemMonitor');
});

//var serverInfo=app.getCurServer();if(!serverInfo.env)serverInfo.env=serverInfo.id;
//http://mongodb.github.io/node-mongodb-native/contents.html
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://'+app.getMaster().host+':27017/'+app.getMaster().id;
if(app.getMaster().mdbUrl) url=app.getMaster().mdbUrl;
//if(app.serverType=="pkcon"||app.serverType=="pkroom"){url+="PlayLog";}

if(app.serverType!="pkcon")
MongoClient.connect(url,{ server: { poolSize: 3 , auto_reconnect:true }}, function(err, db) 
{
  if(!err) console.log(app.serverId+" Connected correctly to server.");
  app.mdb=
  {
	  db:db,
	  insert:function(table,doc,cb)
	  {
		  db.collection(table).insertOne(doc,function(er,ret){
			  cb(er,ret);
		  });
	  },
	  find:function(table,filter,cb){
		  var cursor =db.collection(table).find(filter);
		  cursor.each(function(err, doc){
			  cb(err,doc);
		  });
	  },
	  findOne:function(table,filter,cb)
	  {
		  db.collection(table).findOne(filter,{},cb);
	  },
	  findOrCreate:function(table,filter,cDoc,update,cb)
	  {
			//var cursor =
			db.collection(table).findAndModify(
				   filter
				  ,null //sort
				  ,{$setOnInsert: cDoc}
				  ,{
				     new: true
				    ,upsert: true
					,update:update		  
				  }
				,
			  function(err, doc)
			  {
				  //console.info(JSON.stringify(["findOrCreate",err,doc]));
				  if(!err)  cb(err,doc.value);
				  else console.info(err);
			  }		
			);
	  },
	  
	  update:function(table,where,set,op)
	  {
		  var up={}; up[op]=set;
		   db.collection(table).update(where,up,function(er,doc){
			   if(er!=null) console.error("update "+er);
		   });
	  },
	  upMemObj:function(pl,val,op)
	  {
		 for(var pty in val)
		 {
			 //pl._dirty[pty]=val[pty];
			 var ptyVal=val[pty];
			 pty=pty.split('.');
			 var obj=pl;
			 for(var i=0;i<pty.length;i++)
			 {
				 if(i<pty.length-1) 
				 {
					var nextObj=obj[pty[i]];
					if(!nextObj) obj[pty[i]]=nextObj={};					
					obj=nextObj;
				 }
				 else 
				 {
					 
					 if(op=='$set')  obj[pty[i]]=ptyVal;
					 else if(op=='$inc')
					 {
						 var oldVal=obj[pty[i]];
						 if(!oldVal) oldVal=0;
						 oldVal+=ptyVal;
						 obj[pty[i]]=oldVal;
					 }
					 else if(op=='$unset')  delete obj[pty[i]];
                     else if(op=='$push')   obj[pty[i]].push(obj[pty[i]]);
					 else delete obj[pty[i]];
				 }	 
			 }
		 }
	  },
	  remove:function(){
		  
	  },
	  max:function(table,fd,minVal,cb)
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
  }
  if(app.mongodbReady) app.mongodbReady();
  
});

// start app
app.start(function(){

   console.error("start finish "+app.serverId);
   var rpcErr=[];
   app.syserr=function(tag,err){ app.FileWork(rpcErr,"uncaught/"+tag+app.serverId+".txt",err);  }
   
   if(app.serverType!='master')
   {
	   app.components.__proxy__.client._station.on('error',
	   function(code, tracer, serverId, msg, opts, cb)
	   {
		    app.FileWork(rpcErr,"uncaught/rpcErr_"+app.serverId+".txt",code+' '+serverId+" "+JSON.stringify(msg))
	   });
   }
   else
   {
   }
});

process.on('uncaughtException', function (err) { 
fs.appendFileSync('uncaught/'+app.serverId+"_"+(new Date().Format("yyyy_MM_dd"))+".txt",'\nuncaught '+err.stack);

});





});




