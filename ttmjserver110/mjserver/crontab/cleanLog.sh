#!/bin/sh
mydate=$(date -d "3 days ago" +%Y-%m-%d)
echo $mydate

myMSec=$(date --date=$mydate +%s)
echo $myMSec

location="/playlog/"

for dirlist in ${location}*
do

if test -d $dirlist
then

time=${dirlist##*/}
echo $time

times=`echo $time|sed "s/-//g"`
echo $times

msec=$(date --date=$times +%s)
echo $msec

if [ "$myMSec" -gt "$msec" ]
then
rm -rf $dirlist
fi

fi
done