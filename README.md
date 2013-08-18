knowledge-maps
==============
An apt-get for knowledge.

                             
Current testing instructions (April 11, 2013):

1. Install [django](https://www.djangoproject.com/download/) 1.5+ and [Whoosh](https://pypi.python.org/pypi/Whoosh) 2.5+.
2. Clone/checkout/download the [agfk content](https://github.com/agfk/agfk-content) to an appropriate external directory 
3. Copy config-template.py to config.py, set the appropriate paths in this directory.
4. Add the `agfk` project directory to your PYTHONPATH
5. From `agfk` project directory:

        python manage.py syncdb

        python manage.py collectstatic

        run_test_servers.sh
6. Open [localhost:8080/kmap#node=node_id](http://localhost:8080/kmap#node=logistic_regression) (e.g. http://localhost:8080/kmap#node=logistic_regression) with a modern javascript-enabled browser, preferably a webkit-based browser
Note: the initial page may take some time to load (the backend must construct the graph), but all subsequent pages should load much quicker.

Basic explore-mode use:

- drag to pan	
- mouse scroll to zoom	
- double click to quick-zoom 

Basic learning-mode use:

- expand/collapse nodes by clicking on their titles
- internal and external links currently open in a new tab

Please submit all bugs, feature requests, or comments to [https://github.com/agfk/knowledge-maps/issues?state=open](https://github.com/agfk/knowledge-maps/issues?state=open)
