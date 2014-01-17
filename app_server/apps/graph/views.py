import json
import pdb

from django.shortcuts import render_to_response
from django.http import HttpResponse
from django.template import RequestContext

from apps.cserver_comm.cserver_communicator import get_full_graph_json_str, get_concept_data
from apps.user_management.models import Profile
from model_handler import sync_graph


def get_agfk_app(request):
    concepts = get_user_data(request)
    concept_tag = request.path.split("/")[-1].split("#")[0]
    concept_data = get_concept_data(concept_tag)
    return render_to_response("agfk-app.html",
                              {"full_graph_skeleton": get_full_graph_json_str(), "user_data": json.dumps(concepts), "concept_data": concept_data},
                              context_instance=RequestContext(request))

def new_graph(request):
    if request.method == "GET":
        concepts = get_user_data(request)
        full_graph_json = get_full_graph_json_str()
        return render_to_response("graph-creator.html", {"full_graph_skeleton": full_graph_json, "user_data": json.dumps(concepts)}, context_instance=RequestContext(request))
    elif request.method == "PUT":
        graph_url = update_graph(request,return_url=True)
        return HttpResponse(json.dumps({"url": graph_url}), content_type="application/json", status=200)
    else:
        return HttpResponse(status=403)

def update_graph(request, return_url=False):
    if request.method == "PUT":
        sync_graph(json.loads(request.body))
        if return_url:
            return "/user/graph/some_unique_id_should_probably_use_title_somehow_with_intelligent_redirects"
        else:
            return HttpResponse(status=200)
    else:
        return HttpResponse(status=403)


def get_user_data(request):
    if request.user.is_authenticated():
        uprof, created = Profile.objects.get_or_create(pk=request.user.pk)
        lset = set()
        sset = set()
        [lset.add(lc.id) for lc in uprof.learned.all()]
        [sset.add(sc.id) for sc in uprof.starred.all()]
        concepts = {"concepts": [{"id": uid, "learned": uid in lset, "starred": uid in sset} for uid in lset.union(sset)]}
    else:
        concepts = {"concepts": []}
    return concepts

def save_graph_data(request):
    """
    Save the input graph data (update the graph and appropriate concept models and revisions)
    TODO handle status of concepts/graphs automatically
    check for errors and conflicts
    """
    pass

def save_concept_data(request):
    """
    Save the input concept data (update the appropriate concept models and revisions)
    TODO handle status of concepts automatically
    check for errors and conflicts
    """
    pass
