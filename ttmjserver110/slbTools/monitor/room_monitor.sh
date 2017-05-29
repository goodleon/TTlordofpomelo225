#!/bin/sh
#监控主机进程，cpu，内存占用
#生成数组命令
#key="`ps aux |grep node|grep id=pkcon|awk '{print $16}'|sort|sed 's/id=//'`";i=0; for j in `echo $key|xargs`; do echo "data[${i}]=$j";i=$((i+1)); done
export NODE_PATH=/usr/lib/node_modules
export LANG=zh_CN.utf-8

currentPath=$PWD
#HOST_NAME=$(echo $HOSTNAME | awk -F '-' '{print $1}')
HOST_NAME=$(echo $HOSTNAME)
hostType=$(echo $HOSTNAME | awk -F '-' '{print $2}')
MAIL_LIST="dongxingqiang@happyplaygame.net,yangdongxu@happyplaygame.net,liuhuanqiang@happyplaygame.net,gaowei@happyplaygame.net,fujiangong@happyplaygame.net"
OPT="-r service@happyplaygame.net -S smtp=smtps://smtphz.qiye.163.com:465  -S smtp-auth-user=service@happyplaygame.net -S smtp-auth-password=TUOl1h81Ryuc0DSQ -S smtp-auth=login -S ssl-verify=ignore -S nss-config-dir=/etc/pki/nssdb/"
declare -A data
#data[0]=A_pkroom1
data[0]=pkroom0000
data[1]=pkroom0001
data[2]=pkroom0002
data[3]=pkroom0003
data[4]=pkroom0004
data[5]=pkroom0005
data[6]=pkroom0007
data[7]=pkroom0008
data[8]=pkroom0009
data[9]=pkroom0010
data[10]=pkroom0011
data[11]=pkroom0012
data[12]=pkroom0013
data[13]=pkroom0014
data[14]=pkroom0015
data[15]=pkroom0016
data[16]=pkroom0017
data[17]=pkroom0018
data[18]=pkroom0019
data[19]=pkroom0020
data[20]=pkroom0021
data[21]=pkroom0022
data[22]=pkroom0023
data[24]=pkroom0025
data[25]=pkroom0026
data[26]=pkroom0027
data[27]=pkroom0028
data[28]=pkroom0029
#进程名字可修改

#检测进程存活
check_alived() {
  flag=""
  for key in ${data[@]}
  do
    proname=${key}
    NUM=`ps aux | grep "id=${proname}" | grep -v grep |wc -l`

    if [ "${NUM}" -lt "1" ];then
      flag="$flag ${proname}"
      #cd   /root/mjserver/game-server
      #pomelo start -e ${hostname} -D -t pkroom -i ${proname}
    fi
  done
  if [ -z "$flag" ];then
    echo "process is normal."
  else
    echo "${HOST_NAME}:${flag} process was killed."
    echo "${HOST_NAME}:${flag} process was killed." |mail ${OPT} -s "host:${HOST_NAME} process monitor" $MAIL_LIST

  fi

}

#检测cpu占用
check_cpu() {
  flag=""
  for key in ${data[@]}
  do
    proname=${key}
    CPU=`ps aux | grep "id=${proname}" | grep -v grep |awk '{print $3}'|awk -F. '{print $1}'`
    if [ -z ${CPU} ];then
    CPU=0
    fi
    echo "${proname}:${CPU}"
    if [ ${CPU} -gt 80 ];then
    #if [ ${CPU} -eq 0 ];then
      flag="$flag ${proname}:${CPU}"
    fi
  done

  if [ -z "$flag" ];then
    echo "cpu is normal."
    return 0
  else
    echo "${HOST_NAME}:${flag} cpu great than 80%." 
    echo "${HOST_NAME}:${flag} cpu great than 80%." |mail ${OPT} -s "host:${HOST_NAME}CPU monitor" $MAIL_LIST
  fi

}

#检测进程内存占用,rss单位为kb
check_mem() {
  flag=""
  for key in ${data[@]}
  do
  proname=$key
  MEM=`ps aux | grep "id=${proname}" | grep -v grep |awk '{print $6}'`
  if [ -z ${MEM} ];then
    MEM=0
  fi
  echo "${proname}:${MEM}"

  if [ ${MEM} -gt 1048576 ];then
  #if [ ${MEM} -eq 0 ];then
    flag="$flag ${proname}:${MEM}"
  fi
  done
  if [ -z "$flag" ];then
    echo "mem is normal."
    return 0
  else
    echo "${HOST_NAME}:${flag} mem great than 1G." 
    echo "${HOST_NAME}:${flag} mem great than 1G." |mail ${OPT} -s "host:${HOST_NAME} MEM monitor" $MAIL_LIST
  fi


}
echo "`date`"
check_alived
check_cpu
check_mem

