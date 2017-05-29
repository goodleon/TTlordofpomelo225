#!/usr/bin/python
#coding=utf8

import os,sys
import socket
import time
import shutil
import logging
from logging.handlers import RotatingFileHandler
def red(info):
  return "\033[1;31;40m{0}\033[0m".format(info)
def green(info):
  return "\033[1;32;40m{0}\033[0m".format(info)
hname = socket.gethostname().lower()
hname_project = hname.split("-")[0]
template_file = "/root/mjserver/tool/template.json"
bak_time = time.strftime("%Y%m%d_%H%M%S")
current_path = os.getcwd()
script_path = "/root/slbTools/ydx/shell/"
sys.path.append(script_path)
import base_fuc
mk = base_fuc.mkfp()
#-------------------------------------------log-----------------------------
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

if len(sys.argv) == 3:
  stype = sys.argv[1]
  if not stype == "single":
    print "----------------------------------------------"
    logging.info(green("\tconfigure single server please Usage {0} single project_name".format(sys.argv[0])))
    logging.info(green("\tconfigure much server please Usage {0} much project_name file".format(sys.argv[0])))
    print "----------------------------------------------"
    quit()
  project_name = sys.argv[2]
  if not hname_project == project_name:
    print "---------------------------------------------"
    logging.error(red("\tCurrent host project name not equal {0}".format(project_name)))
    print "---------------------------------------------"
    quit()
  role_ip = get_ip_address("eth0")
elif len(sys.argv) == 4:
  stype = sys.argv[1]
  if not stype == "much":
    print "----------------------------------------------"
    logging.info(green("\tconfigure single server please Usage {0} single project_name".format(sys.argv[0])))
    logging.info(green("\tconfigure much server please Usage {0} much project_name file".format(sys.argv[0])))
    print "----------------------------------------------"
    quit()
  project_name = sys.argv[2]
  if not hname_project == project_name:
    print "---------------------------------------------"
    logging.error(red("\tCurrent host project name not equal {0}".format(project_name)))
    print "---------------------------------------------"
    quit()
  srole = hname.split("-")[1]
  if not srole in ['data', 'room', 'link', 'loginpkplayer']:
    print "--------------------------------------------------"
    logging.error(red("\tCurrent server role is wrong !!!!!!!!"))
    logging.error(red("\tPlease change current hostname_role for example data/room/link/loginpkplayer"))
    print "--------------------------------------------------"
    quit()
  sfile = "{0}/{1}".format(current_path, sys.argv[3])
  if not os.path.exists(sfile):
    print "----------------------------------------------------"
    logging.error(red("\tPlease update {0}".format(sfile)))
    logging.error(red("\tFor example"))
    logging.error(red("\troom,1.1.1.1,2.2.2.2"))
    print "----------------------------------------------------"
    quit()
else:
  print "---------------------------------------------------------------------------"
  logging.info(green("\tconfigure single server please Usage {0} single project_name".format(sys.argv[0])))
  logging.info(green("\tconfigure much server please Usage {0} much project_name file".format(sys.argv[0])))
  print "---------------------------------------------------------------------------"
  quit()


project_list = ['  "%s": {\n' % (project_name), '  }\n']
if stype == "single":
  login_list = ['    "login": [\n', '      {\n', '        "host": "{0}",\n'.format(role_ip), '        "portStart": 2010,\n', '        "portEnd": 2012,\n', '        "length": 3\n', '      }\n', '    ],\n']
  pklayer_list = ['    "pkplayer": [\n', '      {\n', '        "host": "{0}",\n'.format(role_ip), '        "portStart": 5030,\n', '        "portEnd": 5032,\n', '        "length": 3\n', '      }\n', '    ],\n']
  room_list = ['    "pkroom": [\n', '      {\n', '        "host": "{0}",\n'.format(role_ip), '        "portStart": 5040,\n', '        "portEnd": 5045,\n', '        "length": 6\n', '      }\n', '    ],\n']
  link_list = ['    "pkcon": [\n', '      {\n', '        "host": "{0}",\n'.format(role_ip), '        "portStart": 15120,\n', '        "portEnd": 17129,\n', '        "clientPortStart": 15010,\n', '        "clientPortEnd": 15029,\n', '        "length": 10\n', '      }\n', '    ]\n']
