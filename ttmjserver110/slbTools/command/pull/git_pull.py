#!/usr/bin/python
#coding=utf8

import os,sys
import socket
import time
BASE_PATH = os.path.dirname(os.path.dirname(__file__))
sys.path.append(BASE_PATH)
sys.path.append("/root/slbTools/ydx/shell/")
from config import settings
from lib import public
from models import clone,jsonbak,pull,git_log_recode,file_rollback,check_root_parttion
bak_time = time.strftime("%Y%m%d_%H%M%S")
hname = socket.gethostname().lower()

if len(sys.argv) == 2:
  target = sys.argv[1]
elif len(sys.argv) == 3:
  target = sys.argv[1]
  tstores = sys.argv[2]
else:
  print "Please Usage {0} 'progect'".format(sys.argv[0])
  print "Please Usage {0} 'progect' 'mjserver/webadmin/webagent/slbTools/web/zip/server'".format(sys.argv[0])
  print "Please Usage {0} 'mjserver/webadmin/webagent/slbTools'".format(sys.argv[0])
  quit()


if settings.server_type == "lb":
  def pull_lb(p_type):
    if len(settings.hn_list) == 4:
      if settings.progect_name == target:
        clone.diao_clone(target, p_type)
        pull.do_pull_web(target, p_type)
      else:
        err_info = "Please check current LB hostname and project_name !!!!!!!"
        public.recode_log(err_info, 'error')
        public.xiushi(err_info, 'error')
        quit()
    elif len(settings.hn_list) == 3:
      clone.diao_clone(target, p_type)
      pull.do_pull_web(target, p_type)
    else:
      err_info = "Please check current LB hostname !!!!!!!"
      public.recode_log(err_info, 'error')
      public.xiushi(err_info, 'error')
      quit()
  try:
    tstores
  except Exception as e:
    if target in settings.mwws_list:
      error_info = "LB host not pull {0}".format("/".join(settings.mwws_list))
      public.recode_log(error_info, 'error')
      public.xiushi(error_info, 'error')
    else:
      pull_lb('all')
  else:
    if tstores == "web":
      pull_lb(tstores)
    elif tstores == "zip":
      pull_lb(tstores)
    elif tstores == "server":
      pull_lb(tstores)
    else:
      if tstores == progect_name:
        err_info = "Parameter reversed , please check !!!!"
        public.recode_log(err_info, 'error')
        public.xiushi(err_info, 'error')
        quit()
      else:
        err_info = "Parameter {0} not in all/web/zip/server !!!!!!!!!!!!!!".format(tstores)
        public.recode_log(err_info, 'error')
        public.xiushi(err_info, 'error')
        quit()
else:
  check_list = ['mjserver', 'slbTools']
  test_list = ['a', 'test']
  def error_info(t):
    err_info = "current host server_type is {0} not execute {1}".format(settings.server_type, t)
    public.recode_log(err_info, 'error')
    public.xiushi(err_info, 'error')
    quit()
  if len(sys.argv) == 2:
    dt = jsonbak.Data_bakup(target)
    fr = file_rollback.rollback_jsonfile(target)
    if target in settings.mwws_list:
      mwws_store = pull.Pull_mwws(target)
      if settings.server_type in settings.d_list:
        dt.bak()
        mwws_store.tpull()
      elif settings.server_type in settings.lpr_list or settings.server_type == 'link' or settings.server_type in test_list:
        if target in check_list:
          mwws_store.tpull()
        else:
          error_info(target)
      else:
        error_info(target)
    else:
      if settings.server_type in settings.lpr_list:
        clone.diao_clone(target, 'server')
        pull.do_pull_web(target, 'server')
      elif settings.server_type in settings.d_list or settings.server_type == 'lb':
        clone.diao_clone(target, 'all')
        dt.bak()
        pull.do_pull_web(target, 'all')
        fr.do()
      elif settings.server_type == 'link':
        print settings.red("link server not pull project")
        quit()
  elif len(sys.argv) == 3:
    mwws_store = pull.Pull_mwws(tstores)
    dt = jsonbak.Data_bakup(target)
    fr = file_rollback.rollback_jsonfile(target)
    if tstores in settings.mwws_list:
      if settings.server_type in settings.lpr_list or settings.server_type == 'link':
        if not tstores in settings.check_list:
          error_info(tstores)
    def do_clone_and_bak(p_type='all'):
      clone.diao_clone(target, p_type)
    if tstores in settings.mwws_list:
      dt = jsonbak.Data_bakup(target)
      dt.bak()
      mwws_store.tpull()
      pull.do_pull_web(target, 'all')
      fr.do()
    elif tstores == "web":
      dt = jsonbak.Data_bakup(target)
      dt.bak()
      do_clone_and_bak()
      pull.do_pull_web(target, tstores)
      fr.do()
    elif tstores == "zip":
      do_clone_and_bak()
      pull.do_pull_web(target, tstores)
    elif tstores == "server":
      do_clone_and_bak()
      pull.do_pull_web(target, tstores)
    else:
      if tstores == progect_name:
        err_info = "Parameter reversed , please check !!!!"
        public.recode_log(err_info, 'error')
        public.xiushi(err_info, 'error')
        quit()
      else:
        err_info = "Parameter {0} is error !!!!!!!!!!!!!!".format(tstores)
        public.recode_log(err_info, 'error')
        public.xiushi(err_info, 'error')
        quit()

if settings.lb_name == "abroad":
  os.chdir("/root/slbTools")
  setRegion_cmd = "bash setRegion {0}".format(target)
  if os.system(setRegion_cmd) == 0:
    right_info = "exec {0} setRegion success".format(target)
    public.recode_log(right_info, 'info')
    public.xiushi(right_info, 'info')
  else:
    right_info = "exec {0} setRegion fail !!!!!!!!".format(target)
    public.recode_log(right_info, 'error')
    public.xiushi(right_info, 'error')

check_root_parttion.do()
