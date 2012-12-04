#!/bin/bash

PATH=/bin:/sbin:/usr/bin:/usr/sbin:$PATH
export PATH

cd /opt/node-pro/fundFlow/lib 
pid=`cat generate.pid`
if [ -z $pid ]
then
 echo "receiveData is not running"
else
 kill -9 $pid
fi
/usr/local/bin/node  generate-index.js &

