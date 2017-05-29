#!/usr/bin/python
#coding=utf8
#Author : yangdongxu
#QQ : 948178288

import os,sys,shutil
from subprocess import *
import subprocess
import shlex
import time
import glob

target_network_device  = "eth1"
#-------------------------------install service----------------------------------
"""
---------------------------------------------------------
{0} to install the service program.
For example nginx,iptables and so on.
---------------------------------------------------------
""".format(os.getcwd() + os.sep + sys.argv[0])
#--------------------------------public variable-------------------------------
bak_time = time.strftime('%Y%m%d_%H%M%S')
service_path = '/usr/lib/systemd/system'
bak_path = '/home/ydxbak'
#--------------------------------nginx variable---------------------------------
nginx_tfile = '/etc/nginx/nginx.conf'
nginx_conf_name = nginx_tfile.split('/')[-1]
nginx_sfile = '/root/slbTools/ydx/nginx/nginx.conf'
root_path = '/root/mjserver/web-server/public'
#--------------------------------iptables variable---------------------------------
iptables_tfile = '/etc/sysconfig/iptables'
iptables_sfile = '/root/slbTools/ydx/iptables/iptables_sfile'
iptables_conf_name = iptables_tfile.split('/')[-1]

class SoftWare_Config(object):
  def __init__(self, soft):
    self.soft = soft
    self.bak_path = '{0}/{1}/'.format(bak_path, self.soft)
    if not os.path.exists(self.bak_path):
      os.makedirs(self.bak_path)
  #-------------------------------install service----------------------------------
  def s_install(self):
    yum_cmd = 'yum install -y {s}'.format(s=self.soft)
    x = shlex.split(yum_cmd)
    if self.soft == "iptables-services":
      self.soft = "iptables"
      commond = "rpm -qa|grep -c iptables-services"
      check_device = os.popen("ip a|grep -c {0}".format(target_network_device)).read().strip()
      if check_device == "0":
        print "--------------------------------------"
        print "\tCannot execute"
        print "\tNetwork Device {0} not exist".format(target_network_device)
        print "--------------------------------------"
        quit()
    else:
      commond = "ls -l /usr/sbin/{0}|wc -l".format(self.soft)
    if os.popen(commond).read().strip() == "0":
      i = subprocess.Popen(x,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
      for e in i.stderr.readlines():
        print e.strip()
      i.communicate()
      if os.popen(commond).read().strip() == "1":
        print "--------------------------------------"
        print "\tInstall {0} success".format(self.soft)
        print "--------------------------------------"
      else:
        print "--------------------------------------"
        print "\tInstall {0} fail !!!!!!!!!!!!!".format(self.soft)
        print "--------------------------------------"
        quit()
    else:
      print "--------------------------------------"
      print "\t{0} allready install".format(self.soft)
      print "--------------------------------------"
      quit()
  #-------------------------------start service----------------------------------
  def s_start(self):
    if self.soft == 'nginx':
      start_cmd = '{s}'.format(s=self.soft)
    else:
      start_cmd = 'systemctl start {s}'.format(s=self.soft)
    if os.system(start_cmd) == 0:
      print "--------------------------------------"
      print "\t{0} start success".format(self.soft)
      print "--------------------------------------"
    else:
      print "--------------------------------------"
      print "\t{0} start fail !!!!!!!!!!!".format(self.soft)
      print "--------------------------------------"
      quit()
    if self.soft == 'nginx':
      print os.popen("ps -ef|grep {0}".format(self.soft)).read().strip()
    elif self.soft == 'iptables':
      print os.popen("iptables -L -n -v").read().strip()
  #-------------------------------restart service----------------------------------
  def s_restart(self):
    if self.soft == 'nginx':
      if os.system('nginx -s stop') == 0:
        restart_cmd = '{s}'.format(s=self.soft)
      else:
        os.system("pkill -9 nginx")
        restart_cmd = '{s}'.format(s=self.soft)
    else:
      restart_cmd = 'systemctl restart {s}'.format(s=self.soft)
    if os.system(restart_cmd) == 0:
      print "--------------------------------------"
      print "\t{0} restart success".format(self.soft)
      print "--------------------------------------"
    else:
      print "--------------------------------------"
      print "\t{0} restart fail !!!!!!!!!!!".format(self.soft)
      print "--------------------------------------"
      quit()
    if self.soft == 'nginx':
      print os.popen("ps -ef|grep {0}".format(self.soft)).read().strip()
    elif self.soft == 'iptables':
      print os.popen("iptables -L -n -v").read().strip()
  #-------------------------------enable service----------------------------------
  def s_system_boot(self):
    check_boot = os.popen('systemctl is-enabled {0}.service'.format(self.soft)).read().strip()
    system_open_cmd = 'systemctl enable {s}'.format(s=self.soft)
    if check_boot == "disabled":
      print "--------------------------------------"
      print "\t{0} system boot start".format(self.soft)
      print "--------------------------------------"
      sopen = shlex.split(system_open_cmd)
      service_sopen = subprocess.Popen(sopen,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
      for ee in service_sopen.stderr.readlines():
        print ee.strip()
      service_sopen.communicate()
    else:
      print "--------------------------------------"
      print "\t{0} allready system boot ".format(self.soft)
      print "--------------------------------------"
  #-------------------------------nginx configure----------------------------------
  def configure_nginx(self):
    global bak_tfile
    bak_tfile = self.bak_path + nginx_conf_name + "." + bak_time
    if os.path.exists(nginx_tfile):
      tfile_size = os.stat(nginx_tfile).st_size
    else:
      print "\t{0} configure file {1} is not exists !!!!!".format(self.soft, nginx_tfile)
      quit()
    sfile_size = os.stat(nginx_sfile).st_size
    if not tfile_size == sfile_size:
      print "\tbak {0} to {1}".format(nginx_tfile, bak_tfile)
      shutil.move(nginx_tfile, bak_tfile)
      print "\tupdate {0}".format(nginx_tfile)
      shutil.copy2(nginx_sfile, nginx_tfile)
    else:
      print "--------------------------------------"
      print "\t{0} configure allready update".format(self.soft)
      print "--------------------------------------"
  #-------------------------------iptbales configure----------------------------------
  def configure_iptables(self):
    #----------------------------------xt_recent-----------
    profile_conf = '/etc/profile'
    os.system('modprobe xt_recent')
    check_profile = os.popen('grep xt_recent {0}|wc -l'.format(profile_conf)).read().strip()
    if check_profile == '0':
      os.system('echo "/usr/sbin/modprobe xt_recent" >> {0}'.format(profile_conf))
    os.system('systemctl stop firewalld')
    os.system('systemctl disable firewalld')
    #----------------------------------configure file----------------
    global bak_tfile
    bak_tfile = self.bak_path + iptables_conf_name + "." + bak_time
    if os.path.exists(iptables_tfile):
      tfile_size = os.stat(iptables_tfile).st_size
    else:
      print "\t{0} configure file {1} is not exists !!!!!".format(self.soft, nginx_tfile)
      quit()
    sfile_size = os.stat(iptables_sfile).st_size
    if not tfile_size == sfile_size:
      print "\tbak {0} to {1}".format(iptables_tfile, bak_tfile)
      shutil.move(iptables_tfile, bak_tfile)
      print "\tupdate {0}".format(iptables_tfile)
      shutil.copy2(iptables_sfile, iptables_tfile)
      print "--------------------------------------"
      print "\t{0} configure update success".format(self.soft)
      print "--------------------------------------"
    else:
      print "--------------------------------------"
      print "\t{0} configure allready update".format(self.soft)
      print "--------------------------------------"
    #----------------------------------eth1----------------
    if os.system('ifconfig eth1') == 0:   
      eth1_cmd = os.popen('ifconfig eth1|grep netmask|awk \'{print $2}\'').read().strip()
      sed_cmd = 'sed -i \'s/114.55.218.189/%s/\' %s' % (eth1_cmd, iptables_tfile)
      if os.system(sed_cmd) == 0:
        print "--------------------------------------"
        print "\tupdate public ip success"
        print "--------------------------------------"
      else:
        print "--------------------------------------"
        print "\tupdate public ip fail !!!!!!"
        print "--------------------------------------"
        quit()
    else:
      os.system('yum remove -y iptables-services')
      print "--------------------------------------"
      print "eth1: error fetching interface information: Device not found"
      print "remove iptables services"
      print "--------------------------------------"
      quit()

if __name__=="__main__":
  i = SoftWare_Config('nginx')
#  i.s_install()
#  i.configure_nginx()
#  i.s_system_boot()
#  i.s_start()
#  i.s_restart()
