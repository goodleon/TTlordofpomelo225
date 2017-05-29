#!/usr/bin/python
#coding=utf8
import os,sys,time,re
import logging
import subprocess
from logging.handlers import RotatingFileHandler
import shutil
import socket
import json

def red(info):
  return "\033[1;31;40m{0}\033[0m".format(info)
def green(info):
  return "\033[1;32;40m{0}\033[0m".format(info)

script_out = 'restart/stop/setcpu/status/check150/checkmongo/check/log/data/web/admin/activity/login/pkplayer/room/link'
def script_do():
  print green("""
python {0} restart    "restart all node server"
python {0} stop       "stop all node server"
python {0} setcpu     "binding room and link pid on per cpu processor"
python {0} status     "get link server login user count"
python {0} check      "check server process and port"
python {0} log        "check server log"
python {0} check150   "when restart link server check TCP 150 port count"
python {0} checkmongo "when restart mongod server check mongo cpu and mem percent"
python {0} data       "restart data"
python {0} web        "restart web"
python {0} admin      "restart web"
python {0} activity   "restart activity"
python {0} login      "restart login"
python {0} pkplayer   "restart pkplayer"
python {0} room       "restart room"
python {0} link       "restart link"
""".format(sys.argv[0]))

#  print "Please Usage {0} {1}".format(sys.argv[0], script_out)
hname = socket.gethostname().lower()
host_stype = hname.split("-")[1]
host_project = hname.split("-")[0]
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
#-------------------------------------restart data-------------------------------------------
export_cmd = 'export NODE_PATH=/usr/lib/node_modules'
def c_profile():
  profile_file = "/etc/profile"
  with open(profile_file) as f:
    nr = f.readlines()
    if not export_cmd in "".join(nr):
      with open(profile_file, 'ab') as f:
        f.write(export_cmd + "\n")
c_profile()
class Mine_node(object):
  def __init__(self, role):
    self.mj_path = '/root/mjserver'
    self.role = role
    self.mj_web_path = "/root/mjserver/web-server"
    self.webadmin_path = "/root/webadmin"
    self.monitor_file = "/usr/lib/node_modules/forever/bin/monitor"
    if self.role == "data":
      self.start_cmd = "pomelo start -e {0} -D -t master".format(host_project)
      self.target_path = '{0}/game-server'.format(self.mj_path)
      self.check_bd = "{0}/app.js env={1}".format(self.target_path, host_project)
    elif self.role == "all":
      self.start_cmd = "pomelo start -e {0} -D".format(host_project)
      self.target_path = '{0}/game-server'.format(self.mj_path)
    elif self.role == "web":
      self.start_cmd = "forever start web.js"
      self.target_path = '{0}/web-server'.format(self.mj_path)
      self.check_bd = "{0}/web.js".format(self.mj_web_path)
      self.check_monitor_bd = "{0} web.js".format(self.monitor_file)
    elif self.role == "admin":
      self.start_cmd = "forever start adminWeb.js {0}.json".format(host_project)
      self.target_path = self.webadmin_path
      self.check_bd = "{0}/adminWeb.js {1}.json".format(self.target_path, host_project)
      self.check_monitor_bd = "{0} adminWeb.js".format(self.monitor_file)
    elif self.role == "activity":
      self.start_cmd = "forever start activityWeb.js {0}".format(host_project)
      self.target_path = self.webadmin_path
      self.check_bd = "{0}/activityWeb.js {1}".format(self.target_path, host_project)
      self.check_monitor_bd = "{0} activityWeb.js".format(self.monitor_file)
    elif self.role == "login":
      self.start_cmd = "pomelo start -e {0} -D -t login".format(host_project)
      self.target_path = '{0}/game-server'.format(self.mj_path)
      self.check_bd = "serverType=login"
    elif self.role == "pkplayer":
      self.start_cmd = "pomelo start -e {0} -D -t pkplayer".format(host_project)
      self.target_path = '{0}/game-server'.format(self.mj_path)
      self.check_bd = "serverType=pkplayer"
    elif self.role == "room":
      self.start_cmd = "pomelo start -e {0} -D -t pkroom".format(host_project)
      self.target_path = '{0}/game-server'.format(self.mj_path)
      self.check_bd = "serverType=pkroom"
    elif self.role == "link":
      self.start_cmd = "pomelo start -e {0} -D -t pkcon".format(host_project)
      self.target_path = '{0}/game-server'.format(self.mj_path)
      self.check_bd = "serverType=pkcon"
