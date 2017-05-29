#!/usr/bin/python
#coding=utf8
import os,sys
import socket
import time
import glob
import logging
import subprocess
from logging.handlers import RotatingFileHandler
import shutil
bak_time = time.strftime("%Y%m%d_%H%M%S")
script_path_list = ["/root/slbTools/ydx/shell/"]
for script_path in script_path_list:
  sys.path.append(script_path)
import base_fuc
mk = base_fuc.mkfp()
hname = socket.gethostname().lower()
 
def red(info):
  return "\033[1;31;40m{0}\033[0m".format(info)
def green(info):
  return "\033[1;32;40m{0}\033[0m".format(info)

if len(sys.argv) == 2:
  target = sys.argv[1]
elif len(sys.argv) == 3:
  target = sys.argv[1]
  tstores = sys.argv[2]
else:
  print "-----------------------------------------------------------------------------------------------"
  print green("\tPlease Usage {0} 'progect'".format(sys.argv[0]))
  print green("\tPlease Usage {0} 'progect' 'mjserver/webadmin/webagent/slbTools/web/zip/server'".format(sys.argv[0]))
  print green("\tPlease Usage {0} 'mjserver/webadmin/webagent/slbTools'".format(sys.argv[0]))
  print "-----------------------------------------------------------------------------------------------"
  quit()

mwws_biaoshi = 'mwws'
jsonbak_path = '/home/backup/{0}/'.format(target)
log_path = '/home/logs/'
#------------------------------------------log---------------------------------------
pull_log = '{0}pull.log'.format(log_path)
mk.mkf(pull_log)
logging.basicConfig(level=logging.DEBUG,
              format='%(asctime)s %(filename)s[line:%(lineno)d] %(levelname)s %(message)s',
              filename=pull_log,
              filemode='a')
console=logging.StreamHandler()
console.setLevel(logging.DEBUG)
formatter=logging.Formatter('%(message)s')
console.setFormatter(formatter)
logging.getLogger().addHandler(console)
#-----------------------------------------clear log-----------------------------------
clog = pull_log
class Update_log(object):
  def __init__(self, logfile, scount):
    self.logfile = logfile
    self.scount = scount
  def lclear(self):
    ccount = len(open(self.logfile, 'rb').readlines())
    if ccount > self.scount:
      dcount = int(ccount) - self.scount
      with open(self.logfile, 'rb') as f:
        x = f.readlines()
        del x[:dcount]
        with open(self.logfile, 'wb') as f:
          f.writelines(x)
ul = Update_log(clog, 10000)
ul.lclear()
#--------------------------------------check root parttions ------------------
def check_root_parttion():
  import base_ci_package
  base_ci_package.check_package("python-devel", 'yum')
  base_ci_package.check_package("gcc", 'yum')
  base_ci_package.check_package("python2-pip", 'yum')
  base_ci_package.check_package("psutil", 'python')
  import psutil
  current_usage = psutil.disk_usage('/').percent
  if current_usage > 80:
    print "--------------------------------------------------------------"
    logging.error(red("Warning !!! Current root parttion space is usage {0}%".format(current_usage)))
    print "--------------------------------------------------------------"
    enter_value = raw_input(green("Continue ? (y/n): "))
    if enter_value.lower() == "y":
      pass
    elif enter_value.lower() == "n":
      quit()
    else:
      print red("input info is error please usage y/n")
      quit()
#------------------------------------git clone--------------------------------------------------
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
  def tclone(self):
    if not os.path.exists(self.progect_path):
      git_cmd = 'git clone http://git.happyplaygame.net/Publish/{0}_{1}.git {2}'.format(self.progect, self.ptype, self.progect_path)
      if not os.system(git_cmd) == 0:
        print "-------------------------------------------------------------------------"
        logging.error(red("\tclone {0}_{1} fail !!!!!!!!!!".format(self.progect, self.ptype)))
        print "-------------------------------------------------------------------------"
        quit()
      else:
        print "-------------------------------------------------------------------------"
        logging.info(green("\tclone {0}_{1} success".format(self.progect, self.ptype)))
        print "-------------------------------------------------------------------------"
