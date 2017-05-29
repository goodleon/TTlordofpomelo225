#!/usr/bin/python
#coding=utf8

import logging
from logging.handlers import RotatingFileHandler
import os,sys
Current_PATH = os.getcwd()
BASE_PATH = os.path.dirname(os.path.dirname(Current_PATH + os.sep + __file__))
sys.path.append(BASE_PATH)
sys.path.append("/root/slbTools/ydx/shell/")
import base_fuc
mk = base_fuc.mkfp()
from config import settings

def red(info):
  return "\033[1;31;40m{0}\033[0m".format(info)
def green(info):
  return "\033[1;32;40m{0}\033[0m".format(info)

#---------------------------------------xiushi------------------------------------
def xiushi(nr, itype):
#  print "-"*(len(nr)+10)
  if itype == "error":
    print red("\t{0}".format(nr))
  elif itype == "info":
    print green("\t{0}".format(nr))
#  print "-"*(len(nr)+10)

#------------------------------------------log---------------------------------------
log_path = '/home/logs/'
pull_log = '{0}pull.log'.format(log_path)
def recode_log(nr, ntype):
  mk.mkf(pull_log)
  logging.basicConfig(level=logging.DEBUG,
              format='%(asctime)s %(filename)s[line:%(lineno)d] %(levelname)s %(message)s',
              filename=pull_log,
              filemode='a')
  console=logging.StreamHandler()
  console.setLevel(logging.DEBUG)
  formatter=logging.Formatter('%(message)s')
  console.setFormatter(formatter)
#  logging.getLogger().addHandler(console)
  if ntype == 'info':
    logging.info(nr)
  elif ntype == 'error':
    logging.error(nr)
  else:
    xiushi("Please Usage error/info", 'info')

#-----------------------------------------clear log-----------------------------------
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
clog = pull_log
ul = Update_log(clog, 10000)
ul.lclear()

#---------------------------------------------update slbTools------------------------------
def update_slbTools():
  slb_path = "/root/slbTools"
  if os.path.exists(slb_path):
    os.chdir(slb_path)
    os.system("git pull")
