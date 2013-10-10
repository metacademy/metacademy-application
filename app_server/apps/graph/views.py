import json

from django.shortcuts import render_to_response
from django.template import RequestContext

from apps.cserver_comm.cserver_communicator import get_full_graph_json_str
from apps.user_management.models import Profile

def get_agfk_app(request):
    if request.user.is_authenticated():
        uprof, created = Profile.objects.get_or_create(pk=request.user.pk)
        concepts = { "starred": [ l.id for l in getattr(uprof, "starredconcept_set").all()],
                     "learned":  [ l.id for l in getattr(uprof, "learnedconcept_set").all()]}
    else:
        concepts = {}
    return render_to_response("agfk-app.html",
                              {"full_graph_skeleton": get_full_graph_json_str(), "user_data": json.dumps(concepts)},
                              context_instance=RequestContext(request))
