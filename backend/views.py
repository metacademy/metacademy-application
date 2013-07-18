from backend import settings
from backend.db_handler import db
import config
from content_server import formats
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
    Returns the knowledge-map browser (learning/explore view)
    """
    return render_to_response('kmap-tester.html', {'content_server':CONTENT_SERVER}, context_instance=RequestContext(request))

def process_content_form(request):
    return render_to_response('content-submission.html',{'content_server':CONTENT_SERVER},context_instance=RequestContext(request))

def get_search_view(request):
    """
    Returns the search (list) view for a given query
    """
    
    return render_to_response('search-results.html', {'content_server':CONTENT_SERVER}, context_instance=RequestContext(request))

