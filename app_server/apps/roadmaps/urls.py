from django.conf.urls import patterns, url

from apps.roadmaps import views

urlpatterns = patterns('',
                       url(r'^$', views.list),
                       url(r'^preview$', views.preview),
                       url(r'^new$', views.new),
                       url(r'^([^/]+)/([^/]+)$', views.show),
                       url(r'^([^/]+)/([^/]+)/edit$', views.edit),
                       url(r'^([^/]+)$', views.list_by_user),
                       )
