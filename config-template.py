CONTENT_PATH = '/path/to/agfk-content'
TEMP_PATH = '/path/to/tmp-area'
DB_PATH = '/path/to/agfk.db'
HASH = 'randomLettersAndNumbers'
CONTENT_SERVER_PORT = 9090
FRONTEND_SERVER_PORT = 8080
INDEX_PATH = '/path/to/index'      # directory to build the index in
DEBUG = True                       # debug mode for local testing

#  hack to obtain ports in bash script
if __name__ == "__main__":
    print CONTENT_SERVER_PORT
    print FRONTEND_SERVER_PORT
