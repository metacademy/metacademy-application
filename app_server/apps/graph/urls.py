from django.conf.urls import patterns, url
from django.views.generic.base import TemplateView
from apps.graph import views

urlpatterns = patterns('',
                       url(r'^(?i)concepts/', TemplateView.as_view(template_name="agfk-app.html"), name="concepts"),
                       )