#------------------------------------------------------link server---------------------------------
def link_server():
  def project_link(spath, tpath):
    def do():
      sp = subprocess.call('ln -s %s %s' % (spath, tpath), shell=True)
      if sp == 0:
        print "---------------------------------------------------------------------------------"
        logging.info(green('\tlink {0} to {1} success'.format(spath, tpath)))
        print "---------------------------------------------------------------------------------"
      else:
        print "---------------------------------------------------------------------------------"
        logging.error(red("\tlink {0} to {1} fail !!!!!!!!".format(spath, tpath)))
        print "---------------------------------------------------------------------------------"
    if not os.path.exists(spath):
      logging.error(red("\tnot exists {0}".format(spath)))
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
    lin_list = glob.glob("/root/{0}/*".format(target))
    for a in lin_list:
      if os.path.basename(a) == "web":
        continue
      else:
        if os.path.isdir(a) == True:
          spath = "/root/{0}/{1}".format(target, os.path.basename(a))
          tpath = "/root/mjserver/game-server/app/servers/pkroom/games/{0}".format(os.path.basename(a))
          project_link(spath, tpath)
  if server_type == "lb":
    mk.mkp("/root/web")
    spath = "/root/{0}/web".format(target)
    tpath = "/root/web/{0}".format(target)
    project_link(spath, tpath)
  elif server_type in d_list:
    game_link()
    spath = "/root/{0}/web".format(target)
    tpath = "/root/mjserver/web-server/public/{0}".format(target)
    project_link(spath, tpath)
  elif server_type in lpr_list:
    game_link()
#------------------------------------pull project class-----------------------------------------
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
    lg = Log_git(os.path.basename(self.progect_path))
    lg.plog()
    check_branch(self.progect_path)
    if os.path.exists(self.progect_path):
      store_name = self.progect_path.split("/")[-1]
      os.chdir(self.progect_path)
      if os.system('git pull') == 0:
        print "----------------------------------------------"
        logging.info(green("\tpull {0} success".format(store_name)))
        print "----------------------------------------------"
      else:
        slove_chongtu(self.progect_path, self.ptype).mv_err()
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
        print "-----------------------------------------"
        logging.error(red("\tNot exists {0} !!!!!".format(p)))
        print "-----------------------------------------"
        quit()
    if os.system(rsync_web) == 0:
      print "---------------------------------------------------------------"
      logging.info(green("\trsync {0} to {1} success".format(web_path, server_web_path)))
      print "---------------------------------------------------------------"
    else:
      quit()
