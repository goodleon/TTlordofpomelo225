#!/usr/bin/python
#coding=utf8

import os,sys
import socket,shutil
Current_PATH = os.getcwd()
BASE_PATH = os.path.dirname(os.path.dirname(Current_PATH + os.sep + __file__))
sys.path.append(BASE_PATH)
sys.path.append("/root/slbTools/ydx/shell/")
import base_fuc
import subprocess
from config import settings
from lib import public
mk = base_fuc.mkfp()
import pull
#----------------------------------------------slove chongtu----------------------
class slove_chongtu(object):
  def __init__(self, pull_path, ptype):
    self.pull_path = pull_path
    self.ptype = ptype
    self.target_ku = self.pull_path.split("/")[-1]
  def mv_err(self):
    os.chdir(self.pull_path)
    x = subprocess.Popen(['git', 'pull'], stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    chongtu_list = []
    for err in x.stderr.readlines():
      if "overwritten by merge" in err:
        continue
      elif "you can merge" in err:
        continue
      elif "Aborting" in err:
        continue
      else:
        err = err.strip()
        err_file = "{0}/{1}".format(self.pull_path, err)
        chongtu_list.append(err_file)
    if len(chongtu_list) > 0:
      bakpath = "/home/chongtu_bak/{0}/{1}".format(self.ptype, settings.bak_time)
      bfile_fbak_list = []
      for bfile in chongtu_list:
#--------------------------------------------s_t list-------------------------
        sfile = bfile.replace(self.pull_path+os.sep, "")
        if os.sep in sfile:
          n_list = sfile.split("/")
          sname = n_list[-1]
          n_list.remove(sname)
          create_path = "{0}/{1}".format(bakpath, "/".join(n_list))
          fbak = "{0}/{1}".format(create_path, sname)
          bfile_fbak_list.append("{0}:{1}".format(bfile, fbak))
        else:
          fbak = "{0}/{1}".format(bakpath, sfile)
          bfile_fbak_list.append("{0}:{1}".format(bfile, fbak))
#--------------------------------------------bak------------------------------
        t_catalog = os.path.dirname(fbak)
        mk.mkp(t_catalog)
        shutil.move(bfile, fbak)
        if os.path.exists(fbak):
          right_info = "file {0} move to {1} success".format(bfile, fbak)
          public.recode_log(right_info, 'info')
          public.xiushi(right_info, 'info')
        else:
          err_info = "file {0} move to {1} fail !!!!!!!!".format(bfile, fbak)
          public.recode_log(err_info, 'error')
          public.xiushi(err_info, 'error')
          quit()
#--------------------------------------------restore------------------------------
      target_ku = os.path.basename(self.pull_path)
      if "_" in target_ku:
        target_ku = target_ku.split("_")[0]
      if self.ptype == "server":
        pserver = pull.Pull_project(target_ku,'server')
        pserver.tpull()
      elif self.ptype == "web":
        pweb = pull.Pull_project(target_ku,'web')
        pweb.tpull()
      elif self.ptype == "zip":
        pzip = pull.Pull_project(target_ku,'zip')
        pzip.tpull()
      elif self.ptype == "slbTools":
        pm = pull.Pull_mwws(target_ku)
        pm.tpull()
      else:
        restore_list = ['webadmin', 'webagent', 'mjserver']
        if target_ku in restore_list:
          pm = pull.Pull_mwws(target_ku)
          pm.tpull()
#          for nr in bfile_fbak_list:
#            t = nr.split(":")[0]
#            s = nr.split(":")[1]
#            rsync_cmd = "rsync -a {0} {1}".format(s, t)
#            if os.system(rsync_cmd) == 0:
#              right_info = "rollback file {0} to {1} success".format(s, t)
#              public.recode_log(right_info, 'info')
#              public.xiushi(right_info, 'error')
#            else:
#              err_info = "rollback file {0} to {1} success".format(s, t)
#              public.recode_log(err_info, 'error')
#              public.xiushi(err_info, 'error')
#              quit()
        else:
          pass