#--------------------------------start------------------------------------
  def start(self):
    try:
      os.chdir(self.target_path)
      sp = subprocess.Popen(self.start_cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
      if sp.stderr.read():
        print sp.stderr.read()
    except Exception as e:
      print "----------------------------------------------------"
      logging.error(red("\tstart {0} fail !!!!!!!!".format(self.role)))
      logging.error(e)
      print "----------------------------------------------------"
      quit()
    else:
      print "----------------------------------------------------"
      logging.info(green("\tstart {0} success".format(self.role)))
      print "----------------------------------------------------"
    time.sleep(1)
  def check_process(self):
    cmd = os.popen("ps -eo 'cmd'|grep -v grep|grep '{0}'".format(self.check_bd)).read().strip()
    cmd_list = cmd.split("\n")
    def do(bd, start_type):
      bd_str = ",".join(cmd_list)
      if bd in bd_str:
        logging.info(green("\t{0} server {1} process count {2} is ok".format(host_stype, start_type, len(cmd_list))))
      else:
        logging.error(red("\t{0} server {1} process count {2} is fail !!!!!!!!".format(host_stype, start_type, len(cmd_list))))
        quit()
    try:
      self.check_monitor_bd
    except Exception as e:
      do(self.check_bd, self.role)
    else:
      do(self.check_bd, self.role)
      cmd = os.popen("ps -eo 'cmd'|grep -v grep|grep '{0}'".format(self.check_monitor_bd)).read().strip()
      cmd_list = cmd.split("\n")
      do(self.check_monitor_bd, "{0} monitor".format(self.role))
  def check_port(self):
    def check_web_admin():
      if self.role == "web":
        nlist = web_list
      elif self.role == "admin":
        if hname == 'scmj-master':
          nlist = ['80', '89']
        else:
          nlist = admin_list
      try:
        nlist
      except Exception as e:
        pass
      else:
        for port in nlist:
          net_cmd = "netstat -anltp|grep :%s|awk '{print $4}'|awk -F':' '{print $2}'|sort|uniq" % (port)
          current_run_port_list = os.popen(net_cmd).read().strip().split()
          if str(port) in current_run_port_list:
            logging.info(green("\t{0} server port {1} start success".format(host_stype, port)))
          else:
            logging.error(red("\t{0} server port {1} not start !!!!!!!!".format(host_stype, port)))
            quit()
    def compare_port():
      cmd1 = "netstat -ant"
      ip_duan = '0.0.0.0'
      if self.role == "link":
        stype_list = pkcon_list
        cmd2 = "grep '{0}:150'".format(ip_duan)
      elif self.role == "room":
        stype_list = pkroom_list
        cmd2 = "grep '{0}:50'".format(ip_duan)
      elif self.role == "login":
        stype_list = login_list
        cmd2 = "grep '{0}:20'".format(ip_duan)
      elif self.role == "pkplayer":
        stype_list = pkplayer_list
        cmd2 = "grep '{0}:50'".format(ip_duan)
      cmd3 = "awk '{print $4}'"
      cmd4 = "awk -F':' '{print $2}'"
      command1 = subprocess.Popen(cmd1, shell=True, stdout=subprocess.PIPE)
      command2 = subprocess.Popen(cmd2, shell=True, stdin=command1.stdout, stdout=subprocess.PIPE)
      command3 = subprocess.Popen(cmd3, shell=True, stdin=command2.stdout, stdout=subprocess.PIPE)
      command4 = subprocess.Popen(cmd4, shell=True, stdin=command3.stdout, stdout=subprocess.PIPE)
      command5 = subprocess.Popen(['sort'], shell=True, stdin=command4.stdout, stdout=subprocess.PIPE)
      command6 = subprocess.Popen(['uniq'], shell=True, stdin=command5.stdout, stdout=subprocess.PIPE)
      current_run_port_list = command6.stdout.read().split()
      hp_list = []
      for num in range(len(stype_list)):
        host_ip = stype_list[num]['host']
        if self.role == "link":
          port = stype_list[num]['clientPort']
        else:
          port = stype_list[num]['port']
        nr = "{0}:{1}".format(host_ip, port)
        hp_list.append(nr)
      fail_port = []
      new_hp_list = []
      for hp in hp_list:
        hip = hp.split(":")[0]
        hport = hp.split(":")[1]
        if eth_ip == hip or hip == "127.0.0.1":
          if not hport in current_run_port_list:
            fail_port.append(hport)
          else:
            new_hp_list.append(hport)
      total_port = len(new_hp_list)
      if len(fail_port) == 0:
        logging.info(green("\t{0} server {1} port count {2} is ok".format(host_stype, self.role, total_port)))
      else:
        su_num = total_port - len(fail_port)
        x = red("\t{0} server {1} port {2} not start !!!!!!!!".format(host_stype, self.role, ",".join(fail_port)))
        logging.error(x)
        quit()
    if self.role == "web":
      check_web_admin()
    elif self.role == "admin":
      check_web_admin()
    else:
      compare_port()
#-------------------------------------get template.json info---------------------------------
template_file = "/root/mjserver/game-server/config/servers.json"
master_file = "/root/mjserver/game-server/config/master.json"
new_list = []
with open(template_file) as f:
  nr = f.read()
dict = json.loads(nr)
pkcon_list = dict[host_project]['pkcon']
pkroom_list = dict[host_project]['pkroom']
login_list = dict[host_project]['login']
pkplayer_list = dict[host_project]['pkplayer']
web_list = ['800']
admin_list = ['80', '88']

#--------------------------------------check activity----------------------------------------
def node_exec(role, do):
  x = Mine_node(role)
  process_list = ['data']
  port_process_list = ['web', 'admin', 'login', 'pkplayer', 'room', 'link']
  def start_activity():
    def check_activity():
      with open(master_file) as f:
        nr = f.read()
      dict = json.loads(nr)
      try:
        master_list = dict[host_project]['actServer']
      except Exception as e:
        pass
      else:
        return "activity"
    z = check_activity()
    if z == "activity":
      if do == "start":
        x.start()
      elif do == "check":
        x.check_process()
  if role == "activity":
    start_activity()
  elif role == "all":
    x.start()
    for y in port_process_list:
      n = Mine_node(y)
      n.check_process()
      n.check_port()
  else:
    if do == "start":
      x.start()
    elif do == "check":
      if role in process_list:
        x.check_process()
      elif role in port_process_list:
        if role == "link":
          time.sleep(3)
        x.check_process()
        x.check_port()
#---------------------------------------------stop node---------------------------------------
def stop():
  try:
    os.system('pkill -9 node')
  except Exception as e:
    print "----------------------------------------------------"
    logging.error(red("\tstop node fail !!!!!!!!"))
    logging.error(e)
    print "----------------------------------------------------"
    quit()
  else:
    print "----------------------------------------------------"
    logging.info(green("\tstop node success"))
    print "----------------------------------------------------"

#---------------------------------------------setcpu---------------------------------------
def setCpu():
  cpu_processor_num = os.popen('cat /proc/cpuinfo |grep -c "processor"').read().strip()
  cpu_num_list = range(int(cpu_processor_num))
  cpu_num_range = '{0}-{1}'.format(cpu_num_list[0],cpu_num_list[-1])
  cmd1 = 'ps -e -o pid,command'
  cmd2 = 'grep "env={0}"'.format(host_project)
  if host_stype == "link":
    cmd3 = 'grep "id=pkcon"'
  elif host_stype == "room":
    cmd3 = 'grep "id=pkroom"'
  else:
    cmd3 = 'grep "id="'
  cmd4 = "awk '{print $1}'"
  command1 = subprocess.Popen(cmd1, shell=True, stdout=subprocess.PIPE)
  command2 = subprocess.Popen(cmd2, shell=True, stdin = command1.stdout, stdout=subprocess.PIPE)
  command3 = subprocess.Popen(cmd3, shell=True, stdin = command2.stdout, stdout=subprocess.PIPE)
  command4 = subprocess.Popen(cmd4, shell=True, stdin = command3.stdout, stdout=subprocess.PIPE)
  current_pid_list = command4.stdout.read().split()
  x=0
  for value in range(len(current_pid_list)):
    cpuid = x%int(cpu_processor_num)
    ppid = current_pid_list[value]
    cmd = "taskset -cp %s %s" % (cpuid, ppid)
    command5 = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE)
    nlist = command5.stdout.read().split('\n')
    n0_cpuid = nlist[0].split()[-1]
    if "," in n0_cpuid:
      n0_cpuid = n0_cpuid.replace(',', '-')
    n1_cpuid = nlist[1].split()[-1]
    if "," in n1_cpuid:
      n1_cpuid = n1_cpuid.replace(',', '-')
    if n0_cpuid == cpu_num_range or n0_cpuid == n1_cpuid:
      logging.info(green("\tsetPid {0} on CPUID {1} success".format(ppid, cpuid)))
    else:
      logging.info(red("\tsetPid {0} on CPUID {1} fail !!!!!!!!".format(ppid, cpuid)))
      quit()
    x += 1
