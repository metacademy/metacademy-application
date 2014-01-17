from django.conf.urls import patterns, url
from django.views.generic.base import TemplateView

from views import get_agfk_app, new_graph, update_graph

urlpatterns = patterns('',
                       url(r'^new/?', new_graph, name="graph-creator"),
                       url(r'^([^/])/([^/])/?', update_graph, name="graph-creator"),
                       url(r'^(?i)concepts/', get_agfk_app, name="concepts"),
)
