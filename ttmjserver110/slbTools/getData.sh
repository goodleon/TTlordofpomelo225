#!/bin/sh
#Author : dongxingqiang
#2017-01-08

GIT_UPDATE(){
cd /root/
DIR=''
if [ "$2" == "server" ];then
  DIR="$1"
else
  DIR=${1}_${2}
fi

if [ ! -e $DIR ];then
  git clone http://git.happyplaygame.net/Publish/${1}_${2}.git $DIR
  if [ $? -ne 0 ];then
    echo "git clone $DIR fail!"
    exit 1
  fi
else
  cd $DIR
  git pull
  if [ $? -ne 0 ];then
    echo "git pull $DIR fail!"
    exit 1
  fi
fi
}

WEB_DIR_EXIST(){
  cd /root/
  WEB_DIR=''
  if [ "$2" == "server" ];then
    WEB_DIR="$1/web"
  else
    WEB_DIR="${1}_zip/web"
  fi
  if [ ! -e $WEB_DIR ];then
    echo "${WEBDIR}/web not exist!"
    exit 1
  fi
}


MAIN(){
cd /root/

GIT_UPDATE $1 server
GIT_UPDATE $1 web
GIT_UPDATE $1 zip

WEB_DIR_EXIST $1 server
WEB_DIR_EXIST $1 web
WEB_DIR_EXIST $1 zip

cp -rf ${1}_zip/web/* ${1}/web/

if [ ! -e ./web ];then
  mkdir -p ./web
fi

if [ ! -e /root/web/${1} ];then
  ln -s /root/${1}/web /root/web/${1}
else
  if [ ! -L /root/web/${1} ];then
    mv /root/web/${1} /root/web/${1}_`date +%F`
    ln -s /root/${1}/web /root/web/${1}
  fi
fi
Config_Nginx
}

if [ "$1" == "" ];then
  echo -e "\$1 is null.\nplease input project name"
  exit 1
else
  MAIN ${1}
fi

