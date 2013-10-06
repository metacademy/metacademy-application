Metacademy's Source
==============

This source is licensed under GPLv3, see LICENSE.txt (note: metacademy's content is CC BY SA 3.0).

## Installation

Current installation instructions for *nix and OSX (6 Oct 2013), all commands are executed from the terminal

### Preliminary requirements

1. Currently, the only preliminary requirement is [pip](http://www.pip-installer.org/en/latest/); here are [pip's installation instructions](http://www.pip-installer.org/en/latest/installing.html)

### Setting up a virtual environment
We recommend using a virtual environment if you will be developing for the metacademy application, this way, metacademy won't conflict with your system libraries

1. install virtualenv `pip install virtualenv` (you may need to instead run `sudo pip install virtualenv`)
1. create a top-level metacademy directory in a desired location, e.g. `mkdir -p ~/MyProjects/metacademy`
1. go to the top-level metacademy directory `cd ~/MyProjects/metacademy`
1. initialize a virtual environment in this directory 

        virtualenv --no-site-packages .

1. activate your virtual environment
    
        source bin/activate 

### Installing metacademy-application, metacademy-content, and dependencies
1. from your top-level metacademy directory, clone the content and the application servers:
 
        git clone https://github.com/metacademy/metacademy-application.git

        git clone https://github.com/metacademy/metacademy-content.git
        
1. create a `local_dbs` directory (note: you can move/change this directory as long as you update `config.py` appropriately, see below)

        mkdir local_dbs
        
1. create appropriate subdirectories (note: you can move/change these directories as long as you update `config.py` appropriately, see below)

        mkdir local_dbs/django_db
        
        mkdir local_dbs/content_index
        
        mkdir local_dbs/app_index
        
1. go to the `metacademy-application` directory

        cd metacademy-application
        
1. install the metacademy-application dependencies 

        pip install -r requirements.txt

1. copy `config-template.py` to `config.py`

        cp config-template.py config.py
        
1. copy `app_server/settings_local-template.py` to `app_server/settings_local.py`

        cp app_server/settings_local-template.py app_server/settings_local.py

1. from `metacademy-application` project directory:

        python app_server/manage.py syncdb # you'll be prompted to create an admin account -- simply follow the instructions
        
        python app_server/manage.py migrate

        ./run_test_servers.sh
        
1. Open [localhost:8080](http://localhost:8080) with a modern javascript-enabled browser, preferably a webkit-based browser

Note: the initial search may take some time to load (the backend must load the graph into memory), but all subsequent pages should load much quicker.

If you have any problems with this installations, please submit a ticket at [https://github.com/metacademy/metacademy-application/issues?state=open](https://github.com/metacademy/metacademy-application/issues?state=open)
