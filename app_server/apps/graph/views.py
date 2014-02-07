import json
import random
import string
import pdb

from django.shortcuts import render_to_response
from django.http import HttpResponse
from django.template import RequestContext

from apps.cserver_comm.cserver_communicator import get_full_graph_json_str, get_concept_data
from apps.user_management.models import Profile
from apps.graph.models import Graph, Concept, GlobalResource
from apps.graph.models import ConceptResource as CResource
from apps.graph.api import GraphResource


def _gen_random_id(rlen):
    return ''.join([random.choice(string.lowercase + string.digits) for i in range(rlen)])


def check_id(request):
    if request.method == "GET":
        gtype = request.GET.get("type")
        in_id = request.GET.get("id", default="")
        useid = in_id
        if gtype == "graph":
            dobj = Graph
        elif gtype == "concept":
            dobj = Concept
        elif gtype == "resource":
            dobj = CResource
        elif gtype == "global_resource":
            dobj = GlobalResource
        else:
            return HttpResponse(status=404)

        while len(useid) == 0 or len(dobj.objects.filter(id=useid)) > 0:
            useid = _gen_random_id(12)
        resp = {"id": useid, "changed": useid != in_id}
        return HttpResponse(json.dumps(resp), "application/json")
    else:
        return HttpResponse(status=405)


def get_agfk_app(request, concept_tag=""):
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
