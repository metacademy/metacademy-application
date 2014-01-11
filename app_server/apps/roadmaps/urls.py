from django.conf.urls import patterns, url

from apps.roadmaps import views

urlpatterns = patterns('',
                       url(r'^$', views.list),
                       url(r'^preview$', views.preview, name='preview'),
                       url(r'^new$', views.new, name='new'),
                       url(r'^([^/]+)/([^/]+)$', views.show, name='show'),
                       url(r'^([^/]+)/([^/]+)/edit$', views.edit, name='edit'),
                       url(r'^([^/]+)/([^/]+)/history$', views.show_history, name='history'),
                       url(r'^([^/]+)/([^/]+)/settings$', views.settings, name='settings'),
                       url(r'^([^/]+)/([^/]+)/version/(\d+)$', views.show, name='version'),
                       url(r'^([^/]+)/([^/]+)/update_to_revision/(\d+)$', views.update_to_revision, name='revert'),
                       url(r'^([^/]+)$', views.list_by_user, name='user-list'),
                       )