#------------------------------------------------------pull mwws class-----------------------------------
class Pull_mwws(object):
  def __init__(self, tstore):
    self.tstore = self.ptype = tstore
    self.tstore_path = "/root/{0}".format(self.tstore)
  def tpull(self):
    def do(store_name, tpath):
      lg = Log_git(os.path.basename(tpath))
      lg.plog()
      os.chdir(tpath)
      print "-------------------------------------"
      logging.info(green("\tgit pull {0}".format(store_name)))
      print "-------------------------------------"
      if os.system('git pull') == 0:
        print "-------------------------------------"
        logging.info(green("\tpull {0} success".format(store_name)))
        print "-------------------------------------"
      else:
        slove_chongtu(self.tstore_path, self.ptype).mv_err()
    if self.tstore == mwws_biaoshi:
      mwws_list.remove(mwws_biaoshi)
      for s in mwws_list:
        self.tstore_path = "/root/{0}".format(s)
        if os.path.exists(self.tstore_path):
          do(s, self.tstore_path)
        else:
          print "----------------------------------------------------"
          logging.error(red("\t{0} not exists !!!!!!!!!!!".format(self.tstore_path)))
          print "----------------------------------------------------"
          quit()
    else:
      if os.path.exists(self.tstore_path):
        do(self.tstore, self.tstore_path)
      else:
        print "----------------------------------------------------"
        logging.error(red("\t{0} not exists !!!!!!!!!!!".format(self.tstore_path)))
        print "----------------------------------------------------"
        quit()

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
      tt_path = jsonbak_path + bak_time
      mk.mkp(tt_path)
      del_old_dir(jsonbak_path)
      for ss in bak_list:
        if ss == mwws_biaoshi:
          ss_path = spath + "webadmin"
        else:
          ss_path = spath + ss
        if os.path.exists(ss_path):
          rsync_cmd = 'rsync -a {0} {1}'.format(ss_path, tt_path)
          if os.system(rsync_cmd) == 0:
            logging.info(green("\tbackup {0} to {1} success".format(ss_path, tt_path)))
          else:
            logging.error(red("\tbackup {0} to {1} fail !!!!!!".format(ss_path, tt_path)))
            quit()
    if self.tproject in ["webadmin", mwws_biaoshi]:
      spath = '/root/{0}/'.format("webadmin")
      bak_list = ['config', 'alipay', 'notice.json']
      do()
    elif self.tproject == progect_name:
      spath = '/root/{0}/web/'.format(self.tproject)
      bak_list = ['notice.json', 'action.json', 'gamefree.json']
      x = glob.glob(spath+'con*')
      for path in x:
        tfile = path.split('/')[-1]
        bak_list.append(tfile)
      do()
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
        log_info = "\t{0}:{1}".format(self.pro_name, pro_commit_version)
        logging.info(green(log_info))
      else:
        print "---------------------------------------------------------------------"
        logging.error(red("\texecute {0} \"{1}\" is fail !!!!!".format(self.pro_name, log_cmd)))
        print "---------------------------------------------------------------------"
    if self.pro_name == mwws_biaoshi:
      for ml in mwws_list:
        if ml == mwws_biaoshi:
          continue
        else:
          pro_path = '/root/{0}'.format(ml)
          if os.path.exists(pro_path):
            do(pro_path)
          else:
            logging.error(red("\tgit log not exec because not exist {0}".format(pro_path)))
    else:
      pro_path = '/root/{0}'.format(self.pro_name)
      if os.path.exists(pro_path):
        do(pro_path)
      else:
        logging.error(red("\tgit log not exec because not exist {0}".format(pro_path)))

#-----------------------------------get hostname------------------------------------------
hn_list = hname.split('-')
if len(hn_list) == 4:
  lb_name = net_line = hn_list[0]
  progect_name = hn_list[2]
  server_type = hn_list[1]
  server_id = hn_list[3]
elif len(hn_list) == 3:
  progect_name = lb_name = hn_list[0]
  server_type = hn_list[1]
  server_id = hn_list[2]
elif len(hn_list) == 2:
  progect_name = lb_name = hn_list[0]
  server_type = hn_list[1]
else:
  print "------------------------------------------------------"
  logging.error(red("\tPlease Check Current Hostname !!!!!"))
  print "------------------------------------------------------"
  quit()

d_list = ["data", "master"]
lpr_list = ["room", "pkplayer", "login", "pkplayerlogin", "loginpkplayer"]
mwws_list = [mwws_biaoshi, 'webadmin', 'webagent', 'slbTools', 'mjserver']
#-----------------------------------check project and hostname-----------------------
if target in mwws_list:
  pass
else:
  if server_type == "lb":
    pass
  elif not progect_name == target:
    print "---------------------------------------------------------------------"
    logging.error(red("\tPlease check current project_name and hostname !!!!!!!"))
    print "---------------------------------------------------------------------"
    quit()

