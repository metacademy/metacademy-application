import pdb
from django.conf.urls import patterns, include, url
# handle static files locally
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.contrib import admin
from django.views.decorators.cache import cache_page
from django.views.generic.base import TemplateView, RedirectView
from haystack.views import search_view_factory
from haystack.query import SearchQuerySet

from apps.roadmaps.models import Roadmap
from views import MultiSearchView, ContactView, get_list_view

admin.autodiscover()

sqs = SearchQuerySet().filter(is_listed_in_main_str="True")
search_inst = search_view_factory(view_class=MultiSearchView, searchqueryset=sqs, template='search-results.html')

"""
Django urls handler
"""
urlpatterns = patterns('',
                       url(r'^$', TemplateView.as_view(template_name="landing.html")),
                       url(r'^(?i)search$', search_inst, name="haystack_search"),
                       url(r'^(?i)list$', get_list_view),
                       url(r'^(?i)concepts/((?P<anything>.*))',
                           RedirectView.as_view(url="/graphs/concepts/%(anything)s", query_string=True), name='concepts'),
                       url(r'^(?i)graphs/', include('apps.graph.urls', namespace="graphs") ),
                       url(r'^user/', include('apps.user_management.urls', namespace='user') ),
                       url(r'^roadmaps/', include('apps.roadmaps.urls', namespace='roadmaps')),
                       url(r'^captcha/', include('captcha.urls')),
                       url(r'^about/?$', TemplateView.as_view(template_name='about.html')),
                       url(r'^feedback/?$', ContactView.as_view()),
                       url(r'^thanks/?$', TemplateView.as_view(template_name='feedback_thanks.html')),
                       (r'^admin/doc/', include('django.contrib.admindocs.urls')),
                       url(r'^admin/', include(admin.site.urls)),
                       url(r'^browser-tests', include('apps.browser_tests.urls', namespace="btests")),
)

urlpatterns += staticfiles_urlpatterns()