#---------------------------------------------status----------------------------------------
def status():
  cmd1 = 'netstat -ant'
  cmd2 = 'grep -v LISTEN'
  count_list = []
  for num in range(len(pkcon_list)):
    host_ip = pkcon_list[num]['host']
    if host_ip == eth_ip or host_ip == "127.0.0.1":
      port = pkcon_list[num]['clientPort']
    else:
      continue
    cmd3 = 'grep -c :{0}'.format(port)
    command1 = subprocess.Popen(cmd1, shell=True, stdout=subprocess.PIPE)
    command2 = subprocess.Popen(cmd2, shell=True, stdin=command1.stdout, stdout=subprocess.PIPE)
    command3 = subprocess.Popen(cmd3, shell=True, stdin=command2.stdout, stdout=subprocess.PIPE)
    port_pkcon_num = command3.stdout.read().strip()
    count_list.append(int(port_pkcon_num))
    print green("{0}: {1}".format(port, port_pkcon_num))
  print green("allCount: {0}".format(sum(count_list)))
#------------------------------------------start check 150 is null --------------------------
def check_150():
  get_cmd = 'netstat -anltp|grep -c :150'
  pkcon_counters = int(os.popen(get_cmd).read().strip())
  while pkcon_counters > 10:
    print "-------------------------------------------------------------------"
    print red("\tCurrent not closed TCP number is : {0}".format(pkcon_counters))
    print "-------------------------------------------------------------------"
    pkcon_counters = int(os.popen(get_cmd).read().strip())
    time.sleep(5)
