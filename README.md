[![Build Status](https://travis-ci.org/metacademy/metacademy-application.svg?branch=master)](https://travis-ci.org/metacademy/metacademy-application)

<p align="center">
<img src="http://obphio.us/media/images/meta-logo.png" alt="Metacademy Logo" height="150px"/>
</p>

This source is licensed under GPLv3, see [LICENSE.txt](LICENSE.txt) (Note: Metacademy's content is CC BY SA 3.0).

## Demo

Metacademy is live at http://www.metacademy.org.


## Installation

### Windows
For Windows installation/requirements, please see the README located in [/windows](/windows). These instructions here presume a *nix or OS X OS.


### Preliminary requirements
* `Python 2.7.X` *Nota bene*: install `python-devel`/`python-dev` if you're using a package manager such as `yum` or `apt-get`. The following command should then print a path. If this command raises an exception, make sure that you have `python-devel`/`-dev` for your installed version of python installed:

        python -c 'from distutils.sysconfig import get_makefile_filename as m; print m()'

* `gcc` Install [gcc](http://gcc.gnu.org) For OS X users, installing the [OS X developer tools](https://developer.apple.com/technologies/tools/) is probably the easiest way to do this. The following command should not throw an error:

        gcc -v

* `pip` Install [pip](http://www.pip-installer.org/en/latest/); here are [pip's installation instructions](http://www.pip-installer.org/en/latest/installing.html). The following command should not throw an error:

        pip -V

* `node.js` (needed to run tests): Install [node](http://nodejs.org/), preferably via [`nvm`](https://github.com/creationix/nvm) The following command should not throw an error:

        node -v


### Mac OS X and *nix

1. Create an empty top-level Metacademy directory in a desired location, e.g. `mkdir -p ~/MyProjects/metacademy`.

> It will be used for (1) the actual application, (2) storing the database and (3) the respective virtual Python environment.

2. Go to the top-level Metacademy directory `cd ~/MyProjects/metacademy`
3. From your top-level Metacademy directory, clone the application repo:

        git clone https://github.com/metacademy/metacademy-application.git

4. Go to the `metacademy-application` directory

        cd metacademy-application

5. Install the Metacademy application (Note: this project uses a [virtual environment](http://www.virtualenv.org/en/latest/) for development):

        make

    During the process confirm to load the initial dataset with `yes`.

    > Your Metacademy project directory now also contains the `local_dbs` and `meta_venv` directories.

6. Verify the installation

        make test

---

## Optional

The following tasks are not neccessarily needed to run Metacademy.

### Create a Django superuser

A Django superuser will allow you to login at `/admin` to perform additional management tasks.

Given you are still in the `metacademy-application` directory, activate the virtual environment first.

    source ../meta_venv/bin/activate

Then create the Django superuser.

    python app_server/manage.py createsuperuser

You can leave the virtual environment again simply by invoking

    deactivate

## Very Optional

### Install `numpy` and `pandas` manually
They are needed for some legacy/aux function calls.

> **Note:** These dependencies should already be part of the *virtual environment* by running `make` above. Make sure to activate the virtual environment before continuing.

    pip install numpy

    pip install pandas

### Install `scipy` dependency

Some of Metacademy's ancillary functions currently depend on `scipy`. Scipy can be tricky to install, so we have made it an optional dependency. `pip install scipy` won't work unless you have all of the system-level dependencies.

Please refer to the [official Scipy installation instructions](http://www.scipy.org/install.html) to set it up for your Operating System / Linux Distribution.

Once you have `scipy` installed on your machine, link its `site-packages` folder to your virtual environment's `lib/python2.7/site-packages/` folder.

From within the `meta_venv` directory it could read

    ln -s /usr/local/lib/python2.7/site-packages/scipy lib/python2.7/site-packages/

or still from within the `metacademy-application` directory on a 64 bit RHEL-based system similiar to

    ln -s /usr/lib64/python2.7/site-packages/scipy ../meta_venv/lib64/python2.7/site-packages/

---

## Execution

### Mac OS X and *nix

1. Start the virtual environment. You must do this for each new session.

        source ../meta_venv/bin/activate

2. Start the development server

        python app_server/manage.py runserver 8080

3. Open [localhost:8080](http://localhost:8080) in a modern JavaScript-enabled browser

> Note: The initial search may take some time while the backend loads the graph into memory, but all subsequent pages should load much quicker.

If you have any problems with this installation, please submit an issue at [https://github.com/metacademy/metacademy-application/issues?state=open](https://github.com/metacademy/metacademy-application/issues?state=open).
