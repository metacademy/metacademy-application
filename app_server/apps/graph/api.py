import pdb
# myapp/api.py
from tastypie import fields
from tastypie.resources import ModelResource
from tastypie.authorization import Authorization # TODO change

from apps.graph.models import Concept, Edge, Flag, Graph, ConceptResource
from apps.graph.serializers import ConceptSerializer, GraphSerializer


class FlagResource(ModelResource):
    class Meta:
        fields = ("text",)
        include_resource_uri = False
        queryset = Flag.objects.all()
        resource_name = 'flag'
        authorization = Authorization()

class ShellConceptResource(ModelResource):
    class Meta:
        fields = ("id", "tag")
        queryset = Concept.objects.all()
        resource_name = 'concept'
        include_resource_uri = False
        authorization = Authorization()

class EdgeResource(ModelResource):
    source = fields.ForeignKey(ShellConceptResource, "source", full=True)
    target = fields.ForeignKey(ShellConceptResource, "target", full=True)
    class Meta:
        queryset = Edge.objects.all()
        resource_name = 'edge'
        include_resource_uri = False
        authorization = Authorization()

    def dehydrate(self, bundle):
        # TODO better way to rename?
        bundle.data["edge_id"] = bundle.data["id"]
        del bundle.data["id"]
        return bundle

class ConceptResourceResource(ModelResource):
    concept = fields.ForeignKey(ShellConceptResource, "concept", full=True)
    class Meta:
        queryset = ConceptResource.objects.all()
        resource_name = 'conceptresource'
        authorization = Authorization()

class ConceptResource(ModelResource):
    dependencies = fields.ToManyField(EdgeResource, 'edge_target', full=True)
    resources = fields.ToManyField(ConceptResourceResource, 'concept_resource', full = True)
    flags = fields.ManyToManyField(FlagResource, 'flags', full=True)
    class Meta:
        queryset = Concept.objects.all()
        resource_name = 'concept'
        authorization = Authorization()
        serializer = ConceptSerializer()

class GraphResource(ModelResource):
    concepts = fields.ManyToManyField(ConceptResource, 'concepts', full=True)
    class Meta:
        queryset = Graph.objects.all()
        resource_name = 'graph'
        authorization = Authorization()
        serializer = GraphSerializer()
