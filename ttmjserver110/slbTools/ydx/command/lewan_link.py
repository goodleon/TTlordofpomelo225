#!/usr/bin/python
#coding=utf8
import os,sys,time,re
import logging
import subprocess
from logging.handlers import RotatingFileHandler
import shutil
import socket
import json
import glob

def red(info):
  return "\033[1;31;40m{0}\033[0m".format(info)
def green(info):
  return "\033[1;32;40m{0}\033[0m".format(info)

hname = socket.gethostname().lower()
host_stype = hname.split("-")[1]
host_project = hname.split("-")[0]
bak_time = time.strftime("%Y%m%d_%H%M%S")
script_path = "/root/slbTools/ydx/shell/"
sys.path.append(script_path)
import base_fuc
mk = base_fuc.mkfp()
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
#--------------------------------------get ip and role---------------------------------------
import fcntl
import struct
def get_ip_address(ifname):
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    return socket.inet_ntoa(fcntl.ioctl(
        s.fileno(),
        0x8915,  # SIOCGIFADDR
        struct.pack('256s', ifname[:15])
    )[20:24])
eth_ip = get_ip_address("eth0")

data_list = ['data', 'master']
test_list = ['test', 'a']
lpr_list = ["room", "pkplayer", "login", "pkplayerlogin", "loginpkplayer"]

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
def test_link():
  check_path = '/root/{0}/server/{0}'.format(target)
  if os.path.exists(check_path):
    target_type = 'dir'
  else:
    target_type = 'file'
  if target_type == 'dir':
    target_path = '/root/{0}/server'.format(target)
    nlist = glob.glob("{0}/*".format(target_path))
    for f in nlist:
      if os.path.isdir(f):
        search_target = f.split("/")[-1]
        spath = "{0}/{1}".format(target_path, search_target)
        tpath = "/root/mjserver/game-server/app/servers/pkroom/games/{0}".format(search_target)
      else:
        continue
      try:
        tpath
      except Exception as e:
        pass
      else:
        project_link(spath, tpath)
  elif target_type == 'file':
    spath = "/root/{0}/server".format(target)
    tpath = "/root/mjserver/game-server/app/servers/pkroom/games/{0}".format(target)
    project_link(spath, tpath)

def test_web_link():
  print "---------------------------------------------"
  print green("\t更新服新加项目,请首先拉取新项目")
  print green("\t更新服新加项目,记得更新FileSync.sh")
  print "---------------------------------------------"
  spath = "/root/{0}/server".format(target)
  tpath = "/root/mjserver/game-server/app/servers/pkroom/games/{0}".format(target)
  project_link(spath, tpath)
  spath = "/root/{0}/web".format(target)
  tpath = "/root/web/{0}".format(target)
  project_link(spath, tpath)
  spath = "/root/{0}/web".format(target)
  tpath = "/root/mjserver/web-server/public/{0}".format(target)
  project_link(spath, tpath)

def link_logCat():
  def check_logCat_user():
    with open('/etc/passwd') as f:
      nr = f.readlines()
      if not "logCat" in "".join(nr):
        user_cmd = 'useradd {0};echo "{0}"|passwd --stdin {0}'.format('logCat')
        if os.system(user_cmd) == 0:
          logging.info(green("\tcreate system user logCat success"))
        else:
          logging.error(red("\tcreate system user logCat fail !!!!!"))
          quit()
  def create_logcat_file():
    if not os.path.exists(logCat_file):
      mk.mkf(logCat_file)
      bc = base_fuc.chown_fp()
      bc.cown_fp(logCat_file, "logCat")
  target_path = '/root/{0}/server'.format(target)
  check_path = '/root/{0}/server/{0}'.format(target)
  nlist = glob.glob("{0}/*".format(target_path))
  if os.path.exists(check_path):
    target_type = 'dir'
  else:
    target_type = 'file'
  if target_type == 'dir':
    for f in nlist:
      if os.path.isdir(f):
        search_target = f.split("/")[-1]
        logCat_file = "/home/logCat/{0}.txt".format(search_target)
        tpath = "/root/{0}/server/{1}/log.txt".format(target, search_target)
      else:
        continue
      try:
        tpath
      except Exception as e:
        pass
      else:
        check_logCat_user()
        create_logcat_file()
        project_link(logCat_file, tpath)
  elif target_type == 'file':
    logCat_file = "/home/logCat/{0}.txt".format(target)
    check_logCat_user()
    create_logcat_file()
    tpath = "/root/{0}/server/log.txt".format(target)
    project_link(logCat_file, tpath)

