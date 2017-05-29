 
 require('mongodb').MongoClient.connect("mongodb://"+process.argv[2]+":27017/"+process.argv[3],function(er,db)
 {
	 var nid2uids={},uid2nid={},errnid={},errnum=[0,0,0,0,0,0,0,0,0,0,0,0,0];
	 var nidNum=0,uidNum=0;
	 db.collection("cgbuser").find().each(
		 function(er,doc)
		 {
			 if(doc)
			 {
				 if(doc.unionid)
				 {
					 if(!nid2uids[doc.unionid]) nid2uids[doc.unionid]={};
					 nid2uids[doc.unionid][doc._id]=0;
					 uid2nid[doc._id]=doc.unionid;
					 nidNum++; if(nidNum%2000==0) console.info("nidNum "+nidNum);
				 }
			 }
			 else 
			 {
				 db.collection("majiang").find().each(function(eer,dc){
					 if(dc)
					 {
						 var nid=uid2nid[dc._id];
						 if(nid)
						 {
							 nid2uids[nid][dc._id]=dc.money;
							 uidNum++; if(uidNum%2000==0) console.info("uidNum "+uidNum);
						 }
					 }
					 else
					 {
						 console.info("nidNum "+nidNum+" "+"uidNum "+uidNum);
						 var errDoc=[],delID=[];
						 for(var nid in nid2uids)
						 {
							 var uid2money=nid2uids[nid];
							 var uids=Object.keys(uid2money);
							 for(var i=0;i<uids.length;i++) uids[i]=parseInt(uids[i]);
							 if(uids.length>1)
							 {
								 errnid[nid]=uid2money;
								 errnum[uids.length]++;
								 uids.sort(function(a,b){return a-b});
								 var addmoney=0;
								 for(var i=1;i<uids.length;i++)
								 {
									 delID.push(uids[i]);
									 var dmoney=uid2money[uids[i]];
									 if(dmoney>16) addmoney+=(dmoney-16);
								 }
								 errDoc.push({_id:uids[0],uids:uid2money,addmoney:addmoney});
							 }
						 }

						 var ei=0;
						 function repair()
						 {
							 if(ei<errDoc.length)
							 {
								 var d=errDoc[ei++];
								 if(ei%1000==0) console.info(""+ei);
								 var delIds=Object.keys(d.uids);
								 for(var i=0;i<delIds.length;i++) delIds[i]=parseInt(delIds[i]);
								 delIds.splice(delIds.indexOf(d._id),1);
								 db.collection("scmjErr").insert(d,function(){
									 db.collection("cgbuser").remove({_id:{ $in:delIds}},function(){
										   db.collection("majiang").remove({_id:{ $in:delIds}},function(){
												if(d.addmoney>0)
														db.collection("majiang").update({_id:d._id},{$inc:{money:d.addmoney}},function(ae){
															console.info("add "+d._id+" "+d.addmoney+" "+delIds);
															repair();
														});
												 else  repair();		
										   });
									 });											 
								 });
							 }
							 else 
							 {
								 console.info("errnum "+errnum+" delNum "+delID.length);
								 db.close();
							 }
						 }
						 repair();
					 }
				 });
			 }
		 }
	 ); 
	 
 });