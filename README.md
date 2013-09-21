Metacademy's Source
==============

This source is licenses under GPLv3, see LICENSE.txt (note: metacademy's content is CC BY SA 3.0).

                             
Current testing instructions (30 Aug 2013):

1. install [Numpy 1.4+](http://www.numpy.org/) and [Scipy 0.1+](http://scipy.org/)
2. install `pip install -r requirements.txt`
2. Clone/checkout/download the [metacademy content](https://github.com/metacademy/metacademy-content) to an appropriate external directory 
3. Copy `config-template.py` to `config.py`, set the appropriate paths in this directory.
4. Copy `app_server/settings_local-template.py` to `app_server/settings_local.py`, set the appropriate variables
4. Add the `agfk` project directory to your PYTHONPATH
5. From `agfk` project directory:

        python app_server/manage.py syncdb

        run_test_servers.sh
        
6. Open [localhost:8080](http://localhost:8080) with a modern javascript-enabled browser, preferably a webkit-based browser

Note: the initial page may take some time to load (the backend must load the graph into memory), but all subsequent pages should load much quicker.

Basic explore-mode use:

- drag to pan	
- mouse scroll to zoom	
- double click to quick-zoom 

Basic learning-mode use:

- show concepts by clicking on their titles
- internal and external links currently open in a new tab

Please submit all bugs, feature requests, or comments to [https://github.com/agfk/knowledge-maps/issues?state=open](https://github.com/agfk/knowledge-maps/issues?state=open)
