#!/usr/bin/python
#coding=utf8

import os,sys
import re
import socket
import time
Current_PATH = os.getcwd()
BASE_PATH = os.path.dirname(os.path.dirname(Current_PATH + os.sep + __file__))
sys.path.append(BASE_PATH)
sys.path.append("/root/slbTools/ydx/shell/")
import base_fuc
import subprocess
from config import settings
from lib import public

def c_150():
  get_cmd = 'netstat -anltp|grep -c :150'
  pkcon_counters = int(os.popen(get_cmd).read().strip())
  while pkcon_counters > 10:
    print settings.red("\tCurrent not closed TCP number is : {0}".format(pkcon_counters))
    pkcon_counters = int(os.popen(get_cmd).read().strip())
    time.sleep(5)

def c_package(package, ptype):
  def install_package():
    if ptype == "yum":
      install_cmd = "yum install -y {0}".format(package)
    elif ptype == "python":
      install_cmd = "pip install {0}".format(package)
    right_info = "install {1} package {0}".format(package, ptype)
    public.recode_log(right_info, 'info')
    public.xiushi(right_info, 'info')
    if not os.system(install_cmd) == 0:
      err_info = "install {1} Package {0} fail !!!!!!".format(package, ptype)
      public.recode_log(err_info, 'error')
      public.xiushi(err_info, 'error')
      quit()
  if ptype == "yum":
    if package == "gcc":
      cmd = "rpm -qa|grep ^gcc-4.8.5-11.el7.x86_64"
      rc = re.compile(r"\w+.4.8.5")
    else:
      cmd = "rpm -qa|grep '{0}'".format(package)
      rc = re.compile(r'\w+-\w+')
  elif ptype == "python":
    cmd = "pip list|grep '{0}'".format(package)
    rc = re.compile(r'\w+')
  try:
    sp = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    ssr = sp.stdout.read()
    target_nr = rc.match(ssr).group()
  except Exception as e:
    print e
    install_package()
  else:
    if target_nr == package:
      pass
    elif target_nr == "{0}-4.8.5".format(package):
      pass
    else:
      install_package()

def mongod(process):
  c_package("gcc", 'yum')
  c_package("python-devel", 'yum')
  c_package("python2-pip", 'yum')
  c_package("psutil", 'python')
  import psutil
  cmd = "ps aux|grep '{0}'|grep -v 'grep'".format(process)
  get_nr = subprocess.Popen(cmd,shell=True,stdout=subprocess.PIPE)
  process_pid = int(get_nr.stdout.read().split()[1])
  p = psutil.Process(process_pid)
  process_cpu_percent = float('%.2f' % p.cpu_percent())
  process_memory_percent = float('%.2f' % p.memory_percent())
  def compare_value(value, p):
    while value > 10.0:
      print "-----------------------------------------------------"
      print red("\t{0} {1} percent is not restore".format(process, p))
      print red("\tCurrent {0} {1} percent is {2}".format(process, p, value))
      print "-----------------------------------------------------"
      time.sleep(5)
  compare_value(process_cpu_percent, 'CPU')
  compare_value(process_memory_percent, 'Memory')

