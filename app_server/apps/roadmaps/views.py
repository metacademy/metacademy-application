import bleach
import markdown
import os

from django.forms import CharField, ChoiceField, Form, Textarea
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.utils import safestring
from django.views.decorators.csrf import csrf_exempt


import settings

MIT_6_438_FILE = os.path.join(settings.CLIENT_SERVER_PATH, 'static', 'text', 'mit_6_438.txt')

BLEACH_TAG_WHITELIST = ['a', 'b', 'blockquote', 'code', 'em', 'i', 'li', 'ol', 'strong', 'ul',
                        'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']

def load_roadmap(username, roadmap_name):
    # special case hack for 6.438 roadmap
    if username == 'rgrosse' and roadmap_name == 'mit_6_438':
        title = 'MIT 6.438 Roadmap'
        author = 'Roger Grosse'
        audience = 'MIT 6.438 students'
        if os.path.exists(MIT_6_438_FILE):
            markdown_text = open(MIT_6_438_FILE).read()
        else:
            return None

    else:
        # read from database
        return None

    return title, author, audience, markdown_text

def markdown_to_html(markdown_text):
    roadmap_html = markdown.markdown(markdown_text, safe_mode=True)
    return bleach.clean(roadmap_html, tags=BLEACH_TAG_WHITELIST)

    

def get_roadmap(request, username, roadmap_name):
    result = load_roadmap(username, roadmap_name)
    if result is None:
        return HttpResponse(status=404)
    title, author, audience, markdown_text = result

    can_edit = request.user.is_authenticated() and request.user.username == username
    edit_url = '/roadmaps/%s/%s/edit' % (username, roadmap_name)

    roadmap_html = markdown_to_html(markdown_text)
    
    return render(request, 'roadmap.html', {
        'roadmap_html': safestring.mark_safe(roadmap_html),
        'title': title,
        'author': author,
        'audience': audience,
        'show_edit_link': can_edit,
        'edit_url': edit_url,
        'CONTENT_SERVER': settings.CONTENT_SERVER,
        })


class RoadmapForm(Form):
    VIS_PRIVATE = 'PRIVATE'
    VIS_PUBLIC = 'PUBLIC'
    VIS_MAIN = 'PUB_MAIN'
    
    title = CharField(label='Title:')
    author = CharField(label='Author(s):')
    audience = CharField(label='Target audience:')
    visibility = ChoiceField(label='Visibility:',
                             choices=[(VIS_PRIVATE, 'Private'),
                                      (VIS_PUBLIC, 'Public'),
                                      (VIS_MAIN, 'Public, listed in main page'),
                                      ])
    body = CharField(widget=Textarea(attrs={'cols': 100, 'rows': 40}))

def edit_roadmap(request, username, roadmap_name):
    if not request.user.is_authenticated() or request.user.username != username:
        return HttpResponse(status=404)
    
    result = load_roadmap(username, roadmap_name)
    if result is None:
        return HttpResponse(status=404)
    title, author, audience, markdown_text = result

    if request.method == 'POST':
        form = RoadmapForm(request.POST)
        if form.is_valid():
            # do stuff here
            return HttpResponseRedirect('/roadmaps/%s/%s' % (username, roadmap_name))

    else:
        form = RoadmapForm(initial={'title': title, 'author': author, 'audience': audience, 'body': markdown_text})
    
    return render(request, 'roadmap-edit.html', {
        'form': form,
        'CONTENT_SERVER': settings.CONTENT_SERVER,
        })

@csrf_exempt  # this is a POST request because it contains data, but there are no side effects
def preview_roadmap(request):
    if request.method != 'POST':
        return HttpResponse(status=404)

    title = request.POST['title'] if 'title' in request.POST else ''
    author = request.POST['author'] if 'author' in request.POST else ''
    audience = request.POST['audience'] if 'audience' in request.POST else ''
    body = request.POST['body'] if 'body' in request.POST else ''

    roadmap_html = markdown_to_html(body)
    
    return render(request, 'roadmap-content.html', {
        'title': title,
        'author': author,
        'audience': audience,
        'roadmap_html': safestring.mark_safe(roadmap_html),
        'show_edit_link': False,
        'CONTENT_SERVER': settings.CONTENT_SERVER,
        })


    
