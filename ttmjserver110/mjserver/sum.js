    var mdb=null;
 	function loadPlayer()
	{
		var loadNum=0;
		var sum=0;
	    mdb.collection(process.argv[4]).find().each(function(er,doc){
		if(doc){
		   loadNum++;
		   sum+=doc[process.argv[5]];
		}
		else
		{
			mdb.close();
			console.info(sum+" "+loadNum);
		}
	  });	
	}
	
// redis Á´½Ó
if(process.argv.length>5)
require('mongodb').MongoClient.connect("mongodb://"+process.argv[2]+":27017/"+process.argv[3],function(er,db){
    if(!db) return;
	mdb=db;
	loadPlayer();
});



	


	




	


	

