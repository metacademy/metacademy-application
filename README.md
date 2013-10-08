Metacademy's Source
==============

This source is licensed under GPLv3, see LICENSE.txt (note: metacademy's content is CC BY SA 3.0).

## Installation

Current installation instructions for *nix and OSX (6 Oct 2013), all commands are executed from the terminal

### Preliminary requirements
* Install python 2.7X. NB: install `python-devel` if you're using a package manager such as apt-get. The following command should print a path (if this command raises an exception, make sure that you have the `python-devel` version installed):
* 
            python -c 'from distutils.sysconfig import get_makefile_filename as m; print m()'

* Install [gcc](http://gcc.gnu.org) (OSX users: installing the [OSX developer tools](https://developer.apple.com/technologies/tools/) is probably the easiest way to do this). The following command should not throw an error:
        
        gcc -v  

* Install [pip](http://www.pip-installer.org/en/latest/); here are [pip's installation instructions](http://www.pip-installer.org/en/latest/installing.html). The following command should not throw an error:

        pip -V

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

        mkdir local_dbs/django_db local_dbs/content_index local_dbs/app_index

1. go to the `metacademy-application` directory

        cd metacademy-application
        
1. install the metacademy-application dependencies 

        pip install -r requirements.txt

1. copy `config-template.py` to `config.py`

        cp config-template.py config.py
        
1. copy `app_server/settings_local-template.py` to `app_server/settings_local.py`

        cp app_server/settings_local-template.py app_server/settings_local.py

1. add the `metacademy-application` to your `PYTHONPATH` environmental variable (this assumes you're running a bash terminal, if you're not, set your `PYTHONPATH` to include the `metacademy-application` directory)

        echo "export PYTHONPATH=$PWD:$PYTHONPATH" >> ../bin/activate
        
        source ../bin/activate

1. from `metacademy-application` project directory:

        python app_server/manage.py syncdb # you'll be prompted to create an admin account -- simply follow the instructions
        
        python app_server/manage.py migrate

        ./run_test_servers.sh
        
1. Open [localhost:8080](http://localhost:8080) with a modern javascript-enabled browser, preferably a webkit-based browser

Note: the initial search may take some time to load (the backend must load the graph into memory), but all subsequent pages should load much quicker.

If you have any problems with this installations, please submit a ticket at [https://github.com/metacademy/metacademy-application/issues?state=open](https://github.com/metacademy/metacademy-application/issues?state=open)

## Optional Dependency: Scipy
Some of metacademy's ancillary functions currently depend on `scipy`. Scipy can be tricky to install (`pip install scipy` won't work unless you have all of the systems-level dependencies) so we have made it an optional dependency. Once you have scipy installed on your machine (google will help here...), link it's site-packages folder to to your virtual environment's `lib/python2.7/site-packages/` folder. On my machine, this command was:

        ln -s /usr/local/lib/python2.7/site-packages/scipy lib/python2.7/site-packages/
        
        
