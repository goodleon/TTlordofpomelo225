#!/usr/bin/python
#coding=utf8

import os,glob
import sys,shutil
import socket
import logging
from logging.handlers import RotatingFileHandler
def red(info):
  return "\033[1;31;40m{0}\033[0m".format(info)
def green(info):
  return "\033[1;32;40m{0}\033[0m".format(info)

if len(sys.argv) == 2:
  project = sys.argv[1]
else:
  print "-----------------------------------------"
  print "Please Usage {0} project".format(sys.argv[0])
  print "-----------------------------------------"
  quit()
hname = socket.gethostname()
hn_list = hname.split('-')
d_list = ["data", "master"]
server_type = hn_list[1]
log_path = '/home/logs/'

#------------------------------------------log---------------------------------------
pull_log = '{0}pull.log'.format(log_path)
logging.basicConfig(level=logging.DEBUG,
              format='%(asctime)s %(filename)s[line:%(lineno)d] %(levelname)s %(message)s',
              filename=pull_log,
              filemode='a')
console=logging.StreamHandler()
console.setLevel(logging.DEBUG)
formatter=logging.Formatter('%(message)s')
console.setFormatter(formatter)
logging.getLogger().addHandler(console)

class rollback_project(object):
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
            print "--------------------------------------------------------------------------------------"
            logging.info(green("\trollback {0} to /root/{1}/web/ success".format(t_file, self.project)))
            print "--------------------------------------------------------------------------------------"
          else:
            print "--------------------------------------------------------------------------------------"
            logging.error(red("\trollback {0} to /root/{1}/web/ fail !!!!!!".format(t_file, self.project)))
            print "--------------------------------------------------------------------------------------"
      else:
        print "--------------------------------------------------"
        logging.error(red("\t{0} is not catalog !!!!!!".format(t_catalog)))
        print "--------------------------------------------------"
        quit()
    else:
      print "------------------------------------------------------------------------"
      logging.error(red("\tbak path {0} is not exist !!!!!!!!!".format(s_path)))
      print "------------------------------------------------------------------------"
      quit()
    
rp = rollback_project(project)
rp.do()
