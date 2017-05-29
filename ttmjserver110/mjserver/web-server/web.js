var express = require('express');
var bodyParser = require('body-parser');
var fs=require('fs');
var app = express();
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.post('/clienterror', function(req, res) 
{
    if(req.body&&req.body.appid&&req.body.tag)
	{
	   var date=new Date();
	   var m=date.getMonth()+1; m=(m<10?'0':'')+m;
	   var d=date.getDate();    d=(d<10?'0':'')+d;
	   fs.appendFile('clienterror/'+date.getFullYear()+'_'+m+'_'+d+'_err.txt',JSON.stringify(req.body)+'\n');
	}
	res.send('');
	
});
app.use(express.static(__dirname + '/public'));
app.listen(800);