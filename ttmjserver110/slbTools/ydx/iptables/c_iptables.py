#!/usr/bin/python
#coding =utf8

import os,sys
script_path="/root/slbTools/ydx/shell/"
sys.path.append(script_path)
import base_service
nginx = base_service.SoftWare_Config('iptables-services')
nginx.s_install()
nginx.configure_iptables()
nginx.s_system_boot()
nginx.s_start()
nginx.s_restart()
