#!/usr/bin/python
#coding=utf8

import os,sys,re,time
import socket
import shutil
import logging
from logging.handlers import RotatingFileHandler
import subprocess
def red(info):
  return "\033[1;31;40m{0}\033[0m".format(info)
def green(info):
  return "\033[1;32;40m{0}\033[0m".format(info)
bak_time = time.strftime("%Y%m%d_%H%M%S")
script_path = "/root/slbTools/ydx/shell/"
sys.path.append(script_path)
import base_fuc
mk = base_fuc.mkfp()
current_path = os.getcwd()
lpr_list = ["link", "room", "pkplayer", "login", "pkplayerlogin", "loginpkplayer"]
d_list = ['data', 'master', 'test', 'a']
def get_ip_address(ifname):
  import fcntl
  import struct
  s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
  return socket.inet_ntoa(fcntl.ioctl(
      s.fileno(),
      0x8915,  # SIOCGIFADDR
      struct.pack('256s', ifname[:15])
  )[20:24])
eth_ip = get_ip_address("eth0")
#------------------------------------------log---------------------------------------
log_path = '/root/'
pull_log = '{0}newhost.log'.format(log_path)
mk.mkf(pull_log)
logging.basicConfig(level=logging.DEBUG,
              format='%(asctime)s %(filename)s[line:%(lineno)d] %(levelname)s %(message)s',
              filename=pull_log,
              filemode='a')
console=logging.StreamHandler()
console.setLevel(logging.DEBUG)
formatter=logging.Formatter('%(message)s')
console.setFormatter(formatter)
logging.getLogger().addHandler(console)
#-------------------------------------change_hostname----------------------------------------
def change_hostname(hn):
  py_script = '/root/slbTools/ydx/load_balancing/change_hostname.py'
  py_cmd = 'python {0} {1}'.format(py_script, hn)
  os.system(py_cmd)
#------------------------------------command check-------------------------------------------
def check_command():
  if len(sys.argv) == 2:
    print "----------------------------------------------"
    pd = raw_input(green("Now configuration official server yes/no y/n:")).lower()
    if not pd in ["yes", 'y']:
      print "------------------------------------"
      logging.info("Quit")
      print "------------------------------------"
      quit()
    else:
      hn = sys.argv[1]
      change_hostname(hn)
  else:
    print "------------------------------------"
    print green("Please Usage {0}/{1} hostname".format(current_path, sys.argv[0]))
    print "------------------------------------"
    quit()

#-----------------------------------install pkg---------------------------------
def install_pkg():
  one_pkg = ['gcc-c++', 'make']
  curl_cmd = 'curl -sL https://rpm.nodesource.com/setup | bash -'
  need_pkg=['python-pip', 'git', 'epel-release', 'sysstat', 'net-tools', 'zip', 'unzip', 'psmisc', 'wget', 'nload', 'iftop', 'vim', 'gcc', 'python-devel']
  def i_pkg(nlist):
    for package in nlist:
      cmd='yum install -y %s' % (package)
      if package == "nodejs-0.10.46":
        if os.popen("node -v").read().strip() == "v0.10.46":
          continue
      if os.system(cmd) == 0:
        logging.info(green("\tinstall {0} success".format(package)))
      else:
        logging.error(red("\tinstall {0} fail !!!!!!!!".format(package)))
  i_pkg(one_pkg)
  if os.system("node -v") == 0:
    if not os.popen("node -v").read().strip() == "v0.10.46":
      if os.system(curl_cmd) == 0:
        os.system("yum install -y nodejs-0.10.46")
  else:
    if os.system(curl_cmd) == 0:
      os.system("yum install -y nodejs-0.10.46")
  i_pkg(need_pkg)
#------------------------------------npm install module-------------------------------------------
def i_module():
  node_path = '/usr/lib/node_modules/'
  m_list = ["pomelo@1.1.7", "pomelo-admin@0.4.5", "mysql@2.11.1", "nodemailer@2.4.2", "express@4.14.0", "body-parser@1.15.2", "cookie-parser@1.4.3", "forever@0.15.2", "mongodb@2.1.18", "redis@2.6.5", "urllib@2.19.0", "jpush-sdk@3.3.1", "request@2.79.0", "json2xls@0.1.2", "node-schedule@1.2.0", "heapdump@0.3.7", 'xml2js@0.4.17', 'ali-mns@2.6.0']
  def do(pkg):
    i_cmd = 'npm --registry=https://registry.npm.taobao.org --cache=$HOME/.npm/.cache/cnpm --disturl=https://npm.taobao.org/dist --userconfig=$HOME/.cnpmrc install -g {0}'.format(pkg)
    if os.system(i_cmd) == 0:
      print "--------------------------------------"
      logging.info(green("\tpackage {0} install success".format(pkg)))
      print "--------------------------------------"
    else:
      print "--------------------------------------"
      logging.error(red("\t{0} package install fail !!!!!!!!".format(pkg)))
      print "--------------------------------------"
  for soft in m_list:
    tpath = "{0}{1}".format(node_path, soft.split("@")[0])
    version_num = soft.split("@")[1]
    if not os.path.exists(tpath):
      do(soft)
    else:
      package_file = "{0}/package.json".format(tpath)
      with open(package_file) as f:
        nr = f.readlines()
        for a in nr:
          if "version" in a:
            if not a.split('"')[-2] == version_num:
             do(soft)
            break
  os.system("export NODE_PATH=/usr/lib/node_modules/")
