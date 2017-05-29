#!/usr/bin/python
#coding=utf8

import os,sys
Current_PATH = os.getcwd()
BASE_PATH = os.path.dirname(os.path.dirname(Current_PATH + os.sep + __file__))
sys.path.append(BASE_PATH)
sys.path.append("/root/slbTools/ydx/shell/")
import base_fuc
from config import settings
from lib import public
from models import check_root_parttion

class Git_clone(object):
  def __init__(self, progect, ptype):
    self.progect = progect
    self.ptype = ptype
    if self.ptype == "server":
      self.progect_path = "/root/{0}".format(self.progect)
    elif self.ptype == "web":
      self.progect_path = "/root/{0}_web".format(self.progect)
    elif self.ptype == "zip":
      self.progect_path = "/root/{0}_zip".format(self.progect)
    else:
      err_info = "Current {0} clone type {1} is error Please Useage web/zip/server".format(self.progect, self.ptype)
      public.recode_log(err_info, 'error')
      public.xiushi(err_info, 'error')
      quit()
  def tclone(self):
    if not os.path.exists(self.progect_path):
      git_cmd = 'git clone http://git.happyplaygame.net/Publish/{0}_{1}.git {2}'.format(self.progect, self.ptype, self.progect_path)
      if not os.system(git_cmd) == 0:
        err_info = "clone {0}_{1} fail !!!!!!!!!!".format(self.progect, self.ptype)
        public.recode_log(err_info, 'error')
        public.xiushi(err_info, 'error')
        quit()
      else:
        right_info = "clone {0}_{1} success".format(self.progect, self.ptype)
        public.recode_log(right_info, 'info')
        public.xiushi(right_info, 'info')

def diao_clone(pname, ctype):
  if not pname in settings.mwws_list:
    if ctype == 'all':
      if settings.server_type in settings.d_list:
        clone_type_list = ['server', 'web', 'zip']
      elif settings.server_type in settings.lpr_list:
        clone_type_list = ['server']
      elif settings.server_type =="lb":
        clone_type_list = ['server', 'web', 'zip']
      elif settings.server_type =="link":
        err_info = "Link server not clone project !!!!!!!!"
        public.recode_log(err_info, 'error')
        public.xiushi(err_info, 'error')
        quit()
      else:
        err_info = "Cannot determine the server role !!!!!!"
        public.recode_log(err_info, 'error')
        public.xiushi(err_info, 'error')
        quit()
    elif ctype == 'web':
      if settings.server_type in settings.d_list:
        clone_type_list = ['web']
      elif settings.server_type == 'lb':
        clone_type_list = ['web']
      else:
        err_info = "Currnet server not clone web project !!!!!!!!"
        public.recode_log(err_info, 'error')
        public.xiushi(err_info, 'error')
        quit()
    elif ctype == 'zip':
      if settings.server_type in settings.d_list:
        clone_type_list = ['zip']
      elif settings.server_type == 'lb':
        clone_type_list = ['zip']
      else:
        err_info = "Currnet server not clone zip project !!!!!!!!"
        public.recode_log(err_info, 'error')
        public.xiushi(err_info, 'error')
        quit()
    elif ctype == 'server':
      if settings.server_type in settings.d_list:
        clone_type_list = ['server']
      elif settings.server_type in settings.lpr_list:
        clone_type_list = ['server']
      elif settings.server_type == 'lb':
        clone_type_list = ['server']
      else:
        err_info = "Currnet server not clone server project !!!!!!!!"
        public.recode_log(err_info, 'error')
        public.xiushi(err_info, 'error')
        quit()
    else:
      err_info = "clone project Please Usage right type all/server/zip/web !!!!!!"
      public.recode_log(err_info, 'error')
      public.xiushi(err_info, 'error')
      quit()
    for ctype in clone_type_list:
      cg = Git_clone(pname, ctype)
      cg.tclone()
