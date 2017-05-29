#!/usr/bin/python
#coding=utf-8
import json
import time
import time
import sys
import socket
import struct 
import fcntl
import re
import os
import smtplib
from email.mime.text import MIMEText
import string
mail_host = "smtphz.qiye.163.com"
mail_user = 'service@happyplaygame.net'
mail_pass = 'TUOl1h81Ryuc0DSQ'
mail_port = 587
mail_postfix = 'happyplaygame.net'
to_email = ['dongxingqiang@happyplaygame.net','yangdongxu@happyplaygame.net','fujiangong@happyplaygame.net','gaowei@happyplaygame.net','liuhuanqiang@happyplaygame.net']
mail_from = 'service@happyplaygame.net'

class Mail(object):
  def __init__(self,mzhuti,mnr):
    self.mzhuti=mzhuti
    self.mnr=mnr
  def send(self):
    email_user=mail_user+'@'+mail_postfix
    msg = MIMEText(self.mnr,_subtype='plain',_charset='utf-8')
    msg['From'] = mail_from
    if not isinstance(self.mzhuti,unicode):
      self.mzhuti = unicode(self.mzhuti,'utf-8')
    msg['Subject'] = self.mzhuti
    msg['To'] = ';'.join(to_email)
    try:
      server = smtplib.SMTP()
      #server.set_debuglevel(1)
      server.connect(mail_host, mail_port)
      server.starttls()
      server.login(mail_user, mail_pass)
      server.sendmail(mail_from, to_email, msg.as_string())
      server.close()
    except Exception, e:
      print str(e)
      quit()


def getip(ethname): 
    s=socket.socket(socket.AF_INET, socket.SOCK_DGRAM) 
    return socket.inet_ntoa(fcntl.ioctl(s.fileno(), 0X8915, struct.pack('256s', ethname[:15]))[20:24])

def get_proname():    
    hostname = socket.gethostname()
    return hostname
def load_json(pro,ip,mo):
    list1 = []
    with open('/root/mjserver/game-server/config/servers.json') as json_file:
        data = json.load(json_file)
        
        print type(data)
        print pro
        for module in data[pro]:
            for i in range(len(data[pro][module])):
                if data[pro][module][i]['host'] == ip:
                    print str(data[pro][module][i]['id']) + " " + str(data[pro][module][i]['host'])
                    list1.append(data[pro][module][i]['id'])
                if data[pro][module][i]['host'] == '127.0.0.1':
                    print str(data[pro][module][i]['id']) + " " + str(data[pro][module][i]['host'])
                    list1.append(data[pro][module][i]['id'])

    print type(list1)
    print list1
    list2 = ['app.js','web.js','adminWeb.js']
    if mo == "data" or mo == "master":
        #for i in list2:
            #list1.append(i)
        list1.extend(list2)
        with open('/root/mjserver/game-server/config/master.json') as json_file:
            data1 = json.load(json_file)
            print 1
            print type(data1[pro])
            if data1[pro].has_key("actServer"):
                list1.append("activityWeb.js")
    return list1
       
    #str5 = ",".join(list)
    


def check_process(list):
    list_down=[]
    for key in list:
        command = "ps aux|grep " + str(key) + "|grep -v grep|grep -v forever 2>&1 >/dev/null"
        if os.system(command) != 0:
            print str(key) + " not exist!!!"
            list_down.append(key)
        else:
            print str(key) + " exist."   
    return list_down


if __name__ == "__main__":
    pro_list = []
    pro_down = []
    pro_cpu = []
    pro_mem = []
    
    print os.system("date")

    #ip = getip('eno16777736')
    ip = getip('eth0')
    print ip

    hostname = get_proname()
    hostname = hostname.lower() 
    print hostname

    proname = re.split('-',hostname)[0]
    module_name = re.split('-',hostname)[1]
    print proname
    print module_name

    pro_list = load_json(proname,ip,module_name)
    print pro_list
    pro_down = check_process(pro_list)
    if len(pro_down) !=0:
        print "process normal."
        str_alert = " ".join(pro_down)
        str_alert = str_alert + " process down."
        ms=Mail(hostname + "进程告警", str_alert)
        ms.send()
    else:
        print "process normal."
