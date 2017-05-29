#!/bin/bash
killall node
time=`date +%s`
mv output.log output.$time
export NODE_PATH=/usr/lib/node_modules
nohup pomelo start -e localhost > output.log &
sleep 2
nohup forever start /root/webadmin/activityWeb.js localhost &
sleep 2
nohup forever start /root/webadmin/adminWeb.js localhost.json
sleep 1
nohup forever start /root/mjserver/web-server/web.js &
