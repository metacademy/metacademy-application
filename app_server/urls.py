from django.conf.urls import patterns, include, url
# handle static files locally
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.views.decorators.cache import cache_page

from apps.graph.views import benchmark_viewer

"""
Django urls handler. Valid URLS/Requests:
  kmap(s)                           display knowledge-map browser

see simple_server for valid content requests
"""

urlpatterns = patterns('',
                       url(r'^', include('apps.content_search.urls') ),
                       url(r'^(?i)graphs/', include('apps.graph.urls', namespace="graphs") ),
                       url(r'^dev/benchmarktest', benchmark_viewer),
)

urlpatterns += staticfiles_urlpatterns()
