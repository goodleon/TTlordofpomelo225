#!/bin/bash
killall node
export NODE_PATH=/usr/lib/node_modules
nohup pomelo start -e localhost -t master > output.log &
nohup pomelo start -e localhost -t matcher >> output.log &
nohup pomelo start -e localhost -t pkroom >> output.log &
nohup pomelo start -e localhost -t login >> output.log &
nohup pomelo start -e localhost -t pkplayer >> output.log &
nohup pomelo start -e localhost -t pkcon >> output.log &

sleep 2
nohup forever start /root/webadmin/activityWeb.js localhost &
sleep 2
nohup forever start /root/webadmin/adminWeb.js localhost.json
sleep 1
nohup forever start /root/mjserver/web-server/web.js &
