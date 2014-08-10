#!/bin/bash -mx

# from `help set`
#
#      -m  Job control is enabled. # needed for use of `&`
#      -x  Print commands and their arguments as they are executed. # as we are testing here.

# set the env
source ../meta_venv/bin/activate
python app_server/manage.py runserver 8080 --noreload & # `&` sends the process to the background

# run the django tests
echo "Django Tests"
#python app_server/manage.py test

# run the browser tests
echo "Browser Tests"
./node_modules/mocha-phantomjs/bin/mocha-phantomjs http://127.0.0.1:8080/browser-tests

# run the selenium tests
python selenium_tests/simple_selenium_tests.py

kill %1 # kills the first, in this case our app_server background process
