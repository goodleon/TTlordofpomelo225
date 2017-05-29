#!/bin/sh
#Author : dongxingqiang
#2017-01-08

GIT_UPDATE(){
cd /root/
  DIR=""
  if [ "$2" == "server" ];then
    DIR="${1}_new"
  elif [ "$2" == "zip"  ];then
    DIR="${1}_zip"
  else
    DIR="${1}_web"
  fi
  if [ ! -e $DIR ];then
    git clone http://git.happyplaygame.net/Publish/${1}_${2}.git $DIR
    if [ $? -ne 0 ];then
      echo "git clone $DIR fail!"
      exit 1
    fi
  fi
}

WEB_DIR_EXIST(){
  cd /root/
  WEB_DIR=''
  if [ "$2" == "server" ];then
    WEB_DIR="$1_new/web"
  elif [ "$2" == "zip" ];then
    WEB_DIR="${1}_zip/web"
  else
    WEB_DIR="${1}_web/web"
  fi
  if [ ! -e $WEB_DIR ];then
    echo "${WEBDIR}/web not exist!"
    exit 1
  fi
}

MV_AND_LN() {
  cd /root
if [ -e ${1}_new ];then
  echo 1
  mv ${1} ${1}_`date +%F`bak
  mkdir -p ${1}_new/web
  \cp -rf ${1}_web/web/* ${1}_new/web/ 
  \cp -rf ${1}_zip/web/* ${1}_new/web/
  mv ${1}_new ${1}

  for PRO_NAME in `cd /root/${1};ls -l|grep "^d"|awk '{print $9}'|xargs`
  do
    if [ "$PRO_NAME" != "web" ];then 
      rm -f /root/mjserver/game-server/app/servers/pkroom/games/${PRO_NAME}
      ln -s /root/${1}/${PRO_NAME} /root/mjserver/game-server/app/servers/pkroom/games/${PRO_NAME}
    else
      rm -f /root/mjserver/web-server/public/${PRO_NAME}
      ln -s /root/${1}/web    /root/mjserver/web-server/public/${1}
    fi
  done
else
  echo 2
  cd /root/${1}
  git pull
  cd /root/${1}_zip
  git pull
  cd /root/${1}_web
  git pull
  rm -rf /root/${1}/web
  mkdir -p /root/${1}/web
  cd /root/
  \cp -rf ${1}_web/web/* ${1}/web/
  \cp -rf ${1}_zip/web/* ${1}/web/
  for LINK in  `ls -l /root/mjserver/game-server/app/servers/pkroom/games/|grep "^l"|awk '{print $9}'|xargs`
  do
    rm -f /root/mjserver/game-server/app/servers/pkroom/games/$LINK  
  done
  rm -f /root/mjserver/web-server/public/${1}
  for PRO_NAME in `cd /root/${1};ls -l|grep "^d"|awk '{print $9}'|xargs`
  do
    if [ "$PRO_NAME" != "web" ];then 
      ln -s /root/${1}/${PRO_NAME} /root/mjserver/game-server/app/servers/pkroom/games/${PRO_NAME}
    else
      ln -s /root/${1}/web    /root/mjserver/web-server/public/${1}
    fi
  done

fi    
}

MAIN(){
cd /root/
if [ ! -e ${1}_web ];then
  GIT_UPDATE $1 server
  GIT_UPDATE $1 web
  GIT_UPDATE $1 zip
  WEB_DIR_EXIST $1 web
  WEB_DIR_EXIST $1 zip
  MV_AND_LN ${1}
else
  MV_AND_LN ${1}
fi
}

if [ "$1" == "" ];then
  echo -e "\$1 is null.\nplease input project name"
  exit 1
else
  MAIN ${1}
fi