#---------------------------------------check_package----------------------------------------
def check_package(package, ptype):
  def install_package():
    if ptype == "yum":
      install_cmd = "yum install -y {0}".format(package)
    elif ptype == "python":
      install_cmd = "pip install {0}".format(package)
    logging.info(green("\tinstall {1} package {0}".format(package, ptype)))
    if not os.system(install_cmd) == 0:
      print "---------------------------------------------------"
      logging.error(red("\tinstall {1} Package {0} fail !!!!!!".format(package, ptype)))
      print "---------------------------------------------------"
      quit()
  if ptype == "yum":
    if package == "gcc":
      cmd = "rpm -qa|grep ^gcc-4.8.5-11.el7.x86_64"
      rc = re.compile(r"\w+.4.8.5")
    else:
      cmd = "rpm -qa|grep '{0}'".format(package)
      rc = re.compile(r'\w+-\w+')
  elif ptype == "python":
    cmd = "pip list|grep '{0}'".format(package)
    rc = re.compile(r'\w+')
  try:
    sp = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    ssr = sp.stdout.read()
    target_nr = rc.match(ssr).group()
  except Exception as e:
    print e
    install_package()
  else:
    if target_nr == package:
      pass
    elif target_nr == "{0}-4.8.5".format(package):
      pass
    else:
      install_package()
#------------------------------------check percent-----------------------------------------------------
def check_process_percent(process):
  check_package("gcc", 'yum')
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
      print red("\t{0} {1} percent is not restore".format(process, p))
      print red("\tCurrent {0} {1} percent is {2}".format(process, p, value))
      print "-----------------------------------------------------"
      time.sleep(3)
  compare_value(process_cpu_percent, 'CPU')
  compare_value(process_memory_percent, 'Memory')
#-----------------------------------restart mongod----------------------------------------------------
def restart_mongo():
  restart_cmd = 'systemctl restart mongod'
  if os.system(restart_cmd) == 0:
    print "----------------------------------------------------"
    logging.info(green("\trestart mongod success"))
    print "----------------------------------------------------"
  else:
    print "----------------------------------------------------"
    logging.error(red("\trestart mongod fail !!!!!!!!"))
    print "----------------------------------------------------"
    quit()
  time.sleep(1)
#----------------------------------get log-----------------------------------------------------------
def get_log():
  logs_path = '/root/mjserver/game-server/logs/'
  uncaught_path = '/root/mjserver/game-server/uncaught/'
  logs_list = os.popen('find {0} -type f -mmin -2'.format(logs_path)).read().strip().split()
  logs_list = sorted(logs_list,key=os.path.getmtime)
  uncaught_list = os.popen('find {0} -type f -mmin -2'.format(uncaught_path)).read().strip().split()
  uncaught_list = sorted(uncaught_list,key=os.path.getmtime)
  if len(uncaught_list) > 0:
    for log_file in uncaught_list:
      print log_file
  else:
    print "2分钟内没有日志更新"
  if len(logs_list) > 0:
    for log_file in logs_list:
      print log_file
  else:
    print "2分钟内没有日志更新"

