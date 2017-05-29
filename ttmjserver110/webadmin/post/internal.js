module.exports=function(admin) {
    var tools = require("./tools.js")(admin);
    var ghttp = require('http');
    var gquerystring = require('querystring');
    var AliMNS = require("ali-mns");

    var smsCheckTimes = 5;//验证码尝试次数
    var smsTryTimes = 6;
    var smsOnceTime = 2 * 60 * 1000;//单次验证码有效期 2mins
    var smsTimeLimit = 60 * 60 * 1000;//一小时内只能验证6次，ali限制是7次
    var findPassCache = {};//找回密码的临时数据
    var accountAliMNS = null;
    var mnsAliMNS = null;

    var smsPhoneCache = {}

    function sendSms(phone, mobiletype) {   //mobiletype 国家号


    }

    return {
        sendSms: function (req, res) {
            var mobiletype = req.body.nation_code;
            var phone = req.body.phone_num;
            var sign = req.body.sign;

            if(typeof mobiletype != 'number' || typeof mobiletype != 'number' || typeof sign != 'string') {
                res.json({er: 2, errmsg:'param'});
                return;
            }

            var input = req.body;
            delete(input.sign);
            var key = "";
            if (admin.jsonCfg.internalKey) {
                key = admin.jsonCfg.internalKey;
            }

            var gen_sign = tools.genInternalSign(input, key);
            if(sign != gen_sign) {
                res.json({er: 2, errmsg:'invalid sign'});
                return;
            }

            var num = "";
            for(var i = 0; i < 6; i++) {
                num += Math.floor(Math.random() * 10);
            }

            //发送国外的号码
            if(mobiletype != undefined && mobiletype !=86) {
                //添加海外处理
                //key 	是 	API 帐号
                //secret 	是 	API 密码
                //from 	否 	部分国家支持自定义显示发送人号码，也称为SenderID，最多支持11个字符。因为不同国家的相关政策规则不同，如果需使用该参数请预先咨询您的客服人员，以确保您的发送成功率；
                //to 	是 	发送目标号码，格式为国家区号直接接手机号码，区号和手机号码均不能以0开头，如8618050006000，86为中国区号，18050006000为手机号码；
                //text 	是 	发送内容，需通过URLEncode方式进行UTF-8编码转换。如需简单测试可通过 http://www.url-encode-decode.com/ 进行文本编码转换；
                //请求示例：http://api.paasoo.com/json?key=API_KEY&secret=API_SECRET&from=PaaSoo&to=8615884401340&text=Hello+world

                //fix bug 首先检查手机号码格式的正确性
                //http://clientsms.paasoo.com/api/validnumber?key=API_KEY&secret=API_SECRET&countryCode=86&nationalNumber=1859261596
                //格式正确：true
                //格式错误：false

                var checkdata= {
                    key: admin.jsonCfg.smsWxyKey,
                    secret: admin.jsonCfg.smsWxySecret,
                    countryCode: mobiletype,
                    nationalNumber: phone
                }
                var content = gquerystring.stringify(checkdata);
                var options = {
                    hostname: 'clientsms.paasoo.com',
                    port: 80,
                    path: '/api/validnumber?' + content,
                    method: 'GET'
                };

                var req = ghttp.request(options, function (resq) {
                    resq.setEncoding('utf8');
                    resq.on('data', function (chunk) {

                        if(chunk =="false")
                        {
                            res.json({er: 10});
                            return;
                        }
                        //检查号码格式通过才进行短信发送

                        var message="";
                        if(mobiletype == 1 )
                        {
                            message="[PPgame]Verification Code:"+num;
                        }else
                        {
                            message="[PPgame]Verification Code:"+num;
                        }
                        var descode=message;
                        var data = {
                            key: admin.jsonCfg.smsWxyKey,
                            secret:admin.jsonCfg.smsWxySecret,
                            to:mobiletype+phone,
                            from:"pipigame",
                            text:descode
                        };
                        var content = gquerystring.stringify(data);
                        var options = {
                            hostname: 'api.paasoo.com',
                            port: 80,
                            path: '/json?' + content,
                            method: 'GET'
                        };
                        var req = ghttp.request(options, function (resq) {
                            resq.setEncoding('utf8');
                            resq.on('data', function (chunk) {
                                var stasd= JSON.parse(chunk);
                                //成功：{"status":"0","messageid":"4b7368321"}

                                if(Number(stasd.status) == 0) {
                                    res.json({er: 0, num:num});
                                    return;
                                }else {
                                    res.json({er: 1});
                                    return;
                                }
                            });
                        });
                        req.on('error', function (e) {
                            res.json({er: 1});
                            return;
                        });
                        req.end();
                    });
                });
                req.on('error', function (e) {
                    res.json({er: 1});
                    return;
                });
                req.end();
            }else {
                //国内的号码
                console.log("admin.jsonCfg.smsPlatform",admin.jsonCfg.smsPlatform);
                //阿里云mns
                if(admin.jsonCfg.smsPlatform == 1)
                {
                    /*
                     阿里云信息服务API官方文档: https://help.aliyun.com/document_detail/27497.html?spm=5176.2020520115.0.0.LObTZO
                     第三方SDK: https://github.com/aliyun/aliyun-mns-nodejs-sdk
                     遇到的问题：https://github.com/InCar/ali-mns/issues/24
                     npm install -g ali-mns
                     */
                    if(!accountAliMNS)
                    {
                        var aliCfg = {
                            accountId:admin.jsonCfg.aliMns.accountId,//http(s)://1950307137601974.mns.cn-hangzhou.aliyuncs.com/  阿里主题中Endpoint的ID
                            keyId: admin.jsonCfg.aliMns.keyId,//阿里消息服务所用的密钥ID
                            keySecret: admin.jsonCfg.aliMns.keySecret,//阿里消息服务所用的密钥值
                            topicName: admin.jsonCfg.aliMns.topicName,//阿里消息服务主题名称
                            setGA:admin.jsonCfg.aliMns.setGA,//Google统计分析
                        };
                        accountAliMNS = new AliMNS.Account(aliCfg.accountId, aliCfg.keyId, aliCfg.keySecret);
                        accountAliMNS.setGA(aliCfg.setGA);
                        mnsAliMNS = new AliMNS.Topic(aliCfg.topicName, accountAliMNS);
                    }
                    if(!mnsAliMNS)
                    {
                        res.json({er: 2, msg: "mnsAliMNS error"});
                        return;
                    }
                    var attrs = {
                        DirectSMS: JSON.stringify(
                            {
                                FreeSignName:admin.jsonCfg.aliMns.FreeSignName,//短信签名
                                TemplateCode:admin.jsonCfg.aliMns.TemplateCode,//短信模板
                                Type:admin.jsonCfg.aliMns.Type,//单发
                                Receiver:phone,//接收人的手机号 13416503454 17071487674 15232583691
                                SmsParams:JSON.stringify({name:num}),//短信具体参数: key为短信模板->短信内容的key
                            }
                        )
                    };

                    console.log("mnsAliMNS num,phone",num,phone);
                    mnsAliMNS.publishP("ali-mns",true,null,attrs/*,{ forever: true }*/).then(function (log) {
                        res.json({er: 0, num:num});
                        return;
                    }, function (err) {
                        res.json({er: 2, err:err});
                        return;
                    });
                }
                else
                {
                    admin.smsClient.execute('alibaba.aliqin.fc.sms.num.send', {
                        'extend': '',
                        'sms_type': 'normal',
                        'sms_free_sign_name': admin.jsonCfg.sign_name,
                        'sms_param': "{name:'" + num + "'}",
                        'rec_num': phone,
                        'sms_template_code': admin.jsonCfg.templatecode
                    }, function (error, response)
                    {

                        if (error) {
                            if (error.code == 15) {//如果内存丢失，这里判断次数满
                                res.json({er: 4, time: smsTimeLimit});
                                return;
                            } else {
                                res.json({er: 2});
                                return;
                            }
                        } else if (response.result.err_code != 0) {
                            res.json({er: 2});
                            return;
                        } else {
                            res.json({er: 0, num:num});
                            return;
                        }
                    });
                }


            }
        }
    }
}
