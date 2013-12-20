from django.conf.urls import patterns, url

from views import show_broken_links, show_btests

urlpatterns = patterns('',
                       url(r'broken_links', show_broken_links, name="link_checker"),
                       url(r'', show_btests, name="link_checker"),
)
