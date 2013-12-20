#!/bin/bash
# a simple script to open the content and frontend servers (convienience script)

#obtain ports
ports=`python config.py`
set -- $ports
ci=$1
cp=$2
fi=$3
fp=$4

python content_server/server.py $ci:$cp &
cserver_id=$!
python app_server/manage.py runserver $fi:$fp --insecure

# stop both servers on exit (this may not be desirable)
pkill -TERM -P $cserver_id
