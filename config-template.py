CONTENT_PATH = '/path/to/agfk-content'
TEMP_PATH = '/path/to/tmp-area'
DB_PATH = '/path/to/agfk.db'
HASH = 'randomLettersAndNumbers'
CONTENT_SERVER_IP   = '0.0.0.0'   # set to 0.0.0.0 to access externally
CONTENT_SERVER_PORT = 9090
FRONTEND_SERVER_IP   = '0.0.0.0'  # set to 0.0.0.0 to access externally
FRONTEND_SERVER_PORT = 8080
INDEX_PATH = '/path/to/index'      # directory that contains the concepts index
APP_SERVER_SEARCH_INDEX_PATH = '/path/to/index'      # directory that contains the index for app server searching
DEBUG = True                       # debug mode for local testing

#  hack to obtain ports in bash script
if __name__ == "__main__":
    print CONTENT_SERVER_IP
    print CONTENT_SERVER_PORT
    print FRONTEND_SERVER_IP
    print FRONTEND_SERVER_PORT
