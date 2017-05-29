/**
 * Created by AAA on 2017/2/16.
 */
module.exports=function(admin) {
    var fs=require('fs');
    var crypto=require('crypto');
    var redis   = require('redis'),
       RDS_PORT = 6379,		//�˿ں�
       // RDS_HOST = 'cbfff72bcb1b4db9.redis.rds.aliyuncs.com',	//������IP
      RDS_HOST = admin.jsonCfg.redishost,
     //   RDS_HOST = '127.0.0.1',	//������IP
        RDS_OPTS = {};			//������

    if(!RDS_HOST) {
        return {};
    }

  //  var client  = redis.createClient('6379', 'cbfff72bcb1b4db9.redis.rds.aliyuncs.com');
   var  client = redis.createClient(RDS_PORT, RDS_HOST, RDS_OPTS);

// redis ���Ӵ���
    client.on("error", function(error) {
        console.log(error);
    });

    client.auth("jxlw921JXLW");

    client.select('0', function(error) {
        if (error) {
            console.log(error);
        } else {
            // set
            client.hget('login_6', 'ozUH9w9Llxk59Xg7cvj3gsvLU73U@weixin', function (error, res) {
                console.log(JSON.stringify([error, res]));
                // �ر�����

                client.quit();

               // client.end();

            });
        }
    });
    return {

        getJbcpzJson: function (req, res) {
            client = redis.createClient(RDS_PORT, RDS_HOST, RDS_OPTS);
            client.auth("jxlw921JXLW");
            client.on('connect', function () {

            client.lrange("SigninCfg", 0,-1,function (err, resdata) {
                if (err) {
                    console.log('Error:' + err);
                    return;
                }
               // console.dir(res);
               console.log(resdata);

                return res.json({data:resdata });

               // return res;
            });
        });
        client.on('ready', function (err) {
            console.log('ready');
        });

    },

        saveJbcDataJson: function (req, res) {
            //  console.log( req.body.msg.content.id);
            var keynum = parseInt( req.body.msg.content.id) ;
            var contents = JSON.stringify( req.body.msg.content.content);

            var  keynum  =    parseInt(keynum);
            client = redis.createClient(RDS_PORT, RDS_HOST, RDS_OPTS);
           client.auth("jxlw921JXLW");
            client.on('connect', function () {
              // �ж�key ���� �����ǵ�ǰֵ
                var counts ='';
               // client.llen('SigninCfg',function (err, resdata))

                    client.llen("SigninCfg", function (err, tCounts) {
                        if (err) {
                            console.log('Error:' + err);
                            return;
                        }
                        // console.dir(res);
                        console.log(tCounts);
                        counts = tCounts

                        if( keynum < counts){
                            //�༭
                         //   console.log(1111);
                            client.lset('SigninCfg', keynum, contents);
                        }else{
                            //���
                           // console.log(2222);
                            client.rpush('SigninCfg', contents, redis.print);

                        }
                    });
               // client.lset('SigninCfg', keynum, contents);
              ///  client.lpush('SigninCfg', contents, redis.print);
               // console.log(client.lrange("SigninCfg", 0,-1));

          });

            return res.json(contents);

},

        delJbcpzJson: function (req, res) {

            var keynum = parseInt( req.body.msg) ;

          // console.log(keynum);
           client = redis.createClient(RDS_PORT, RDS_HOST, RDS_OPTS);
           client.auth("jxlw921JXLW");

            client.on('connect', function () {

                client.lpop('SigninCfg');

            });


            client.on('ready', function (err) {
                console.log('ready');
            });

        },


        /////////////////////////////////

         getCoinRoomCfgJson: function (req, res) {
            client = redis.createClient(RDS_PORT, RDS_HOST, RDS_OPTS);
            client.auth("jxlw921JXLW");
            client.on('connect', function () {
                client.lrange("CoinRoomCfg", 0,-1,function (err, resdata) {
                    if (err) {
                        console.log('Error:' + err);
                        return;
                    }
                    // console.dir(res);
                    console.log(resdata);
                    //     console.log(11111);
                    //    res.json({data:resdata });
                    return res.json({data:resdata });
                    //  return ;
                    // return res;
                });
            });
            client.on('ready', function (err) {
                console.log('ready');
            });

        },
        saveCountervailJson: function (req, res) {

        //  console.log( req.body.msg.content.id);
        var keynum = parseInt( req.body.msg.content.id) ;
        var Countervailcontenets = JSON.stringify( req.body.msg.content.content);
        //  var contents = req.body.msg.content.content;

        var  keynum  =    parseInt(keynum);
        //console.log(Countervailcontenets);
       //console.log(keynum);

        client = redis.createClient(RDS_PORT, RDS_HOST, RDS_OPTS);
          client.auth("jxlw921JXLW");

        client.on('connect', function () {

            // �ж�key ���� �����ǵ�ǰֵ
            var counts ='';
            // client.llen('SigninCfg',function (err, resdata))

            client.llen("CoinRoomCfg", function (err, tCounts) {
                if (err) {
                    console.log('Error:' + err);
                    return;
                }
                // console.dir(res);
                console.log(tCounts);
                counts = tCounts

                if( keynum < counts){
                    //�༭
                    //   console.log(1111);
                    client.lset('CoinRoomCfg', keynum, Countervailcontenets);
                }else{
                    //���
                    // console.log(2222);
                    client.rpush('CoinRoomCfg', Countervailcontenets, redis.print);

                }
            });
            // client.lset('SigninCfg', keynum, contents);

            ///  client.lpush('SigninCfg', contents, redis.print);
            // console.log(client.lrange("SigninCfg", 0,-1));

        });

        return res.json(Countervailcontenets);

    },
        deleteCountervail: function (req, res) {

            var keynum = parseInt( req.body.msg) ;

            //  console.log(keynum);
         client = redis.createClient(RDS_PORT, RDS_HOST, RDS_OPTS);
            client.auth("jxlw921JXLW");

            client.on('connect', function () {

                client.lpop('CoinRoomCfg');

            });


            client.on('ready', function (err) {
                console.log('ready');
            });

        },

        //////////////////////////////////////////////////////////////////////////���ͱ���

        getpushMoneyJson: function (req, res) {
            client = redis.createClient(RDS_PORT, RDS_HOST, RDS_OPTS);
             client.auth("jxlw921JXLW");
            client.on('connect', function () {
                client.get("pushMoneyCfg",function (err, resdata) {
                    if (err) {
                        console.log('Error:' + err);
                        return;
                    }
                    // console.dir(res);

                    return res.json({data:resdata });

                });
            });
            client.on('ready', function (err) {
                console.log('ready');
            });

        },
        savepushMoneyJson: function (req, res) {

            var keynum = parseInt( req.body.msg.content.id) ;
            var pushMoneycontenets = JSON.stringify( req.body.msg.content.content);
            //  var contents = req.body.msg.content.content;

            var  keynum  =    parseInt(keynum);;

            client = redis.createClient(RDS_PORT, RDS_HOST, RDS_OPTS);
              client.auth("jxlw921JXLW");

            client.on('connect', function () {

                client.set('pushMoneyCfg', pushMoneycontenets, redis.print);

            });

            return res.json(pushMoneycontenets);

        },
        deletepushMoneyJson: function (req, res) {

            var keynum = parseInt( req.body.msg) ;
            //  console.log(keynum);
            client = redis.createClient(RDS_PORT, RDS_HOST, RDS_OPTS);
              client.auth("jxlw921JXLW");

            client.on('connect', function () {
                client.del('pushMoneyCfg');

            });

            client.on('ready', function (err) {
                console.log('ready');
            });
            return res.json(keynum);

        },


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


        getpresentedDataJson: function (req, res) {
           client = redis.createClient(RDS_PORT, RDS_HOST, RDS_OPTS);
            client.auth("jxlw921JXLW");
            client.on('connect', function () {
                client.get("GetCoinCount",function (err, resdata) {
                    if (err) {
                        console.log('Error:' + err);
                        return;
                    }
                    // console.dir(res);

                    return res.json({data:resdata });

                });
            });
            client.on('ready', function (err) {
                console.log('ready');
            });

        },
        savepresentedDataJson: function (req, res) {

            var keynum = parseInt( req.body.msg.content.id) ;
            var Countervailcontenets = JSON.stringify( req.body.msg.content.content);
            //  var contents = req.body.msg.content.content;

            var  keynum  =    parseInt(keynum);;

          client = redis.createClient(RDS_PORT, RDS_HOST, RDS_OPTS);
           client.auth("jxlw921JXLW");

            client.on('connect', function () {

                   client.set('GetCoinCount', Countervailcontenets, redis.print);

            });

            return res.json(Countervailcontenets);

        },
        delpresentedDataJson: function (req, res) {

            var keynum = parseInt( req.body.msg) ;
            //  console.log(keynum);
            client = redis.createClient(RDS_PORT, RDS_HOST, RDS_OPTS);
            client.auth("jxlw921JXLW");

            client.on('connect', function () {
                client.del('GetCoinCount');

            });

            client.on('ready', function (err) {
                console.log('ready');
            });
            return res.json(keynum);

        }




}

}