from django.conf.urls import patterns, url, include

from tastypie.api import Api
from apps.graph.api import ConceptResource, GraphResource
from views import get_agfk_app, new_graph, existing_graph

# api v1
v1_api = Api(api_name='v1')
v1_api.register(ConceptResource())
v1_api.register(GraphResource())

urlpatterns = patterns('',
                       url(r'^new/?', new_graph, name="graph-creator"),
                       # /mapi/graph (should handle get/post/put requests
                       url('^api/', include(v1_api.urls)),
                       url(r'^(?i)concepts/', get_agfk_app, name="concepts"),
                       url('^([^/]+)/', existing_graph),
)
