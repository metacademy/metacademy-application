from django.shortcuts import render_to_response
from django.template import RequestContext

from apps.cserver_comm.cserver_communicator import get_full_graph_json_str

def get_agfk_app(request):
    return render_to_response("agfk-app.html", {"full_graph_skeleton": get_full_graph_json_str()}, context_instance=RequestContext(request))
