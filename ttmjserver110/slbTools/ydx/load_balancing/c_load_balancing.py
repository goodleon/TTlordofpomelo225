#!/usr/bin/python
#coding =utf8

import os,sys
script_path="/root/slbTools/ydx/shell/"
sys.path.append(script_path)
import base_service
import shutil,time
crond = base_service.SoftWare_Config('crond')
bak_time = time.strftime('%Y%m%d_%H%M%S')
bak_path = '/home/ydxbak/crond/'

#-----------------------------------install pkg---------------------------------
def install_pkg():
  need_pkg=['sysstat', 'net-tools', 'zip', 'unzip', 'psmisc', 'wget', 'nload', 'iftop', 'gcc-c++', 'make', 'vim', 'nodejs']
  for package in need_pkg:
    cmd='yum install -y %s' % (package)
    os.system(cmd)
  print "\tinstall sysstat,net-tools,zip,unzip,psmisc,wget,nload,iftop,gcc-c++,make,vim,nodejs"
#----------------------------c_nginx----------------------------
def c_nginx():
  nginx = base_service.SoftWare_Config('nginx')
  nginx.install()
  nginx.configure_nginx()
  nginx.system_boot()
  nginx.start()
#----------------------------c_crond----------------------------
def c_FileSync():
  crond_conf = "/var/spool/cron/root"
  crond_conf_bak = bak_path + "crond." + bak_time
  f_nr = "*/1 * * * * cd /root/slbTools&&bash FileSync.sh"
  def check_rule():
    with open(crond_conf, 'rb') as f:
      for num,nr in enumerate(f.readlines()):
        nr = nr.strip()
        new_list.append(nr)
    if f_nr in "".join(new_list):
      print "---------------------------------"
      print "\tFileSync rule update success"
      print "---------------------------------"
    else:
      shutil.copy2(crond_conf_bak, crond_conf)
      print "---------------------------------"
      print "\tFileSync rule update fail !!!!!!!"
      print "\trestore cron rules"
      print "---------------------------------"
      crond.restart()
  if os.path.exists(crond_conf):
    shutil.copy2(crond_conf, crond_conf_bak)
    nr_list = []
    with open(crond_conf, 'rb') as f:
      for num,nr in enumerate(f.readlines()):
        nr = nr.strip()
        nr_list.append(nr)
    if f_nr in "".join(nr_list):
      print "---------------------------------"
      print "\tFileSync is allready update"
      print "---------------------------------"
    else:
      with open(crond_conf, 'ab') as f:
        f.write(f_nr+'\n')
      crond.restart()
      new_list = []
      check_rule()
  else:
    with open(crond_conf, 'wb') as f:
      f.write(f_nr+'\n')
    crond.restart()
    check_rule()

install_pkg()
c_nginx()
c_FileSync()