#---------------------------------------configure huifang-------------------------------------------------
def c_huifang():
  spath = "/playlog"
  tpath = "/root/mjserver/web-server/public/playlog"
  mk.mkp(spath)
  link = base_fuc.Ln(spath, tpath)
  link.do()
  if os.path.exists(tpath):
    check_link=os.popen('file %s' % (tpath)).read().strip('\n')
    cl = check_link.split()[1]
    if cl != 'symbolic':
      print "--------------------------------------------"
      logging.error(red("\tlink {0} to {1} fail !!!!!!!!".format(spath, tpath)))
      print "--------------------------------------------"
    else:
      print "--------------------------------------------"
      logging.info(green("\tlink {0} to {1} success".format(spath, tpath)))
      print "--------------------------------------------"
  else:
    print "--------------------------------------------"
    logging.info(green("\tlink {0} to {1} success".format(spath, tpath)))
    print "--------------------------------------------"
#--------------------------------------install mongodb----------------------------------------------------
def i_mongodb():
  hname = socket.gethostname().lower()
  server_type = hname.split("-")[1]
  source_file = '/etc/yum.repos.d/mongodb.repo'
  conf_file = "/etc/mongod.conf"
  #fnr = "[mongodb]\nname=MongoDB Repository\nbaseurl=http://downloads-distro.mongodb.org/repo/redhat/os/x86_64/\ngpgcheck=0\nenabled=1\n"
  fnr = "[mongodb-org-3.4]\nname=MongoDB Repository\nbaseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/3.4/x86_64/\ngpgcheck=1\nenabled=1\ngpgkey=https://www.mongodb.org/static/pgp/server-3.4.asc"
  def c_mongodb():
    def check_ip(ip):
      if not os.system("ipcalc -c {0}".format(ip)) == 0:
        print "-----------------------------------------------"
        logging.error(red("\t{0} not ip address !!!!!!!!".format(ip)))
        print "-----------------------------------------------"
        quit()
    role_ip = eth_ip
    bd_nr = "bind_ip=127.0.0.1\n"
    if os.path.exists(conf_file):
      with open(conf_file) as f:
        nr = f.readlines()
        if bd_nr in "".join(nr):
          bd_postion = nr.index(bd_nr)
          nr[18] = bd_nr.replace("127.0.0.1", role_ip)
      with open(conf_file, 'wb') as f:
        f.write("".join(nr))
    else:
      print "------------------------------------------"
      print red("\t{0} not exits".format(conf_file))
      print "------------------------------------------"
#--------------------------------------yum install----------------------
  def yum_install():
    with open(source_file, 'wb') as f:
      f.write(fnr)
    pkg_list = ["mongodb-org", "mongodb-org-server"]
    for pkg in pkg_list:
      i_cmd = "yum install -y {0}".format(pkg)
      if os.system(i_cmd) == 0:
        print "-------------------------------------------------"
        logging.info(green("\tinstall {0} success".format(pkg)))
        print "-------------------------------------------------"
      else:
        print "-------------------------------------------------"
        logging.error(red("\tinstall {0} fail !!!!!!!!".format(pkg)))
        print "-------------------------------------------------"
#--------------------------------------rpm install---------------------
  def rpm_install():
