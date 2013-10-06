import config

CONTENT_SERVER = 'http://localhost:' + str(config.CONTENT_SERVER_PORT)

DEBUG = config.DEBUG
TEMPLATE_DEBUG = DEBUG

# Make this unique, and don't share it with anybody.
SECRET_KEY = '1234!'
