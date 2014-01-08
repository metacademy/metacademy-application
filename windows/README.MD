# Windows Installation

This file describes installation on a modern Windows OS (This process was tested on Windows 7). If you run into difficulty, please submit an issue on the Github repository: https://github.com/metacademy/metacademy-application/issues?state=open

## Preliminary Requirements

1. Install Git for Windows if you haven't already, and make sure that you include command-line execution http://msysgit.github.io

1. Install Python 2.7X for Windows to C:\Python27 (or another directory if desired- just change the fitems below to match) http://www.python.org/getit/
    > Note: Using a 32-bit Python build is the most reliable way to get a working installation on Windows with NumPy / Django.

1. Install NodeJS for Windows http://nodejs.org/

## Python Environment Set-up

1. Append environment PATH variable to include the following (if they aren't there already).
See [this stack overflow post](http://stackoverflow.com/questions/3701646/how-to-add-to-the-pythonpath-in-windows-7)
if you're unfamiliar with setting paths in windows.

        C:\Python27;C:\Python27\Lib;C:\Python27\Scripts;C:\Python27\Tools\Scripts;C:\Python27\DLLs

1. Append (or create) environment PYTHONPATH variable to include the following

        C:\Python27;C:\Python27\Lib;C:\Python27\Lib\lib-tk;C:\Python27\DLLs

1. Download ez\_setup.py at https://bitbucket.org/pypa/setuptools/raw/bootstrap/ez_setup.py

1. Open PowerShell (close and re-open if you already have it open)

1. Navigate to ez_setup.py and execute it

        python ez_setup.py

        easy_install pip

        pip install virtualenv

        pip install wheel

1. Make sure that you can execute unsigned scripts; the following should return  `RemoteSigned`, `Unrestricted`, or `Bypass`:

        Get-ExecutionPolicy

    If the previous command returns `Restricted` or `AllSigned`, then run either:

        Set-ExecutionPolicy RemoteSigned

    or (if you don't have admin rights):

        Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser

    (you can use "Process" instead of "CurrentUser" if you'd rather, but you will have to call that command if you re-start your session)

## Metacademy Installation

1. Now, make a top level directory for Metacademy, and then cd to your new dirctory in powershell:

        mkdir  `~/MyProjects/metacademy`

        cd `~/MyProjects/metacademy`

1. Get the git repository and the cd to the directory:

        git clone https://github.com/metacademy/metacademy-application.git

        cd metacademy-application

1. Run the powershell script; for a 32-bit build (recommended) run:

        ./Windows/win32build.ps1

    or if you want to work with a 64-bit build (expiremental) run:

        ./Windows/win64build.ps1

1. After the build process is complete, run:

        ./run_test_servers.sh

    Open a modern web browser and navigate to http://127.0.0.1:8080 to verify the installation.

#### Optional: create a superuser

        python app_server/manage.py createsuperuser

## Execution

The win32build.ps1 script will automatically activate the virtual environment for Metacademy. To deactivate, simply call the global

        deactivate

To activate a new sessions, navigate to the top level scripts directory  and run the activate script:

        cd `~\MyProjects\metacademy\scripts`

        .\activate.ps1
