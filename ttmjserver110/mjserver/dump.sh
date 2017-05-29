#!/bin/sh

#chkconfig: - 85 15
#description: my game server
DATE=$(date +%Y%m%d)
mongodump --host 10.10.10.10 -d hnmj -c cgbuser -o DATE
mongodump --host 10.10.10.10 -d hnmj -c majiang -o DATE
mongodump --host 10.10.10.10 -d hnmj -c majiangLog -o DATE
mongodump --host 10.10.10.10 -d hnmj -c userMoney -o DATE
mongodump --host 10.10.10.10 -d hnmj -c memberMoney -o DATE
mongodump --host 10.10.10.10 -d hnmj -c members -o DATE






