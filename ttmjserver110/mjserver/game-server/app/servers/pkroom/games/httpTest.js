var client = require("./httpClient")();

/*
client.postJson("UpdatePlayer",{uid:100003,update:{$inc:{money:9}}},6031,"localhost",function(er,rtn){
	console.info(er+" "+rtn);
})*/

function ReloadCode(port, ip) {
    client.postJson("ReloadCode", {}, port, ip, function(er, rtn) {
        console.info(JSON.stringify([port, er, rtn]));
    })
}

//修改host与port加载pkplayer
//for(var i=6030;i<=6059;i++) ReloadCode(i,"120.76.221.73")


//修改roomList加载房间代码
/*
var roomList = ['120.0.0.1'];

for(var i = 0; i < roomList.length; i++) {
	for(var k = 6040; k <= 6069; k++) {
		ReloadCode(k, roomList[i]);
	}
}
*/
/*client.postJson("coinKey",{},6030,"localhost",function(er,rtn){
	console.info(JSON.stringify([er,rtn]));
})*/