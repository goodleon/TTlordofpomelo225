    var mdb=null;
    var badTotal=0;
	function loadPlayer(skp,lmt)
	{
		var loadNum=0,loadNum2=0;var badNum=0;
	    mdb.collection("cgbuser").find().skip(skp).limit(lmt).each(function(er,doc){
		if(doc){
			loadNum++;
			if(doc.email&&doc.openid&&doc.unionid)
			{
				loadNum2++;
				if(doc.email!=doc.unionid+"@weixin")
				{
					doc.email=doc.unionid+"@weixin";
					badNum++;badTotal++;
					mdb.collection("cgbuser").update({_id:doc._id},{$set:{email:doc.email}});
				}
			}
		}
		else
		{
			console.info(skp+" loadNum "+loadNum+" "+loadNum2+" "+badNum+" "+badTotal);
			if(loadNum>=lmt)
			{
				setTimeout(function(){ loadPlayer(skp+lmt,lmt); }, Math.floor(2000*Math.random() ) );
			}
			else mdb.close();
		}
	  });	
	}
	
// redis Á´½Ó
require('mongodb').MongoClient.connect("mongodb://"+process.argv[2]+":27017/"+process.argv[3],function(er,db){
    if(!db) return;
	mdb=db;
	loadPlayer(0,2000);
});



	


	




	


	

