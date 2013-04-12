from backend import settings
from backend.db_handler import db
import global_resources
import content_server.formats as formats
import config
from forms import ResourceForm
from backend.settings import CONTENT_SERVER
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response, redirect, render
from django.template import RequestContext
from django import forms
import os
import pdb
import urllib
import urllib2

"""
Django view functions: handles web requests and queries content server for content
"""

def get_kmap_browser_view(request):
    """
    returns k-map browser
    """
    node_list = formats.read_nodes(config.CONTENT_PATH, onlytitle=True) # TODO: move this to content server?
    node_list.sort()
    node_list.insert(0,'full_graph')
    return render_to_response('kmap-tester.html', {'node_list':node_list, 'content_server':CONTENT_SERVER}, context_instance=RequestContext(request), )


def get_content(request):
    """
    Return requested content from content server
    """
    fmt = request.GET.get('format','json')
    full_url = CONTENT_SERVER + request.path + '?' + urllib.urlencode(request.GET)
    data = urllib2.urlopen(full_url)
    return HttpResponse(data, content_type=_get_content_type(fmt))


def _get_content_type(fmt):
    return  {'json': 'application/json',
                         'svg': 'image/svg+xml',
                         'dot': 'text/plain',
                         }[fmt]

def process_resource_form(request):
    """
    Add resources to resource database via a form
    """
    if request.method == 'POST':
        form = ResourceForm(request.POST)
        if form.is_valid():
            rdb = db(settings.RESOURCE_DB)
            if not rdb.check_table_existence(global_resources.RESOURCE_DB_TABLE):
                rdb.add_table('%s (key Text PRIMARY KEY, title Text, location Text, resource_type Text, free Boolean, notes Text)' % global_resources.RESOURCE_DB_TABLE)
            rdb.execute("INSERT OR REPLACE INTO %s (key, title, location, resource_type, free, notes) VALUES(?, ?, ?, ?, ?, ?)" % global_resources.RESOURCE_DB_TABLE,
            [form.cleaned_data['key'], form.cleaned_data['title'], form.cleaned_data['location'],
             form.cleaned_data['resource_type'], form.cleaned_data['cost']=="free", form.cleaned_data['notes']])
            return HttpResponseRedirect('/resource-submission/')
    else:
        form = ResourceForm()
    return render(request, 'resource_submission.html', {'form': form,})



    
   

