from django.conf.urls import patterns, include, url
# handle static files locally
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.views.decorators.cache import cache_page
from django.views.generic.base import TemplateView

from apps.graph.views import benchmark_viewer

"""
Django urls handler. Valid URLS/Requests:
  kmap(s)                           display knowledge-map browser

see simple_server for valid content requests
"""

urlpatterns = patterns('',
                       url(r'^', include('apps.content_search.urls') ),
                       url(r'^(?i)graphs/', include('apps.graph.urls', namespace="graphs") ),
                       url(r'^user/', include('apps.user_management.urls', namespace='user') ),
                       url(r'^roadmaps/', include('apps.roadmaps.urls', namespace='roadmaps')),
                       # url(r'^dev/benchmarktest', benchmark_viewer),
                       url(r'^captcha/', include('captcha.urls')),
                       url(r'^about/',  TemplateView.as_view(template_name='about.html'))
)

urlpatterns += staticfiles_urlpatterns()
