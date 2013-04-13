knowledge-maps
==============
An apt-get for knowledge.

                             
Current testing instructions (April 11, 2013):

1. Install [django](https://www.djangoproject.com/download/).
2. Clone/checkout/download the [agfk content](https://github.com/agfk/agfk-content) to an appropriate external directory 
3. Copy config-template.py to config.py, edit.
4. From `agfk` project directory:

        run_test_servers.sh

5. Open [localhost:8080/kmap](http://localhost:8080/kmap) with a modern javascript-enabled browser

Basic use:

- drag to pan	
- mouse scroll to zoom	
- double click to quick-zoom 
- click node to load information       
	
See the comments in `backend/urls.py` for further information
