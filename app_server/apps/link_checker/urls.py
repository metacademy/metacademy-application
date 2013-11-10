from django.conf.urls import patterns, url

from views import show_broken_links

urlpatterns = patterns('',
                       url(r'', show_broken_links, name="link_checker"),
)
