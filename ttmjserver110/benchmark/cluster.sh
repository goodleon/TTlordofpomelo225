#!/bin/bash

for((i=1;i<10;i++))
do
   nohup node app.js &
done
