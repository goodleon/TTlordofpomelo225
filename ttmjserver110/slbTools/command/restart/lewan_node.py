#!/usr/bin/python
#coding=utf8

import os,sys
Current_PATH = os.getcwd()
BASE_PATH = os.path.dirname(os.path.dirname(Current_PATH + os.sep + __file__))
sys.path.append(BASE_PATH)
sys.path.append("/root/slbTools/ydx/shell/")
import subprocess
import base_fuc
import time
from config import settings
from lib import public
from models import restart,tocheck,setcpu,check_process,check_port,diao_sc,get_log,status,check_root_parttion,zcheck,opencms


if len(sys.argv) == 2:
  target = sys.argv[1]
  if target == "stop":
    restart.node_stop()
  elif target == "restart":
    check_process.c_chongfu(target)
    restart.node_stop()
    diao_sc.start()
    zcheck.check()
    if settings.host_stype == "room":
      setcpu.do()
    elif settings.host_stype == "link":
      setcpu.do()
    get_log.do()
    check_root_parttion.do()
  elif target == "status":
    status.do()
  elif target == "check150":
    tocheck.c_150()
  elif target == "checkmongo":
    tocheck.mongod('mongod')
  elif target == "log":
    get_log.do()
  elif target == "check":
    diao_sc.check()
  elif target in ['sms_1', 'sms_0']:
    opencms.do(int(target.split('_')[-1]))
  elif target[-4:] == ".txt":
    get_log.cat_ulog(target)
  else:
    check_process.c_chongfu(target)
    diao_sc.chaifen(target)
else:
  public.script_do()
  quit()
