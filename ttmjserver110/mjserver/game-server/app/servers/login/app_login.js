module.exports = function(pomelo,app,SessionRoute,DirectRoute) 
{
   var LoginData = require ('../login/LoginData');
   app.load (LoginData,{});
}