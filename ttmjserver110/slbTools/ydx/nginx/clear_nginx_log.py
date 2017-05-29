#!/usr/bin/python
#coding=utf8

import os,sys

log_path = "/var/log/nginx/access.log"
check_size = os.popen("du -sh {0}".format(log_path)).read()
log_size = check_size.split()[0]
if "G" in log_size:
  clear_cmd = "echo '0' > {0}".format(log_path)
  if os.system(clear_cmd) == 0:
    print "clear nginx log success"
