MAPS_OUTPUT_PATH = '/path/to/kmaps/output'
CONTENT_PATH = '/path/to/knowledge-maps/content'
TEMP_PATH = '/path/to/tmp-area'
HASH = 'randomLettersAndNumbers'
CONTENT_SERVER_PORT = 9090
FRONTEND_SERVER_PORT = 8080

#  hack to obtain ports in bash script
if __name__ == "__main__":
    print CONTENT_SERVER_PORT
    print FRONTEND_SERVER_PORT