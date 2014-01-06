from django.conf.urls import patterns, url
from django.views.generic.base import TemplateView

from views import get_agfk_app, get_graph_creator

urlpatterns = patterns('',
                       url(r'^new/?', get_graph_creator, name="graph-creator"),
                       url(r'^(?i)concepts/', get_agfk_app, name="concepts"),
)
