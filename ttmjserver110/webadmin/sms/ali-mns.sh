#!/usr/bin/env bash

if [ ! -f  /usr/lib/node_modules/ali-mns/index.js ];then
   npm install -g ali-mns --registry=https://registry.npm.taobao.org
fi

if [ ! -f  /root/webadmin/sms/index.js ];then
    cd /root/webadmin/&&git pull
fi

\cp -rf /root/webadmin/sms/index.js /usr/lib/node_modules/ali-mns/