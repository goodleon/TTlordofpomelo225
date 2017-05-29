
//		function initNotice(){
//			postJson("/admin/getNoticeJson",{},
//					function(data)
//					{
//						$("#notice").html(data["rows"][0]["content"]);
//					}
//			);
//		}
//		$(document).ready(function () {
//			initNotice();
//		});

		function changeAvatar() {
			$("#image").attr("src", "../" + getGameType(window.location.host).loginImg);
		}

		changeAvatar();

		function changeAddDiamondName() {
			$("#addDiamondName").text(getGameType(window.location.host).addDiamondName);
		}
		changeAddDiamondName();

		var startDate;

		startDate = getFormatDate(new Date());
		startDate = startDate.toString();

	  var user=null;
	  function getUserByID()
	  {
	     var uid=parseInt( $("#uid").val() );
		 if(uid>10000)
			 postJson("/admin/getUserByID",{uid:uid},
			   function(data)
			   {
				  if(data.rows.length>0)
				  {
					 user=data.rows[0];
					 if(!user) alert("用户不存在");
					 else
					 {
					     $("#info_uid").html(user.uid);
					     $("#info_nickname").html( unescape(user.nickname) );
					     $("#info_money").html(user.money);
						 $("#info_code").html(user.loginCode);
						 $("#headimgurl").attr("src", user.headimgurl); 
					 }
				  }
				  else alert("用户不存在");
			   }
			 );
		 else alert("请输入用户ID");	 
	  }
	  var uid=null;
      function addMoney()
	  {
	  //    if(!user)
		 // {
		 //     alert("输入玩家ID,点击搜索");
		 //     return;
		 // }
		 uid=user.uid;
		 $('#buyNum').val("0");
		 $('#buyMoney').val("0");
		 $('#buyType').val(1);
		 $('#buyNote').val("");
		 $('#ddMoney').dialog('open');
	  }
	  function getUserBuyList()
	  {
	  	 if(!user)
		 {
		     alert("输入玩家ID,点击搜索");
		     return;
		 }
		 if(user)
		 {
		       uid=user.uid;
			   postJson("/admin/getUserBuyList",{uid:uid, day:startDate},
				   function(data)
				   {
					   if(data.rows) data.rows.reverse();

					   for(var key in data.rows){
						   var time = data.rows[key]["buyTime"];
						   time = new Date(time);
						   //time = time.toLocaleDateString() + " " + time.toLocaleTimeString();
						   time = getDateCommonFormat(time);
						   data.rows[key]["buyTime"] = time;
					   }

					 $("#gmjl").datagrid("loadData",data);
				   }
		       );
		 }
	  }

	  function getUserMajiangLog()
	  {
		  if(!user)
		  {
			  alert("输入玩家ID,点击搜索");
			  return;
		  }
		  if(user)
		  {
			  uid=user.uid;
			  postJson("/admin/majiangLog",{uid:uid},
					  function(data)
					  {
						  if(data.rows) data.rows.reverse();
						  for(var i=0;i<data.rows.length;i++)
						  {
							  var row=data.rows[i];
							  row.detail=JSON.stringify(row.players);
							  for(var j=0;j<row.players.length;j++)
							  {
								  if(row.players[j].uid==uid)
								  {
									  row.mymoney=row.players[j].money;
									  break;
								  }
							  }

						  }

						  for(var key in data.rows){
							  var time = data.rows[key]["now"];
							  time = new Date(time);
							  time = time.toLocaleDateString() + " " + time.toLocaleTimeString();
							  data.rows[key]["now"] = time;
						  }

						  $("#mjlog").datagrid("loadData",data);
					  }
			  );
		  }
	  }
	  function addMoneyYes()
	  {
	      $('#ddMoney').dialog('close');
		  var msg=		    {  
			    uid:uid
			   ,buyNum:parseInt($('#buyNum').val())
			   ,buyMoney:parseInt($('#buyMoney').val())
			   ,buyNote:$('#buyNote').val()
			   ,buyType:$('#buyType').val()
			};
			
		  if(msg.buyNum>=0&&msg.buyMoney>=0)
	      postJson("/admin/addUserMoney",msg,function(data)
		   {
		       if(data>=0)
			   {
			       window.parent.setMoney(data);
				   setTimeout(function(){
					   $("#uid").val(uid);
					   getUserByID();
				   },2000);
                   alert("添加成功");
			   }
			   else if(data==-2)
			   {
				   alert("余额不足");
			   }
			   else if(data == -10)
			   {
				   alert('您的密码不安全，请修改密码后操作');
			   }
			   
		   }
		 );
	  }
	  function forceLogout()
	  {
	  	 // var uid=parseInt($("#uid").val());
		 if(!user)
		 {
		     alert("输入玩家ID,点击搜索");
			 return; 
		 }
		 if(user)
		 {
		 	uid=user.uid;
		 	postJson("/admin/forceLogout",{uid:user.uid},function(data){
			    alert(data);
			 });
		 }
	  }
		function onSelect(date){
			startDate = getFormatDate(date);
			startDate = startDate.toString();
		}

		function searchForUserBuyList() {
			getUserBuyList();
		}

		function histroyData() {
			startDate = "";
			getUserBuyList();
		}
	