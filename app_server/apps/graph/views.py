import json
import random
import string
import pdb

from django.shortcuts import render_to_response
from django.http import HttpResponse
from django.template import RequestContext

from apps.cserver_comm.cserver_communicator import get_full_graph_json_str, get_concept_data
from apps.user_management.models import Profile
from apps.graph.models import Graph
from apps.graph.api import GraphResource


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
        used = True
        while used:
            gid = ''.join([random.choice(string.lowercase + string.digits) for i in range(8)])
            used = len(Graph.objects.filter(id=gid)) > 0

        return render_to_response("graph-creator.html", {"full_graph_skeleton": full_graph_json, "user_data": json.dumps(concepts), "graph_id": gid, "graph_init_data": {"id": gid}}, context_instance=RequestContext(request))
    else:
        return HttpResponse(status=405)

def existing_graph(request, gid):
    if request.method == "GET":
        # get the graph data so we can bootstrap it
        full_graph_json = get_full_graph_json_str()
        concepts = get_user_data(request)
        gr = GraphResource()
        try:
            graph = gr.obj_get(gr.build_bundle(request=request), id=gid)
        except:
            HttpResponse(status=404)
        gr_bundle = gr.build_bundle(obj=graph, request=request)
        graph_json = gr.serialize(request, gr.full_dehydrate(gr_bundle), "application/json")
        return render_to_response("graph-creator.html", {"full_graph_skeleton": full_graph_json, "user_data": json.dumps(concepts), "graph_id": gid, "graph_init_data": graph_json}, context_instance=RequestContext(request))
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
