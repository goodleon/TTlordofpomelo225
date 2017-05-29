#!/bin/sh

Config_Nginx(){
  bakpath='/home/bakpath'
  nginx_conf='/etc/nginx/nginx.conf'
  target_nr='/root/mjserver/web-server/public'
  nginx_root='/root/web'
  check_num=`grep -c $target_nr $nginx_conf`
  if [ ! -e $bakpath ];then
    mkdir $bakpath
  fi
  if [ $check_num -gt 0 ];then
    \cp -f $nginx_conf $bakpath/nginx.conf
    echo
    echo "bak nginx.conf to $bakpath/nginx.conf"
    echo
    sed -i "s#$target_nr#$nginx_root#" $nginx_conf
    systemctl restart nginx
    check_num_again=`grep -c $target_nr $nginx_conf`
    if [ $check_num_again  -eq 0 ];then
      echo
      echo "Nginx update success!"
      echo
    else
      echo "Nginx update fail!!!!!"
      \cp -f $bakpath/nginx.conf $nginx_conf
      systemctl restart nginx
      echo "allready restore nginx"
      exit 1
    fi
  else
    echo "nginx root_path is allready update"
  fi
}

Config_Nginx
