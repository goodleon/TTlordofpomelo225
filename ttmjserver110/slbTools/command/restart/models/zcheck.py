#!/usr/bin/python
#coding=utf8

import os,sys
import json
import time
Current_PATH = os.getcwd()
BASE_PATH = os.path.dirname(os.path.dirname(Current_PATH + os.sep + __file__))
sys.path.append(BASE_PATH)
sys.path.append("/root/slbTools/ydx/shell/")
import subprocess
import base_fuc
from config import settings
from lib import public
from models import restart,tocheck,setcpu,check_process,check_port,diao_sc

def check():
  if settings.host_stype in settings.data_list:
    linkip_list = []
    for num in range(len(settings.pkcon_list)):
      hip = settings.pkcon_list[num]['host']
      linkip_list.append(hip)
    linkip_list= list(set(linkip_list))
    roomip_list = []
    for num in range(len(settings.pkroom_list)):
      hip = settings.pkroom_list[num]['host']
      roomip_list.append(hip)
    roomip_list= list(set(roomip_list))
    loginip_list = []
    for num in range(len(settings.login_list)):
      hip = settings.login_list[num]['host']
      loginip_list.append(hip)
    loginip_list= list(set(loginip_list))
    pkplayerip_list = []
    for num in range(len(settings.pkplayer_list)):
      hip = settings.pkplayer_list[num]['host']
      pkplayerip_list.append(hip)
    pkplayerip_list= list(set(pkplayerip_list))
    if len(linkip_list) == len(roomip_list) == len(loginip_list) == len(pkplayerip_list) == 1:
      diao_sc.node_exec('data', 'check')
      diao_sc.node_exec('web', 'check')
      diao_sc.node_exec('admin', 'check')
      diao_sc.node_exec('activity', 'check')
      diao_sc.node_exec('login', 'check')
      diao_sc.node_exec('pkplayer', 'check')
      diao_sc.node_exec('room', 'check')
      diao_sc.node_exec('link', 'check')
    else:
      for num in range(len(settings.login_list)):
        login_ip = settings.login_list[num]['host']
      for num in range(len(settings.pkplayer_list)):
        pkplayer_ip = settings.pkplayer_list[num]['host']
      if settings.eth_ip == login_ip == pkplayer_ip or login_ip == pkplayer_ip == "127.0.0.1":
        diao_sc.node_exec('data', 'check')
        diao_sc.node_exec('web', 'check')
        diao_sc.node_exec('admin', 'check')
        diao_sc.node_exec('activity', 'check')
        diao_sc.node_exec('login', 'check')
        diao_sc.node_exec('pkplayer', 'check')
      else:
        diao_sc.node_exec('data', 'check')
        diao_sc.node_exec('web', 'check')
        diao_sc.node_exec('admin', 'check')
        diao_sc.node_exec('activity', 'check')
  elif settings.host_stype in settings.loginpkplayer_list:
    diao_sc.node_exec('login', 'check')
    diao_sc.node_exec('pkplayer', 'check')
  elif settings.host_stype == "room":
    diao_sc.node_exec('web', 'check')
    diao_sc.node_exec('room', 'check')
  elif settings.host_stype == "link":
    diao_sc.node_exec('link', 'check')
