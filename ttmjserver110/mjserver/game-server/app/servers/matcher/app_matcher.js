module.exports = function(pomelo,app,SessionRoute,DirectRoute) 
{
    var matcherData = require ('./matcherData');
    app.load (matcherData,{});
}