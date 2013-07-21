import config
import cserver_comm
from backend import settings
from backend.db_handler import db
from backend.settings import CONTENT_SERVER
from content_server import formats

from forms import ResourceForm
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
    Returns the knowledge-map browser (learning/explore view)
    """
    return render_to_response('kmap-tester.html', {'content_server':CONTENT_SERVER}, context_instance=RequestContext(request))

def process_content_form(request):
    return render_to_response('content-submission.html',{'content_server':CONTENT_SERVER},context_instance=RequestContext(request))

def get_search_view(request):
    """
    Returns the search (list) view for a given query
    """
    qstring = request.GET['q']
    if len(qstring) == 0:
        search_data = None
        print 'WARNING: empty query parameter in get_search_view'
    else:
        search_data = cserver_comm.get_search_json(qstring)
    
    return render_to_response('search-results.html', {'content_server': CONTENT_SERVER, 'search_data': search_data, 'search_query': qstring}, context_instance=RequestContext(request))

