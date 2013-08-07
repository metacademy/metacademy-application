from django.conf.urls import patterns, url

from apps.graph import views

urlpatterns = patterns('',
                       url(r'^(?i)concepts/', views.graph_browser, name="concepts"),
                       )
