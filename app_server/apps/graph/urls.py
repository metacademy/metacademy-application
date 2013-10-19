from django.conf.urls import patterns, url
from django.views.generic.base import TemplateView

from views import get_agfk_app

urlpatterns = patterns('',
                       url(r'^(?i)concepts/', get_agfk_app, name="concepts"),
)
