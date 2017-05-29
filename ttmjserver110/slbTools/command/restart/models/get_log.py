#!/usr/bin/python
#coding=utf8

import os,sys
Current_PATH = os.getcwd()
BASE_PATH = os.path.dirname(os.path.dirname(Current_PATH + os.sep + __file__))
sys.path.append(BASE_PATH)
sys.path.append("/root/slbTools/ydx/shell/")
from config import settings
uncaught_path = '/root/mjserver/game-server/uncaught/'
logs_path = '/root/mjserver/game-server/logs/'

def do():
  logs_list = os.popen('find {0} -type f -mmin -5'.format(logs_path)).read().strip().split()
  logs_list = sorted(logs_list,key=os.path.getmtime)
  uncaught_list = os.popen('find {0} -type f -mmin -5'.format(uncaught_path)).read().strip().split()
  uncaught_list = sorted(uncaught_list,key=os.path.getmtime)
  if len(uncaught_list) > 0:
    print "5分钟内uncaught目录更新日志:"
    for log_file in uncaught_list:
      print "\t{0}".format(log_file)
  else:
    print "5分钟内uncaught目录没有日志更新"
  if len(logs_list) > 0:
    print "5分钟内logs目录更新日志:"
    for log_file in logs_list:
      print "\t{0}".format(log_file)
  else:
    print "5分钟内logs目录没有日志更新"

def cat_ulog(ulog):
  logfile = "{0}/{1}".format(uncaught_path, ulog)
  if os.path.exists(logfile):
    with open(logfile) as f:
      x = f.readlines()[-50:]
    for nr in x:
      print nr.strip('\n')
