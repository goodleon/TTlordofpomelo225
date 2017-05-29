#!/usr/bin/python
#coding=utf8

import os,sys
import json
Current_PATH = os.getcwd()
BASE_PATH = os.path.dirname(os.path.dirname(Current_PATH + os.sep + __file__))
sys.path.append(BASE_PATH)
sys.path.append("/root/slbTools/ydx/shell/")
import subprocess
import base_fuc
from config import settings
from lib import public
from models import restart,tocheck,setcpu,check_process,check_port

def start():
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
      restart.mongod()
      tocheck.mongod('mongod')
      node_exec('data', 'start')
      node_exec('web', 'start')
      node_exec('admin', 'start')
      node_exec('activity', 'start')
      node_exec('login', 'start')
      node_exec('pkplayer', 'start')
      node_exec('room', 'start')
      tocheck.c_150()
      node_exec('link', 'start')
    else:
      for num in range(len(settings.login_list)):
        login_ip = settings.login_list[num]['host']
      for num in range(len(settings.pkplayer_list)):
        pkplayer_ip = settings.pkplayer_list[num]['host']
      if settings.eth_ip == login_ip == pkplayer_ip or login_ip == pkplayer_ip == "127.0.0.1":
        restart.mongod()
        tocheck.mongod('mongod')
        node_exec('data', 'start')
        node_exec('web', 'start')
        node_exec('admin', 'start')
        node_exec('activity', 'start')
        node_exec('login', 'start')
        node_exec('pkplayer', 'start')
      else:
        restart.mongod()
        tocheck.mongod('mongod')
        node_exec('data', 'start')
        node_exec('web', 'start')
        node_exec('admin', 'start')
        node_exec('activity', 'start')
  elif settings.host_stype in settings.loginpkplayer_list:
    node_exec('login', 'start')
    node_exec('pkplayer', 'start')
  elif settings.host_stype == "room":
    node_exec('web', 'start')
    node_exec('room', 'start')
  elif settings.host_stype == "link":
    tocheck.c_150()
    node_exec('link', 'start')

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
      node_exec('data', 'check')
      node_exec('web', 'check')
      node_exec('admin', 'check')
      node_exec('activity', 'check')
      node_exec('login', 'check')
      node_exec('pkplayer', 'check')
      node_exec('room', 'check')
      node_exec('link', 'check')
    else:
      for num in range(len(settings.login_list)):
        login_ip = settings.login_list[num]['host']
      for num in range(len(settings.pkplayer_list)):
        pkplayer_ip = settings.pkplayer_list[num]['host']
      if settings.eth_ip == login_ip == pkplayer_ip or login_ip == pkplayer_ip == "127.0.0.1":
        node_exec('data', 'check')
        node_exec('web', 'check')
        node_exec('admin', 'check')
        node_exec('activity', 'check')
        node_exec('login', 'check')
        node_exec('pkplayer', 'check')
      else:
        node_exec('data', 'check')
        node_exec('web', 'check')
        node_exec('admin', 'check')
        node_exec('activity', 'check')
  elif settings.host_stype in settings.loginpkplayer_list:
    node_exec('login', 'check')
    node_exec('pkplayer', 'check')
  elif settings.host_stype == "room":
    node_exec('web', 'check')
    node_exec('room', 'check')
  elif settings.host_stype == "link":
    node_exec('link', 'check')

def node_exec(role, do):
  process_list = ['data']
  port_process_list = ['web', 'admin', 'login', 'pkplayer', 'room', 'link']
  def start_activity():
    def check_activity():
      with open(settings.master_file) as f:
        nr = f.read()
      dict = json.loads(nr)
      try:
        settings.master_list = dict[settings.host_project]['actServer']
      except Exception as e:
        pass
      else:
        return "activity"
    z = check_activity()
    if z == "activity":
      if do == "start":
        restart.node_start(role)
      elif do == "check":
        check_process.do(role)
  if role == "activity":
    start_activity()
#  elif role == "all":
#    for y in port_process_list:
#      n = Mine_node(y)
#      n.check_process()
#      n.check_port()
  else:
    if do == "start":
      restart.node_start(role)
    elif do == "check":
      if role in process_list:
        check_process.do(role)
      elif role in port_process_list:
        check_port.do(role)
        check_process.do(role)

def chaifen(target):
  try:
    target
  except Exception as e:
    print settings.red("\tcurrent restart project not in ['data/web/admin/activity/login/pkplayer/room/link']")
  else:
    if target == "data":
      node_exec('data', 'start')
      node_exec('data', 'check')
    elif target == "web":
      node_exec('web', 'start')
      node_exec('web', 'check')
    elif target == "admin":
      node_exec('admin', 'start')
      node_exec('admin', 'check')
    elif target == "activity":
      node_exec('activity', 'start')
      node_exec('activity', 'check')
    elif target == "login":
      node_exec('login', 'start')
      node_exec('login', 'check')
    elif target == "pkplayer":
      node_exec('pkplayer', 'start')
      node_exec('pkplayer', 'check')
    elif target == "room":
      node_exec('web', 'start')
      node_exec('room', 'start')
      node_exec('web', 'check')
      node_exec('room', 'check')
      setcpu.do()
    elif target == "link":
      tocheck.c_150()
      node_exec('link', 'start')
      node_exec('link', 'check')
      setcpu.do()
    elif target == "setcpu":
      setcpu.do()
    else:
      public.script_do()
      quit()
