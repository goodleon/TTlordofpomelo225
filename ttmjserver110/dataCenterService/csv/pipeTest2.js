/**
 * Created by HJF on 2016/12/27 0027.
 */


var fs = require('fs');
var util = require('util');
var stream = require('stream');
util.inherits(UpperTransform, stream.Transform);

function UpperTransform(opt){
    stream.Transform.call(this, opt);
}

UpperTransform.prototype._transform = function(chunk, encoding, callback){
    var data = new Buffer(chunk.length);
    var str = chunk.toString('utf8');

    for(var i = 0, offset=0; i < str.length; i++){
        if(/^[a-z]+$/.test(str[i])){
            offset += data.write(str[i].toUpperCase(), offset);
        }else{
            offset += data.write(str[i], offset);
        }
    }


    this.push(data);
    callback();
}

UpperTransform.prototype._flush = function(cb){
    cb();
}

var upper = new UpperTransform();
var inFile = fs.createReadStream('loginLog20161104.csv');
inFile.setEncoding('utf8');
var outFile = fs.createWriteStream('loginLog20161104Upper.csv',{defaultEncoding: 'utf8'});

inFile.pipe(upper).pipe(outFile);