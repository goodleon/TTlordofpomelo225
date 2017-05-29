#!/usr/bin/python
#coding=utf8

import os,sys
import socket
import json
Current_PATH = os.getcwd()
BASE_PATH = os.path.dirname(os.path.dirname(Current_PATH + os.sep + __file__))
sys.path.append(BASE_PATH)
sys.path.append("/root/slbTools/ydx/shell/")
import base_fuc
import shutil
from config import settings
from lib import public
mk = base_fuc.mkfp()

def do(opt):
  bak_path = '/home/backup'
  bak_file = "{0}/localhost.{1}.json".format(bak_path, settings.bak_time)
  cms_file = "/root/webadmin/config/localhost.json"
  mk.mkp(bak_path)
  def check_cstatus():
    if opt == 0:
      right_info = "已关闭短信验证"
      public.recode_log(right_info, 'info')
      public.xiushi(right_info, 'info')
    elif opt == 1:
      right_info = "已开启短信验证"
      public.recode_log(right_info, 'info')
      public.xiushi(right_info, 'info')
#----------------------------------------bak config file---------------------------
  def bak():
    try:
      shutil.copy2(cms_file, bak_file)
    except Exception as e:
      right_info = "备份配置文件失败！！！"
      public.recode_log(right_info, 'error')
      public.xiushi(right_info, 'error')
      quit()
    else:
      right_info = "成功备份配置文件到{0}".format(bak_file)
      public.recode_log(right_info, 'info')
      public.xiushi(right_info, 'info')
#---------------------------------------rollback----------------------------------
  def rollfile():
    try:
      shutil.copy2(bak_file, cms_file)
    except Exception as e:
      right_info = "回滚配置文件失败！！！"
      public.recode_log(right_info, 'error')
      public.xiushi(right_info, 'error')
      quit()
    else:
      right_info = "成功回滚备份配置文件到{0}".format(cms_file)
      public.recode_log(right_info, 'info')
      public.xiushi(right_info, 'info')
#------------------------------------------do------------------------
  def todo():
    nlist = []
    with open(cms_file) as f:
      for nr in f.readlines():
        if "openSmsCheck" in nr:
          nr = nr.replace(str(current_value), '{0}'.format(opt))
          nlist.append(nr)
        else:
          nlist.append(nr)
    try:
      with open(cms_file, 'wb') as f:
        f.write("".join(nlist))
    except Exception as e:
      err_info = "update config error!!!"
      rollfile()
      public.recode_log(err_info, 'error')
      public.xiushi(err_info, 'error')
      quit()
    else:
      check_cstatus()
  def restart_webadmin():
    process_id = int(os.popen("ps -ef|grep -v grep |grep 'adminWeb.js localhost.json'|awk '{print $2}'").read().strip())
    try:
      process_id
    except Exception as e:
      err_info = "查找webadmin进程失败！！！"
      public.recode_log(err_info, 'error')
      public.xiushi(err_info, 'error')
      quit()
    else:
      if not os.system('kill -9 {0}'.format(process_id)) == 0:
        err_info = "kill webadmin process fail !!!"
        public.recode_log(err_info, 'error')
        public.xiushi(err_info, 'error')
        quit()
      else:
        right_info = "管理后台重启成功"
        public.recode_log(right_info, 'info')
        public.xiushi(right_info, 'info')

  with open(cms_file) as f:
    nr = f.read()
  dict = json.loads(nr)
  current_value = dict['openSmsCheck']
  vlist = [1, 0]
  if current_value == opt:
    check_cstatus()
    quit()
  else:
    if not opt in vlist:
      err_info = "参数必须是1/0，请更正"
      public.xiushi(err_info, 'error')
      quit()
    else:
      bak()
      todo()
      restart_webadmin()
