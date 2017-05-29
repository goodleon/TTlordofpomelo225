#!/usr/bin/python
#coding=utf8
import os,sys,socket
import glob
import logging

def red(info):
  return "\033[1;31;40m{0}\033[0m".format(info)
def green(info):
  return "\033[1;32;40m{0}\033[0m".format(info)
hname = socket.gethostname().lower()
host_stype = hname.split("-")[1]
host_project = hname.split("-")[0]
if len(sys.argv) == 2:
  target = sys.argv[1]
else:
  print red("\tPlease Usage {0} project_name".format(sys.argv[0]))
  quit()

if not host_stype == "lb":
  if not host_project == target:
    print red("\tproject_name not equal {0}!!!".format(host_project))
    quit()
script_path = "/root/slbTools/ydx/shell/"
sys.path.append(script_path)
import base_fuc
mk = base_fuc.mkfp()
log_path = '/home/logs/'
#------------------------------------------log---------------------------------------
pull_log = '{0}pull.log'.format(log_path)
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
#---------------------------------------------remove zip------------------------------
project_zip_path = '/root/{0}_zip/web'.format(target)
if os.path.exists(project_zip_path):
  cf_lists = glob.glob('{0}/*'.format(project_zip_path))
  for cf in cf_lists:
    if os.path.isdir(cf) == True:
      source_web_path = os.path.basename(cf)
      zip_list = glob.glob('{0}/*.zip'.format(cf))
      source_zip_list = []
      for nzip in zip_list:
        nzip = nzip.split('/')[-1]
        source_zip_list.append(nzip)
      project_server_web_path = '/root/{0}/web/{1}'.format(target, source_web_path)
      target_zip_list = glob.glob('{0}/*.zip'.format(project_server_web_path))
      for target_zip in target_zip_list:
        new_target_zip = target_zip.split('/')[-1]
        if not new_target_zip in source_zip_list:
          try:
            os.remove(target_zip)
          except Exception as e:
            print e
            logging.error(ren("\tremove {0} is error !!!!!!".format(target_zip)))
          else:
            logging.info(green("\tremove old data {0} is success".format(target_zip)))
else:
  print red("not exists {0} please check !!!!".format(project_zip_path))
  quit()
