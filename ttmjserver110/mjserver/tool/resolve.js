//var server = require('./myCreate.json');

var server = require(process.argv[2]);

function analy() {
    for (var key in server) {
        var ids = [];
        var host = [];

        for (var ke in server[key]) {
            for (var i = 0; i < server[key][ke].length; i++) {
                var obj = server[key][ke][i];

                if (obj["id"]) {
                    ids.push({ "Project": key, "Link": ke, "id": obj["id"] });
                }

                if (obj["host"]) {
                    var temp = {};
                    temp["Project"] = key;
                    temp["Link"] = ke;
                    temp["id"] = obj["id"];
                    temp["host"] = obj["host"];
                    if (obj["port"]) {
                        temp["port"] = obj["port"];
                    }
                    if (obj["clientPort"]) {
                        temp["clientPort"] = obj["clientPort"];
                    }

                    host.push(temp);
                }
            }
        }

        for (var i = 0; i < ids.length; i++) {
            var obj = ids[i];
            for (var j = 0; j < ids.length; j++) {
                var ob = ids[j];
                if (i != j && obj["id"] == ob["id"]) {
                    console.info("Same id " + obj["Project"] + " " + obj["Link"] + " " + obj["id"]);
                }
            }
        }

        for (var i = 0; i < host.length; i++) {
            var obj = host[i];

            for (var j = 0; j < host.length; j++) {
                var ob = host[j];

                if (i != j && obj["host"] == ob["host"]) {
                    if (obj["port"] && ob["port"]) {
                        if (obj["port"] == ob["port"]) {
                            console.info("Same port " + obj["Project"] + " " + obj["Link"] + " " + obj["id"] + " " + obj["port"]);
                        }
                    }
                    if (obj["clientPort"] && ob["clientPort"]) {
                        if (obj["clientPort"] == ob["clientPort"]) {
                            console.info("Same clientPort " + obj["Project"] + " " + obj["Link"] + " " + obj["id"] + " " + obj["clientPort"]);
                        }
                    }
                    if (obj["port"] && ob["clientPort"]) {
                        if (obj["port"] == ob["clientPort"]) {
                            console.info("Same port && clientPort " + obj["Project"] + " " + obj["Link"] + " " + obj["id"] + " " + obj["port"]);
                        }
                    }
                }
            }
        }
    }
}

analy();