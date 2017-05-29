#!/usr/bin/python
#coding=utf8

import os,sys
import time
Current_PATH = os.getcwd()
BASE_PATH = os.path.dirname(os.path.dirname(Current_PATH + os.sep + __file__))
sys.path.append(BASE_PATH)
sys.path.append("/root/slbTools/ydx/shell/")
import subprocess
import base_fuc
from config import settings
from lib import public

def do(role):
  def check_web_admin():
    if role == "web":
      nlist = settings.web_list
    elif role == "admin":
      if settings.hname == 'scmj-master':
        nlist = ['80', '89']
      else:
        nlist = settings.admin_list
    try:
      nlist
    except Exception as e:
      pass
    else:
      for port in nlist:
        net_cmd = "netstat -anltp|grep :%s|awk '{print $4}'|awk -F':' '{print $2}'|sort|uniq" % (port)
        current_run_port_list = os.popen(net_cmd).read().strip().split()
        if str(port) in current_run_port_list:
          right_info = "{0} server port {1} start success".format(settings.host_stype, port)
          public.recode_log(right_info, 'info')
          public.xiushi(right_info, 'info')
        else:
          err_info = "{0} server port {1} not start !!!!!!!!".format(settings.host_stype, port)
          public.recode_log(err_info, 'error')
          public.xiushi(err_info, 'error')
          quit()
  def compare_port():
    if role == "link":
      stype_list = settings.pkcon_list
      port = 150
    elif role == "room":
      stype_list = settings.pkroom_list
      port = 50
    elif role == "login":
      stype_list = settings.login_list
      port = 20
    elif role == "pkplayer":
      stype_list = settings.pkplayer_list
      port = 50
    hp_list = []
    cmd = "netstat -ant|grep 0.0.0.0:%d|awk '{print $4}'|awk -F':' '{print $2}'|sort|uniq" % (port)
    current_run_port_list = os.popen(cmd).read().strip().split()
    for num in range(len(stype_list)):
      host_ip = stype_list[num]['host']
      if role == "link":
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
      if settings.eth_ip == hip or hip == "127.0.0.1":
        new_hp_list.append(hport)
    right_run_port_list = []
    x = 0
    while 10 > x:
      for hport in new_hp_list:
        if hport in current_run_port_list:
          right_run_port_list.append(hport)
      right_run_port_list = list(set(right_run_port_list))
      if len(right_run_port_list) < len(new_hp_list):
        current_run_port_list = os.popen(cmd).read().strip().split()
        print "\t第{1}次检查{0}端口".format(role, x+1)
        time.sleep(2)
      elif len(right_run_port_list) == len(new_hp_list):
        x = 9
      else:
        x = 9
      x += 1
    for hport in new_hp_list:
      if not hport in right_run_port_list:
        fail_port.append(hport)
    total_port = len(new_hp_list)
    if len(fail_port) == 0:
      right_info = "{0} server {1} port count {2} is ok".format(settings.host_stype, role, total_port)
      public.recode_log(right_info, 'info')
      public.xiushi(right_info, 'info')
    else:
      su_num = total_port - len(fail_port)
      err_info = "{0} server {1} port {2} not start !!!!!!!!".format(settings.host_stype, role, ",".join(fail_port))
      public.recode_log(err_info, 'error')
      public.xiushi(err_info, 'error')
      quit()
  if role == "web":
    check_web_admin()
  elif role == "admin":
    check_web_admin()
  else:
    compare_port()

