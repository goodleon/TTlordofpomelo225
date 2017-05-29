#!/usr/bin/python
#coding =utf8

import os,sys
script_path="/root/slbTools/ydx/shell/"
sys.path.append(script_path)
import base_service
nginx = base_service.SoftWare_Config('nginx')
nginx.s_install()
nginx.configure_nginx()
nginx.s_system_boot()
nginx.s_start()
nginx.s_restart()
