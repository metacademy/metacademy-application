import json
import pdb

from django.shortcuts import render_to_response, redirect
from django.http import HttpResponseRedirect, HttpResponse
from django.template import RequestContext
from django.shortcuts import render
from apps.user_management.models import LearnedConcept, Profile, UserCreateForm

from apps.cserver_comm.cserver_communicator import get_id_to_concept_dict
from settings import CONTENT_SERVER

def user_main(request):
    if not request.user.is_authenticated():
        return redirect('/user/login?next=%s' % request.path)

    # obtain an array of learned concept ids for the user
    uprof, created = Profile.objects.get_or_create(pk=request.user.pk)
    lids = [l.id for l in uprof.learnedconcept_set.all()]
    if len(lids) > 0:
        concepts_dict = get_id_to_concept_dict()
        lconcepts  = [concepts_dict[idval] for idval in lids if concepts_dict.has_key(idval)]
    else:
        lconcepts = []

    return render_to_response('user.html', {"lconcepts": lconcepts, "content_server": CONTENT_SERVER}, context_instance=RequestContext(request))

def register(request):
    if request.method == 'POST':
        form = UserCreateForm(request.POST)
        if form.is_valid():
            user = form.save()
            prof = Profile(user=user)
            prof.save()
            return HttpResponseRedirect("/user")
    else:
        form = UserCreateForm()
    return render(request, "register.html", {
        'form': form,
    })

# we may want to consider using a more structured approach like tastypi as we
# increase the complexity of the project
# or maybe just switching class-based views would simplify this makeshift API
def handle_learned_concepts(request, conceptId=""):
    """
    A simple REST interface for accessing a user's learned concepts
    """
    if request.user.is_authenticated():
        # TODO: handle multiple concepts at once
        uprof, created = Profile.objects.get_or_create(pk=request.user.pk)
        if not conceptId:
            if request.method == "GET":
                lconcepts = [ l.id for l in uprof.learnedconcept_set.all()]
                return HttpResponse(json.dumps(lconcepts), mimetype='application/json')
            else:
                return HttpResponse(status=405)
        else:
            dbConceptObj, ucreated = LearnedConcept.objects.get_or_create(id=conceptId)
            if request.method == "PUT":
                dbConceptObj.uprofiles.add(uprof)
            elif request.method == "DELETE":
                dbConceptObj.uprofiles.remove(uprof)
            dbConceptObj.save()
            return HttpResponse()
    else:
        # TODO: use a cookie to store clicked data of non-signed in users
        return HttpResponse('{}', mimetype='application/json')
            
