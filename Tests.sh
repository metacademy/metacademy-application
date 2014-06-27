#!/bin/bash -e

# set the env
source ../meta_venv/bin/activate
python app_server/manage.py runserver 8080 &
rserver_id=$!

# run the django tests
echo "Django Tests"
python app_server/manage.py test

# run the browser tests
echo "Browser Tests"
./node_modules/mocha-phantomjs/bin/mocha-phantomjs http://127.0.0.1:8080/browser-tests

# run the selenium tests
python selenium_tests/simple_selenium_tests.py
pkill -TERM -P $rserver_id
