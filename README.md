knowledge-maps
==============
An apt-get for knowledge.

                             
Current testing instructions (Colorado Reed 18 Jan 2013)    
1) Install django: see https://www.djangoproject.com/download/
2) From agfk project directory:
		python manage.py runserver [port number; default is 8000]
3) Open: 
	http://localhost:[port number]/kmap
		with a modern javascript-enabled browser

Basic use:
	-drag to pan
	-mouse scroll to zoom
	-double click to quick-zoom 
	-click node to load information       
	
See the comments in backend/urls.py for further information