#------------------------------------execute function---------------------------------------
def do_pull_web(p_name, p_type):
  pserver = Pull_project(p_name,'server')
  pweb = Pull_project(p_name,'web')
  pzip = Pull_project(p_name,'zip')
  if p_type == 'all':
    pzip.tpull()
    pzip.rsync_data()
    pserver.tpull()
    pweb.tpull()
    pweb.rsync_data()
    link_server()
  elif p_type == 'web':
    pweb.tpull()
    pweb.rsync_data()
    link_server()
  elif p_type == 'zip':
    pzip.tpull()
    pzip.rsync_data()
  elif p_type == 'server':
    pserver.tpull()
  else:
    print "------------------------------------------------------"
    logging.error(red("Please check project pull type !!!!"))
    print "------------------------------------------------------"
    quit()

def do_pull_project(p_name, p_type):
  pserver = Pull_project(p_name,'server')
  pweb = Pull_project(p_name,'web')
  pzip = Pull_project(p_name,'zip')
  if p_type == 'all':
    if server_type in d_list:
      pzip.tpull()
      pzip.rsync_data()
      pserver.tpull()
      pweb.tpull()
      pweb.rsync_data()
      link_server()
    elif server_type in lpr_list:
      pserver.tpull()
    elif server_type == "link":
      print "----------------------------------------"
      logging.error(red("\tLink server not pull project !!!!!!!!"))
      print "----------------------------------------"
      quit()
    else:
      print "------------------------------------------------------"
      logging.error(red("\tCannot determine the server role !!!!!!"))
      print "------------------------------------------------------"
      quit()
  elif p_type == 'web':
    if server_type in d_list:
      pweb.tpull()
      pweb.rsync_data()
      link_server()
    else:
      print "---------------------------------------------------------"
      logging.error(red("\t{0} server not pull project {1}!!!!!!!!".format(server_type, p_type)))
      print "--------------------------------------------------------"
      quit()
  elif p_type == 'zip':
    if server_type in d_list:
      pzip.tpull()
      pzip.rsync_data()
    else:
      print "------------------------------------------------------"
      logging.error(red("\t{0} server not pull project {1}!!!!!!!!".format(server_type, p_type)))
      print "------------------------------------------------------"
      quit()
  elif p_type == 'server':
    if server_type in d_list:
      pserver.tpull()
    elif server_type in lpr_list:
      pserver.tpull()
    else:
      print "------------------------------------------------------"
      logging.error(red("\t{0} server not pull project {1}!!!!!!!!".format(server_type, p_type)))
      print "------------------------------------------------------"
      quit()
  else:
    print "------------------------------------------------------"
    logging.error(red("Please check project pull type !!!!"))
    print "------------------------------------------------------"
    quit()

def clone_project(p_name, p_type='all'):
  cserver = Git_clone(p_name, 'server')
  cweb = Git_clone(p_name, 'web')
  czip = Git_clone(p_name, 'zip')
  if p_name in mwws_list:
    print "-------------------------------------------------------"
    logging.error(red("LB host not clone {0}".format(p_name)))
    print "-------------------------------------------------------"
    quit()
  if p_type == "all":
    if server_type in d_list:
      cserver.tclone()
      cweb.tclone()
      czip.tclone()
    elif server_type in lpr_list:
      cserver.tclone()
    elif server_type == "lb":
      cserver.tclone()
      cweb.tclone()
      czip.tclone()
    elif server_type == "link":
      print "----------------------------------------"
      logging.error(red("\tLink server not clone project !!!!!!!!"))
      print "----------------------------------------"
      quit()
    else:
      print "------------------------------------------------------"
      logging.error(red("\tCannot determine the server role !!!!!!"))
      print "------------------------------------------------------"
      quit()
  elif p_type == "web":
    if server_type in d_list:
      cweb.tclone()
    elif server_type == "lb":
      cweb.tclone()
    else:
      print "------------------------------------------------------"
      logging.error(red("\tCurrnet server not clone web project !!!!!!!!"))
      print "------------------------------------------------------"
      quit()
  elif p_type == "zip":
    if server_type in d_list:
      czip.tclone()
    elif server_type == "lb":
      czip.tclone()
    else:
      print "------------------------------------------------------"
      logging.error(red("\tCurrnet server not clone zip project !!!!!!!!"))
      print "------------------------------------------------------"
      quit()
  elif p_type == "server":
    if server_type in d_list:
      cserver.tclone()
    elif server_type == "lb":
      cserver.tclone()
    elif server_type in lpr_list:
      cserver.tclone()
    else:
      print "------------------------------------------------------"
      logging.error(red("\tCurrnet server not clone server project !!!!!!!!"))
      print "------------------------------------------------------"
      quit()
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
      bakpath = "/home/chongtu_bak/{0}/{1}".format(target, bak_time)
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
          print "-----------------------------------------------------------------------------------------"
          logging.info(green("file {0} move to {1} success".format(bfile, fbak)))
          print "-----------------------------------------------------------------------------------------"
        else:
          print "------------------------------------------------------------------------------------------"
          logging.error(red("file {0} move to {1} fail !!!!!!!!".format(bfile, fbak)))
          print "------------------------------------------------------------------------------------------"
          quit()
