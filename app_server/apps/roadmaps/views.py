import bleach
import markdown
import os

from django.contrib.auth.models import User
from django.forms import ModelForm, Textarea
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.utils import safestring
from django.views.decorators.csrf import csrf_exempt

import models
import settings


MIT_6_438_FILE = os.path.join(settings.CLIENT_SERVER_PATH, 'static', 'text', 'mit_6_438.txt')

BLEACH_TAG_WHITELIST = ['a', 'b', 'blockquote', 'code', 'em', 'i', 'li', 'ol', 'strong', 'ul',
                        'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']

# temporary: list of users who can edit
EDIT_USERS = ['rgrosse', 'cjrd']

def markdown_to_html(markdown_text):
    body_html = markdown.markdown(markdown_text, safe_mode=True)
    return bleach.clean(body_html, tags=BLEACH_TAG_WHITELIST)



def show(request, username, tag):
    roadmap = models.load_roadmap(username, tag)
    if roadmap is None:
        return HttpResponse(status=404)

    if not roadmap.visible_to(request.user):
        return HttpResponse(status=404)
    
    can_edit = roadmap.editable_by(request.user)
    edit_url = '/roadmaps/%s/%s/edit' % (username, tag)

    # temporary: editing disabled on server
    if username not in EDIT_USERS:
        can_edit = False

    body_html = markdown_to_html(roadmap.body)
    
    return render(request, 'roadmap.html', {
        'body_html': safestring.mark_safe(body_html),
        'roadmap': roadmap,
        'show_edit_link': can_edit,
        'edit_url': edit_url,
        'CONTENT_SERVER': settings.CONTENT_SERVER,
        })


class RoadmapForm(ModelForm):
    class Meta:
        model = models.Roadmap
        fields = ('title', 'author', 'audience', 'visibility', 'blurb', 'body')
        widgets = {
            'blurb': Textarea(attrs={'cols': 50, 'rows': 3}),
            'body': Textarea(attrs={'cols': 100, 'rows': 40}),
            }

class RoadmapCreateForm(RoadmapForm):
    class Meta:
        model = models.Roadmap
        fields = ('title', 'url_tag', 'author', 'audience', 'visibility', 'blurb', 'body')
        widgets = {
            'blurb': Textarea(attrs={'cols': 50, 'rows': 3}),
            'body': Textarea(attrs={'cols': 100, 'rows': 40}),
            }
        

def edit(request, username, tag):
    # temporary: editing disabled on server
    if username not in EDIT_USERS:
        return HttpResponse(status=404)
    
    if not request.user.is_authenticated():
        return HttpResponse(status=404)

    roadmap = models.load_roadmap(username, tag)
    if roadmap is None:
        return HttpResponse(status=404)
    if not roadmap.editable_by(request.user):
        return HttpResponse(status=404)
    
    if request.method == 'POST':
        form = RoadmapForm(request.POST, instance=roadmap)

        if form.is_valid():
            form.save()

            return HttpResponseRedirect('/roadmaps/%s/%s' % (username, tag))

    else:
        form = RoadmapForm(instance=roadmap)
    
    return render(request, 'roadmap-edit.html', {
        'form': form,
        'tag': roadmap.url_tag,
        'CONTENT_SERVER': settings.CONTENT_SERVER,
        })

def new(request):
    # temporary: editing disabled on server
    if not (request.user.is_authenticated() and request.user.username in EDIT_USERS):
        return HttpResponse(status=404)

    if not request.user.is_authenticated():
        return HttpResponse(status=404)

    if request.method == 'POST':
        form = RoadmapCreateForm(request.POST)
        if form.is_valid():
            roadmap = form.save(commit=False)
            roadmap.user = request.user
            roadmap.save()
            
            return HttpResponseRedirect('/roadmaps/%s/%s' % (request.user.username, roadmap.url_tag))
    else:
        form = RoadmapCreateForm()
        
    return render(request, 'roadmap-new.html', {
        'form': form,
        'CONTENT_SERVER': settings.CONTENT_SERVER,
        })


@csrf_exempt  # this is a POST request because it contains data, but there are no side effects
def preview(request):
    if request.method != 'POST':
        return HttpResponse(status=404)

    roadmap = {
        'title': request.POST['title'] if 'title' in request.POST else '',
        'author': request.POST['author'] if 'author' in request.POST else '',
        'audience': request.POST['audience'] if 'audience' in request.POST else '',
        }
    body = request.POST['body'] if 'body' in request.POST else ''

    body_html = markdown_to_html(body)


    
    return render(request, 'roadmap-content.html', {
        'roadmap': roadmap,
        'body_html': safestring.mark_safe(body_html),
        'show_edit_link': False,
        'CONTENT_SERVER': settings.CONTENT_SERVER,
        })


def list(request):
    roadmaps = models.Roadmap.objects.all()
    roadmaps = filter(lambda r: r.listed_in_main(), roadmaps)

    return render(request, 'roadmap-list.html', {
        'roadmaps': roadmaps,
        'include_create': True,
        'empty_message': 'Nobody has made any roadmaps yet.',
        'CONTENT_SERVER': settings.CONTENT_SERVER,
        })
    
def list_by_user(request, username):
    try:
        user = User.objects.get(username__exact=username)
    except User.DoesNotExist:
        return HttpResponse(status=404)

    roadmaps = models.Roadmap.objects.filter(user__username__exact=user.username)
    roadmaps = filter(lambda r: r.is_public(), roadmaps)

    include_create = request.user.is_authenticated() and request.user.username == username

    return render(request, 'roadmap-list.html', {
        'roadmaps': roadmaps,
        'include_create': include_create,
        'empty_message': 'This user has not made any roadmaps.',
        'CONTENT_SERVER': settings.CONTENT_SERVER,
        })
    
