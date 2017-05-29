#!/usr/bin/python
#coding=utf8

import os,sys
import socket
Current_PATH = os.getcwd()
BASE_PATH = os.path.dirname(os.path.dirname(Current_PATH + os.sep + __file__))
sys.path.append(BASE_PATH)
sys.path.append("/root/slbTools/ydx/shell/")
import time
import base_fuc
import subprocess
from config import settings
from lib import public

def node_start(role):
  if role == 'admin':
    check_admin_process = os.popen("ps -ef|grep -v grep|grep -c 'adminWeb.js localhost.json'").read().strip()
    if check_admin_process == '1':
      public.xiushi("后台进程存在，请勿重复启动", 'info')
      quit()
  try:
    os.chdir(settings.Mine_node(role).target_path)
    sp = subprocess.Popen(settings.Mine_node(role).start_cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if sp.stderr.read():
      print sp.stderr.read()
  except Exception as e:
    err_info = "start {0} fail !!!!!!!!".format(role)
    public.recode_log(err_info, 'error')
    public.xiushi(err_info, 'error')
    quit()
  else:
    right_info = "start {0} success".format(role)
    public.recode_log(right_info, 'info')
    public.xiushi(right_info, 'info')
  time.sleep(1)

def node_stop():
  try:
    os.system('pkill -9 node')
  except Exception as e:
    err_info = "stop node fail !!!!!!!!"
    public.recode_log(err_info, 'error')
    public.xiushi(err_info, 'error')
    quit()
  else:
    right_info = "stop node success"
    public.recode_log(right_info, 'info')
    public.xiushi(right_info, 'info')

def mongod():
  restart_cmd = 'systemctl restart mongod'
  if os.system(restart_cmd) == 0:
    right_info = "restart mongod success"
    public.recode_log(right_info, 'info')
    public.xiushi(right_info, 'info')
  else:
    err_info = "restart mongod fail !!!!!!!!"
    public.recode_log(err_info, 'error')
    public.xiushi(err_info, 'error')
    quit()
  time.sleep(1)
