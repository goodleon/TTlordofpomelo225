#!/bin/sh

#chkconfig: - 85 15
#description: my game server

ulimit -n 20000
export NODE_PATH=/usr/lib/node_modules

cd game-server

pomelo start -e localhost -D



