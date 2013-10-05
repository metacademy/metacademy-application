from django.conf.urls import patterns, url
from django.views.generic.base import TemplateView

urlpatterns = patterns('',
                       url(r'^(?i)concepts/', TemplateView.as_view(template_name="agfk-app.html"), name="concepts"),
                       )
