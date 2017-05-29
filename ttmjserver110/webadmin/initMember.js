 
 require('mongodb').MongoClient.connect("mongodb://"+process.argv[2]+":27017/"+process.argv[3],function(er,db){
	 db.collection("members").count(function(er,num){
		 
		 if(num==0)
		 {
			 db.collection("members").insertMany(
			 [
				 {
					 _id:135790,
					 mid:135790,
					 mNick:"超级管理员",
					 mName:"changhao",
					 mPhone1:"13520189350",
					 mPhone2:"13520189350",
					 mPass:"02468",
					 money:100000000,
					 adminLevel:10,
					 buyTotal:0,
					 buyReward:0
				 }
			 ]
			 ,function(){
				 db.collection("members").createIndex({"byMid":1},{"background":1});
				 db.collection("members").createIndex({"mAddByMid":1},{"background":1});
				 db.close();
			 })
		 }
		 else db.close();
	 });
 });