import bleach
import markdown
import os

from django.forms import CharField, Form, Textarea
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.utils import safestring

import settings

MIT_6_438_FILE = os.path.join(settings.CLIENT_SERVER_PATH, 'static', 'text', 'mit_6_438.txt')

BLEACH_TAG_WHITELIST = ['a', 'b', 'blockquote', 'code', 'em', 'i', 'li', 'ol', 'strong', 'ul',
                        'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']

def load_roadmap(username, roadmap_name):
    # special case hack for 6.438 roadmap
    if username == 'rgrosse' and roadmap_name == 'mit_6_438':
        title = 'MIT 6.438 Roadmap'
        author = 'Roger Grosse'
        if os.path.exists(MIT_6_438_FILE):
            markdown_text = open(MIT_6_438_FILE).read()
        else:
            return None

    else:
        # read from database
        return None

    return title, author, markdown_text

    

def get_roadmap(request, username, roadmap_name):
    result = load_roadmap(username, roadmap_name)
    if result is None:
        return HttpResponse(status=404)
    title, author, markdown_text = result

    roadmap_html = markdown.markdown(markdown_text, safe_mode=True)
    roadmap_html = bleach.clean(roadmap_html, tags=BLEACH_TAG_WHITELIST)
    
    return render(request, 'roadmap.html', {
        'roadmap_html': safestring.mark_safe(roadmap_html),
        'title': title,
        'author': author,
        })


class RoadmapForm(Form):
    title = CharField(label='Title:')
    author = CharField(label='Author(s):')
    body = CharField(widget=Textarea(attrs={'cols': 100, 'rows': 40}))

def edit_roadmap(request, username, roadmap_name):
    #if not request.user.is_authenticated() or request.user.username != username:
    #    return HttpResponse(status=404)
    
    result = load_roadmap(username, roadmap_name)
    if result is None:
        return HttpResponse(status=404)
    title, author, markdown_text = result

    if request.method == 'POST':
        form = RoadmapForm(request.POST)
        if form.is_valid():
            # do stuff here
            return HttpResponseRedirect('/')

    else:
        form = RoadmapForm(initial={'title': title, 'author': author, 'body': markdown_text})
    
    return render(request, 'roadmap-edit.html', {
        'form': form,
        })

