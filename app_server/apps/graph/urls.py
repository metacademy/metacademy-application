from django.conf.urls import patterns, url, include

from tastypie.api import NamespacedApi

from apps.graph.api import ConceptResource, GraphResource, ConceptResourceResource, DependencyResource, GoalResource,\
    TargetGraphResource, FullTargetGraphResource, GlobalResourceResource, ResourceLocationResource
from views import *

# api v1
v1_api = NamespacedApi(api_name='v1', urlconf_namespace='graphs')
v1_api.register(ConceptResource())
v1_api.register(ConceptResourceResource())
v1_api.register(GlobalResourceResource())
v1_api.register(ResourceLocationResource())
v1_api.register(GraphResource())
v1_api.register(TargetGraphResource())
v1_api.register(FullTargetGraphResource())
v1_api.register(DependencyResource())
v1_api.register(GoalResource())

#import pdb; pdb.set_trace()

# TODO refactor concepts
urlpatterns = patterns('',
                       url(r'^$', "django.views.defaults.page_not_found"),
                       url(r'^concept-triplet/?$', get_concept_triplet, name='concept_triplet'),
                       url(r'^gresource-search/?$', get_gresource_search, name='resource_search'),
                       url(r'^autocomplete/?$', get_autocomplete, name='autocomplete'),
                       url(r'^(?i)concepts/([^/]+)/history/?$', get_concept_history, name="concept-history"),
                       url(r'^(?i)concepts/([^/]+)/?$', get_concept_dep_graph, name="concepts"),
                       url(r'^(?i)concepts/$', "django.views.defaults.page_not_found", name="concepts-base"),
                       #                  url(r'^(?i)concepts/([^/]+)?/version/(\d+)/?$', get_concept_version, name="concept-version"),
                       url(r'^edit/new/?', new_graph, name="graph-creator"),
                       url('^edit/([^/]+)/?$', edit_existing_graph, name="existing-edit"),
                       url('id/([^/]+)/?', show_graph, name="show-graph"),
                       url(r'^idchecker/?', check_id, name="idchecker"),
                       url(r'^tagschecker/?', check_tags, name="tagschecker"),
                       url('^api/', include(v1_api.urls), name="api"),

)
