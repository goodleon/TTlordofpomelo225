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
  cmd1 = 'netstat -ant'
  cmd2 = 'grep -v LISTEN'
  count_list = []
  for num in range(len(settings.pkcon_list)):
    host_ip = settings.pkcon_list[num]['host']
    if host_ip == settings.eth_ip or host_ip == "127.0.0.1":
      port = settings.pkcon_list[num]['clientPort']
    else:
      continue
    cmd3 = 'grep -c :{0}'.format(port)
    command1 = subprocess.Popen(cmd1, shell=True, stdout=subprocess.PIPE)
    command2 = subprocess.Popen(cmd2, shell=True, stdin=command1.stdout, stdout=subprocess.PIPE)
    command3 = subprocess.Popen(cmd3, shell=True, stdin=command2.stdout, stdout=subprocess.PIPE)
    port_pkcon_num = command3.stdout.read().strip()
    count_list.append(int(port_pkcon_num))
    print settings.green("{0}: {1}".format(port, port_pkcon_num))
  print settings.green("allCount: {0}".format(sum(count_list)))
