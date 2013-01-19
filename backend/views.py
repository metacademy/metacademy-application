import utils.formats as formats
import config
from backend.settings import CONTENT_SERVER
from django.http import HttpResponse
from django.shortcuts import render_to_response, redirect
from django.template import RequestContext
import os
import pdb
import urllib
import urllib2

"""
Django view functions: handles web requests and queries content server for content
"""

def get_kmap_browser_view(request):
    """
    returns k-map browser
    """
    node_list = formats.read_nodes(config.CONTENT_PATH, onlytitle=True) # TODO: move this to content server?
    node_list.sort()
    node_list.insert(0,'full_graph')
    return render_to_response('kmap-tester.html', {'node_list':node_list, 'content_server':CONTENT_SERVER}, context_instance=RequestContext(request), )


def get_content(request):
    """
    Return requested content from content server
    """
    fmt = request.GET.get('format','json')
    full_url = CONTENT_SERVER + request.path + '?' + urllib.urlencode(request.GET)
    data = urllib2.urlopen(full_url)
    return HttpResponse(data, content_type=_get_content_type(fmt))


def _get_content_type(fmt):
    return  {'json': 'application/json',
                         'svg': 'image/svg+xml',
                         'dot': 'text/plain',
                         }[fmt]



    
   

