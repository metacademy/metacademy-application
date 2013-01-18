from django.conf.urls import patterns, include, url
from views import *
# handle static files locally
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.views.decorators.cache import cache_page
from backend.views import get_node_content, get_full_graph, get_kmap_browser

"""
Django urls handler. Valid URLS/Requests:
  kmap(s)                             display knowledge-map browser

  GET full_graph                      get a JSON object representing the full graph
  GET nodes/node-name                 get the JSON representation of a single node
  GET nodes/node-name/map             get the part of the graph that a node depends on
  GET nodes/node-name/related         get the part of the graph that's related to a node
                                         (ancestors/descendants)
"""

urlpatterns = patterns('',
    (r'^(?i)kmaps?/', get_kmap_browser),
    (r'^(?i)full_graph/$', get_full_graph),# cache_page(60*30)(res_disp))# (cache for 30 minutes)
    (r'^(?i)nodes/([^/]+)/(\w+)?/?$',get_node_content)
)

urlpatterns += staticfiles_urlpatterns()