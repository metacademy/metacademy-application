#!/bin/bash
# a simple script to open the content and frontend servers (convienience script)

#obtain ports
ports=`python config.py`
set -- $ports
cp=$1
shift
fp=$@

python content_server/server.py $cp &
cserver_id=$!
python manage.py runserver $fp

# stop both servers on exit (this may not be desirable)
kill $cserver_id
