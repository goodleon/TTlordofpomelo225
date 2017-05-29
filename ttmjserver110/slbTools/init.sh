#!/bin/sh
#clean system init
yum install git vim nginx -y
chmod +x /etc/rc.d/rc.local
cd /root
git clone http://git.happyplaygame.net/liuhuanqiang/slbTools.git
echo "*/1 * * * * cd /root/slbTools&&bash FileSync.sh" >> /var/spool/cron/root
systemctl restart crond
systemctl restart nginx
