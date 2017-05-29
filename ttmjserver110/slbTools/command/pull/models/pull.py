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
import git_log_recode
import chongtu
import check_branch
import link,zip_rsync
#----------------------------------------------------pull project class--------------------------------
class Pull_project(object):
  def __init__(self, progect, ptype):
    self.progect = progect
    self.ptype = ptype
    if self.ptype == "server":
      self.progect_path = "/root/{0}".format(self.progect)
    elif self.ptype == "web":
      self.progect_path = "/root/{0}_web".format(self.progect)
    elif self.ptype == "zip":
      self.progect_path = "/root/{0}_zip".format(self.progect)
  def tpull(self):
    lg = git_log_recode.Log_git(os.path.basename(self.progect_path))
    lg.plog() 
    check_branch.do(self.progect_path)
    if os.path.exists(self.progect_path):
      store_name = self.progect_path.split("/")[-1]
      os.chdir(self.progect_path)
      if os.system('git pull') == 0:
        right_info = "pull {0} success".format(store_name)
        public.recode_log(right_info, 'info')
        public.xiushi(right_info, 'info')
      else:
        chongtu.slove_chongtu(self.progect_path, self.ptype).mv_err()
  def rsync_data(self):
    server_web_path = "/root/{0}/web/".format(self.progect)
    server_path = "/root/{0}".format(self.progect)
    if self.ptype == "web":
      web_path = "/root/{0}_web/web/".format(self.progect)
    elif self.ptype == "zip":
      web_path = "/root/{0}_zip/web/".format(self.progect)
    rsync_web = 'rsync -a {0} {1}'.format(web_path, server_web_path)
    p_list = [server_path, web_path]
    for p in p_list:
      if not os.path.exists(p):
        err_info = "Not exists {0} !!!!!".format(p)
        public.recode_log(err_info, 'error')
        public.xiushi(err_info, 'error')
        quit()
    if os.system(rsync_web) == 0:
      right_info = "rsync {0} to {1} success".format(web_path, server_web_path)
      public.recode_log(right_info, 'info')
      public.xiushi(right_info, 'info')
    else:
      quit()

def do_pull_web(p_name, p_type):
  pserver = Pull_project(p_name,'server')
  pweb = Pull_project(p_name,'web')
  pzip = Pull_project(p_name,'zip')
  public.update_slbTools()
  if p_type == 'all':
    pzip.tpull()
    pzip.rsync_data()
    pserver.tpull()
    pweb.tpull()
    pweb.rsync_data()
    link.link_server(p_name)
    zip_rsync.do(p_name)
    pzip.rsync_data()
  elif p_type == 'web':
    pweb.tpull()
    pweb.rsync_data()
    link.link_server(p_name)
  elif p_type == 'zip':
    pzip.tpull()
    pzip.rsync_data()
    zip_rsync.do(p_name)
    pzip.rsync_data()
  elif p_type == 'server':
    pserver.tpull()
  else:
    err_info = "Please check project pull type !!!!"
    public.recode_log(err_info, 'error')
    public.xiushi(err_info, 'error')
    quit()


#------------------------------------------------------pull mwws class-----------------------------------
class Pull_mwws(object):
  def __init__(self, tstore):
    self.tstore = self.ptype = tstore
    self.tstore_path = "/root/{0}".format(self.tstore)
  def tpull(self):
    def do(store_name, tpath):
      lg = git_log_recode.Log_git(os.path.basename(tpath))
      lg.plog() 
      public.update_slbTools()
      os.chdir(tpath)
      right_info = "git pull {0}".format(store_name)
      public.recode_log(right_info, 'info')
      public.xiushi(right_info, 'info')
      if os.system('git pull') == 0:
        right_info = "pull {0} success".format(store_name)
        public.recode_log(right_info, 'info')
        public.xiushi(right_info, 'info')
      else:
        chongtu.slove_chongtu(self.tstore_path, self.ptype).mv_err()
    if os.path.exists(self.tstore_path):
      do(self.tstore, self.tstore_path)
    else:
      err_info = "{0} not exists !!!!!!!!!!!".format(self.tstore_path)
      public.recode_log(err_info, 'error')
      public.xiushi(err_info, 'error')
      quit()
