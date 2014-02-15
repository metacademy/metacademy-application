from django.conf.urls import patterns, url, include

from tastypie.api import Api

from apps.graph.api import ConceptResource, GraphResource, ConceptResourceResource, DependencyResource, GoalResource, TargetGraphResource
from views import new_graph, check_id, get_concept_dep_graph, edit_existing_graph

# api v1
v1_api = Api(api_name='v1')
v1_api.register(ConceptResource())
v1_api.register(ConceptResourceResource())
v1_api.register(GraphResource())
v1_api.register(TargetGraphResource())
v1_api.register(DependencyResource())
v1_api.register(GoalResource())

#import pdb; pdb.set_trace()

urlpatterns = patterns('',
                       url(r'^(?i)concepts/([^/]+)?/?', get_concept_dep_graph, name="concepts"),
                       url(r'^new/?', new_graph, name="graph-creator"),
                       url(r'^idchecker/?', check_id, name="idchecker"),
                       # /mapi/graph (should handle get/post/put requests
                       url('^api/', include(v1_api.urls), name="api"),
                       url('^([^/]+)/', edit_existing_graph),
)
