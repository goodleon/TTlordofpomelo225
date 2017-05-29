#!/bin/bash

export NODE_PATH=/usr/lib/node_modules

hostname=$(echo $HOSTNAME | awk -F '-' '{print $1}')

node /root/webadmin/tool/money.js ${hostname}