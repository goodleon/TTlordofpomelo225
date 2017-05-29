#!/usr/bin/python
#coding=utf8
import os,sys,re
import subprocess
import logging
from logging.handlers import RotatingFileHandler

def red(info):
  return "\033[1;31;40m{0}\033[0m".format(info)
def green(info):
  return "\033[1;32;40m{0}\033[0m".format(info)

script_path = "/root/slbTools/ydx/shell/"
sys.path.append(script_path)
import base_fuc
mk = base_fuc.mkfp()
#---------------------------------------check_package----------------------------------------
def check_package(package, ptype):
  def install_package():
    if ptype == "yum":
      install_cmd = "yum install -y {0}".format(package)
    elif ptype == "python":
      install_cmd = "pip install {0}".format(package)
    logging.info(green("\tinstall {1} package {0}".format(package, ptype)))
    if not os.system(install_cmd) == 0:
      print "---------------------------------------------------"
      logging.error(red("\tinstall {1} Package {0} fail !!!!!!".format(package, ptype)))
      print "---------------------------------------------------"
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

