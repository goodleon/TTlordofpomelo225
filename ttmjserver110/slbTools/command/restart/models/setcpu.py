#!/usr/bin/python
#coding=utf8

import os,sys
import socket
Current_PATH = os.getcwd()
BASE_PATH = os.path.dirname(os.path.dirname(Current_PATH + os.sep + __file__))
sys.path.append(BASE_PATH)
sys.path.append("/root/slbTools/ydx/shell/")
import time
import base_fuc
import subprocess
from config import settings
from lib import public

def do():
  cpu_processor_num = os.popen('cat /proc/cpuinfo |grep -c "processor"').read().strip()
  cpu_num_list = range(int(cpu_processor_num))
  cpu_num_range = '{0}-{1}'.format(cpu_num_list[0],cpu_num_list[-1])
  cmd1 = 'ps -e -o pid,command'
  cmd2 = 'grep "env={0}"'.format(settings.host_project)
  if settings.host_stype == "link":
    cmd3 = 'grep "id=pkcon"'
  elif settings.host_stype == "room":
    cmd3 = 'grep "id=pkroom"'
  else:
    cmd3 = 'grep "id="'
  cmd4 = "awk '{print $1}'"
  command1 = subprocess.Popen(cmd1, shell=True, stdout=subprocess.PIPE)
  command2 = subprocess.Popen(cmd2, shell=True, stdin = command1.stdout, stdout=subprocess.PIPE)
  command3 = subprocess.Popen(cmd3, shell=True, stdin = command2.stdout, stdout=subprocess.PIPE)
  command4 = subprocess.Popen(cmd4, shell=True, stdin = command3.stdout, stdout=subprocess.PIPE)
  current_pid_list = command4.stdout.read().split()
  x=0
  for value in range(len(current_pid_list)):
    cpuid = x%int(cpu_processor_num)
    ppid = current_pid_list[value]
    cmd = "taskset -cp %s %s" % (cpuid, ppid)
    command5 = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE)
    nlist = command5.stdout.read().split('\n')
    n0_cpuid = nlist[0].split()[-1]
    if "," in n0_cpuid:
      n0_cpuid = n0_cpuid.replace(',', '-')
    n1_cpuid = nlist[1].split()[-1]
    if "," in n1_cpuid:
      n1_cpuid = n1_cpuid.replace(',', '-')
    if n0_cpuid == cpu_num_range or n0_cpuid == n1_cpuid:
      right_info = "setPid {0} on CPUID {1} success".format(ppid, cpuid)
      public.recode_log(right_info, 'info')
      print settings.green("\t{0}".format(right_info))
    else:
      err_info = "setPid {0} on CPUID {1} success".format(ppid, cpuid)
      public.recode_log(err_info, 'info')
      print settings.red("\t{0}".format(err_info))
      quit()
    x += 1
