#!/bin/sh

hostname=$(echo $HOSTNAME | awk -F '-' '{print $1}')
hostType=$(echo $HOSTNAME | awk -F '-' '{print $2}')
hostType=$(echo ${hostType} | awk -F [0-9] '{print $1}')
currentPath=$PWD
ad=$(bash ${currentPath}/command/getCatalog /root)
ads=(${ad// /})


declare -A data
data[scmj]=120.27.215.168

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
