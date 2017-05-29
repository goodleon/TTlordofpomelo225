#!/usr/bin/python
#coding=utf8

import os,sys,time,re
import logging
import subprocess
from logging.handlers import RotatingFileHandler
import shutil
import socket
import json

if len(sys.argv) == 2:
  project_name = sys.argv[1]
else:
  print "-------------------------------------------"
  print "Please Usage {0} project_name".format(sys.argv[0])
  print "-------------------------------------------"
  quit()

hname = socket.gethostname().lower()
host_stype = hname.split("-")[1]
host_project = hname.split("-")[0]
if not host_project == project_name:
  print "------------------------------------------------"
  print "project_name not equal hostname_project !!!!!!!!"
  print "------------------------------------------------"
  quit()

bak_time = time.strftime("%Y%m%d_%H%M%S")
script_path = "/root/slbTools/ydx/shell/"
sys.path.append(script_path)
import base_fuc
mk = base_fuc.mkfp()
log_path = '/home/logs/'
#------------------------------------------log---------------------------------------
pull_log = '{0}pull.log'.format(log_path)
mk.mkf(pull_log)
logging.basicConfig(level=logging.DEBUG,
              format='%(asctime)s %(filename)s[line:%(lineno)d] %(levelname)s %(message)s',
              filename=pull_log,
              filemode='a')
console=logging.StreamHandler()
console.setLevel(logging.DEBUG)
formatter=logging.Formatter('%(message)s')
console.setFormatter(formatter)
logging.getLogger().addHandler(console)
#--------------------------------------get ip and role---------------------------------------
import fcntl
import struct
def get_ip_address(ifname):
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    return socket.inet_ntoa(fcntl.ioctl(
        s.fileno(),
        0x8915,  # SIOCGIFADDR
        struct.pack('256s', ifname[:15])
    )[20:24])
eth_ip = get_ip_address("eth0")
#-------------------------------------get template.json info---------------------------------
template_file = "/root/mjserver/game-server/config/servers.json"
new_list = []
with open(template_file) as f:
  nr = f.read()
dict = json.loads(nr)
pkcon_list = dict[project_name]['pkcon']
pkroom_list = dict[project_name]['pkroom']
login_list = dict[project_name]['login']
pkplayer_list = dict[project_name]['pkplayer']
data_list = [88,80,800]
class get_server_info(object):
  def __init__(self, slist, stype):
    self.slist = slist
    self.stype = stype
  def check(self):
    hp_list = []
    cmd1 = "netstat -anltp"
    if self.stype == "link":
      cmd2 = "grep :150"
    elif self.stype == "room":
      cmd2 = "grep :50"
    elif self.stype == "login":
      cmd2 = "grep :20"
    elif self.stype == "pkplayer":
      cmd2 = "grep :50"
    cmd3 = "awk '{print $4}'|awk -F':' '{print $2}'|sort|uniq"
    net_cmd = "{0}|{1}|{2}".format(cmd1, cmd2, cmd3)
    current_run_port_list = os.popen(net_cmd).read().strip().split()
    for num in range(len(self.slist)):
      host_ip = self.slist[num]['host']
      if self.stype == "link":
        port = self.slist[num]['clientPort']
      else:
        port = self.slist[num]['port']
      nr = "{0}:{1}".format(host_ip, port)
      hp_list.append(nr)
    total_port = len(hp_list)
    fail_port = []
    for hp in hp_list:
      hip = hp.split(":")[0]
      hport = hp.split(":")[1]
      if eth_ip == hip or hip == "127.0.0.1":
        if not hport in current_run_port_list:
          fail_port.append(hport)
    if len(fail_port) == 0:
      logging.info("\t{0} server port total {1} is Listen, {0} start success".format(self.stype,total_port))
    else:
      su_num = total_port - len(fail_port)
      x = "\t{0} server port {1} not start !!!!!!!!".format(self.stype, ",".join(fail_port))
      logging.error(x)
      quit()
  def check_data(self):
    for port in data_list:
      net_cmd = "netstat -anltp|grep :%s|awk '{print $4}'|awk -F':' '{print $2}'|sort|uniq" % (port)
      current_run_port_list = os.popen(net_cmd).read().strip().split()
      if str(port) in current_run_port_list:
        logging.info("\t{0} server port {1} start success".format(self.stype, port))
      else:
        logging.error("\t{0} server port {1} not start !!!!!!!!".format(self.stype, port))
        quit()

player_login_list = ["pkplayer", "login", "pkplayerlogin", "loginpkplayer"]
if host_stype == "link": 
  gp = get_server_info(pkcon_list, 'link')
  gp.check()
elif host_stype == "room":
  gp = get_server_info(pkroom_list, 'room')
  gp.check()
elif host_stype in player_login_list:
  gp = get_server_info(login_list, 'login')
  gp.check()
  gp = get_server_info(pkplayer_list, 'pkplayer')
  gp.check()
elif host_stype == "data":
  linkip_list = []
  for num in range(len(pkcon_list)):
    hip = pkcon_list[num]['host']
    linkip_list.append(hip)
  linkip_list= list(set(linkip_list))
  roomip_list = []
  for num in range(len(pkroom_list)):
    hip = pkroom_list[num]['host']
    roomip_list.append(hip)
  roomip_list= list(set(roomip_list))
  loginip_list = []
  for num in range(len(login_list)):
    hip = login_list[num]['host']
    loginip_list.append(hip)
  loginip_list= list(set(loginip_list))
  pkplayerip_list = []
  for num in range(len(pkplayer_list)):
    hip = pkplayer_list[num]['host']
    pkplayerip_list.append(hip)
  pkplayerip_list= list(set(pkplayerip_list))
  if len(linkip_list) == len(roomip_list) == len(loginip_list) == len(pkplayerip_list) == 1:
    gp = get_server_info(pkcon_list, 'link')
    gp.check()
    gp = get_server_info(pkroom_list, 'room')
    gp.check()
    gp = get_server_info(login_list, 'login')
    gp.check()
    gp = get_server_info(pkplayer_list, 'pkplayer')
    gp.check()
    gp = get_server_info(data_list, 'single')
    gp.check_data()
  else:
    for num in range(len(login_list)):
      login_ip = login_list[num]['host']
    for num in range(len(pkplayer_list)):
      pkplayer_ip = pkplayer_list[num]['host']
    if eth_ip == login_ip == pkplayer_ip or login_ip == pkplayer_ip == "127.0.0.1":
      gp = get_server_info(login_list, 'login')
      gp.check()
      gp = get_server_info(pkplayer_list, 'pkplayer')
      gp.check()
      gp = get_server_info(data_list, 'much')
      gp.check_data()
    else:
      gp = get_server_info(data_list, 'much')
      gp.check_data()
