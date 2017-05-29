#!/bin/sh
#Author : dongxingqiang
#2017-01-08

GIT_UPDATE(){
cd /root/
DIR=""
if [ "$2" == "web" ];then
  DIR="${1}_new"
else
  DIR=${1}_zip
fi

if [ ! -e $DIR ];then
  git clone http://git.happyplaygame.net/Publish/${1}_${2}.git $DIR
  if [ $? -ne 0 ];then
    echo "git clone $DIR fail!"
    exit 1
  fi
else
  cd $DIR
  git checkout .
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
  if [ "$2" == "web" ];then
    WEB_DIR="$1_new/web"
  else
    WEB_DIR="${1}_zip/web"
  fi
  if [ ! -e $WEB_DIR ];then
    echo "${WEBDIR}/web not exist!"
    exit 1
  fi
}

MV_AND_LN() {
  cd /root
  mv ${1} ${1}_`date +%F`bak
  mv ${1}_new ${1}
  if [ ! -e ./web ];then
    mkdir -p ./web
  fi   
  cd /root/web
  rm -f ${1}
  ln -s /root/${1}/web /root/web/${1}

}

MAIN(){
cd /root/

GIT_UPDATE $1 web
GIT_UPDATE $1 zip
WEB_DIR_EXIST $1 web
WEB_DIR_EXIST $1 zip
\cp -rf ${1}_zip/web/* ${1}_new/web/
MV_AND_LN ${1}
systemctl restart nginx.service
}

if [ "$1" == "" ];then
  echo -e "\$1 is null.\nplease input project name"
  exit 1
else
  MAIN ${1}
fi

