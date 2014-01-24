import pdb
import string
import random

# myapp/api.py
from tastypie import fields
from tastypie.resources import ModelResource
from tastypie.authorization import Authorization # TODO change
from tastypie.exceptions import ImmediateHttpResponse

from apps.graph.models import Concept, Edge, Flag, Graph, ConceptResource, GraphSettings, ConceptSettings
from apps.user_management.models import Profile



CONCEPT_SAVE_FIELDS = ["id", "tag", "title", "summary", "goals", "exercises", "software", "pointers", "is_shortcut", "flags", "dependencies", "resources"]
def normalize_concept(in_concept):
    """
    Temporary hack to normalize tag/id for new and old data and remove client-side fields
    """
    if type(in_concept) != dict:
        return

    if not in_concept["id"] or in_concept["id"][:4] == "-new":
        useid = ''
        while not useid or not len(Concept.objects.filter(id=useid)) == 0:
            useid = ''.join([random.choice(string.lowercase + string.digits) for i in range(8)])
        usetag = useid
    elif in_concept.has_key("sid") and len(in_concept["sid"]):
        useid = in_concept["sid"]
        usetag = in_concept["id"]
    else:
        useid = in_concept["id"]
        usetag = in_concept["id"]
    in_concept["id"] = useid
    in_concept["tag"] = usetag

    for field in in_concept.keys():
        if field not in CONCEPT_SAVE_FIELDS:
            del in_concept[field]


class CustomReversionResource(ModelResource):
    """
    ModelResource that uses django reversions
    """
    def save(self, bundle, skip_errors=False):
        self.is_valid(bundle)

        if bundle.errors and not skip_errors:
            raise ImmediateHttpResponse(response=self.error_response(bundle.request, bundle.errors))

        # Check if they're authorized.
        if bundle.obj.pk:
            self.authorized_update_detail(self.get_object_list(bundle.request), bundle)
        else:
            self.authorized_create_detail(self.get_object_list(bundle.request), bundle)

        # Save FKs just in case.
        self.save_related(bundle)

        # Save the main object.
        bundle.obj.save()
        bundle.objects_saved.add(self.create_identifier(bundle.obj))

        # per resource post-save hook
        self.post_save_hook(bundle)

        # Now pick up the M2M bits.
        m2m_bundle = self.hydrate_m2m(bundle)
        self.save_m2m(m2m_bundle)
        return bundle

    def post_save_hook(self, bundle):
        """
        called after saving to db
        must implement in subclass
        """
        return

    def obj_create(self, bundle, **kwargs):
        return super(ModelResource, self).obj_create(bundle, **kwargs)

    def obj_update(self, bundle, **kwargs):
        return super(ModelResource, self).obj_update(bundle, **kwargs)

    def obj_get(self, bundle, **kwargs):
        return super(ModelResource, self).obj_get(bundle, **kwargs)


class FlagResource(ModelResource):
    class Meta:
        max_limit = 0
        fields = ("text",)
        include_resource_uri = False
        queryset = Flag.objects.all()
        resource_name = 'flag'
        authorization = Authorization()

class ShellConceptResource(ModelResource):
    class Meta:
        max_limit = 0
        fields = ("id", "tag")
        queryset = Concept.objects.all()
        resource_name = 'concept'
        include_resource_uri = False
        authorization = Authorization()

class EdgeResource(ModelResource):
    source = fields.ForeignKey(ShellConceptResource, "source", full=True)
    target = fields.ForeignKey(ShellConceptResource, "target", full=True)
    class Meta:
        max_limit = 0
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
        max_limit = 0
        queryset = ConceptResource.objects.all()
        resource_name = 'conceptresource'
        authorization = Authorization()

