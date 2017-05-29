#! /bin/sh
export NODE_PATH=/usr/lib/node_modules

currentPath=$PWD
hostname=$(echo $HOSTNAME | awk -F '-' '{print $1}')
hostType=$(echo $HOSTNAME | awk -F '-' '{print $2}')

declare -A data
#data[0]=A_pkroom1
#data[1]=A_pkroom2
data[0]=pkroom0000
data[1]=pkroom0001
data[2]=pkroom0002
data[3]=pkroom0003
data[4]=pkroom0004
data[5]=pkroom0005
#进程名字可修改


for key in ${data[@]}
do
  proname=${key}
  
  NUM=`ps aux | grep ${proname} | grep -v grep |wc -l`

  if [ "${NUM}" -lt "1" ];then
     echo "${proname} was killed"
     cd   /root/mjserver/game-server
     pomelo start -e ${hostname} -D -t pkroom -i ${proname}
  fi 
  

done

  
exit 0