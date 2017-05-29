#!/usr/bin/python
#coding=utf8
import os,sys
import socket

script_path = '/root/slbTools/ydx/shell'
sys.path.append(script_path)
import base_fuc

if len(sys.argv) == 2:
  hname = socket.gethostname()
  new_hname = sys.argv[1]
else:
  hname = socket.gethostname()
  new_hname = hname

boot_file = '/etc/rc.d/rc.local'
bc = base_fuc.chmod_fp()
bc.chmodfp(boot_file, 755)
if os.system('hostname {0}'.format(new_hname)) == 0:
  nr_list = []
  with open(boot_file,'rb') as f:
    for num,nr in enumerate(f.readlines()):
      nr_list.append(nr)
  if "hostname {0}".format(hname) in "".join(nr_list):
    t_replace = "hostname {0}".format(hname)
  elif "hostname {0}".format(new_hname) in "".join(nr_list):
    t_replace = "hostname {0}".format(new_hname)
  else:
    t_replace = "null"
  chk_hname = t_replace.split()[-1]
  if not chk_hname == new_hname:
    if chk_hname == hname:
      for nr in nr_list:
        if "hostname {0}".format(hname) in nr:
          nr_num = nr_list.index(nr)
          nr_list[nr_num] = "hostname {0}".format(new_hname)
          break
      new_nr = "".join(nr_list)
      with open(boot_file, 'wb') as f:
        f.write(new_nr)
        print "------------------------------------------------------------------"
        print "Change the current host name {0} to {1} success".format(hname, new_hname)
        print "------------------------------------------------------------------"
    elif chk_hname == "null":
      new_list = []
      new_list.append('sleep 5\n')
      new_list.append('hostname {0}\n'.format(new_hname))
      new_nr = "".join(new_list)
      with open(boot_file, 'ab') as f:
        f.write(new_nr)
        print "------------------------------------------------------------------"
        print "Change the current host name {0} to {1} success".format(hname, new_hname)
        print "------------------------------------------------------------------"
  elif chk_hname == new_hname:
    print "---------------------------------------------------------"
    print "Cannot change"
    print "The new host name is allready update"
    print "---------------------------------------------------------"
    quit()
