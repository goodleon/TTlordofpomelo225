#!/usr/bin/python
#coding=utf8
import os,sys,re
import socket
import time
import glob
import logging
import subprocess
from logging.handlers import RotatingFileHandler
import shutil
bak_time = time.strftime("%Y%m%d_%H%M%S")
script_path = "/root/slbTools/ydx/shell/"
sys.path.append(script_path)
import base_fuc
mk = base_fuc.mkfp()
command_path = '/root/mjserver/command'
hname = socket.gethostname().lower()
project_name = hname.split('-')[0]
host_stype = hname.split("-")[1]
#------------------------------------------log---------------------------------------
log_path = '/home/logs/'
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
#---------------------------------------check_package----------------------------------------
def check_package(package, ptype):
  def install_package():
    if ptype == "yum":
      install_cmd = "yum install -y {0}".format(package)
    elif ptype == "python":
      install_cmd = "pip install {0}".format(package)
    logging.info("\tinstall {1} package {0}".format(package, ptype))
    if not os.system(install_cmd) == 0:
      print "---------------------------------------------------"
      logging.error("\tinstall {1} Package {0} fail !!!!!!".format(package, ptype))
      print "---------------------------------------------------"
      quit()
  try:
    if ptype == "yum":
      cmd = "rpm -qa|grep '{0}'".format(package)
      rc = re.compile(r'\w+-\w+')
    elif ptype == "python":
      cmd = "pip list|grep '{0}'".format(package)
      rc = re.compile(r'\w+')
    sp = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE)
    ssr = sp.stdout.read()
    target_nr = rc.match(ssr).group()
  except Exception as e:
    print e
    install_package()
  else:
    if target_nr == package:
      pass
    else:
      install_package()
#------------------------------------check percent-----------------------------------------------------
def check_process_percent(process):
  check_package("python-devel", 'yum')
  check_package("python2-pip", 'yum')
  check_package("psutil", 'python')
  import psutil
  cmd = "ps aux|grep '{0}'|grep -v 'grep'".format(process)
  get_nr = subprocess.Popen(cmd,shell=True,stdout=subprocess.PIPE)
  process_pid = int(get_nr.stdout.read().split()[1])
  p = psutil.Process(process_pid)
  process_cpu_percent = float('%.2f' % p.cpu_percent())
  process_memory_percent = float('%.2f' % p.memory_percent())
  def compare_value(value, p):
    while value > 10.0:
      print "-----------------------------------------------------"
      logging.info("\t{0} {1} percent is not restore".format(process, p))
      print "\tCurrent {0} {1} percent is {2}".format(process, p, value)
      print "-----------------------------------------------------"
      time.sleep(2)
  compare_value(process_cpu_percent, 'CPU')
  compare_value(process_memory_percent, 'Memory')
#-----------------------------------------reboot mongod-----------------------------------------------
def restart_mongo():
  restart_cmd = 'systemctl restart mongod'
  if os.system(restart_cmd) == 0:
    print "--------------------------------------------"
    logging.info("\trestart mongod success")
    print "--------------------------------------------"
  else:
    print "--------------------------------------------"
    logging.error("\trestart mongod fail !!!!!!!!")
    print "--------------------------------------------"
    quit()
  time.sleep(1)
#---------------------------------------------stop node--------------------------------------------------
def stop_node():
  os.chdir(command_path)
  stop_cmd = 'bash stop'
  if os.system(stop_cmd) == 0:
    print "--------------------------------------------"
    logging.info("\tstop node success")
    print "--------------------------------------------"
  else:
    print "--------------------------------------------"
    logging.error("\tstop node fail !!!!!!!!")
    print "--------------------------------------------"
    quit()
  time.sleep(2)
#-------------------------------------------get ip and role---------------------------------------
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
#-------------------------------------get servers.json info----------------------------------------
import json
player_login_list = ["pkplayer", "login", "pkplayerlogin", "loginpkplayer"]
template_file = "/root/mjserver/game-server/config/servers.json"
new_list = []
with open(template_file) as f:
  nr = f.read()
dict = json.loads(nr)
pkcon_list = dict[project_name]['pkcon']
pkroom_list = dict[project_name]['pkroom']
login_list = dict[project_name]['login']
pkplayer_list = dict[project_name]['pkplayer']
#--------------------------------------------------check pkcon------------------------------------
def check_150():
  get_cmd = 'netstat -anltp|grep :150|wc -l'
  pkcon_counters = int(os.popen(get_cmd).read().strip())
  while pkcon_counters > 0:
    print "-------------------------------------------------------------------"
    logging.info("\tCurrent not closed TCP number is : {0}".format(pkcon_counters))
    print "-------------------------------------------------------------------"
    pkcon_counters = int(os.popen(get_cmd).read().strip())
    time.sleep(1)
#--------------------------------------------------restart node------------------------------------
def restart_node():
  os.chdir(command_path)
  restart_cmd = "bash autoRestart"
  if os.system(restart_cmd) == 0:
    print "--------------------------------------------"
    logging.info("\trestart node success")
    print "--------------------------------------------"
  else:
    print "--------------------------------------------"
    logging.error("\trestart node fail !!!!!!!!")
    print "--------------------------------------------"
    quit()
  time.sleep(2)
#---------------------------------------------------check restart---------------------------------------------
def check_restart():
  command_path = "/root/slbTools/command"
  os.chdir(command_path)
  check_cmd = "bash check"
  os.system(check_cmd)
#-----------------------------------------------------setCPU-------------------------------------------------
def setcpu():
  os.chdir(command_path)
  setcpu_cmd = "bash setCpu"
  os.system(setcpu_cmd)
#---------------------------------------------------do---------------------------------------------
if host_stype == "data" or host_stype == "master":
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
    restart_mongo()
    check_process_percent('mongod')
    stop_node()
    check_150()
    restart_node()
    check_process_percent('mongod')
    check_restart()
  else:
    restart_mongo()
    check_process_percent('mongod')
    stop_node()
    restart_node()
    check_process_percent('mongod')
    check_restart()
elif host_stype in player_login_list:
  stop_node()
  restart_node()
  check_restart()
elif host_stype == "room":
  stop_node()
  restart_node()
  check_restart()
  setcpu()
elif host_stype == "link":
  stop_node()
  check_150()
  restart_node()
  check_restart()
  setcpu()
else:
  print "----------------------------------"
  logging.error("\t{0} is not normal server role !!!!!!!!".format(host_stype))
  print "----------------------------------"
  quit()

