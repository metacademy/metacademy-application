import bleach
import markdown
import os

from django.http import HttpResponse
from django.shortcuts import render
from django.utils import safestring

import settings

MIT_6_438_FILE = os.path.join(settings.CLIENT_SERVER_PATH, 'static', 'text', 'mit_6_438.txt')

BLEACH_TAG_WHITELIST = ['a', 'b', 'blockquote', 'code', 'em', 'i', 'li', 'ol', 'strong', 'ul',
                        'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']

def get_roadmap(request, username, roadmap_name):
    # special case hack for 6.438 roadmap
    if username == 'rgrosse' and roadmap_name == 'mit_6_438':
        title = 'MIT 6.438 Roadmap'
        author = 'Roger Grosse'
        if os.path.exists(MIT_6_438_FILE):
            markdown_text = open(MIT_6_438_FILE).read()
        else:
            return HttpResponse(status=404)

    else:
        # read from database
        return HttpResponse(status=404)

    roadmap_html = markdown.markdown(markdown_text, safe_mode=True)
    roadmap_html = bleach.clean(roadmap_html, tags=BLEACH_TAG_WHITELIST)
    
    return render(request, 'roadmap.html', {
        'roadmap_html': safestring.mark_safe(roadmap_html),
        'title': title,
        'author': author,
        })


                  
