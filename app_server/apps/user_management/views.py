import json
import pdb

from django.shortcuts import render_to_response, redirect
from django.http import HttpResponseRedirect, HttpResponse
from django.template import RequestContext
from django.shortcuts import render
from apps.user_management.models import Concepts, Profile, UserCreateForm
from django.core.mail import EmailMultiAlternatives
from django.contrib.auth import authenticate, login

from lazysignup.decorators import allow_lazy_user
from lazysignup.templatetags.lazysignup_tags import is_lazy_user
from lazysignup.models import LazyUser

from apps.cserver_comm.cserver_communicator import get_id_to_concept_dict
from aux_text import HTML_ACCT_EMAIL, TXT_ACCT_EMAIL


def user_main(request):
    if not request.user.is_authenticated() or is_lazy_user(request.user):
        return redirect('/user/login?next=%s' % request.path)

    uprof, created = Profile.objects.get_or_create(pk=request.user.pk)

    # list graphs they've edited
    graphs = [gs.graph for gs in uprof.edited_graph.all()]

    # list concepts they've edited
    concepts = [cs.concept for cs in uprof.edited_concept.all()]

    # list roadmaps where the user is listed as an owner
    roadmaps = [rs.roadmap for rs in uprof.roadmap_owners.all()]

    # obtain an array of learned concept ids for the user
    lids = [l.id for l in uprof.learned.all()]
    sids = [s.id for s in uprof.starred.all()]
    # TODO refactor
    if len(lids) > 0:
        concepts_dict = get_id_to_concept_dict()
        lconcepts  = [concepts_dict[idval] for idval in lids if concepts_dict.has_key(idval)]
    else:
        lconcepts = []

    if len(sids) > 0:
        concepts_dict = get_id_to_concept_dict()
        sconcepts  = [concepts_dict[idval] for idval in sids if concepts_dict.has_key(idval)]
    else:
        sconcepts = []

    return render_to_response('user.html',
                              {
                                  "lconcepts": lconcepts,
                                  "sconcepts": sconcepts,
                                  "roadmaps": roadmaps,
                                  "graphs": graphs,
                                  "concepts": concepts
                              },
                              context_instance=RequestContext(request))

@allow_lazy_user
def register(request, redirect_addr="/user"):

    # don't allow logged-in users to register a new account
    if request.user.is_authenticated and not is_lazy_user(request.user):
        return HttpResponseRedirect(redirect_addr)

    if request.method == 'POST':
        form = UserCreateForm(request.POST, instance=request.user)

        if form.is_valid():

            # save lazy or non-lazy acct
            if is_lazy_user(form.instance):
                user = LazyUser.objects.convert(form)
            else:
                user = form.save()

            # create and save corresponding profile
            prof = Profile(user=user)
            prof.save()

            # send basic info email
            uname = form.cleaned_data['username']
            subject, from_email, to = 'Metacademy account successfully created', 'accounts@metacademy.org', form.cleaned_data['email']
            text_content = TXT_ACCT_EMAIL % uname

            html_content = HTML_ACCT_EMAIL % uname
            msg = EmailMultiAlternatives(subject, text_content, from_email, [to])
            msg.attach_alternative(html_content, "text/html")

            try:
                msg.send()
            except:
                # TODO handle incorrect emails better
                print "Unable to send confirmation message to " + to
            login(request, authenticate(**form.get_credentials()))
            return HttpResponseRedirect(redirect_addr)
    else:
        form = UserCreateForm()
    return render(request, "user_management/register.html", {
        'form': form,
    })

# we may want to consider using a more structured approach like tastypi as we
# increase the complexity of the project
# or maybe just switching to class-based views would simplify this makeshift API
@allow_lazy_user
def handle_concepts(request, cid=""):
    """
    A simple interface for handling a user's association with a concept
    """
    rbody = json.loads(request.body) # communication payload
    method = request.method

    if method == "PUT":
        if not cid:
            cid = rbody["id"]
        learned = rbody["learned"]
        starred = rbody["starred"]

        uprof, created = Profile.objects.get_or_create(pk=request.user.pk)
        dbConceptObj, ucreated = Concepts.objects.get_or_create(id=cid)

        if learned:
            dbConceptObj.learned_uprofs.add(uprof)
        else:
            dbConceptObj.learned_uprofs.remove(uprof)
        if starred:
            dbConceptObj.starred_uprofs.add(uprof)
        else:
            dbConceptObj.starred_uprofs.remove(uprof)

        dbConceptObj.save()

        return HttpResponse()

    else:
        return HttpResponse(status=405)
