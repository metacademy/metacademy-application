from django.conf.urls import patterns, url

from apps.roadmaps import views

urlpatterns = patterns('',
                       url(r'^$', views.list),
                       url(r'^([^/]+)$', views.list_by_user),
                       url(r'^([^/]+)/([^/]+)$', views.get_roadmap),
                       url(r'^([^/]+)/([^/]+)/edit$', views.edit_roadmap),
                       url(r'^preview$', views.preview_roadmap),
                       url(r'^new$', views.new_roadmap),
                       )