elif stype == "much":
  lroom = []
  llogin = []
  lpkplayer = []
  llink = []
  with open(sfile) as f:
    for nr in f.readlines():
      nr = nr.strip()
      nr = nr.split(",")
      if nr[0] == "room":
        del nr[0]
        for ip in nr:
          lroom.append(ip)
      if nr[0] == "login":
        del nr[0]
        for ip in nr:
          llogin.append(ip)
      if nr[0] == "pkplayer":
        del nr[0]
        for ip in nr:
          lpkplayer.append(ip)
      if nr[0] == "link":
        del nr[0]
        for ip in nr:
          llink.append(ip)

  login_list = ['    "login": [\n', '    ],\n']
  pklayer_list = ['    "pkplayer": [\n', '    ],\n']
  room_list = ['    "pkroom": [\n', '    ],\n']
  link_list = ['    "pkcon": [\n', '    ]\n']
#-----------------------------------------------------room---------------------------------------
  for role_ip in lroom:
    room_template_list = ['      {\n', '        "host": "{0}",\n'.format(role_ip), '        "portStart": 5040,\n', '        "portEnd": 5069,\n', '        "length": 30\n', '      },\n']
    room_list.insert(-1, "".join(room_template_list))
  room_list[-2] = room_list[-2].replace("},", "}")
#-----------------------------------------------------login---------------------------------------
  for role_ip in llogin:
    login_template_list = ['      {\n', '        "host": "{0}",\n'.format(role_ip), '        "portStart": 2010,\n', '        "portEnd": 2024,\n', '        "length": 15\n', '      },\n']
    login_list.insert(-1, "".join(login_template_list))
  login_list[-2] = login_list[-2].replace("},", "}")
#-----------------------------------------------------pkplayer---------------------------------------
  for role_ip in lpkplayer:
    pklayeer_template_list = ['      {\n', '        "host": "{0}",\n'.format(role_ip), '        "portStart": 5030,\n', '        "portEnd": 5044,\n', '        "length": 15\n', '      },\n']
    pklayer_list.insert(-1, "".join(pklayeer_template_list))
  pklayer_list[-2] = pklayer_list[-2].replace("},", "}")
#-----------------------------------------------------llink---------------------------------------
  for role_ip in llink:
    link_template_list = ['      {\n', '        "host": "{0}",\n'.format(role_ip), '        "portStart": 15120,\n', '        "portEnd": 17129,\n', '        "clientPortStart": 15010,\n', '        "clientPortEnd": 15029,\n', '        "length": 30\n', '      },\n']
    link_list.insert(-1, "".join(link_template_list))
  link_list[-2] = link_list[-2].replace("},", "}")
else:
  print "---------------------------------------------------------------------"
  logging.error(red("\tPlsese Usage single/much"))
  print "---------------------------------------------------------------------"
  quit()

def bak(source_file):
  bak_path = "/home/install_bak"
  if not os.path.exists(bak_path):
    os.mkdir(bak_path)
  shutil.copy2(source_file, "{0}/{1}".format(bak_path, os.path.basename(source_file)) + "." + bak_time)

def c_single_server():
  project_list.insert(1, "".join(login_list))
  project_list.insert(2, "".join(pklayer_list))
  project_list.insert(3, "".join(room_list))
  project_list.insert(4, "".join(link_list))
  if not os.path.exists(template_file): 
    print "------------------------------------------------------------------"
    logging.error(red("\t{0} is not exist !!!!!!!!".format(template_file)))
    print "------------------------------------------------------------------"
    quit()
  new_list = []
  with open(template_file, "rb") as f:
    for a in f.readlines():
      if '"%s"' % (project_name) in a:
        print "------------------------------------"
        logging.info(green("\tfile {0} allready update".format(template_file)))
        print "------------------------------------"
        quit()
      new_list.insert(-1, a)
  if new_list[-1] == "{\n":
    new_list.insert(0, new_list[-1])
    new_list.pop(-1)
  new_list[-2] = "  },\n"
  new_list.insert(-1, "".join(project_list))
  bak(template_file)
  with open(template_file, "wb") as f:
    f.write("".join(new_list))

