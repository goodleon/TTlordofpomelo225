#!/usr/bin/python
#coding=utf8
#monitor gzmjoffline.happyplaygame.net:80
import urllib
import traceback
import datetime
import os

now = datetime.datetime.now()
now = str(now) + "\n"
mail_command = 'echo gzmjoffline.happyplaygame.net访问异常。|mail -r service@happyplaygame.net -S smtp=smtps://smtp.exmail.qq.com:465  -S smtp-auth-user=service@happyplaygame.net -S smtp-auth-password=RX-R\\"j*/6pTJBo -S smtp-auth=login -S ssl-verify=ignore -S nss-config-dir=/etc/pki/nssdb/ -s 监控报警-乐玩地推管理后台 dongxingqiang@happyplaygame.net yangdongxu@happyplaygame.net xiexu@happyplaygame.net fanliping@happyplaygame.net fujiangong@happyplaygame.net liuhuanqiang@happyplaygame.net'

def alert2mail():
    print 1
    os.system(mail_command)

try:
    f = urllib.urlopen('http://gzmjoffline.happyplaygame.net/')
except:
    print 2
    file_object=open("/root/monitor/log",'a+')
    file_object.write(str(now))
 
    traceback.print_exc(file=file_object)  
    file_object.flush()  
    file_object.close()
    alert2mail()
else:
    print 3
    Rcode = f.getcode()
    if( Rcode != 200):
        print 4
        print Rcode
        file_object=open("/root/monitor/log",'a+')
        file_object.write(str(now))
        file_object.write("code=" + str(Rcode) + "\n")
        file_object.flush()
        file_object.close
        alert2mail()
    else:
        print now
        print "code=" + str(Rcode) + ",ok"

