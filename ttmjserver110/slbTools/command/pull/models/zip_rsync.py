#!/usr/bin/python
#coding=utf8
import os,sys,socket
import glob

import os,sys
Current_PATH = os.getcwd()
BASE_PATH = os.path.dirname(os.path.dirname(Current_PATH + os.sep + __file__))
sys.path.append(BASE_PATH)
sys.path.append("/root/slbTools/ydx/shell/")
from config import settings
from lib import public

#---------------------------------------------remove zip------------------------------
def do(pname):
  project_zip_path = '/root/{0}_zip/web'.format(pname)
  lb_zip_path = '/root/{0}/web'.format(pname)
  if not os.path.exists(lb_zip_path):
    err_info = "不存在web路径{0}".format(lb_zip_path)
    public.recode_log(err_info, 'error')
    public.xiushi(err_info, 'error')
    quit()
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
        project_server_web_path = '{0}/{1}'.format(lb_zip_path, source_web_path)
        pname_zip_list = glob.glob('{0}/*.zip'.format(project_server_web_path))
        for pname_zip in pname_zip_list:
          new_pname_zip = pname_zip.split('/')[-1]
          if not new_pname_zip in source_zip_list:
            try:
              os.remove(pname_zip)
            except Exception as e:
              print e
              err_info = "remove {0} is error !!!!!!".format(pname_zip)
              public.recode_log(err_info, 'error')
              public.xiushi(err_info, 'error')
            else:
              right_info = "remove old data {0} is success".format(pname_zip)
              public.xiushi(right_info, 'info')
  else:
    print "not exists {0} please check !!!!".format(project_zip_path)
    quit()
