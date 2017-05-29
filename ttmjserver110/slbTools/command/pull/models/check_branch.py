#!/usr/bin/python
#coding=utf8

import os,sys
Current_PATH = os.getcwd()
BASE_PATH = os.path.dirname(os.path.dirname(Current_PATH + os.sep + __file__))
sys.path.append(BASE_PATH)
sys.path.append("/root/slbTools/ydx/shell/")
import base_fuc
from config import settings
import socket
from lib import public
#---------------------------------------------check_branch--------------------------------
def do(path):
  if not os.path.exists(path):
    err_info = "check branch not exec because not exist {0}".format(path)
    public.recode_log(err_info, 'error')
    public.xiushi(err_info, 'error')
  else:
    os.chdir(path)
    x = os.popen("git branch").read().strip()
    nr_list = x.split("\n")
    for nr in nr_list:
      if "*" in nr:
        current_branch = nr.split()[-1]
        if current_branch == "rollback":
          enter_parameter = raw_input(settings.green("Current branch is {0} update (y/n): ".format(current_branch)))
          if enter_parameter == "n":
            quit()
        break
