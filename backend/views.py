import utils.formats as formats
import config
from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.template import RequestContext
from utils.graph_utils import get_node_json,get_map,get_related_nodes, get_all_nodes
import os
import pdb

"""
Django view functions: handles web requests
"""

def get_kmap_browser(request):
    node_list = formats.read_nodes(config.CONTENT_PATH, onlytitle=True)
    node_list.sort()
    node_list.insert(0,'full_graph')
    return render_to_response('kmap-tester.html', {'node_list':node_list}, context_instance=RequestContext(request), )

def get_full_graph(request):
    fmt = request.GET.get('format','json')
    return HttpResponse(get_all_nodes(fmt), content_type=get_content_type(fmt))


def get_node_content(request, node, node_aux=None):
    """
    Return requested node content
    """
    fmt = request.GET.get('format','json')
    if not node_aux:
        assert fmt == 'json'
        text = get_node_json(node)
    elif node_aux == 'related':
        text = get_related_nodes(node, fmt=fmt)
    elif node_aux == 'map':
        text = get_map(node, fmt=fmt)
    else:
        raise RuntimeError('Invalid resource: %s' % os.path.join(request,node,node_aux))

    return HttpResponse(text, content_type=get_content_type(fmt))


def get_content_type(fmt):
    return  {'json': 'application/json',
                         'svg': 'image/svg+xml',
                         'dot': 'text/plain',
                         }[fmt]







    
   

