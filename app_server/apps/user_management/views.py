import json
import pdb

from django.shortcuts import render_to_response, redirect
from django.http import HttpResponseRedirect, HttpResponse
from django.template import RequestContext
from django.shortcuts import render
from apps.user_management.models import LearnedConcept, StarredConcept, Profile, UserCreateForm
from django.core.mail import EmailMultiAlternatives

from apps.cserver_comm.cserver_communicator import get_id_to_concept_dict
from settings import CONTENT_SERVER

def user_main(request):
    if not request.user.is_authenticated():
        return redirect('/user/login?next=%s' % request.path)

    # obtain an array of learned concept ids for the user
    uprof, created = Profile.objects.get_or_create(pk=request.user.pk)
    lids = [l.id for l in uprof.learnedconcept_set.all()]
    sids = [s.id for s in uprof.starredconcept_set.all()]
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

    return render_to_response('user.html', {"lconcepts": lconcepts, "sconcepts": sconcepts, "content_server": CONTENT_SERVER}, context_instance=RequestContext(request))

def register(request):
    if request.method == 'POST':
        form = UserCreateForm(request.POST)
        if form.is_valid():
            user = form.save()
            prof = Profile(user=user)
            prof.save()
            uname = form.cleaned_data['username']
            subject, from_email, to = 'Metacademy account successfully created', 'noreply@metacademy.org', form.cleaned_data['email']
            text_content = """Thanks for creating an account with Metacademy. For future reference, your username is: "%s". You can find more information about Metacademy at our "about page": http://metacademy.org/about. \r\n\r\n

More importantly, we want to hear from you! Please send any Metacademy-related thoughts, opinions, or rants to feedback@metacademy.org.
\r\n\r\n

Sincerely, \r\n
Metacademy admins (Roger and Colorado)
\r\n\r\n

PS) We don't like sending pointless emails, so you probably won't hear from us very often.""" % uname
            
            html_content = """
<p>
Thanks for creating an account with Metacademy. For future reference, your username is <em>%s</em>. You can find more information about Metacademy at our "about page": <a href="http://metacademy.org/about/">http://metacademy.org/about/</a>. 
</p>

<p> 
More importantly, we want to hear from you! Please send any Metacademy-related thoughts, opinions, or rants to <a href="mailto:feedback@metacademy.org">feedback@metacademy.org</a>.
</p>

<p>
Sincerely,<br \>
Metacademy admins (Roger and Colorado)
</p>

<p>
PS) We don't like sending pointless emails, so you probably won't hear from us very often.
</p>
""" % uname
            msg = EmailMultiAlternatives(subject, text_content, from_email, [to])
            msg.attach_alternative(html_content, "text/html")
            try:
                msg.send()
            except:
                # TODO handle incorrect emails better
                print "Unable to send confirmation message to " + to
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
    return handle_user_concepts(request, conceptId, "learnedconcept_set", LearnedConcept)

def handle_starred_concepts(request, conceptId=""):
    """
    A simple REST interface for accessing a user's learned concepts
    """
    return handle_user_concepts(request, conceptId, "starredconcept_set", StarredConcept)

def handle_user_concepts(request, conceptId, set_name, InConcept):
    if request.user.is_authenticated():
        # TODO: handle multiple concepts at once
        uprof, created = Profile.objects.get_or_create(pk=request.user.pk)
        if not conceptId:
            if request.method == "GET":
                concepts = [ l.id for l in getattr(uprof, set_name).all()]
                return HttpResponse(json.dumps(concepts), mimetype='application/json')
            else:
                return HttpResponse(status=405)
        else:
            dbConceptObj, ucreated = InConcept.objects.get_or_create(id=conceptId)
            if request.method == "PUT":
                dbConceptObj.uprofiles.add(uprof)
            elif request.method == "DELETE":
                dbConceptObj.uprofiles.remove(uprof)
            dbConceptObj.save()
            return HttpResponse()
    else:
        # TODO: use a cookie to store clicked data of non-signed in users
        return HttpResponse('{}', mimetype='application/json')
            
