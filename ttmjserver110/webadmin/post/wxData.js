/**
 * Created by lhq on 2016/11/10 0010.
 * 微信接入的各类接口
 */

module.exports = function(admin) {
    var crypto = require('crypto');
    var fs = require('fs');
    var ghttp=require("http");
    var gqs= require('querystring');
    var tools = require('./tools')(admin);
    var mtools = require('../tools.js')();
    var wxpaykey = admin.jsonCfg.alipayKey;
    var wxpayiv = admin.jsonCfg.alipayIv;//支付密匙
    var wxargkey = admin.jsonCfg.wxargKey;//"Wxp04nrhfuZ74NMnthfiQ98ZXCe6ytAA";
    var wxargiv = admin.jsonCfg.wxargIv;//"Wxp04nrhfuZ74NMn";//往返协议密匙

    var smsCheckTimes = 5;//验证码尝试次数
    var smsTryTimes = 6;
    var smsOnceTime = 2 * 60 * 1000;//单次验证码有效期 2mins
    var smsTimeLimit = 60 * 60 * 1000;//一小时内只能验证6次，ali限制是7次

    var escapeList = /[<>()'"${}\[\]:]/;//需要屏蔽的特殊字符
    var accountBindCache={};
    var memberStatus = {};
    memberStatus.wait = 0;//等待审核
    memberStatus.pass = 1;//通过
    memberStatus.cancel = 2;//被拒绝
    memberStatus.black = 3;//黑名单

    function stringHash(str) {
        var hash = 0;
        if (str.length == 0) {
            return hash;
        }
        for (i = 0; i < str.length; i++) {
            char = str.charCodeAt(i);
            hash = ((hash<<5)-hash)+char;
            hash = hash & hash; // Convert to 32bit integer
        }
        if(hash < 0) {
            hash=-hash;
        }
        return hash;
    }

    function getLoginServer(unionId) {
        var len = admin.loginServer.length;
        var ss;
        var data = {};
        if(len < 1) {
            return false;
        }
        if(len > 1) {
            var hash = stringHash(unionId);
            ss = admin.loginServer[1 + hash % (len - 1)];
            data.host = ss.host;
            data.port = ss.port + 1000;
        } else {
            ss = admin.loginServer[0];
            var master = admin.masterCfg;
            data.host = ss.host;
            if(master.accountServer) {//注意，这里游戏需要兼容老的。。。
                data.port = master.accountServer;
            } else {
                data.port = ss.port + 1000;
            }
        }
        return data;
    }

    function encodeRecharge(args) {
        var str = encodeURI(JSON.stringify(args));
        var cipher = crypto.createCipheriv('aes-256-cbc', wxpaykey, wxpayiv);
        var crypted = cipher.update(str, 'binary', 'base64');
        crypted += cipher.final('base64');
        return crypted;
    }

    function decodeRecharge(arg) {
        arg = decodeURI(arg);
        var decipher = crypto.createDecipheriv('aes-256-cbc', wxpaykey, wxpayiv);
        var dec = decipher.update(arg, 'base64', 'binary');
        dec += decipher.final('binary');
        var args = JSON.parse(dec);
        return args;
    }

    function encodeArg(args) {
        var str = encodeURI(JSON.stringify(args));
        var cipher = crypto.createCipheriv('aes-256-cbc', wxargkey, wxargiv);
        var crypted = cipher.update(str, 'binary', 'base64');
        crypted += cipher.final('base64');
        return crypted;
    }

    function decodeArg(arg) {
        arg = decodeURI(arg);


        var decipher = crypto.createDecipheriv('aes-256-cbc', wxargkey, wxargiv);
        var dec = decipher.update(arg, 'base64', 'binary');
        dec += decipher.final('binary');
        var args = JSON.parse(dec);
        return args;
    }

    function addMember(res, type, doc, payData, byMid, byName) {
        var mData = {};

        mData.mName = doc.mName;
        mData.mAddress = doc.mAddress;
        mData.mNick = doc.mNick;
        mData.buyReward = 0;
        mData.mbindphone = doc.mbindphone;
        mData.mTime= new Date();
        mData.mprotect = 1;
        mData.gameType= doc.gameType;
        mData.openid=doc.openid;
        mData.addtype=type;
        mData.uniond=doc.uniod;
        mData.adminLevel = 0;

        if(byMid) {
            mData.mAddByMid = byMid;
            mData.mAddBy = byName;
            mData.byMid = byMid;
            mData.byName = byName;
        }

        if(payData) {
            mData.buyTotal = payData.buyMoney;
            mData.money = payData.buyNum;
        } else {
            mData.buyTotal = 0;
            mData.money = 0;
        }
        var num = "";
        for (var i = 0; i < 6; i++) {
            num += Math.floor(Math.random() * 10);
        }
        mData.mPass = admin.cryptoMemberPass(num);
        var saveCount = 5;
        function saveMember() {
            mData.mid = Math.floor(Math.random() * 899999) + 100000;
            mData._id = mData.mid;



            admin.mdb.collection('members').insertOne(mData, function(er, rtn) {

                if(er || rtn.ok == 0) {
                    saveCount--;
                    if(saveCount > 0) {
                        saveMember();
                    } else {
                        res.json({"status": 7, data:""});
                    }
                } else {
                    var result = {
                        mid: mData.mid,
                        passwd: num
                    };
                    if(type == 'shenhe') {
                        admin.opLog(0, doc.ip, 'addMemberShenhe', mData);
                      //  res.json({"status": 0, data:encodeArg(result)});
                    } else {
                        //res.json({"status": 0, data:encodeRecharge(result)});
                        admin.opLog(0, doc.ip, 'addMemberAuto', mData);
                    }
                    var result3 = {};//审核通过 添加成功会员了
                    result3['status'] = 1;
                    result3['type'] = doc.gameType;
                    result3['openid'] = mData.openid;
                    result3['phone'] = mData.mbindphone;
                    result3['nickname'] = doc.mNick;
                    result3['mid'] = mData.mid;
                    result3['pass'] = num;

                    sendweiinnotiy2user(result3);
                }
            });
        }

        saveMember();
    }
    function sendUserAccountWx(data) {
        var crypted = encodeArg(data);

        var data = {
            data: crypted,
        };//这是需要提交的数据
        var content = gqs.stringify(data);
        //加密数据
        var options = {
            hostname: 'wxpay.happyplaygame.net',
            port: 80,
            path: '/agentbindauto.php?' + content,
            method: 'GET'
        };
        //发送
       
        var req = ghttp.request(options, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
               
            });
        });
        req.on('error', function (e) {
        });
        req.end();

    }
    function sendweiinnotiy2user(data)
    {

        var crypted = encodeArg(data);
        var data = {
            data: crypted,
            };//这是需要提交的数据
        var content = gqs.stringify(data);
        //加密数据
        var options = {
            hostname: 'wxpay.happyplaygame.net',
            port: 80,
            path: '/agentnoti.php?' + content,
            method: 'GET'
        };
        //发送
        var req = ghttp.request(options, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {

            });
        });
        req.on('error', function (e) {
        });
        req.end();

    }

   //发送短信验证码
    function sendSms(phone, unionId, type, res) {
        var data = admin.smsPhoneCache[phone];
        var time = Date.now();
        if (!data) {
            data = {};
            data.count = 0;
        } else {
            //每次验证都要判断是不是超过了一个小时，超过，就重置次数
            if (time > data.limitTime) {
                data.count = 0;
            }
            if (data.count >= smsTryTimes) {
                //满6次需要等待1小时
                var times = Math.ceil((data.limitTime - time) / 60 / 1000);
                res.json({er: 4, time: data.limitTime - time, desc: "请求频繁,请" + times + "分钟后尝试"});
                return;
            }
            if (time <= data.onceTime) {
                //有效期内，不能重复请求
                var timess = Math.ceil((data.onceTime - time) / 60 / 1000);
                res.json({er: 3, time: data.onceTime - time, desc: "请求频繁,请" + timess + "分钟后尝试"});
                return;
            }
        }

        var num = "";
        //随机密码
        for (var i = 0; i < 6; i++) {
            num += Math.floor(Math.random() * 10);
        }

        admin.smsClient.execute('alibaba.aliqin.fc.sms.num.send', {
            'extend': '',
            'sms_type': 'normal',
            'sms_free_sign_name': admin.jsonCfg.sign_name,
            'sms_param': "{name:'" + num + "'}",
            'rec_num': phone,
            'sms_template_code': admin.jsonCfg.templatecode
        }, function (error, response) {

            if (error) {
                if (error.code == 15) {//如果内存丢失，这里判断次数满
                    res.json({
                        er: 4,
                        time: smsTimeLimit,
                        desc: "请求频繁,请" + Math.ceil(smsTimeLimit / 60 / 1000) + "分钟后尝试"
                    });
                } else {
                    res.json({er: 2, desc: "输入有误，请检查"});
                }
            } else if (response.result.err_code != 0) {
                res.json({er: 2, desc: "输入有误，请检查"});
            } else {
                data.code = num;
                data.count++;//请求次数，每小时清0
                data.onceTime = time + smsOnceTime;//单次有效期2分钟
                data.type = type;
                data.check = 0;//尝试次数
                data.phone = phone;
                data.unionId = unionId;

                if (data.count == 1) {//只有第一次重置
                    data.limitTime = time + smsTimeLimit;//6次后1小时的限制
                }
                //增加查询日志
                admin.opLog(phone, unionId, 'sendSms', data);
                admin.smsPhoneCache[phone] = data;//如果是新建的map，不成功不赋值
                res.json({er: 0, desc: "发送成功请稍后"});
            }
        });
    }

    function checkSms(phone, type, unionId, code) {
        var data = admin.smsPhoneCache[phone];
        var result = {};

        if(!data) {//没有这个验证码
            result['status'] = 3;
            result['desc'] = "没有这个验证码";

            return result;
        }

        data.check++;

        if(data.check > smsCheckTimes) {//超过6次验证有效期
            result['status'] = 6;
            result['desc'] = "验证码使用次数超过6次,请重新请求";

            return result;
        }

        if(data.code == '0') {//此验证码无效
            result['status'] = 7;
            result['desc'] = "验证码无效,请重新请求";

            return result;
        }

        if(data.code != code || data.type != type || data.unionId != unionId) {//验证码错误
            result['status'] = 8;
            result['desc']="验证码错误,请重新输入";

            return result;
        }

        if(Date.now() > data.onceTime) {//超过验证码有效期
            result['status'] = 9;
            result['desc'] = "验证码超过有效期,请重新请求";

            return result;
        }

        data.code = '0';//验证成功后清除验证码，防止反复使用
        return 0;
    }

    function getWxPayFile(file, filePath) {
        var json;

        if (!fs.existsSync(filePath)) {
            json = {};
            json.checkStatus = 1;
            json.agentMoney  = 300;
            json.diamond     = 600;
            json.giftDiamond = 300;

            fs.writeFileSync(filePath, JSON.stringify(json));
        } else {
            delete require.cache[require.resolve(file)];
            json = require(file);
        }

        return json;
    }
    //玩家充值配置文件


    return {
        getWxProductInfo:function (req,res) {

            var args=req.body.id;
            var jsondata=admin.getWxProductInfoDetial(args);

            if(!jsondata)
            {
                return res.json({er:1,data:""});
            }else {
                return res.json({er:0,data:jsondata});
            }

        },
        getWxUserPayJson: function (req, res) {
            var json = admin.getWxUserPayJsonCfg();
            return res.json(json);
        },
        saveWxUserPayJson:function (req,res) {
            if (!admin.checkLevel(req, [3, 10])) {
                res.end();
                return;
            }
            var member = admin.getMember(req);
            admin.opLog(member._id, admin.getClientIp(req), 'saveWxUserPayJson', req.body);

            var json = admin.getWxUserPayJsonCfg().content;
            var msg = {};

            var item = req.body.msg.content;
            json[item.id] = item.content;

            msg["content"] = json;

            admin.setWxUserPayJsonCfg(msg);

            res.json(1);

        },
        delWxUserPayJson:function (req,res) {
            if (!admin.checkLevel(req, [3, 10])) {
                res.end();
                return;
            }

            var member = admin.getMember(req);
            admin.opLog(member._id, admin.getClientIp(req), 'delWxUserPayJson', req.body);
            var rtn = [];

            var json = admin.getWxUserPayJsonCfg();

            for (var key in json.content) {
                if (key == req.body.msg) {
                    delete json.content[key];
                    break;
                }
            }
            admin.setWxUserPayJsonCfg({"type":"content","content":json.content});

            return res.json(json.content);

        },
        getwxsms:function (req, res) {


            var arg = req.body.arg;
            if(!arg  || typeof  arg != "string")
            {
                res.json({er:2, desc:"手机号码格式错误"});
                return;
            }
            var args=decodeArg(arg);
            var phones = args.tel;
            var unionId = args.unionId;
            if(!args.type )
            {
                res.json({er:2, desc:"系统错误,请联系管理员"});
                return;
            }
            if(!phones || typeof(phones) != 'number') {
                res.json({er:2, desc:"手机号码格式错误"});
                return;
            }
            if(typeof unionId != 'string' || escapeList.test(unionId)) {
                res.json({er:2, desc:"错误的微信信息"});
                return;
            }

            var type = 1;//如果后期有其他获取。。。
            /*
             * 1 申请会员请求
             */

            admin.mdb.collection("members").findOne({$or:[{mbindphone:phones}, {unionId:unionId}]}, function(er, doc) {
                if(doc) {
                    res.json({er:6,desc:"此手机号/微信号已被绑定"});
                } else {
                    admin.mdb.collection("wxagent").findOne({$or:[{_id:unionId}, {mbindphone:phones}]}, function(e, r) {
                        if(r) {
                            if(r.status == memberStatus.wait) {
                                res.json({er:7, desc:"已申请，请耐心等待审核"});
                                return;
                            } else if(r.status ==memberStatus.pass) {

                                res.json({er:8, desc:"此手机号已申请成为代理,请查看微信通知或联系客服"});
                                return;
                            } else if(r.status == memberStatus.black) {
                                res.json({er:9, desc:"您的信息有误，请联系管理员"});
                                return;
                            }
                        }
                        sendSms(phones, unionId, type, res);
                    });
                }
            });
        },doWxAgentAction:function(req,res) {

            //获取代理申请资料
            if (!admin.checkLevel(req, [ 3, 10])) {
                res.end();
                return;
            }
            if (admin.mdb)
           {
            var msg = req.body.msg;

            var type = msg.type;//
            var phone=msg.phone;
            var commit=msg.commit;
            var uid=msg.uid;
            var dataid=msg.id;

            if(typeof(type) == "undefined" || typeof(phone) == "undefined"  ||typeof(commit) == "undefined"
            || typeof(uid) == "undefined"|| typeof(dataid) == "undefined")
            {
                res.json({err: 2, desc: "参数错误"});
                return;
            }
            if (typeof(commit)!= 'string' || escapeList.test(commit) || commit.length > 150) {

                commit="";

            }
            //1：通过，2：拒绝，3：加黑名单 type
            admin.mdb.collection("wxagent").findOne({_id:dataid}, function(er, doc1) {
                if(!doc1)
                {
                    res.json({err: 2, desc: "系统内部错误"});
                    return;
                }else {
                    var datas = new Date().Format("yyyy-MM-dd hh:mm:ss");
                    //必须是待审核的状态才能修改
                    if (doc1.status == 0)
                    {   //审核人 审核时间 备注
                        var userstatus=type;
                        //更新审核资料状态
                        admin.mdb.collection("wxagent").update({_id: dataid},
                            {
                            $set: {
                                approver: uid,
                                approvTime: datas,
                                remarks: commit,
                                status:userstatus
                            }
                        }, function (er, doc) {

                            if (er || !doc) {
                                res.json({err: 2, desc: "系统内部错误"});
                            } else
                            {
                                if(type == 1)
                                {
                                    var datas = {};
                                    //审核通过自动添加会员
                                    datas.mName     =   doc1.mName;//
                                    datas.mAddress  =   doc1.mAddress;
                                    datas.ip        =   admin.getClientIp(req);
                                    datas.mNick     =   doc1.mNick;
                                    datas.gameType  =   doc1.gameType;
                                    datas.mbindphone=   doc1.mbindphone;
                                    datas.openid    =   doc1.openid;
                                    datas.uniod     =   doc1.uniod;
                                    var member = admin.getMember(req);
                                    admin.opLog(member._id, admin.getClientIp(req), 'doWxAgentActionPass', datas);

                                    var result3 = {};//审核通过

                                    result3['type'] = doc1.gameType;
                                    result3['openid'] = doc1.openid;
                                    result3['unionid'] = doc1.uniod;

                                    sendUserAccountWx(result3);
                                    //
                                    var para = req.body;
                                    addMember(res, "shenhe", datas, 0, para.byMid,para.byName);
                                    res.json({err: 0, desc: "操作成功"});
                                }else{
                                    var result3 = {};//审核通过
                                    result3['status'] = userstatus;
                                    result3['type'] = doc1.gameType;
                                    result3['openid'] = doc1.openid;
                                    result3['phone'] = doc1.mbindphone;
                                    result3['nickname'] = doc1.mNick;
                                    var member = admin.getMember(req);
                                    if(userstatus == 2)
                                    {
                                        admin.opLog(member._id, admin.getClientIp(req), 'doWxAgentActionCanel', result3);
                                    }else {
                                        admin.opLog(member._id, admin.getClientIp(req), 'doWxAgentActionRefuse', result3);
                                    }
                                    sendweiinnotiy2user(result3);
                                    res.json({err: 0, desc: "操作成功"});

                                }
                            }
                        });
                    } else {
                        //不能重复审核
                        res.json({err: 1, desc: "重复审核"});
                    }

                }
            });



        }
    },getAgentCount:function (req,res) {

            if (!admin.checkLevel(req, [ 3, 10])) {
                res.end();
                return;
            }

            var db = admin.mdb;

             if (db)
             {
                db.collection("wxagent").count(function (er, rtn) {
                    res.json(rtn);
                });
                return;
             }
    },wxagentapply:function(req, res) {
            var arg = req.body.arg;

            if(!arg) {
                res.json({er:2,desc:"内部错误,请联系管理员"});
                return;
            }
            var args=decodeArg(arg);
            var phone =Number(args.phone);
            var openid=args.openid;
            var unionId = args.unionId;
            var code = args.code;
            var result = {status:0, desc:""};

            if(!phone || typeof phone != 'number') {//没有手机号

                res.json({er:2,desc:"没有这个手机号"});
                return;
            }

            if (
                typeof args.type != 'string' || escapeList.test(args.type)
                || typeof args.address != 'string' || escapeList.test(args.address)
                || typeof args.nickname != 'string' || escapeList.test(args.nickname)
                || typeof args.wxid != 'string' || escapeList.test(args.wxid)) {

                res.json({er:2,desc:"信息错误"});
                return ;
            }
            result = checkSms(phone, 1, unionId, code);
            if(result) {
                res.json(result);
                return;
            }



            var pargam2db = {};

            pargam2db._id = unionId;
            pargam2db.mTime = new Date().Format("yyyy-MM-dd hh:mm:ss");//new Date();
            pargam2db.gameType = args.type;
            pargam2db.mAddress = args.address;
            pargam2db.mbindphone = phone;
            pargam2db.openid = openid;
            pargam2db.uniod = args.unionId;
            pargam2db.mNick = args.nickname;
            pargam2db.mName = args.wxid;
            pargam2db.status = memberStatus.wait;
            pargam2db.approver = "";
            pargam2db.approvTime = "";
            pargam2db.remarks = "";

            admin.mdb.collection("members").findOne({$or:[{mbindphone:phone}, {uniond:unionId},{openid:openid}]}, function(er, doc) {
                if(doc) {
                    //如果查询到了这个手机号  说明不对 这个手机号被绑定了  更新状态 然后判断是否在黑名单里面

                    res.json({er:2,desc:"此微信已申请会员,请更换微信号"});
                } else {
                     admin.mdb.collection("wxagent").findOne({$or:[{_id:unionId}, {mbindphone:phone}]}, function (e, r) {
                        if (r) {
                            if (r.status == memberStatus.wait) {
                                res.json({er: 7, desc: "已申请，请耐心等待审核"});
                                return;
                            } else if (r.status == memberStatus.pass) {
                                res.json({er: 8, desc: "审核已通过，请查看微信通知"});
                                return;
                            } else if (r.status == memberStatus.black) {
                                res.json({er: 9, desc: "您的信息有误，请联系管理员"});
                                return;
                            } else {
                                pargam2db.hisBy = r.byMid;
                                pargam2db.hisRemarks = r.remarks;
                            }
                        }

                        admin.mdb.collection("wxagent").save(pargam2db, function (e, r) {

                            res.json({er:0,desc:"操作成功,请等待审核"});

                        });
                    });
                }
            });
        },wxCheckUser:function(req, res) {
            var arg = req.body.arg;
            if(typeof arg != 'string') {
                res.json({er:3,desc:"用户名或密码错误"});
                return;
            }
           
            var args = decodeArg(arg);



            var mid = args.account;
            if(typeof args.account != 'number' || typeof args.password != 'string')
            {
               res.json({er:3,desc:"用户名或密码错误"});
               return;
            }
            var ip = admin.getClientIp(req);
            var dbIp = ip.split('.');
            dbIp = dbIp.join('_');
            var data = accountBindCache[dbIp];
            if(!data)
            {
                data = {};
                data.count = 0;
            }
            var time = Date.now();
            if(data.count >3)
            {
                if(data.onceTime < time)//封禁时间到了
                {
                    data = {};
                    data.count = 0;
                }else {

                    res.json({er: 3, desc: "用户名或密码错误"});
                    return;
                }
            }
            var passwd = admin.cryptoMemberPass(args.password);
            var unionId = args.unionid;
            var openid=args.openid;
            var types=args.type;



            if(!mid || typeof mid != 'number' || typeof passwd != 'string' || typeof openid != 'string' ||typeof types != 'string') {

                res.json({er:3,desc:"用户名或密码错误"});
                return;
            }

            admin.mdb.collection("members").findOne({$or:[{uniond:unionId}, {openid:openid}]}, function(er, doc) {

                if(doc && doc.addtype !="autoCharge" && doc.addtype !="shenhe") {
                    res.json({er:2,desc:"您的微信号已绑定,请更换微信号"});
                    return;
                }else {
                    admin.mdb.collection("members").findOne({_id: mid}, function (er, docm) {
                        if (!docm) {//已经绑定了
                            res.json({er: 3, desc: "用户名或密码错误"});
                            return;
                        }

                        if (docm.banTime) {
                            var now = Date.now();
                            if (docm.banTime > now) {

                                res.json({er: 3, desc: "用户名或密码错误"});
                                return;
                            }
                        } else {


                            if (docm.mPass != passwd) {

                                data.code = dbIp;
                                data.count++;//请求次数，每小时清0
                                data.onceTime = 0;//time + smsTimeLimit;//单次有效期2分钟
                                if(data.count >3)
                                {
                                    data.onceTime = time + smsTimeLimit;//单次有效期2分钟
                                }
                                accountBindCache[dbIp] = data;//如果是新建的map，不成功不赋值

                                res.json({er: 1, desc: "用户名或密码错误"});
                                return;
                            }

                            admin.mdb.collection("members").update({_id: mid}, {
                                $set: {
                                    uniond: unionId,
                                    openid: openid,
                                    gameType: types
                                }
                            }, function (e, r) {
                                data.code=0;
                                res.json({er: 0, mid: mid, pass: passwd});
                            });

                        }
                    });
                }

            });
        },doWxLogin:function(req, res) {
            var arg = req.body.u;
            if(typeof  arg  != 'string')
            {
                res.json({er:2,desc:"信息错误"});
                return;
            }

            var args =decodeArg(arg);
            var unionId = args.unionId;

            if(typeof unionId != 'string') {
                res.json({er:2,desc:"信息错误"});
                return;
            }

            var ip = admin.getClientIp(req);
            var dbIp = ip.split('.');
            dbIp = dbIp.join('_');

            admin.mdb.collection('members').findOne({uniond: unionId}, function (er, doc) {
                if(doc) {
                    if(doc.banTime) {
                        var now = Date.now();

                        if(doc.banTime > now) {
                            var days = Math.ceil((doc.banTime - now) / 86400000);
                            res.json({banDays:days});
                            return;
                        }
                    }

                    var msg = {};

                    msg.fromHtml = 1;
                    msg.mid = doc.mid;
                    doc.tempIp = dbIp;

                    doc.tempUnionId = 1;//unionId;//注意负载均衡
                    msg.doc = doc;

                    admin.doLogin(msg, res, req, false);//false from login.js doLogin, true from adminWeb.js balanceLogin
                } else {
                    res.json({er:3,desc:"信息错误"});
                }
            });
        },getAgentMembers:function (req,res) {

            //获取代理申请资料
            if (!admin.checkLevel(req, [ 3, 10])) {
                res.end();
                return;
            }

            if (admin.mdb)
            {
                var msg = req.body;
                var filter=msg.filter;//

                delete  msg.filter;
                var skip = msg.skip;
                delete msg.skip;
                var limit = msg.limit;
                delete msg.limit;

                if (!skip)  skip = 0;

                if (!limit) limit = 50;
                if(!filter)
                {
                    filter=0;
                }

                if (msg.mid) {
                    msg._id = msg.mid;
                    delete msg.mid;
                }

                var rtn = [];
                var msgfilter={};

                if(filter < 5)
                {
                    msgfilter.status=filter;
                }

                admin.mdb.collection("wxagent").find(msgfilter).skip(skip).limit(limit).each(function (er, doc) {
                    if (doc) rtn.push(doc);
                    else {
                        res.json({total: rtn.length, rows: rtn});
                    }
                });

            }

        },getWxPayJson:function (req, res) {
            var file = '../wxconfig/localhost.json';
            var filePath = __dirname + "/" + file;
            var json = getWxPayFile(file, filePath);
            res.json(json);
        },
        saveWxPayJson:function (req, res) {
            //保存微信配置
            if (!admin.checkLevel(req, [3, 10])) {
                res.end();
                return;
            }
            var member = admin.getMember(req);
            admin.opLog(member._id, admin.getClientIp(req), 'saveWxPayJson', req.body);

            var msg = req.body.msg;

            if(!msg) {
                res.end();
                return;
            }

            var json = {};

            if(typeof msg.checkstatus != 'number'
                || typeof msg.agentMoney != 'number'
                || typeof msg.diamond != 'number'
                || typeof msg.giftDiamond != 'number'
                || msg.agentMoney < 0
                || msg.diamond < 0
                || msg.giftDiamond < 0) {

                res.end();
                return;
            }

            json.checkStatus = msg.checkstatus;
            json.agentMoney = msg.agentMoney;
            json.diamond = msg.diamond;
            json.giftDiamond = msg.giftDiamond;

            var file = '../wxconfig/localhost.json';
            var filePath = __dirname + "/" + file;

            fs.writeFile(filePath, JSON.stringify(json), function(er, rtn) {

                res.json(1);
            });
        },addWXUserPay:function (req, res) {
        //sign    transaction_id   nonce_str    appid  mch_id   uid    product_id
       // console.info("addWXUserPay");


            var arg  = req.body.arg;
        var args = decodeRecharge(arg);
        var sign          = args.sign;
        var transactionid = args.transaction_id;
        var noncestr      = args.nonce_str;
        var appid         = args.appid;
        var uid           = args.uid;
        var produt_id     = args.product_id;
        var total_fee     = args.total_fee;
        var time_end      = args.time_end;
        var member = admin.getMember(req);

        mtools.wLog('transactionid', transactionid, 'transactionid');

        function callbackGrowth(para) {
                if(!admin.jsonCfg.growthHost) {
                    return
                }

                sign = tools.genGrowthSign(para, "/api/recharge/callback");
                para.sign = sign;

                admin.httpClient.get('/api/recharge/callback', para, 80, admin.jsonCfg.growthHost, function(er, rtn){
                    //忽略返回的错误
                    if(er) {
                        console.log(er, rtn)
                    }
                });
        }

        var pkserver = admin.uid2pkplayer(uid);
            console.info(pkserver);
			console.info("==transactionid=========",transactionid);

            mtools.wLog('transactionid', transactionid, 'transactionid2');
            mtools.wLog('arg', arg, 'arg');


            admin.httpClient.postJson("WxPay", {
                sign           : args.sign,
                transactionid : args.transaction_id,
                noncestr      : args.nonce_str,
                appid         : args.appid,
                uid           : args.uid,
                produtid      : args.product_id,
                price         : args.total_fee

            }, pkserver.port + 1000, pkserver.host, function (er, rtn) {
                if (!er) {
                    if (!args.total_fee || !args.time_end) {
                        res.json({"status": -1});
                        return;
                    }

		    var access_id = '';
                    if(admin.jsonCfg.growthAccessId) {
                        access_id = admin.jsonCfg.growthAccessId;
                    }

                    var para = {
                        player_id : args.uid,
                        recharge_id : args.transaction_id,
                        recharge : args.total_fee,
                        recharge_time : args.time_end,
                        access_id : access_id
                    }

                    console.info("===========>>212ttttttttt",rtn);

                    callbackGrowth(para);

                    //admin.opLog(member._id, admin.getClientIp(req), 'jbcCharge', {transactionid:transactionid, total_fee:total_fee, uid:uid, status:1,appid:appid});

                    res.json({"status": 1, data:"充值成","sss":rtn});
                    return;

                }

                res.json({"status": -1});
                //admin.opLog(member._id, admin.getClientIp(req), 'jbcCharge', {transactionid:transactionid, total_fee:total_fee, uid:uid, status:-1,appid:appid});
                return;

            });


    },doWxUserPayLog:function (req,res) {

    },
        //会员充值自动审核
        wxgetorder:function(req, res) {

            var arg = req.body.arg;
            var file = '../wxconfig/localhost.json';
            var filePath = __dirname + "/" + file;

            if(typeof arg != 'string') {
                res.json({"status": 1, data:"系统错误,请联系管理员"});
                return;
            }



            var args = decodeRecharge(arg);

            var unionId = args.unionId;

            if(typeof unionId != 'string') {
                res.json({"status": 2, data:"非法操作"});
                return;
            }

            var json = getWxPayFile(file, filePath);

            if(json.checkStatus == 0) {
                res.json({"status": 3, data:"充值通道关闭,请等待客服审核"});
                return;
            }

            admin.mdb.collection('wxagent').findOne({_id:unionId}, function(er, doc) {

                if(doc && (doc.status != memberStatus.wait)) {
                    res.json({"status": 3, data:"您已申请,请耐心等待客服审核"});
                    return;
                }
                var time = admin.getDateCommon(new Date());
                var descunionid=unionId.substr(0,5);
                var orderNumber = admin.getPayOrderNumber(descunionid);

                admin.coverOrderNumber[orderNumber] = {
                    state: 0,
                    flag: "wxgetorder",
                    mid: unionId,
                    gametype:args.type,
                    buyNum: json.diamond + json.giftDiamond,
                    buyMoney: json.agentMoney,
                    geTime: Date.now()
                };

                var result = {
                    time: time,
                    orderNumber: orderNumber,
                    buyNum:json.diamond + json.giftDiamond,
                    buyMoney:json.agentMoney
                };

                res.json({status:0, data:encodeRecharge(result)});
            });
        },
        //会员充值自动审核，回调
        wxgetorderCallback:function(req, res) {

            var ips=admin.getClientIp(req);

            var ifind=admin.jsonCfg.wxchargeip.indexOf(ips); //查找有没有对应的ips
            if(ifind < 0){
                res.json({"status": 2, data:""});
                return;
            }





            var arg = req.body.arg;

            var args = decodeRecharge(arg);

            var unionId = args.unionId;
            var orderNumber = args.order;

            if(typeof unionId != 'string' || typeof unionId != 'string') {
                res.json({"status": 2, data:""});
                return;
            }

            var data = admin.coverOrderNumber[orderNumber];

            if(!data) {
                res.json({"status": 2, data:""});
                return;
            }

            if(data.state == 1) {
                res.json({"status": 3, data:""});
                return;
            }

            if(data.flag != 'wxgetorder') {
                res.json({"status": 4, data:""});
                return;
            }

            data.state = 1;

            admin.opLog(0, admin.getClientIp(req), 'wxgetorderCallback', data);
            admin.mdb.collection('wxagent').findOne({openid:unionId}, function(er, doc) {
                if(!doc) {
                    res.json({"status": 5, data:""});
                    return;
                }

                if(doc.status != memberStatus.wait) {
                    res.json({"status": 6, data:""});
                    return;
                }

                var para = {};
                para.status = memberStatus.pass;
                para.byTime = new Date().Format("yyyy-MM-dd hh:mm:ss");
                para.byMid = 0;
                doc.ip =  admin.getClientIp(req);



                admin.mdb.collection('wxagent').update({openid:unionId}, {$set:para}, function(e, r) {


                    //通知微信绑定
                    var result3 = {};//审核通过

                    result3['type'] = doc.gameType;
                    result3['openid'] = doc.openid;
                    result3['unionid'] = doc.uniod;

                    sendUserAccountWx(result3);
                    //自动成为会员，并增加钻石
                    var day = new Date();
                    day = (day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate()) + "";
                    admin.mdb.collection("weixinMoney" + day).insertOne(
                        {
                            mid: unionId,
                            buyNum: data.buyNum,
                            buyMoney: data.buyMoney,
                            buyNote: "会员申请微信充值",
                            buyTime: new Date(),
                            byMid: "",
                            byName: ""
                        },
                        function () {
                            admin.checkWeixinMoneyDay(day);
                        }
                    );
                    addMember(res, "autoCharge",doc,data, 0,"");
                });
            });
        },
        //玩家充值
        wxUserPay:function(req, res) {

            var arg = req.body.arg;

            if(typeof arg != 'string') {
                res.json({"status": 1, data:""});
                return;
            }
            var args = decodeRecharge(arg);
           
            var unionId = args.unionId;
            var openid= args.openid;
            var payId = args.payId;// 产品id

            var jsondata=admin.getWxProductInfoDetial(payId);


            if(!jsondata)
            {
                res.json({"status": 1, data:""});
                return;
            }

            if(typeof payId != 'string') {
                res.json({"status": 2, data:""});
                return;
            }
            if(typeof unionId != 'string') {
                res.json({"status": 2, data:""});
                return;
            }

            //var json = getWxPayFile(file, filePath);
            var loginServer = getLoginServer(unionId);

            if(!loginServer) {
                res.json({"status": 2, data:""});
                return;
            }

            admin.httpClient.postJson("CheckPlayer", {unionId:unionId, type:'wx'}, loginServer.port,
                loginServer.host, function(er, doc) {

                if(er || !doc) {
                    //no this user
                    res.json({"status": 3, data:""});
                    return;
                }
                if(doc.er != 0)
                {
                    res.json({"status": 3, data:""});
                    return;
                }


                var time = admin.getDateCommon(new Date());

                var uid = doc.pl._id;
                var orderNumber = admin.getPayOrderNumber(uid);

                admin.coverOrderNumber[orderNumber] = {
                    state: 0,
                    flag: "wxUserPay",
                    unionId: openid,
                    uid: uid,
                    buyNum: jsondata.buyNum + jsondata.giveNum,
                    buyMoney: jsondata.buyMoney,
                    geTime: Date.now()
                };
                
                var result = {
                    time: time,
                    orderNumber: orderNumber,
                    uid: uid,
                    productName:jsondata.buyName,
                    buyNum:jsondata.buyNum + jsondata.giveNum,
                    buyMoney:jsondata.buyMoney
                 //   money: doc.money
                };

                res.json({status:0, data:encodeRecharge(result)});
            });
        },
        wxUserPayCallBack:function(req, res) {
            var arg = req.body.arg;

            if(typeof arg != 'string') {
                res.json({"status": 1, data:""});
                return;
            }

            var args = decodeRecharge(arg);
            var unionId = args.unionId;
            var orderNumber = args.order;

            if(typeof unionId != 'string' || typeof unionId != 'string') {
                res.json({"status": 2, data:""});
                return;
            }

            var data = admin.coverOrderNumber[orderNumber];

            if(!data) {
                res.json({"status": 2, data:""});
                return;
            }

            if(data.state == 1) {
                res.json({"status": 3, data:""});
                return;
            }

            if(data.flag != 'wxUserPay' || data.unionId != unionId) {
                res.json({"status": 4, data:""});
                return;
            }
            admin.opLog(0, admin.getClientIp(req), 'wxUserGetOrderCallBack', data);
            var uid = data.uid;
            data.state = 1;

            var byMid = orderNumber;
            var buyNum = data.buyNum;
            var buyMoney = data.buyMoney;

            if (admin.jsonCfg.useHttp) {
                var day = new Date();
                day = (day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate()) + "";

                var db = admin.mdb;
                var pkserver = admin.uid2pkplayer(uid);
                admin.httpClient.postJson("UpdatePlayer", {
                    uid: uid,
                    update: {$inc: {money: buyNum}}
                }, pkserver.port + 1000, pkserver.host, function (er, rtn) {

                    if (rtn && rtn.money > 0) {
                        var msg       = {};
                        msg.uid       = uid;
                        msg.buyNum    = buyNum;
                        msg.buyMoney  = buyMoney;
                        msg.byMid     = 0;
                        msg.buyNote   = orderNumber;//
                        msg.money     = 0;//于额
                        msg.userMoney = rtn.money;
                        msg.buyTime   = new Date();
                        db.collection("userMoney" + day).insertOne(msg, function () {

                            res.json({status:0, data:msg.userMoney});
                            admin.checkUserDay();
                        });
                    }
                });
            } else {//必须使用http充值
                res.json({"status": 5, data:""});
            }
        }
    }
}
