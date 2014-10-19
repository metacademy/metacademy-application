from os import path

META_TOP_LEVEL = path.realpath('..')

# change this path to specify a different local database directory
TOP_DB_PATH = path.join(META_TOP_LEVEL, 'local_dbs')

APP_SERVER_SEARCH_INDEX_PATH = path.join(TOP_DB_PATH, 'app_index')     # directory that contains the index for app server search

DJANGO_DB_FILE = path.join(TOP_DB_PATH, 'django_db', 'db.sqlite')

# No JS Concept Cache
NOJS_CONCEPT_CACHE_PATH = path.join(META_TOP_LEVEL, 'nojs_concept_cache') # WARNING: must also change in index_concepts.js

# settings when running django development server
FRONTEND_SERVER_IP   = '0.0.0.0'  # set to 0.0.0.0 to access externally
FRONTEND_SERVER_PORT = 8080

# Content/App-server Debug level
DEBUG = True

