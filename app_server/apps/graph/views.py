from django.shortcuts import render_to_response
from django.template import RequestContext
from settings import CONTENT_SERVER

def graph_browser(request):
    """
    Returns the knowledge-map browser (learning/explore view)
    """
    return render_to_response('agfk-app.html', {'content_server':CONTENT_SERVER}, context_instance=RequestContext(request))

def benchmark_viewer(request):
    return render_to_response('benchmark-wrapper.html', {'content_server':CONTENT_SERVER}, context_instance=RequestContext(request))
