from django.shortcuts import render_to_response
from django.template import RequestContext
from settings import CONTENT_SERVER
def get_kmap_browser_view(request):
    """
    Returns the knowledge-map browser (learning/explore view)
    """
    return render_to_response('kmap-tester.html', {'content_server':CONTENT_SERVER}, context_instance=RequestContext(request))
