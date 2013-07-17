knowledge-maps
==============
An apt-get for knowledge.

                             
Current testing instructions (April 11, 2013):

1. Install [django](https://www.djangoproject.com/download/) 1.4+ and [Whoosh](https://pypi.python.org/pypi/Whoosh) 2.5+.
2. Clone/checkout/download the [agfk content](https://github.com/agfk/agfk-content) to an appropriate external directory 
3. Copy config-template.py to config.py, edit.
4. Add the `agfk` project directory to your PYTHONPATH
5. From `agfk` project directory:

        python manage.py collectstatic

        run_test_servers.sh
6. Open [localhost:8080/kmap#node=node_id](e.g. http://localhost:8080/kmap#node=logistic_regression) with a modern javascript-enabled browser

Basic use:

- drag to pan	
- mouse scroll to zoom	
- double click to quick-zoom 
- click node to load information       
	
See the comments in `backend/urls.py` for further information
