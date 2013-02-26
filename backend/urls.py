from django.conf.urls import patterns, include, url
from views import *
# handle static files locally
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.views.decorators.cache import cache_page
from backend.views import get_content, get_kmap_browser_view

"""
Django urls handler. Valid URLS/Requests:
  kmap(s)                             display knowledge-map browser

see backend/simple_server for valid content requests
"""

urlpatterns = patterns('',
    (r'^(?i)kmaps?/', get_kmap_browser_view),
    (r'^(?i)full_graph/$', get_content),# cache_page(60*30)(res_disp))# (cache for 30 minutes)
    (r'^(?i)nodes/[^/]+/\w*/?$',get_content),
    (r'^(?i)resource[-_]?submission', process_resource_form)
)

urlpatterns += staticfiles_urlpatterns()