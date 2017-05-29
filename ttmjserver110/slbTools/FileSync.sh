#!/bin/sh

hostname=$(echo $HOSTNAME | awk -F '-' '{print $1}')
hostType=$(echo $HOSTNAME | awk -F '-' '{print $2}')
hostType=$(echo ${hostType} | awk -F [0-9] '{print $1}')
currentPath=$PWD
ad=$(bash ${currentPath}/command/getCatalog /root)
ads=(${ad// /})


declare -A data
data[ynmj]=139.224.25.69
data[xynmmj]=60.205.162.217
data[scmj]=120.27.215.168
data[nxmj]=60.205.163.104
data[ahmj]=121.196.212.241
data[sdmj]=139.129.210.173
data[gxphz]=139.224.52.5
data[gxmj]=139.196.178.124 
data[guandan]=139.224.55.15
data[ddz]=120.27.138.29
data[gdmj]=120.27.238.229
data[fjmj]=121.43.172.224
data[jsmj]=139.196.109.132
data[jxmj]=121.43.173.173
data[henmj]=121.43.177.77
data[zjmj]=120.27.211.254
data[hanmj]=139.196.214.38
data[kwx]=120.27.157.198
data[hnmj]=120.76.202.214
data[gsmj]=121.43.168.36
data[gzmj]=120.27.223.91
data[pdk]=120.76.220.46
data[phz]=121.43.167.40
data[ljmj]=59.110.167.114
data[sxmj]=139.196.178.13
data[ylgymj]=121.196.216.98
data[psz]=121.196.192.73

#withoutPro=[scmj,phz,ddz,gzmj,sxmj,gdmj]

#function getJsonVersion()
#{
#   temp=$(ls -l /root/$1/web | grep json | awk '{print $9}')
#   echo ${temp}
#}

function downloadFile()
{
    relay=$1
    if [ $1 == "hnmj" ];then
    relay=symj
    fi
    wget -q -O /root/$1/web/$2_temp http://${data[$1]}:800/${relay}/$2
    if [ ${?} != 0 ];then
    bash ${currentPath}/command/echoColor "${0}: download $1 -> $2 error" error
    else
    cp -f /root/$1/web/$2_temp /root/$1/web/$2
    bash ${currentPath}/command/echoColor "${0}: download $1 -> $2 successful and /root/$1/web/$2_temp -> /root/$1/web/$2" info
    fi
    rm -rf /root/$1/web/$2_temp
}


function getJsonWithOutServer()
{
    echo configuration.json
    echo notice.json
    echo action.json
    echo gamefree.json
}



for key in $(echo ${!data[*]})
do
   #val=$(getJsonVersion ${key})

   #if [[ "${withoutPro[*]}" =~ ${key} ]];then
   #val=$(getJsonWithOutServer)
   #fi

   val=$(getJsonWithOutServer)

   for key1 in ${val}
   do
   downloadFile ${key} ${key1}
   done
done
