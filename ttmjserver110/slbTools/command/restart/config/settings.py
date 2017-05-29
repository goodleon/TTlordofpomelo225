#!/usr/bin/python
#coding=utf8

import os,sys
import time
import socket
import json
Current_PATH = os.getcwd()
BASE_PATH = os.path.dirname(os.path.dirname(Current_PATH + os.sep + __file__))
BASE_LIB_PATH = os.path.join(BASE_PATH, "lib")
BASE_MODULE_PATH = os.path.join(BASE_PATH, "models")
BASE_CONFIG_PATH = os.path.join(BASE_PATH, "config".format(BASE_PATH))
path_list = ["/root/slbTools/ydx/shell/", BASE_PATH, BASE_LIB_PATH, BASE_MODULE_PATH, BASE_CONFIG_PATH]
for path in path_list:
  sys.path.append(path)
import base_fuc
hname = socket.gethostname().lower()
host_stype = hname.split("-")[1]
host_project = hname.split("-")[0]
bak_time = time.strftime("%Y%m%d_%H%M%S")

def red(info):
  return "\033[1;31;40m{0}\033[0m".format(info)
def green(info):
  return "\033[1;32;40m{0}\033[0m".format(info)

data_list = ['data', 'master', 'test', 'a']
loginpkplayer_list = ["pkplayer", "login", "pkplayerlogin", "loginpkplayer"]

def get_ip_address(ifname):
  import fcntl
  import struct
  s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
  return socket.inet_ntoa(fcntl.ioctl(
      s.fileno(),
      0x8915,  # SIOCGIFADDR
      struct.pack('256s', ifname[:15])
  )[20:24])
eth_ip = get_ip_address("eth0")

def c_profile():
  export_cmd = 'export NODE_PATH=/usr/lib/node_modules'
  profile_file = "/etc/profile"
  with open(profile_file) as f:
    nr = f.readlines()
    if not export_cmd in "".join(nr):
      with open(profile_file, 'ab') as f:
        f.write(export_cmd + "\n")
c_profile()

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

