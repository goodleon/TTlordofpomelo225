var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/dbtest';

MongoClient.connect(url, function(err, db) 
{
	for(var i=0;i<100;i++)
	{
		db.collection("dbtest").insert({date:new Date()},function(er,doc){
			
			console.info(doc);
		});
	}
});
