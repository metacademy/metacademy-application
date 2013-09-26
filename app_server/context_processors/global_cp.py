from settings import CONTENT_SERVER

"""
context processor applied to all requests
"""

def settings_cp(request):
    return {'content_server': CONTENT_SERVER}
