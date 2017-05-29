
var fs = require('fs');

//node createFils.js ./template.json A.json

//var data = 'D:/workspace_/webadmin/tool/template.json';

var data =  require(process.argv[2]);

var myData = {};

var makeZero = function (ZeroNumber)
{
	return function (num, n)
	{
		return (0 >= (n - num.length)) ? num :
		(ZeroNumber[n - num.length] || (ZeroNumber[n - num.length] = Array(n - num.length + 1).join(0))) + num;
	}
}([]);


for(var key in data){
	var obj = {};

	for(var ke in data[key]){
		var ob = [];

		for(var i = 0; i < data[key][ke].length; i++){
			var obje = data[key][ke][i];

			for(var j = 0; j < obje.length; j++){
				var id = ke + makeZero(String(i), 2) + makeZero(String(j), 2);

				if(obje["clientPortStart"]) {
					ob.push({"restart-force":false,"auto-restart":false,"id": id, "host": obje["host"], "port": obje["portStart"]+j, "clientPort": obje["clientPortStart"]+j, "frontend": true});
				} else {
					ob.push({"restart-force":false,"auto-restart":false,"id": id, "host": obje["host"], "port": obje["portStart"]+j});
				}
			}
		}

		obj[ke] = ob;
	}

	myData[key] = obj;
}

//var outputFilename = 'D:/workspace_/webadmin/tool/myCreate.json';

var outputFilename = process.argv[3];

function create() {
	fs.writeFile(outputFilename, JSON.stringify(myData, null, 4), function (err) {
		if(err){
			console.info(err);
		}
		else{
			console.info("JSON saved to " + outputFilename);
		}
	});
}

create();