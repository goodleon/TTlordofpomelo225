#!/bin/sh
mydate=$(date -d "tomorrow" +%Y-%m-%d)
echo $mydate
targetPath="/playlog/"$mydate
curPath="/mnt/vdb1/"$mydate
echo $targetPath
if [ -d $targetPath ]
then
echo "exist"
else
echo "no exist"
if [ -d $curPath ]
then
echo "must link"
else
mkdir $curPath
fi
if [ -d $curPath ]
then
ln -s $curPath $targetPath
fi
fi



