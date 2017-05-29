#!/usr/bin/python
#coding=utf8

import os,glob
import sys,shutil
Current_PATH = os.getcwd()
BASE_PATH = os.path.dirname(os.path.dirname(Current_PATH + os.sep + __file__))
sys.path.append(BASE_PATH)
sys.path.append("/root/slbTools/ydx/shell/")
from config import settings
from lib import public

class rollback_jsonfile(object):
  def __init__(self,project):
    self.project = project
  def do(self):
    s_path = '/home/backup/{0}/'.format(self.project)
    if os.path.exists(s_path):
      t_catalog_list = glob.glob("{0}*".format(s_path))
      t_catalog_list.sort()
      t_catalog = t_catalog_list[-1]
      if os.path.isdir(t_catalog) == True:
        t_file_list = glob.glob("{0}/*".format(t_catalog))
        for t_file in t_file_list:
          cp_cmd = '\cp -ap {0} /root/{1}/web/'.format(t_file, self.project)
          if os.system(cp_cmd) == 0:
            right_info = "rollback {0} to /root/{1}/web/ success".format(t_file, self.project)
            public.recode_log(right_info, 'info')
            public.xiushi(right_info, 'info')
          else:
            err_info = "rollback {0} to /root/{1}/web/ fail !!!!!!".format(t_file, self.project)
            public.recode_log(err_info, 'error')
            public.xiushi(err_info, 'error')
      else:
        err_info = "{0} is not catalog !!!!!!".format(t_catalog)
        public.recode_log(err_info, 'error')
        public.xiushi(err_info, 'error')
        quit()
    else:
      err_info = "bak path {0} is not exist !!!!!!!!!".format(s_path)
      public.recode_log(err_info, 'error')
      public.xiushi(err_info, 'error')
      quit()