#--------------------------------------------restore------------------------------
      target_ku = os.path.basename(self.pull_path)
      if "_" in target_ku:
        target_ku = target_ku.split("_")[0]
      if self.ptype == "server":
        pserver = Pull_project(target,'server')
        pserver.tpull()
      elif self.ptype == "web":
        pweb = Pull_project(target,'web')
        pweb.tpull()
      elif self.ptype == "zip":
        pzip = Pull_project(target,'zip')
        pzip.tpull()
      elif self.ptype == "slbTools":
        pm = Pull_mwws(target)
        pm.tpull()
      else:
        restore_list = ['webadmin', 'webagent', 'mjserver']
        if target_ku in restore_list:
          pm = Pull_mwws(target)
          pm.tpull()
#          for nr in bfile_fbak_list:
#            t = nr.split(":")[0]
#            s = nr.split(":")[1]
#            rsync_cmd = "rsync -a {0} {1}".format(s, t)
#            if os.system(rsync_cmd) == 0:
#              print "-----------------------------------------------------------------------------------------"
#              logging.info(green("rollback file {0} to {1} success".format(s, t)))
#              print "-----------------------------------------------------------------------------------------"
#            else:
#              print "--------------------------------------------------------------------------------------"
#              logging.info(green("rollback file {0} to {1} success".format(s, t)))
#              print "-----------------------------------------------------------------------------------------"
#              quit()
        else:
          pass
#---------------------------------------------update slbTools------------------------------
def update_slbTools():
  slb_path = "/root/slbTools" 
  if os.path.exists(slb_path):
    os.chdir(slb_path)
    os.system("git pull")
update_slbTools()
#-----------------------------------------------do rollback---------------------------------
def do_roll_back(t):
  if server_type == "data" or server_type == "master":
    if not t in mwws_list:
      rollback_json_cmd = 'python /root/slbTools/command/rollback_json.py {0}'.format(t)
      if os.system(rollback_json_cmd) == 0:
        print "-----------------------------------------------------------------"
        logging.info(green("\texec {0} rollback json file success".format(t)))
        print "-----------------------------------------------------------------"
      else:
        print "-----------------------------------------------------------------"
        logging.error(red("\texec {0} rollback json file fail !!!!!!!!".format(t)))
        print "-----------------------------------------------------------------"

#---------------------------------------------check_branch--------------------------------
def check_branch(path):
  if not os.path.exists(path):
    logging.error(red("\tcheck branch not exec because not exist {0}".format(path)))
  else:
    os.chdir(path)
    x = os.popen("git branch").read().strip()
    nr_list = x.split("\n")
    for nr in nr_list:
      if "*" in nr:
        current_branch = nr.split()[-1]
        if current_branch == "rollback":
          print "-----------------------------------------------"
          enter_parameter = raw_input(green("Current branch is {0} update (y/n): ".format(current_branch)))
          print "-----------------------------------------------"
          if enter_parameter == "n":
            quit()
        break
