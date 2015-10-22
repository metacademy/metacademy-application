from django.conf.urls import patterns, url

from views import show_btests

urlpatterns = patterns('',
                       url(r'', show_btests),
)
