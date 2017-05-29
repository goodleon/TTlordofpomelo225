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
from models import tocheck
#--------------------------------------check root parttions ------------------
def do():
  tocheck.c_package("python-devel", 'yum')
  tocheck.c_package("gcc", 'yum')
  tocheck.c_package("python2-pip", 'yum')
  tocheck.c_package("psutil", 'python')
  import psutil
  current_usage = psutil.disk_usage('/').percent
  if current_usage > 80:
    err_info = "Warning !!! Current root parttion space is usage {0}%".format(current_usage)
    public.recode_log(err_info, 'error')
    public.xiushi(err_info, 'error')
    enter_value = raw_input("Continue ? (y/n): ")
    if enter_value.lower() == "y":
      pass
    elif enter_value.lower() == "n":
      quit()
    else:
      print "input info is error please usage y/n"
      quit()
