from django.shortcuts import render_to_response
from django.template import RequestContext
from django.contrib.admin.views.decorators import staff_member_required

from broken_link_checker import get_broken_links_concepts

@staff_member_required
def show_broken_links(request):
    blinks = get_broken_links_concepts()
    return render_to_response("display-broken-links.html", {"blinks": blinks}, context_instance=RequestContext(request))
    
