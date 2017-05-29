#!/usr/bin/python
#coding=utf8

import os,sys
import socket
Current_PATH = os.getcwd()
BASE_PATH = os.path.dirname(os.path.dirname(Current_PATH + os.sep + __file__))
sys.path.append(BASE_PATH)
sys.path.append("/root/slbTools/ydx/shell/")
import base_fuc
from config import settings
from lib import public

def do(role):
  cmd = os.popen("ps -eo 'cmd'|grep -v grep|grep '{0}'".format(settings.Mine_node(role).check_bd)).read().strip()
  cmd_list = cmd.split("\n")
  def do(bd, start_type):
    bd_str = ",".join(cmd_list)
    if bd in bd_str:
      right_info = "{0} server {1} process count {2} is ok".format(settings.host_stype, start_type, len(cmd_list))
      public.recode_log(right_info, 'info')
      public.xiushi(right_info, 'info')
    else:
      err_info = "{0} server {1} process count {2} is fail !!!!!!!!".format(settings.host_stype, start_type,len(cmd_list))
      public.recode_log(err_info, 'error')
      public.xiushi(err_info, 'error')
      quit()
  try:
    settings.Mine_node(role).check_monitor_bd
  except Exception as e:
    do(settings.Mine_node(role).check_bd, role)
  else:
    do(settings.Mine_node(role).check_bd, role)
    cmd = os.popen("ps -eo 'cmd'|grep -v grep|grep '{0}'".format(settings.Mine_node(role).check_monitor_bd)).read().strip()
    cmd_list = cmd.split("\n")
    do(settings.Mine_node(role).check_monitor_bd, "{0} monitor".format(role))

def c_chongfu(dotype):
  biaodi = 'lewan_node.py {0}'.format(dotype)
  cmd = 'ps -eo "cmd"|grep -v grep|grep -c "{0}"'.format(biaodi)
  value = os.popen(cmd).read().strip()
  if int(value ) > 2:
    err_info = "当前系统已经存在{0}进程，请勿重复执行".format(dotype)
    public.xiushi(err_info, 'error')
    quit()
  else:
    pass

