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
import shutil

def red(info):
  return "\033[1;31;40m{0}\033[0m".format(info)
def green(info):
  return "\033[1;32;40m{0}\033[0m".format(info)

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
#------------------------------------------get port------------------------
yuyin_conf = '/root/voiceServer/ud/master.json'
import json
with open(yuyin_conf) as f:
  nr = f.read()
dict = json.loads(nr)
port_list = []
project_list = []
for project_name in dict.keys():
  project_list.append(project_name)
  port_list.append(dict[project_name]['port'])
port_list.sort()
#------------------------------------------add project-----------------------------
def add_project():
  new_nr = '"%s":     { "port": %d},\n' % (target, port_list[-1]+1)
  with open(yuyin_conf) as f:
    new_list = f.readlines()
    biaodi_nr = new_list[-3]
    new_list[-3] = "{0}  {1}".format(biaodi_nr, new_nr)
  bak_file = "{0}.{1}".format(yuyin_conf, bak_time)
  try:
    shutil.copy2(yuyin_conf, bak_file)
  except Exception as e:
    print e
    logging.error(red("\tbak {0} to {1} fail!!!!!!".format(yuyin_conf, bak_file)))
    quit()
  else:
    logging.info(green("\tbak {0} to {1} success".format(yuyin_conf, bak_file)))
  try:
    with open(yuyin_conf, 'wb') as f:
      f.write("".join(new_list))
  except Exception as e:
    print e
    logging.error(red("\tupdate {0} configure to {1} fail!!!!!!".format(target, yuyin_conf)))
    quit()
  else:
    logging.info(green("\tupdate {0} configure to {1} success".format(target, yuyin_conf)))
#------------------------------------------check process---------------------------
def check():
  for project in project_list:
    check_biaodi = '/root/voiceServer/ud/app.js {0}'.format(project)
    ps_cmd = "ps -ef|grep -v grep|grep '{0}'".format(check_biaodi)
    spp = subprocess.Popen(ps_cmd, shell=True, stdout=subprocess.PIPE)
    try:
      exist_project = spp.stdout.read().split()[-1]
    except Exception as e:
      logging.error(red("\tnot exist {0} process !!!!".format(project)))
      start_project(project)
    else:
      if not project == exist_project:
        print "-----------------------------------------------------------"
        logging.error(red("\tprocess name {1} not equel {0} !!!!!!".format(project, exist_project)))
        print "-----------------------------------------------------------"
        break
def start_project(pname):
  start_cmd = 'forever start app.js {0}'.format(pname)
  os.chdir('/root/voiceServer/ud')
  if os.system(start_cmd) == 0:
    logging.info(green("\tstart project {0} yuyin server success".format(pname)))
  else:
    logging.error(red("\tstart project {0} yuyin server fail !!!!!!!!".format(pname)))
    quit()

def do_script():
  print green("Please Usage \npython {0} do check\npython {0} do stop\npython {0} do restart\npython {0} add project_name".format(sys.argv[0]))
if len(sys.argv) == 3:
  dotype = sys.argv[1]
  target = sys.argv[2]
else:
  do_script()
  quit()

if dotype == "do":
  if target == "check":
    check()
  elif target == "stop":
    if os.system('pkill -9 node') == 0:
      logging.info(green("\tstop all yuyin server success"))
    else:
      logging.error(red("\tstop all yuyin server fail !!!!!!"))
      quit()
  elif target == "restart":
    if os.system('pkill -9 node') == 0:
      logging.info(green("\tstop all yuyin server success"))
      time.sleep(2)
      check()
    else:
      logging.error(red("\tstop all yuyin server fail !!!!!!"))
      quit()
  else:
    do_script()
    quit()
elif dotype == 'add':
  if target not in project_list:
    add_project()
    start_project(target)
  else:
    logging.error(red("\tproject {0} is allready exists can't update".format(target)))
    quit()
else:
  do_script()
  quit()

