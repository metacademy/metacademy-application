from django.shortcuts import render_to_response
from django.template import RequestContext

from settings import CONTENT_SERVER
from apps.content_search.utils.cserver_communicator import get_search_json


"""
Django search-related view functions: handles web requests and queries content server for content
"""

def get_landing_page(request):
    """
    Returns the landing page
    """
    return render_to_response('landing.html', {'content_server':CONTENT_SERVER}, context_instance=RequestContext(request))


def get_search_view(request):
    """
    Returns the search (list) view for a given query
    """
    qstring = request.GET['q']
    if len(qstring) == 0:
        search_data = None
        print 'WARNING: empty query parameter in get_search_view'
    else:
        search_data = get_search_json(qstring)
    
    return render_to_response('search-results.html', {'content_server': CONTENT_SERVER, 'search_data': search_data, 'search_query': qstring}, context_instance=RequestContext(request))
