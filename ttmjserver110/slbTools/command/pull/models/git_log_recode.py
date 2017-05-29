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

#---------------------------------------------commit log-----------------------------------
class Log_git(object):
  def __init__(self, pro_name):
    self.pro_name = pro_name
  def plog(self):
    def do(xpath):
      os.chdir(xpath)
      log_cmd = 'git log -1|grep commit|awk \'{print $NF}\''
      pro_commit_version = os.popen(log_cmd).read().strip()
      if pro_commit_version:
        right_info = "{0}:{1}".format(self.pro_name, pro_commit_version)
        public.recode_log(right_info, 'info')
        public.xiushi(right_info, 'info')
      else:
        err_info = "backup {0} to {1} fail !!!!!!".format(ss_path, tt_path)
        public.recode_log(err_info, 'error')
        public.xiushi(err_info, 'error')
        quit()
    pro_path = '/root/{0}'.format(self.pro_name)
    if os.path.exists(pro_path):
      do(pro_path)
    else:
      err_info = "git log not exec because not exist {0}".format(pro_path)
      public.recode_log(err_info, 'error')
      public.xiushi(err_info, 'error')
      quit()

