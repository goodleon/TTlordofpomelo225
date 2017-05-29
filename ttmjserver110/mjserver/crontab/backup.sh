#!/bin/sh

hostname=$HOSTNAME
ip=0
dataName=0
nowDate=$(date +%Y-%m-%d)_back

nameArray=("scmj" "phz" "hnmj" "ddz" "gzmj" "ynmj" "xynmmj" "gdmj" "gxphz" "gxmj" "hanmj" "zjmj" "kwx" "fjmj" "pkd" "sxmj")
ipArray=("172.16.114.186" "172.16.114.255" "10.25.103.70" "10.47.113.110" "172.16.114.214" "10.25.36.69" "10.26.168.150" "172.16.114.165" "10.25.38.194" "10.25.45.236" "172.16.115.8" "172.16.115.4" "10.47.114.92" "172.16.115.10" "10.25.203.121" "10.25.45.188")
count=${#nameArray[@]}


function fSum()
{
    if [[ "$1" == *$2* ]]
    then
    ip=${ipArray[$3]}
    dataName=$2
    fi
    return $(($1+$2));
}


for ((i=0;i<$count;i=i+1))
do
fSum $hostname ${nameArray[$i]} $i
#echo ${nameArray[$i]}
done

#echo ${nameArray[*]}


if [ $ip != 0 ]
then
echo $ip
echo $dataName
echo $nowDate
mongodump -h $ip -d $dataName -c cgbuser  -o /mnt/vdb1/$nowDate
mongodump -h $ip -d $dataName -c majiang  -o /mnt/vdb1/$nowDate
mongodump -h $ip -d $dataName -c members  -o /mnt/vdb1/$nowDate
fi
