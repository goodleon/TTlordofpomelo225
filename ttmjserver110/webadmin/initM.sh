#!/bin/sh

#chkconfig: - 85 15
#description: my game server

export NODE_PATH=/usr/lib/node_modules
node initMember.js 127.0.0.1 test


