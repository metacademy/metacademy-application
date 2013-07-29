from django.conf.urls import patterns, url

from apps.content_search import views

urlpatterns = patterns('',
                       url(r'^$', views.landing_page),
                       url(r'^(?i)search', views.get_search_view),
                       )
