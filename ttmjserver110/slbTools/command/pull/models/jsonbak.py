#!/usr/bin/python
#coding=utf8

import os,sys
import socket
import glob
Current_PATH = os.getcwd()
BASE_PATH = os.path.dirname(os.path.dirname(Current_PATH + os.sep + __file__))
sys.path.append(BASE_PATH)
sys.path.append("/root/slbTools/ydx/shell/")
import base_fuc
from config import settings
from lib import public
mk = base_fuc.mkfp()
#------------------------------------------del catalog----------------------------------
def del_old_dir(x):
  f_list = os.listdir(x)
  f_list.sort()
  d_num = len(f_list)
  if d_num >= 100:
    n_list = f_list[:-100]
    for path in n_list:
      l = glob.glob(x+os.sep+path+os.sep+'*')
      if l:
        for f in l:
          if os.remove(f):
            l.remove(f)
        l = glob.glob(path+os.sep+'*')
        if not l:
          os.rmdir(x+os.sep+path)
      else:
        os.rmdir(x+os.sep+path)
#-----------------------------------backup------------------------------------------
class Data_bakup(object):
  def __init__(self, tproject):
    self.tproject = tproject
  def bak(self):
    def do():
      jsonbak_path = '/home/backup/{0}/'.format(self.tproject)
      tt_path = jsonbak_path + settings.bak_time
      mk.mkp(tt_path)
      del_old_dir(jsonbak_path)
      for ss in bak_list:
        ss_path = spath + ss
        if os.path.exists(ss_path):
          rsync_cmd = 'rsync -a {0} {1}'.format(ss_path, tt_path)
          if os.system(rsync_cmd) == 0:
            right_info = "backup {0} to {1} success".format(ss_path, tt_path)
            public.recode_log(right_info, 'info')
            public.xiushi(right_info, 'info')
          else:
            err_info = "backup {0} to {1} fail !!!!!!".format(ss_path, tt_path)
            public.recode_log(err_info, 'error')
            public.xiushi(err_info, 'error')
            quit()
    if self.tproject in ["webadmin"]:
      spath = '/root/{0}/'.format("webadmin")
      bak_list = ['config', 'alipay', 'notice.json']
      do()
    elif self.tproject == settings.progect_name:
      spath = '/root/{0}/web/'.format(self.tproject)
      bak_list = ['notice.json', 'action.json', 'gamefree.json']
      x = glob.glob(spath+'con*')
      for path in x:
        tfile = path.split('/')[-1]
        bak_list.append(tfile)
      do()
