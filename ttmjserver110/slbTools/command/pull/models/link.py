#!/usr/bin/python
#coding=utf8

import os,sys
import socket
import glob
import subprocess
Current_PATH = os.getcwd()
BASE_PATH = os.path.dirname(os.path.dirname(Current_PATH + os.sep + __file__))
sys.path.append(BASE_PATH)
sys.path.append("/root/slbTools/ydx/shell/")
import base_fuc
from config import settings
from lib import public
mk = base_fuc.mkfp()
#------------------------------------------------------link server--------------------------------
def link_server(pname):
  def project_link(spath, tpath):
    def do():
      sp = subprocess.call('ln -s %s %s' % (spath, tpath), shell=True)
      if sp == 0:
        right_info = 'link {0} to {1} success'.format(spath, tpath)
        public.recode_log(right_info, 'info')
        public.xiushi(right_info, 'info')
      else:
        err_info = "link {0} to {1} fail !!!!!!!!".format(spath, tpath)
        public.recode_log(err_info, 'error')
        public.xiushi(err_info, 'error')
    if not os.path.exists(spath):
      err_info = "not exists {0}".format(spath)
      public.recode_log(err_info, 'error')
      public.xiushi(err_info, 'error')
      quit()
    if os.path.exists(tpath):
      check_link = os.popen('file %s' % (tpath)).read().strip('\n')
      cl = check_link.split()[1]
      if cl != 'symbolic':
        shutil.move(tpath, tpath+'.bak')
        do()
    else:
      do()
  def game_link():
    lin_list = glob.glob("/root/{0}/*".format(pname))
    for a in lin_list:
      if os.path.basename(a) == "web":
        continue
      else:
        if os.path.isdir(a) == True:
          spath = "/root/{0}/{1}".format(pname, os.path.basename(a))
          tpath = "/root/mjserver/game-server/app/servers/pkroom/games/{0}".format(os.path.basename(a))
          project_link(spath, tpath)
  if settings.server_type == "lb":
    mk.mkp("/root/web")
    spath = "/root/{0}/web".format(pname)
    tpath = "/root/web/{0}".format(pname)
    project_link(spath, tpath)
  elif settings.server_type in settings.d_list:
    game_link()
    spath = "/root/{0}/web".format(pname)
    tpath = "/root/mjserver/web-server/public/{0}".format(pname)
    project_link(spath, tpath)
  elif settings.server_type in settings.lpr_list:
    game_link()
