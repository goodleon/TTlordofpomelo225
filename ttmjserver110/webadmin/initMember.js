 
 require('mongodb').MongoClient.connect("mongodb://"+process.argv[2]+":27017/"+process.argv[3],function(er,db){
	 if (!db) {
		 console.log("mongodb连接失败:startTalk");
		 return;
	 }

 	console.log("a----------------------mongodb连接成功");
	 db.collection("members").count(function(er,num){
		 console.log("a----------------------1 num= " + num + " er=" + JSON.stringify(er));
		 if(num==0)
		 {
			 console.log("a----------------------2");
			 db.collection("members").insertMany(
			 [
				 {
					 _id:123456,
					 mid:123456,
					 mNick:"超级管理员",
					 mName:"wcx",
					 mPhone1:"13240970101",
					 mPhone2:"13240970101",
					 mPass:"123456",
					 money:100000000,
					 adminLevel:10,
					 buyTotal:0,
					 buyReward:0
				 }
			 ]
			 ,function(){
					 console.log("a----------------------3");
				 db.collection("members").createIndex({"byMid":1},{"background":1});
				 db.collection("members").createIndex({"mAddByMid":1},{"background":1});
				 db.close();
			 })
		 }
		 else {
			 console.log("a----------------------else");
		 	db.close();
		 }
	 });
 });