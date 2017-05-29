//项目 依赖 urllib
//需要npm install -g urllib
	  
/*TopClient = require( './topClient' ).TopClient;
var client = new TopClient({
     'appkey' : '23456217' ,
     'appsecret' : 'af69231fe480ecfcdcf57bda2715a0a5' ,
     'REST_URL' : 'http://gw.api.taobao.com/router/rest'
});
 //参数说明 sms_free_sign_name 短信签名
 //sms_param  name 字段为验证码
//rec_num 接收手机的号码
//sms_template_code 模板的名字  
client.execute( 'alibaba.aliqin.fc.sms.num.send' , {
     'extend' : '' ,
     'sms_type' : 'normal' ,
     'sms_free_sign_name' : '皮皮游戏代理后台' ,
     'sms_param' : "{name:'2345'}" ,
     'rec_num' : '13581800987' ,
     'sms_template_code' : "SMS_14771801"
}, function(error, response) {
     
     if (!error) console.log(response);
     else console.log(error);
});*/



/*
 ali-mns@2.6.0 /usr/lib/node_modules/ali-mns
 需要 npm install -g ali-mns
 需要 index.js覆盖ali-mns模块中的index.js

 阿里云信息服务API官方文档: https://help.aliyun.com/document_detail/27497.html?spm=5176.2020520115.0.0.LObTZO
 第三方SDK: https://github.com/aliyun/aliyun-mns-nodejs-sdk
 遇到的问题：https://github.com/InCar/ali-mns/issues/24
 */

var AliMNS = require("ali-mns");
var aliCfg = {
     accountId:"1950307137601974",//http(s)://1950307137601974.mns.cn-hangzhou.aliyuncs.com/  阿里主题中Endpoint的ID
     keyId: "LTAITrOfTarbpQvR",//阿里消息服务所用的密钥ID
     keySecret: "XFiQXps9CAVmkQXogMT2U8k1hUVgKM",//阿里消息服务所用的密钥值
     topicName: "sms.topic-cn-hangzhou",//阿里消息服务主题名称
};
var attrs = {
     DirectSMS: JSON.stringify(
         {
              FreeSignName:"皮皮游戏代理后台",//短信签名
              TemplateCode:"SMS_61665246",//短信模板
              Type:"singleContent",//单发
              Receiver:"13416503454",//接收人的手机号 13416503454 17071487674 15232583691
              SmsParams:JSON.stringify({name:"12349876"}),//短信具体参数: key为短信模板->短信内容的key
         }
     )
};
var account = new AliMNS.Account(aliCfg.accountId, aliCfg.keyId, aliCfg.keySecret);
var mns = new AliMNS.Topic(aliCfg.topicName, account);
account.setGA(false);//Google统计分析
// mns.publishP("ali-mns",true,null,attrs/*,{ forever: true }*/).then(console.log, console.error);
mns.publishP("ali-mns",true,null,attrs/*,{ forever: true }*/).then(function (log) {
     console.log("log>>>",log);
}, function (err) {
     console.log("err>>>",err);
});
/*
 返回信息
 失败：
 err>>> { Error:
 { '$': { xmlns: 'http://mns.aliyuncs.com/doc/v1' },
 Code: 'InvalidArgument',
 Message: 'The XML you provided did not validate against our published schema, cause by "DirectSMS" Element.',
 RequestId: '58FDC3B5DC7CEB0E6AEDAC91',
 HostId: 'http://1950307137601974.mns.cn-hangzhou.aliyuncs.com' } }

 err>>> { Error:
 { '$': { xmlns: 'http://mns.aliyuncs.com/doc/v1' },
 Code: 'InvalidDigest',
 Message: 'The Content-MD5 you specified is invalid.',
 RequestId: '58FDC410048A931938F4F7DF',
 HostId: 'http://1950307137601974.mns.cn-hangzhou.aliyuncs.com' } }

 成功：
 log>>> { Message:
 { '$': { xmlns: 'http://mns.aliyuncs.com/doc/v1' },
 MessageBodyMD5: 'D5186D525C2B5CB6C5F243AEED92CB4C',
 MessageId: '73278F8A599A4BB0-1-15B9F464FEE-200000032' } }
 */