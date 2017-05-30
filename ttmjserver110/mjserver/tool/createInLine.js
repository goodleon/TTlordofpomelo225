/**
 * Created by Administrator on 2016/11/2 0002.
 */

var fs = require('fs');

//node createFils.js ./template.json A.json

//var data = 'D:/workspace_/webadmin/tool/template.json';

var data = require(process.argv[2]);

//var outputFilename = 'D:/workspace_/webadmin/tool/myCreate.json';

var outputFilename = process.argv[3];


var makeZero = function(ZeroNumber) {
    return function(num, n) {
        return (0 >= (n - num.length)) ? num :
            (ZeroNumber[n - num.length] || (ZeroNumber[n - num.length] = Array(n - num.length + 1).join(0))) + num;
    }
}([]);

var line1 = '    ';
var line2 = '        ';
var line3 = line1 + line2;

//file = fs.createWriteStream(outputFilename, { flags: 'a' });

function writeSync(str) {
    fs.appendFileSync(outputFilename, str);
}



writeSync('{\n');

var k, kk, key, keys, ke, kes;

var keys = Object.keys(data);

for (k = 0; k < keys.length; k++) {
    key = keys[k];
    writeSync(line1 + '"' + key + '":{\n');

    kes = Object.keys(data[key]);
    for (kk = 0; kk < kes.length; kk++) {
        ke = kes[kk];
        writeSync(line2 + '"' + ke + '":[\n');

        for (var i = 0; i < data[key][ke].length; i++) {
            var obje = data[key][ke][i];

            for (var j = 0; j < obje.length; j++) {
                var id = ke + makeZero(String(i), 2) + makeZero(String(j), 2);
                var ob;

                if (obje["clientPortStart"]) {
                    ob = { "restart-force": false, "auto-restart": false, "id": id, "host": obje["host"], "port": obje["portStart"] + j, "clientPort": obje["clientPortStart"] + j, "frontend": true };
                } else {
                    ob = { "restart-force": false, "auto-restart": false, "id": id, "host": obje["host"], "port": obje["portStart"] + j };
                }

                if (i == data[key][ke].length - 1 && j == obje.length - 1)
                    writeSync(line3 + JSON.stringify(ob) + '\n');
                else
                    writeSync(line3 + JSON.stringify(ob) + ',\n');
            }

            if (i < data[key][ke].length - 1) writeSync('\n');
        }

        if (kk == kes.length - 1)
            writeSync(line2 + ']\n');
        else
            writeSync(line2 + '],\n');
    }

    if (k == keys.length - 1)
        writeSync(line1 + '}\n');
    else
        writeSync(line1 + '},\n');
}

writeSync('}');
//file.end();
/*
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
    */