#    pkg_tuple = ('mongodb-org-tools-2.6.12-1.x86_64.rpm','mongodb-org-mongos-2.6.12-1.x86_64.rpm','mongodb-org-shell-2.6.12-1.x86_64.rpm','mongodb-org-server-2.6.12-1.x86_64.rpm','mongodb-org-2.6.12-1.x86_64.rpm')
    pkg_tuple = ('mongodb-org-tools-3.4.3-1.el7.x86_64.rpm', 'mongodb-org-server-3.4.3-1.el7.x86_64.rpm', 'mongodb-org-shell-3.4.3-1.el7.x86_64.rpm', 'mongodb-org-mongos-3.4.3-1.el7.x86_64.rpm', 'mongodb-org-3.4.3-1.el7.x86_64.rpm')
    check_old_mongo = ('mongodb-org', 'mongodb-org-tools','mongodb-org-mongos','mongodb-org-shell','mongodb-org-server')
    pkg_path = '/root/slbTools/ydx/tools/'
    for num in range(len(check_old_mongo)):
      remove_cmd = 'rpm -e {0}'.format(check_old_mongo[num])
      check_num = os.popen('rpm -qa|grep -c {0}'.format(check_old_mongo[num].replace('.rpm',''))).read().strip()
      if not check_num == '0':
        if os.system(remove_cmd) == 0:
          print "---------------------------------------------------------------------"
          logging.info(green("\tremove {0} success").format(check_old_mongo[num]))
          print "---------------------------------------------------------------------"
        else:
          print "---------------------------------------------------------------------"
          logging.error(red("\tremove {0} fail !!!!!!!!".format(check_old_mongo[num])))
          print "---------------------------------------------------------------------"
    for num in range(len(pkg_tuple)):
      yum_cmd = 'rpm -ivh {0}{1}'.format(pkg_path, pkg_tuple[num])
      check_num = os.popen('rpm -qa|grep -c {0}'.format(pkg_tuple[num].replace('.rpm',''))).read().strip()
      if check_num == '0':
        if os.system(yum_cmd) == 0:
          print "---------------------------------------------------------------------"
          logging.info(green("\tyum install {0} success").format(pkg_tuple[num]))
          print "---------------------------------------------------------------------"
        else:
          print "---------------------------------------------------------------------"
          logging.error(red("\tyum install {0} fail !!!!!!!!".format(pkg_tuple[num])))
          print "---------------------------------------------------------------------"
  try:
    rpm_install()
  except Exception as e:
    print e
  else:
    c_mongodb()
    if os.path.exists(conf_file):
      if os.system("systemctl restart mongod") == 0:
        print "-------------------------------------------------"
        logging.info(green("\trestart mongod success"))
        print "-------------------------------------------------"
      else:
        print "-------------------------------------------------"
        logging.error(red("\trestart mongod fail !!!!!!!!"))
        print "-------------------------------------------------"
def c_crontab():
  hname = socket.gethostname().lower()
  server_type = hname.split("-")[1]
  data_cron_nr = "10 4 * * * bash /root/webadmin/tool/money.sh\n20 4 * * * cd /root/webadmin/dataCenterService/statisticsTask/crontab&&bash memberConsumption.sh\n30 4 * * * cd /root/webadmin/dataCenterService/statisticsTask/crontab&&bash membersActive.sh\n32 4 * * * cd /root/webadmin/dataCenterService/statisticsTask/crontab&&bash adminStatistics.sh\n33 4 * * * cd /root/webadmin/dataCenterService/statisticsTask/crontab&&bash customerStatistics.sh\n35 4 * * * cd /root/webadmin/dataCenterService/statisticsTask/crontab&&bash memberStatistics.sh\n36 4 * * * cd /root/webadmin/dataCenterService/statisticsTask/crontab&&bash userConsumption.sh\n38 4 * * * cd /root/webadmin/dataCenterService/crontab&&bash exportDbTask.sh\n0 */1 * * * cd /root/webadmin/dataCenterService/crontab&&bash hourDbTask.sh"
  lpr_nr = "0 4 * * * sh /root/mjserver/crontab/cleanLog.sh"
  def update_cron():
    if not os.path.exists(cron_file):
      with open(cron_file, 'wb') as f:
        f.write(data_cron_nr)
    else:
      with open(cron_file, 'rb') as f:
        x = f.readlines()
        new_nr = "".join(x)
        for nr in nr_list:
          if nr in new_nr:
            print "------------------------------------------------------------------------"
            logging.info(green("\t{0} is allready update to {1}".format(nr, cron_file)))
            print "------------------------------------------------------------------------"
          else:
            with open(cron_file, "ab") as f:
              f.write(nr + "\n")
              print "------------------------------------------------------------------------"
              logging.info(green("\t{0} update to {1}".format(nr, cron_file)))
              print "------------------------------------------------------------------------"
      if os.system("service crond restart") == 0:
        print "--------------------------------------------------------------"
        logging.info(green("\tcrond resart success"))
        print "--------------------------------------------------------------"
      else:
        print "--------------------------------------------------------------"
        logging.error(red("\tcrond resart fail !!!!!!!!"))
        print "--------------------------------------------------------------"
  cron_file = '/var/spool/cron/root'
  if server_type in d_list:
    nr_list = data_cron_nr.split("\n")
    update_cron()
  elif server_type in lpr_list:
    nr_list = lpr_nr.split("\n")
    update_cron()
  else:
    print "----------------------------------------------------"
    logging.error(red("\tCurrent host not update crontab !!!!!!!"))
    print "----------------------------------------------------"

