
Metacademy's Source
==============

This source is licensed under GPLv3, see LICENSE.txt (note: metacademy's content is CC BY SA 3.0).

## Demo

Metacademy is live at http://www.metacademy.org


## Installation

### Windows
For Windows installation/requirements, please see the readme located in [/windows](/windows), these instructions presume a *nix or OSX OS


### Preliminary requirements
* `python 2.7X`: NB: install `python-devel` if you're using a package manager such as apt-get. The following command should print a path (if this command raises an exception, make sure that you have the `python-devel` version installed):
*
            python -c 'from distutils.sysconfig import get_makefile_filename as m; print m()'

* `gcc`: Install [gcc](http://gcc.gnu.org) (OSX users: installing the [OSX developer tools](https://developer.apple.com/technologies/tools/) is probably the easiest way to do this). The following command should not throw an error:

        gcc -v

* `pip` Install [pip](http://www.pip-installer.org/en/latest/); here are [pip's installation instructions](http://www.pip-installer.org/en/latest/installing.html). The following command should not throw an error:

        pip -V

* `node.js` (needed to run tests): Install [node](http://nodejs.org/) The following command should not throw an error:

        node -v


### Mac OSX and *nix

1. create a top-level metacademy directory in a desired location, e.g. `mkdir -p ~/MyProjects/metacademy`
1. go to the top-level metacademy directory `cd ~/MyProjects/metacademy`
1. from your top-level metacademy directory, clone the application repo:

        git clone https://github.com/metacademy/metacademy-application.git

1. go to the metacademy-application directory

        cd metacademy-application

1. install the metacademy application (note: this project uses a [virtual environment](http://www.virtualenv.org/en/latest/) for development):

        make

1. verify the installation

        make test

#### Optional: create a superuser

        python app_server/manage.py createsuperuser

#### Very Optional: Scipy dependency
Some of metacademy's ancillary functions currently depend on `scipy`. Scipy can be tricky to install (`pip install scipy` won't work unless you have all of the systems-level dependencies) so we have made it an optional dependency. Once you have scipy installed on your machine (google will help here...), link it's site-packages folder to to your virtual environment's `lib/python2.7/site-packages/` folder. On my machine, this command was:

        ln -s /usr/local/lib/python2.7/site-packages/scipy lib/python2.7/site-packages/


## Execution

### Mac OSX and *nix

1. start the virtual environment (you must do this for each new session)

        source ../meta_venv/bin/activate

1. start the test servers

        ./run_test_servers.sh

1. Open [localhost:8080](http://localhost:8080) with a modern javascript-enabled browser

Note: the initial search may take some time to load (the backend must load the graph into memory), but all subsequent pages should load much quicker.

If you have any problems with this installations, please submit an issue at [https://github.com/metacademy/metacademy-application/issues?state=open](https://github.com/metacademy/metacademy-application/issues?state=open)