#---------------------------------------------transfer functuon------------------------------
if server_type == "lb":
  def pull_lb(p_type):
    if len(hn_list) == 4:
      if progect_name == target:
        clone_project(target, p_type)
        do_pull_web(target, p_type)
      else:
        print "----------------------------------------------------------------------"
        logging.error(red("\tPlease check current LB hostname and project_name !!!!!!!"))
        print "----------------------------------------------------------------------"
        quit()
    elif len(hn_list) == 3:
      clone_project(target, p_type)
      do_pull_web(target, p_type)
    else:
      print "----------------------------------------------------------------------"
      logging.error(red("\tPlease check current LB hostname !!!!!!!"))
      print "----------------------------------------------------------------------"
      quit()
  try:
    tstores
  except Exception as e:
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
        print "------------------------------------------------------------"
        logging.error(red("\tParameter reversed , please check !!!!"))
        print "------------------------------------------------------------"
        quit()
      else:
        print "-----------------------------------------------------------------"
        logging.error(red("\tParameter {0} not in web/zip/server !!!!!!!!!!!!!!".format(tstores)))
        print "-----------------------------------------------------------------"
        quit()
else:
  check_list = ['mjserver', 'slbTools']
  test_list = ['a', 'test']
  def error_info(t):
    print "----------------------------------------------------------------"
    logging.error(red("\tcurrent host server_type is {0} not execute {1}".format(server_type, t)))
    print "----------------------------------------------------------------"
    quit()
  if len(sys.argv) == 2:
    mwws_store = Pull_mwws(target)
    dt = Data_bakup(target)
    if target in mwws_list:
      if server_type in d_list:
        dt.bak()
        mwws_store.tpull()
      elif server_type in lpr_list or server_type == 'link' or server_type in test_list:
        if target in check_list:
          dt.bak()
          mwws_store.tpull()
        else:
          error_info(target)
      else:
        error_info(target)
    else:
      clone_project(target)
      dt.bak()
      do_pull_project(target, 'all')
      do_roll_back(target)
  elif len(sys.argv) == 3:
    mwws_store = Pull_mwws(tstores)
    dt = Data_bakup(target)
    if tstores in mwws_list:
      if server_type in lpr_list or server_type == 'link':
        if not tstores in check_list:
          error_info(tstores)
    def do_clone_and_bak(p_type='all'):
      clone_project(target, p_type)
    if tstores in mwws_list:
      mwws_dt = Data_bakup(tstores)
      mwws_dt.bak()
      mwws_store.tpull()
      dt.bak()
      do_clone_and_bak()
      do_pull_project(target, 'all')
      do_roll_back(target)
    elif tstores == "web":
      dt.bak()
      do_clone_and_bak(tstores)
      do_pull_project(target, tstores)
      do_roll_back(target)
    elif tstores == "zip":
      do_clone_and_bak(tstores)
      do_pull_project(target, tstores)
    elif tstores == "server":
      do_clone_and_bak(tstores)
      do_pull_project(target, tstores)
    else:
      if tstores == progect_name:
        print "------------------------------------------------------------------------"
        logging.error(red("\tParameter reversed , please check !!!!"))
        print "------------------------------------------------------------------------"
        quit()
      else:
        print "-----------------------------------------------------------------"
        logging.error(red("\tParameter {0} is error !!!!!!!!!!!!!!".format(tstores)))
        print "-----------------------------------------------------------------"
        quit()

if lb_name == "abroad":
  os.chdir("/root/slbTools")
  setRegion_cmd = "bash setRegion {0}".format(target)
  if os.system(setRegion_cmd) == 0:
    print "-----------------------------------------------------------------"
    logging.info(green("\texec {0} setRegion success".format(target)))
    print "-----------------------------------------------------------------"
  else:
    print "-----------------------------------------------------------------"
    logging.error(red("\texec {0} setRegion fail !!!!!!!!".format(target)))
    print "-----------------------------------------------------------------"

check_root_parttion()