class ConceptResource(CustomReversionResource):
    """
    API for concepts, aka nodes
    """
    dependencies = fields.ToManyField(EdgeResource, 'edge_target', full=True)
    resources = fields.ToManyField(ConceptResourceResource, 'concept_resource', full = True)
    flags = fields.ManyToManyField(FlagResource, 'flags', full=True)

    def post_save_hook(self, bundle):
        pdb.set_trace()
        # FIXME we're assuming a user is logged in
        csettings, new = ConceptSettings.objects.get_or_create(concept=bundle.obj)
        uprof, created = Profile.objects.get_or_create(pk=bundle.request.user.pk)
        csettings.editors.add(uprof)
        csettings.save()

    class Meta:
        """ ConceptResource Meta """
        max_limit = 0
        queryset = Concept.objects.all()
        resource_name = 'concept'
        authorization = Authorization()
        allowed_methods = ("get", "post", "put", "delete", "patch")
        always_return_data = True

    def alter_deserialized_detail_data(self, request, data):
        normalize_concept(data)
        return data

    def alter_deserialized_list_data(self, request, data):
        pdb.set_trace() # TODO

    def hydrate_flags(self, bundle):
        in_concept = bundle.data
        if in_concept["flags"]:
            flag_arr = []
            for flag in in_concept["flags"]:
                flag_arr.append({"text": flag})
            in_concept["flags"] = flag_arr
        return bundle

    def hydrate_dependencies(self, bundle):
        in_concept = bundle.data
        for i, in_inlink in enumerate(in_concept["dependencies"]):
            if type(in_inlink) != dict:
                # hack because hydrate can be called twice (https://github.com/toastdriven/django-tastypie/issues/390)
                continue

            inlink = {}
            inlink['source'] = {"id": in_inlink['sid_source'], "tag": in_inlink['source']}
            inlink['target'] = {"id": in_inlink['sid_target'], "tag": in_concept["tag"]}
            inlink['reason'] = in_inlink['reason']
            if not in_inlink.has_key("id"):
                inlink["id"] = in_inlink["sid_source"] + in_inlink["sid_target"]
            else:
                inlink["id"] = in_inlink["id"]
                in_concept["dependencies"][i] = inlink
        return bundle

    def hydrate_resources(self, bundle, **kwargs):
        """
        prep the resource data
        (can't do in ConceptResourceResouce hydrate because we need the tag/id
        from the concept)
        """

        for resource in bundle.data["resources"]:
            if type(resource) != dict:
                # hack because hydrate can be called twice (https://github.com/toastdriven/django-tastypie/issues/390)
                continue
            if resource.has_key("year"):
                try:
                    # must access bundle "longhand"
                    resource["year"]  = int(resource["year"])
                except:
                    resource["year"]  = None
            # FIXME this shouldn't exist here, or at least, it should check
            # that the id doesn't exist (for that 1 in 4.7x10^18 chance)
            if not resource.has_key("id"):
                resource["id"] = ''.join([random.choice(string.lowercase + string.digits) for i in range(8)])
            resource["concept"] = {"id": bundle.data["id"], "tag": bundle.data["tag"]}
            resource["additional_dependencies"] = resource["dependencies"]
            del resource["dependencies"]

        return bundle


class GraphResource(CustomReversionResource):
    """
    """
    concepts = fields.ManyToManyField(ConceptResource, 'concepts', full=True)
    def alter_deserialized_detail_data(self, request, data):
        # create the graph if it does not exist and associate the user with the graph
        for concept in data["concepts"]:
            normalize_concept(concept)
        return data

    def post_save_hook(self, bundle):
        # FIXME we're assuming a user is logged in
        gsettings, new = GraphSettings.objects.get_or_create(graph=bundle.obj)
        uprof, created = Profile.objects.get_or_create(pk=bundle.request.user.pk)
        gsettings.editors.add(uprof)
        gsettings.save()


    class Meta:
        """ GraphResource Meta """
        allowed_methods = ("get", "post", "put", "delete", "patch")
        max_limit = 0
        queryset = Graph.objects.all()
        resource_name = 'graph'
        authorization = Authorization()
