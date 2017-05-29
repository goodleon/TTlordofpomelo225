#!/usr/bin/python
#coding=utf8

import os,sys
import time
import socket
Current_PATH = os.getcwd()
BASE_PATH = os.path.dirname(os.path.dirname(Current_PATH + os.sep + __file__))
BASE_LIB_PATH = os.path.join(BASE_PATH, "lib")
BASE_MODULE_PATH = os.path.join(BASE_PATH, "models")
BASE_CONFIG_PATH = os.path.join(BASE_PATH, "config".format(BASE_PATH))
path_list = ["/root/slbTools/ydx/shell/", BASE_PATH, BASE_LIB_PATH, BASE_MODULE_PATH, BASE_CONFIG_PATH]
for path in path_list:
  sys.path.append(path)
import base_fuc

def red(info):
  return "\033[1;31;40m{0}\033[0m".format(info)
def green(info):
  return "\033[1;32;40m{0}\033[0m".format(info)

bak_time = time.strftime("%Y%m%d_%H%M%S")
hname = socket.gethostname().lower()

d_list = ["data", "master"]
lpr_list = ["room", "pkplayer", "login", "pkplayerlogin", "loginpkplayer"]
nodata_list = ["room", "pkplayer", "login", "pkplayerlogin", "loginpkplayer", 'link']
mwws_list = ['webadmin', 'webagent', 'mjserver', 'slbTools']

hn_list = hname.split('-')
if len(hn_list) == 4:
  lb_name = net_line = hn_list[0]
  progect_name = hn_list[2]
  server_type = hn_list[1]
  server_id = hn_list[3]
elif len(hn_list) == 3:
  progect_name = lb_name = hn_list[0]
  server_type = hn_list[1]
  server_id = hn_list[2]
elif len(hn_list) == 2:
  progect_name = lb_name = hn_list[0]
  server_type = hn_list[1]
else:
  err_info = "Please Check Current Hostname !!!!!"
  public.recode_log(err_info, 'error')
  public.xiushi(err_info, 'error')
  quit()