def update_time():
 timezone_file = "/etc/localtime"
 check_link=os.popen('file %s' % (timezone_file)).read().strip('\n')
 cl = check_link.split()[1]
 if cl != 'symbolic':
  sfile = "/usr/share/zoneinfo/Asia/Shanghai"
  if os.path.exists(sfile):
    if os.path.exists(timezone_file):
      shutil.move(timezone_file, "{0}.bak".format(timezone_file))
      link = base_fuc.Ln(sfile, timezone_file)
      link.do()
      if os.path.exists(timezone_file):
        check_link=os.popen('file %s' % (timezone_file)).read().strip('\n')
        cl = check_link.split()[1]
        if cl != 'symbolic':
          print "--------------------------------------------"
          logging.error(red("\tlink {0} to {1} fail !!!!!!!!".format(sfile, timezone_file)))
          print "--------------------------------------------"
        else:
          print "--------------------------------------------"
          logging.info(green("\tlink {0} to {1} success".format(sfile, timezone_file)))
          print "--------------------------------------------"
      else:
        print "--------------------------------------------"
        logging.info(green("\tlink {0} to {1} success".format(sfile, timezone_file)))
        print "--------------------------------------------"
    else:
      print "--------------------------------------------"
      logging.error(red("\tnot exist {0} !!!!!!!!!!".format(sfile)))
      print "--------------------------------------------"
  else:
    print "--------------------------------------------"
    logging.error(red("\tnot exist {0} !!!!!!!!!!".format(timezone_file)))
    print "--------------------------------------------"   
 rsync_time = "ntpdate time.nist.gov"
 os.system("service ntpd stop")
 if os.system(rsync_time) == 0:
    print "-----------------------------------------------------"
    logging.info(green("\trsync time from time.nist.gov success"))
    print "-----------------------------------------------------"
 else:
    print "-----------------------------------------------------"
    logging.error(red("\trsync time from time.nist.gov fail !!!!!!"))
    print "-----------------------------------------------------"

def tclone(ptype):
    if ptype == "mjserver":
      clone_path = "/root/{0}".format(ptype)
      git_cmd = 'git clone http://git.happyplaygame.net/changhao/mjserver.git {0}'.format(clone_path)
    elif ptype == "webadmin":
      clone_path = "/root/{0}".format(ptype)
      git_cmd = 'git clone http://git.happyplaygame.net/changhao/webadmin.git {0}'.format(clone_path)
    elif ptype == "webagent":
      clone_path = "/root/{0}".format(ptype)
      git_cmd = 'git clone http://git.happyplaygame.net/wangxiaolei/webagent.git {0}'.format(clone_path)
    elif ptype == "dataCenterService":
      clone_path = "/root/{0}".format(ptype)
      git_cmd = 'git clone http://git.happyplaygame.net/huang_jian_feng/dataCenterService.git {0}'.format(clone_path)
    else:
       print "----------------------------------------------------------"
       logging.error(red("\tnot exists {0} source".format(ptype)))
       print "----------------------------------------------------------"
    if not os.path.exists(clone_path):
      if not os.system(git_cmd) == 0:
        print "-------------------------------------------------------------------------"
        logging.error(red("\tclone {0} fail !!!!!!!!!!".format(ptype)))
        print "-------------------------------------------------------------------------"
        quit()
      else:
        print "-------------------------------------------------------------------------"
        logging.info(green("\tclone {0} success".format(ptype)))
        print "-------------------------------------------------------------------------"
export_cmd = 'export NODE_PATH=/usr/lib/node_modules'
def c_profile():
  profile_file = "/etc/profile"
  with open(profile_file) as f:
    nr = f.readlines()
    if not export_cmd in "".join(nr):
      with open(profile_file, 'ab') as f:
        f.write(export_cmd + "\n")
def i_iptables():
  i_cmd = "python /root/slbTools/ydx/iptables/c_iptables.py"
  os.system(i_cmd)

check_command()
install_pkg()
i_module()
i_mongodb()
c_crontab()
update_time()
hname = socket.gethostname().lower()
server_type = hname.split("-")[1]
if server_type in d_list:
  h_list = ["mjserver", "webadmin", "webagent", "dataCenterService"]
else:
  h_list = ["mjserver"]
for target in h_list:
  tclone(target)
os.system("bash /root/webadmin/sms/ali-mns.sh")
c_huifang()
i_iptables()
c_profile()
#configure localhost please usage hostname "localhost-a"  and parameter "localhost-a"
