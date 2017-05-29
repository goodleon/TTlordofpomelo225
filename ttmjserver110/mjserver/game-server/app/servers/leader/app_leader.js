module.exports = function(pomelo,app,SessionRoute,DirectRoute) 
{
   var ServerClass = require ('./ServerClass');
   app.load (ServerClass,{});
}