def c_much_server():
  project_list.insert(1, "".join(login_list))
  project_list.insert(2, "".join(pklayer_list))
  project_list.insert(3, "".join(room_list))
  project_list.insert(4, "".join(link_list))
  if not os.path.exists(template_file):
    print "------------------------------------------------------------------"
    logging.error(red("\t{0} is not exist !!!!!!!!".format(template_file)))
    print "------------------------------------------------------------------"
    quit()
  new_list = []
  with open(template_file, "rb") as f:
    for a in f.readlines():
      if '"%s"' % (project_name) in a:
        print "------------------------------------"
        logging.info(green("\tfile {0} allready update".format(template_file)))
        print "------------------------------------"
        quit()
      new_list.insert(-1, a)
  if new_list[-1] == "{\n":
    new_list.insert(0, new_list[-1])
    new_list.pop(-1)
  new_list[-2] = new_list[-2].replace("}", "},")
  new_list.insert(-1, "".join(project_list))
  bak(template_file)
  try:
    with open(template_file, "wb") as f:
      f.write("".join(new_list))
    print "-------------------------------------------"
    logging.info(green("\t{0} update success".format(template_file)))
    print "-------------------------------------------"
  except Exception,e:
    print Exception,":",e
    print "----------------------------------------------------------"
    logging.error(red("\tupdate {0} fail !!!!!!!!".format(template_file)))
    print "-----------------------------------------------------------"
    quit()

#-------------------------------------------------------servers.json------------------------
import shutil
template_json_path = "/root/mjserver/tool/"
servers_json_path = "/root/mjserver/game-server/config/"
def c_servers_json():
  servers_json = "{0}servers.json".format(servers_json_path)
  os.chdir(template_json_path)
  sc_servers_json_cmd = 'node createInLine.js ./template.json servers.json'
  if os.system(sc_servers_json_cmd) == 0:
    print "------------------------------------------------"
    logging.info(green("\tcreate servers.json success"))
    print "------------------------------------------------"
    if os.path.exists(servers_json):
      os.system("mv {0} {1}".format(servers_json, servers_json + ".bak"))
    s_server_json = "{0}servers.json".format(template_json_path)
    s_size = os.stat(s_server_json).st_size
    shutil.move(s_server_json, servers_json)
    if os.stat(servers_json).st_size == s_size:
      print "------------------------------------------------"
      logging.info(green("\tmove {1} to {0} success".format(servers_json, s_server_json)))
      print "------------------------------------------------"
    else:
      print "------------------------------------------------"
      logging.info(green("\tmove {1} to {0} fail !!!!!!!!".format(servers_json, s_server_json)))
      print "------------------------------------------------"
      quit()

#-------------------------------------------------------master.json------------------------
def c_master_json():
  master_json = "{0}master.json".format(servers_json_path)
  with open(master_json) as f:
    all_list = f.readlines()
    for a in all_list:
      if '"%s"' % (project_name) in a:
        print "------------------------------------"
        logging.info(green("\tfile {0} allready update".format(master_json)))
        print "------------------------------------"
        quit()
  eth0_list = os.popen('ip a|grep "global eth0"').read().strip().split()
  local_nw_ip = eth0_list[1].split("/")[0]
  master_list = ['  "%s": {\n' % (project_name), '    "id": "%s", "host": "%s", "port": 3005, "accountServer": 4005, "actServer": {"port": 100,"num": 1}\n' % (project_name, local_nw_ip), '  }\n']
  all_list[-2] = all_list[-2].replace("}", "},")
  all_list.insert(-1, "".join(master_list))
  try:
    with open(master_json, "wb") as f:
      f.write("".join(all_list))
    print "-------------------------------------------"
    logging.info(green("\t{0} update success".format(master_json)))
    print "-------------------------------------------"
  except Exception,e:
    print Exception,":",e
    print "----------------------------------------------------------"
    logging.error(red("\tupdate {0} fail !!!!!!!!".format(master_json)))
    print "-----------------------------------------------------------"
    quit()
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
  

if stype == "single":
  c_single_server()
elif stype == "much":
  c_much_server()

c_servers_json()
c_master_json()
c_project_json()
