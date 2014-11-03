import json
import random
import string
import ast
import pdb
import os

from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect
from django.core.exceptions import ObjectDoesNotExist
from django.core.urlresolvers import reverse
from haystack.query import SearchQuerySet
import reversion
from lazysignup.templatetags.lazysignup_tags import is_lazy_user

from apps.user_management.models import Profile
from apps.graph.models import Graph, Concept, GlobalResource, ResourceLocation, Goal
from apps.graph.models import ConceptResource as CResource
from apps.graph import api_communicator
from apps.graph import time_estimates
from config import NOJS_CONCEPT_CACHE_PATH

# TODO refactor into two class based views: graphs and concepts


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
    """
    check if the id for the given "type" is available, returns a valid id if it is not
    """
    if request.method == "GET":
        gtype = request.GET.get("type")
        in_id = request.GET.get("id", default="")
        useid = check_model_id(gtype, in_id)
        resp = {"id": useid, "changed": useid != in_id}
        return HttpResponse(json.dumps(resp), "application/json")
    else:
        return HttpResponse(status=405)


def check_tags(request):
    """
    check if the given concept tag is available
    """
    if request.method == "GET":
        qtags = json.loads(request.GET.get("tags"))
        retobj = {}
        for tag in qtags:
            retobj[tag] = Concept.objects.filter(tag=tag).exists()
        return HttpResponse(json.dumps(retobj), "application/json")
    else:
        return HttpResponse(status=405)


def get_concept_history(request, concept_tag=""):
    """
    obtain the edit history for the given concept
    """
    concept = Concept.objects.get(tag=concept_tag)
    revs = _get_versions_obj(concept)[::-1]
    return render(request, 'concept_history.html', {'concept': concept, "revs": revs})


def _get_ac_string(res):
    rstr = res.title
    rstr += " (" + ", ".join(ast.literal_eval(res.authors)) + ")"
    return rstr


def get_autocomplete(request):
    """
    get autocomplete data (title + id) for data in the graph models
    """
    # TODO generalize to more models as needed
    acinp = request.GET.get("ac")
    if not acinp:
        return HttpResponse(status=400)
    sqs = SearchQuerySet().models(GlobalResource).autocomplete(title=acinp)[:10]
    resp = [{"title": _get_ac_string(acres), "id": acres.id.split(".")[-1]} for acres in sqs if acres]

    return HttpResponse(json.dumps(resp), "application/json")


def get_concept_triplet(request):
    """
    Takes a get request with either a "title", "tag", or "title" field and
    returns a json triplet with these three fields if the object exists in the db
    """
    retobj = {}
    try:
        if "tag" in request.GET:
            retobj["tag"] = request.GET["tag"]
            cobj = Concept.objects.get(tag=retobj["tag"])
            retobj["id"] = cobj.id
            retobj["title"] = cobj.title
        elif "title" in request.GET:
            retobj["title"] = request.GET["title"]
            cobj = Concept.objects.get(title=retobj["title"])
            retobj["id"] = cobj.id
            retobj["tag"] = cobj.tag
        elif "id" in request.GET:
            retobj["title"] = request.GET["title"]
            cobj = Concept.objects.get(title=retobj["title"])
            retobj["id"] = cobj.id
            retobj["tag"] = cobj.tag
    except ObjectDoesNotExist:
        retobj = {}

    return HttpResponse(json.dumps(retobj), "application/json")


def render_graph_view(request, gid, template_name):
    if request.method == "GET":
        # get the graph data so we can bootstrap it
        concepts = get_user_data(request)
        try:
            graph_json = api_communicator.get_graph(request, gid)
        except ObjectDoesNotExist:
            return render(request, "graph-does-not-exist.html", {"cref": gid})
        return render(request, template_name,
                      {"user_data": json.dumps(concepts),
                       "graph_id": gid, "graph_init_data": graph_json})
    else:
        return HttpResponse(status=405)


def show_graph(request, gid):
    return render_graph_view(request, gid, "agfk-app.html")


def edit_existing_graph(request, gid):
    if not request.user.is_authenticated() or is_lazy_user(request.user):
        return HttpResponseRedirect(reverse("user:login"))
    
    return render_graph_view(request, gid, "graph-creator.html")


def get_concept_dep_graph(request, concept_tag=""):
    """
    obtain the dependency graph for the given concept
    """
    leaf = None
    try:
        try:
            leaf = Concept.objects.get(id=concept_tag)
        except ObjectDoesNotExist:
            leaf = Concept.objects.get(tag=concept_tag)
    except ObjectDoesNotExist:
        return render(request, "concept-does-not-exist.html", {"cref": concept_tag})
    graph_data = api_communicator.get_targetgraph(request, leaf.id)
    uconcepts = get_user_data(request)
    try:
        nojs_content = open(os.path.join(NOJS_CONCEPT_CACHE_PATH, "graphs/concepts/" + concept_tag)).read()
    except IOError:
        nojs_content = "== Under Construction (not yet cached) =="

    return render(request, "agfk-app.html",
                  {"user_data": json.dumps(uconcepts),
                   "nojs_content": nojs_content,
                   "graph_init_data": graph_data,
                   "leaf": leaf})


def new_graph(request):
    if request.method == "GET":
        if not request.user.is_authenticated() or is_lazy_user(request.user):
            return HttpResponseRedirect(reverse("user:login"))
        
        concepts = get_user_data(request)
        used = True
        while used:
            gid = ''.join([random.choice(string.lowercase + string.digits) for i in range(8)])
            used = len(Graph.objects.filter(id=gid)) > 0

        return render(request, "graph-creator.html",
                      {"user_data": json.dumps(concepts),
                       "graph_id": gid, "graph_init_data": {"id": gid}})

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


def get_gresource_search(request):
    """
    Perform the global resource search
    """
    acinp = request.GET.get("searchtext")
    if not acinp:
        return HttpResponse(status=400)
    sqs = SearchQuerySet().models(GlobalResource).autocomplete(title=acinp)[:10]
    resp = []
    for acres in sqs:
        if not acres:
            continue
        authors = acres.authors
        try:
            auths = ast.literal_eval(authors)
            authors = ", ".join(auths)
        except:
            print "Warning:", authors, "did not literal eval"
        resp.append({"title": acres.title, "authors": authors, "id": acres.id.split(".")[-1]})

    return HttpResponse(json.dumps(resp), "application/json")


def _get_versions_obj(obj):
    return reversion.get_for_object(obj).order_by("id")


def get_time_estimates(request):
    if not (request.user.is_authenticated() and request.user.is_superuser):
        return HttpResponse(status=403)   # Forbidden

    # if SciPy is not installed
    if not hasattr(time_estimates, 'scipy'):
        return HttpResponse(status=501)   # Not implemented

    new_times = time_estimates.fit_model()

    concepts = Concept.objects.all()
    concepts = [c for c in concepts if c.id in new_times]

    if request.method == 'POST':
        for concept in concepts:
            # intentionally not creating a new revision
            concept.learn_time = new_times[concept.id]
            concept.save(update_fields=['learn_time'])

    def format_time(t):
        if t:
            return '{:1.3f}'.format(t)
        else:
            return '???'

    items = [{'title': c.title,
              'old_time': format_time(c.learn_time),
              'new_time': format_time(new_times[c.id])}
             for c in concepts if c.id in new_times]
    items = sorted(items, key=lambda it: float(it['new_time']), reverse=True)

    return render(request, 'time_estimates.html',
                  {'items': items})
    


    