data_list = ['data', 'master', 'test', 'a']
loginpkplayer_list = ["pkplayer", "login", "pkplayerlogin", "loginpkplayer"]
def start():
  if host_stype in data_list:
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
      node_exec('data', 'start')
      node_exec('web', 'start')
      node_exec('admin', 'start')
      node_exec('activity', 'start')
      node_exec('login', 'start')
      node_exec('pkplayer', 'start')
      node_exec('room', 'start')
      check_150()
      node_exec('link', 'start')
    else:
      for num in range(len(login_list)):
        login_ip = login_list[num]['host']
      for num in range(len(pkplayer_list)):
        pkplayer_ip = pkplayer_list[num]['host']
      if eth_ip == login_ip == pkplayer_ip or login_ip == pkplayer_ip == "127.0.0.1":
        restart_mongo()
        check_process_percent('mongod')
        node_exec('data', 'start')
        node_exec('web', 'start')
        node_exec('admin', 'start')
        node_exec('activity', 'start')
        node_exec('login', 'start')
        node_exec('pkplayer', 'start')
      else:
        restart_mongo()
        check_process_percent('mongod')
        node_exec('data', 'start')
        node_exec('web', 'start')
        node_exec('admin', 'start')
        node_exec('activity', 'start')
  elif host_stype in loginpkplayer_list:
    node_exec('login', 'start')
    node_exec('pkplayer', 'start')
  elif host_stype == "room":
    node_exec('web', 'start')
    node_exec('room', 'start')
    setCpu()
  elif host_stype == "link":
    check_150()
    node_exec('link', 'start')
    setCpu()

def check():
  if host_stype in data_list:
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
      node_exec('data', 'check')
      node_exec('web', 'check')
      node_exec('admin', 'check')
      node_exec('activity', 'check')
      node_exec('login', 'check')
      node_exec('pkplayer', 'check')
      node_exec('room', 'check')
      node_exec('link', 'check')
    else:
      for num in range(len(login_list)):
        login_ip = login_list[num]['host']
      for num in range(len(pkplayer_list)):
        pkplayer_ip = pkplayer_list[num]['host']
      if eth_ip == login_ip == pkplayer_ip or login_ip == pkplayer_ip == "127.0.0.1":
        node_exec('data', 'check')
        node_exec('web', 'check')
        node_exec('admin', 'check')
        node_exec('activity', 'check')
        node_exec('login', 'check')
        node_exec('pkplayer', 'check')
      else:
        node_exec('data', 'check')
        node_exec('web', 'check')
        node_exec('admin', 'check')
        node_exec('activity', 'check')
  elif host_stype in loginpkplayer_list:
    node_exec('login', 'check')
    node_exec('pkplayer', 'check')
  elif host_stype == "room":
    node_exec('web', 'check')
    node_exec('room', 'check')
  elif host_stype == "link":
    node_exec('link', 'check')

def chaifen():
  try:
    target
  except Exception as e:
    logging.error(red("\tcurrent restart project not in ['data/web/admin/activity/login/pkplayer/room/link']"))
  else:
    if target == "data":
      node_exec('data', 'start')
      node_exec('data', 'check')
    elif target == "web":
      node_exec('web', 'start')
      node_exec('web', 'check')
    elif target == "admin":
      node_exec('admin', 'start')
      node_exec('admin', 'check')
    elif target == "activity":
      node_exec('activity', 'start')
      node_exec('activity', 'check')
    elif target == "login":
      node_exec('login', 'start')
      node_exec('login', 'check')
    elif target == "pkplayer":
      node_exec('pkplayer', 'start')
      node_exec('pkplayer', 'check')
    elif target == "room":
      node_exec('web', 'start')
      node_exec('room', 'start')
      node_exec('web', 'check')
      node_exec('room', 'check')
      setCpu()
    elif target == "link":
      check_150()
      node_exec('link', 'start')
      node_exec('link', 'check')
      setCpu()
    elif target == "setcpu":
      setCpu()
    else:
      script_do()
      quit()

if len(sys.argv) == 2:
  target = sys.argv[1]
  if target == "stop":
    stop()
  elif target == "restart":
    stop()
    start()
    check()
    get_log()
  elif target == "status":
    status()
  elif target == "check150":
    check_150()
  elif target == "checkmongo":
    check_process_percent('mongod')
  elif target == "log":
    get_log()
  elif target == "check":
    check()
  else:
    chaifen()
else:
  script_do()
