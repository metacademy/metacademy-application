import json
import random
import string
import pdb

from django.shortcuts import render_to_response
from django.http import HttpResponse
from django.template import RequestContext

from apps.cserver_comm.cserver_communicator import get_full_graph_json_str, get_concept_data
from apps.user_management.models import Profile
from apps.graph.models import Graph, Concept, GlobalResource, ResourceLocation, Goal
from apps.graph.models import ConceptResource as CResource
from apps.graph import api_communicator


def _gen_random_id(rlen):
    return ''.join([random.choice(string.lowercase + string.digits) for i in range(rlen)])


def check_model_id(mtype, mid=""):
    if mtype == "graph":
        dobj = Graph
    elif mtype == "concept":
        dobj = Concept
    elif mtype == "resource":
        dobj = CResource
    elif mtype == "global_resource":
        dobj = GlobalResource
    elif mtype == "goal":
        dobj = Goal
    elif mtype == "resource_location":
        dobj = ResourceLocation
    else:
        raise KeyError("check_model_id: model type unkown: " + mtype)

    while len(mid) == 0 or len(dobj.objects.filter(id=mid)) > 0:
        mid = _gen_random_id(10)

    return mid


def check_id(request):
    if request.method == "GET":
        gtype = request.GET.get("type")
        in_id = request.GET.get("id", default="")
        useid = check_model_id(gtype, in_id)
        resp = {"id": useid, "changed": useid != in_id}
        return HttpResponse(json.dumps(resp), "application/json")
    else:
        return HttpResponse(status=405)


def get_concept_dep_graph(request, concept_tag=""):
    pdb.set_trace()
    concepts = get_user_data(request)
    concept_data = get_concept_data(concept_tag)
    # TODO remove full_graph_skeleton, we shouldn't need this client side
    return render_to_response("agfk-app.html",
                              {"full_graph_skeleton": get_full_graph_json_str(),
                               "user_data": json.dumps(concepts), "concept_data": concept_data},
                              context_instance=RequestContext(request))


def new_graph(request):
    if request.method == "GET":
        concepts = get_user_data(request)
        full_graph_json = get_full_graph_json_str()
        used = True
        while used:
            gid = ''.join([random.choice(string.lowercase + string.digits) for i in range(8)])
            used = len(Graph.objects.filter(id=gid)) > 0

        return render_to_response("graph-creator.html",
                                  {"full_graph_skeleton": full_graph_json, "user_data": json.dumps(concepts),
                                   "graph_id": gid, "graph_init_data": {"id": gid}},
                                  context_instance=RequestContext(request))
    else:
        return HttpResponse(status=405)


def edit_existing_graph(request, gid):
    if request.method == "GET":
        # get the graph data so we can bootstrap it
        concepts = get_user_data(request)
        full_graph_json = get_full_graph_json_str()
        graph_json = api_communicator.get_graph(request, gid)
        return render_to_response("graph-creator.html",
                                  {"full_graph_skeleton": full_graph_json, "user_data": json.dumps(concepts),
                                   "graph_id": gid, "graph_init_data": graph_json},
                                  context_instance=RequestContext(request))
    else:
        return HttpResponse(status=405)


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