def copy_file():
  s_list = ["/root/mjserver/version/rpc-client/mailbox.js:/usr/lib/node_modules/pomelo/node_modules/pomelo-rpc/lib/rpc-client/mailbox.js", "/root/mjserver/version/rpc-client/mailboxes/tcp-mailbox.js:/usr/lib/node_modules/pomelo/node_modules/pomelo-rpc/lib/rpc-client/mailboxes/tcp-mailbox.js", "/root/mjserver/version/rpc-server/acceptor.js:/usr/lib/node_modules/pomelo/node_modules/pomelo-rpc/lib/rpc-server/acceptor.js"]
  for s in s_list:
    s_file = s.split(':')[0]
    t_file = s.split(':')[1]
    rsync_cmd = 'rsync -a {0} {1}'.format(s_file, t_file)
    if not os.path.exists(t_file):
      if os.system(rsync_cmd) == 0:
        print "-----------------------------------------------------------------------------"
        logging.info(green("\tcopy {0} to {1} success".format(s_file, t_file)))
        print "-----------------------------------------------------------------------------"
      else:
        print "-----------------------------------------------------------------------------"
        logging.error(red("\tcopy {0} to {1} fail !!!!!!!!".format(s_file, s_file)))
        print "-----------------------------------------------------------------------------"
        quit()

def node_exec(dtype, project_name):
  def do_link():
    spath = "/root/{0}/web".format(project_name)
    tpath = "/root/mjserver/web-server/public/{0}".format(project_name)
    project_link(spath, tpath)
    spath = "/playlog"
    tpath = "/root/mjserver/web-server/public/playlog"
    project_link(spath, tpath)
    spath = "/root/webagent/public"
    tpath = "/root/webadmin/public"
    project_link(spath, tpath)
    if not host_stype in test_list:
      spath = "/root/dataCenterService"
      tpath = "/root/webadmin/dataCenterService"
      project_link(spath, tpath)
    spath = "/root/mjserver/game-server/uncaught"
    tpath = "/root/webadmin/public/uncaught"
    project_link(spath, tpath)
    spath = "/root/mjserver/game-server/logs"
    tpath = "/root/webadmin/public/logs"
    project_link(spath, tpath)
  def do_all():
    if host_stype == "lb":
      mk.mkp("/root/web")
      spath = "/root/{0}/web".format(project_name)
      tpath = "/root/web/{0}".format(project_name)
      project_link(spath, tpath)
    elif host_stype in data_list:
      game_link()
      do_link()
    elif host_stype in test_list:
      do_link()
      test_link()
      link_logCat()
    elif host_stype in lpr_list:
      game_link()
    else:
      logging.error(red("\t{0} is error!!!!".format(host_stype)))
      quit()
  def logcat():
    if host_stype in test_list:
      link_logCat()
    else:
      logging.error(red("\tCurrent host is not test server ！！！！"))
  if dtype == "all":
    do_all()
  elif dtype == 'logcat':
    logcat()
  elif dtype == "testweblink":
    test_web_link()
  else:
    logging.error(red("\t{0} is not in ['all', 'logcat', 'testweblink']").format(dtype))
    quit()

if len(sys.argv) == 3:
  dotype = sys.argv[1]
  target = sys.argv[2]
  if dotype == "all":
    copy_file()
    node_exec(dotype, target)
  elif dotype == "logcat":
    node_exec(dotype, target)
  elif dotype == "testweblink":
    copy_file()
    node_exec(dotype, target)
  else:
    print green("\tplease Usage \"python {0} all/logcat/testweblink project_name\"".format(sys.argv[0]))
    quit()
else:
  print green("\tplease Usage \"python {0} all/logcat/testweblink project_name\"".format(sys.argv[0]))
  quit()
