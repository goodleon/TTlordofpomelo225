#!/usr/bin/python
#coding=utf8

import os,sys
import logging,shutil
import socket
from logging.handlers import RotatingFileHandler
def red(info):
  return "\033[1;31;40m{0}\033[0m".format(info)
def green(info):
  return "\033[1;32;40m{0}\033[0m".format(info)
script_path = "/root/slbTools/ydx/shell/"
sys.path.append(script_path)
import base_fuc
mk = base_fuc.mkfp()
if len(sys.argv) == 2:
  project_name = sys.argv[1]
else:
  print "--------------------------------------------"
  print red("\tPlease Usage {0} project_name".format(sys.argv[0]))
  print "--------------------------------------------"
  quit()
#--------------------------------------------------------------------------------
import fcntl
import struct
def get_ip_address(ifname):
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    return socket.inet_ntoa(fcntl.ioctl(
        s.fileno(),
        0x8915,  # SIOCGIFADDR
        struct.pack('256s', ifname[:15])
    )[20:24])
role_ip = get_ip_address("eth0")
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
#-----------------------------------------------------------------------------------------
houtai_list = ["/root/webadmin", "/root/webagent", "/root/mjserver", "/root/dataCenterService"]

def check_exist():
  for spath in houtai_list:
    if not os.path.exists(spath):
      print "-----------------------------------------------------------------------"
      logging.error(red("\t{0} not exists, please clone !!!!!!!!".format(spath)))
      print "-----------------------------------------------------------------------"
      quit()

def c_link(spath, tpath):
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

def copy_file():
  cmd1 = "\cp /root/mjserver/version/rpc-client/mailbox.js  /usr/lib/node_modules/pomelo/node_modules/pomelo-rpc/lib/rpc-client/"
  cmd2 = "\cp /root/mjserver/version/rpc-client/mailboxes/tcp-mailbox.js  /usr/lib/node_modules/pomelo/node_modules/pomelo-rpc/lib/rpc-client/mailboxes/"
  cmd3 = "\cp /root/mjserver/version/rpc-server/acceptor.js  /usr/lib/node_modules/pomelo/node_modules/pomelo-rpc/lib/rpc-server/"
  if os.system(cmd1) == 0:
    print "-----------------------------------------------------------------------------"
    logging.info(green("\tcopy mailbox.js to rpc-client success"))
    print "-----------------------------------------------------------------------------"
  else:
    print "-----------------------------------------------------------------------------"
    logging.error(red("\tcopy mailbox.js to rpc-client fail !!!!!!!!"))
    print "-----------------------------------------------------------------------------"
    quit()
  if os.system(cmd2) == 0:
    print "-----------------------------------------------------------------------------"
    logging.info(green("\tcopy tcp-mailbox.js to rpc-client/mailboxes success"))
    print "-----------------------------------------------------------------------------"
  else:
    print "-----------------------------------------------------------------------------"
    logging.error(red("\tcopy tcp-mailbox.js to rpc-client/mailboxes fail !!!!!!!!"))
    print "-----------------------------------------------------------------------------"
    quit()
  if os.system(cmd3) == 0:
    print "-----------------------------------------------------------------------------"
    logging.info(green("\tcopy acceptor.js to rpc-server success"))
    print "-----------------------------------------------------------------------------"
  else:
    print "-----------------------------------------------------------------------------"
    logging.error(red("\tcopy acceptor.js to rpc-server fail !!!!!!!!"))
    print "-----------------------------------------------------------------------------"
    quit()

hname = socket.gethostname().lower()
server_type = hname.split("-")[1]
lpr_list = ["link", "room", "pkplayer", "login", "pkplayerlogin", "loginpkplayer"]
d_list = ['data', 'master', 'test', 'a']
if server_type in d_list:
  check_exist()
  c_link("/root/webagent/public", "/root/webadmin/public")
  c_link("/root/dataCenterService", "/root/webadmin/dataCenterService")
  c_link("/root/mjserver/game-server/uncaught", "/root/webadmin/public/uncaught")
  c_link("/root/mjserver/game-server/logs", "/root/webadmin/public/logs")
  copy_file()
elif server_type in lpr_list:
  copy_file()

if os.system("systemctl start mongod") == 0:
  print "-------------------------------------------------"
  logging.info(green("\tstart mongod success"))
  print "-------------------------------------------------"
else:
  print "-------------------------------------------------"
  logging.error(red("\tstart mongod fail !!!!!!!!"))
  print "-------------------------------------------------"

def c_project_json():
  json_list = ["config", "alipay", "accrued"]
  def config_json(path,project):
    json = os.path.basename(path)
    json_file = "{0}/{1}.json".format(path,project)
    local_json_file = "{0}/localhost.json".format(path)
    def update_config():
      if json == "config":
        with open(json_file) as f:
          x = f.readlines()
          for nr in x:
            nr_num = x.index(nr)
            if "127.0.0.1" in nr:
              x[nr_num] = nr.replace('"127.0.0.1"', '"{0}"'.format(role_ip))
            if "127.0.0.1:27017/test" in nr:
              x[nr_num] = nr.replace("127.0.0.1:27017/test", "{0}:27017/{1}".format(role_ip, project))
            if "q1w2e34t5y6u7i8o9p0" in nr:
              x[nr_num] = nr.replace("q1w2e34t5y6u7i8o9p0", "6e051067289bc8a0032d639fbcb81e71")
        with open(json_file, "wb") as f:
          f.write("".join(x))
    if not os.path.exists(json_file):
      if not project =="localhost":
        shutil.copy2(local_json_file, json_file)
        update_config()
  for json in json_list:
    json_path = "/root/webadmin/{0}".format(json)
    config_json(json_path,project_name)

c_project_json()
