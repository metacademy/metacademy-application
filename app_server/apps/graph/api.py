import pdb
import string
import random
import ast

import reversion
from tastypie import fields
from tastypie import http
from tastypie.resources import NamespacedModelResource
from tastypie.authorization import DjangoAuthorization
from tastypie.exceptions import Unauthorized, ImmediateHttpResponse
from django.core.exceptions import ObjectDoesNotExist

from apps.graph.models import Concept, Dependency, Graph, GraphSettings,\
    ConceptSettings, ResourceLocation, GlobalResource, Goal, TargetGraph
# avoid name collision
from apps.graph.models import ConceptResource as CResource
from apps.user_management.models import Profile

# global TODOs
# hydrate should prepare bundle.obj, not bundle.data (probably the reason hydrate is called so many times)


class CreatesCycleException(Exception):
    """
    thrown when added edge creates a cycle
    """
    pass


def get_api_object(ObjRes, request, oid, id_field="id", serialize=True):
    """
    helper function
    get resource object from the tastypie api
    """
    ob_res = ObjRes()
    sel_dict = {id_field: oid}
    robj = ob_res.obj_get(ob_res.build_bundle(request=request), **sel_dict)
    ores_bundle = ob_res.build_bundle(obj=robj, request=request)
    ret_obj = ob_res.full_dehydrate(ores_bundle)
    if serialize:
        ret_obj = ob_res.serialize(request, ret_obj, "application/json")
    return ret_obj


class ModAndUserObjectsOnlyAuthorization(DjangoAuthorization):
    # def create_list(self, object_list, bundle):
    #     # Assuming they're auto-assigned to ``user``.
    #     return object_list

    def create_detail(self, object_list, bundle):
        # TODO when is this called?
        return bundle.obj.editable_by(bundle.request.user)

    def update_list(self, object_list, bundle):
        # called when PUTing a list
        allowed = []

        # nobody can PUT to a list
        if bundle.request.META["REQUEST_METHOD"] == 'PUT':
            raise Unauthorized("PUT to list not allowed")

        for obj in object_list:
            if not obj.editable_by(bundle.request.user):
                raise Unauthorized("not authorized to edit concept")
            allowed.append(obj)
        return allowed

    def update_detail(self, object_list, bundle):

        # check if we're trying to change the id or create a new object using patch
        # TODO I couldn't find a better way to do this --CJR
        split_path = bundle.request.META["PATH_INFO"].split("/")
        split_path = [p for p in split_path if p]
        model_name = split_path[-2]
        if model_name == "v1":
            model_name = split_path[-1]
            model_patch_id = ""
        else:
            model_patch_id = split_path[-1]

        # make sure we're not trying to change the id
        if model_name == bundle.obj._meta.model_name\
           and model_patch_id != bundle.obj.id\
           and bundle.obj.__class__.objects.filter(id=model_patch_id).exists():
            raise Unauthorized("cannot replace id")

        # make sure the existing DB entry is editable
        try:
            match = bundle.obj.__class__.objects.get(id=bundle.obj.id)
            if not match.editable_by(bundle.request.user):
                return False
        except bundle.obj.__class__.DoesNotExist:
            pass

        return bundle.obj.editable_by(bundle.request.user)

    def delete_list(self, object_list, bundle):
        raise Unauthorized("Sorry, no deletes yet. TODO")

    def delete_detail(self, object_list, bundle):
        raise Unauthorized("Sorry, no deletes yet. TODO")


class ConceptAuthorization(ModAndUserObjectsOnlyAuthorization):
    def update_detail(self, object_list, bundle):
        result = super(ConceptAuthorization, self).update_detail(object_list, bundle)
        if not result:
            return False

        # make sure non-supers are not commiting updating with non-matching ids/tags
        if "tag" in bundle.data and "id" in bundle.data\
           and bundle.data["tag"] != bundle.data["id"] and not bundle.request.user.is_superuser:
            raise Unauthorized("normal users cannot push non-matching ids and tags")

        return True


class BaseResource(NamespacedModelResource):
    class Meta:
        list_allowed_methods = ('get', 'post')
        detail_allowed_methods = ('get', 'put', 'patch')
        max_limit = 0
        always_return_data = True
        authorization = ModAndUserObjectsOnlyAuthorization()


class CustomSaveHookResource(BaseResource):
    """
    ModelResource that uses django reversions
    """
    def save(self, bundle, skip_errors=False, **kwargs):
        self.is_valid(bundle)

        if bundle.errors and not skip_errors:
            raise ImmediateHttpResponse(response=self.error_response(bundle.request, bundle.errors))

        # Check if they're authorized.
        if bundle.obj.pk:
            self.authorized_update_detail(self.get_object_list(bundle.request), bundle)
        else:
            self.authorized_create_detail(self.get_object_list(bundle.request), bundle)
        try:
            bundle = self.pre_save_hook(bundle)
        except CreatesCycleException:
            raise ImmediateHttpResponse(response=http.HttpForbidden())

        # Save FKs just in case.
        self.save_related(bundle)

        # Save the main object. # CJR TODO we can somehow check if we should save here (are we calling from an edge?)
        bundle.obj.save()
        bundle.objects_saved.add(self.create_identifier(bundle.obj))

        # Now pick up the M2M bits. (must occur after the main obj)
        m2m_bundle = self.hydrate_m2m(bundle)
        ## try:
        ##     m2m_bundle = self.hydrate_m2m(bundle)
        ## except Exception, e:
#/Users/cjrd/Dropbox/Metacademy/meta_venv/lib/python2.7/site-packages/tastypie/resources.py
        self.save_m2m(m2m_bundle)

        # per resource post-save hook
        bundle = self.post_save_hook(bundle)

        return bundle

    def pre_save_hook(self, bundle):
        """
        called after saving to db

        implement in subclass
        """
        return bundle

    def post_save_hook(self, bundle):
        """
        called after saving to db

        implement in subclass
        """
        return bundle

    def obj_create(self, bundle, **kwargs):
        return super(NamespacedModelResource, self).obj_create(bundle, **kwargs)

    def obj_update(self, bundle, **kwargs):
        return super(NamespacedModelResource, self).obj_update(bundle, **kwargs)

    def obj_get(self, bundle, **kwargs):
        return super(NamespacedModelResource, self).obj_get(bundle, **kwargs)


class GoalResource(CustomSaveHookResource):
    """
    """
    concept = fields.ToOneField("apps.graph.api.ConceptResource", "concept")

    class Meta(CustomSaveHookResource.Meta):
        """ GoalResource Meta"""
        queryset = Goal.objects.all()
        resource_name = 'goal'

    def post_save_hook(self, bundle):
        # TODO decide when to make a new version
        if True:
            with reversion.create_revision():
                # TODO increment version number
                bundle.obj.concept.save()
                reversion.set_user(bundle.request.user)
                reversion.set_comment("changed goal")
        return bundle


class ResourceLocationResource(CustomSaveHookResource):
    cresource = fields.ForeignKey("apps.graph.api.ConceptResourceResource", "cresource")

    class Meta(CustomSaveHookResource.Meta):
        queryset = ResourceLocation.objects.all()
        resource_name = 'resourcelocation'

    def post_save_hook(self, bundle):
        # TODO decide when to make a new version
        if True:
            with reversion.create_revision():
                # TODO increment version number
                reversion.set_user(bundle.request.user)
                reversion.set_comment("changed resource location")
                bundle.obj.cresource.concept.save()
        return bundle


class GlobalResourceResource(CustomSaveHookResource):
    """
    tastypie resource for global resources
    """

    def dehydrate(self, bundle, **kwargs):
        if "authors" in bundle.data and bundle.data["authors"]:
            bundle.data["authors"] = ast.literal_eval(bundle.data.get("authors"))

        if "edition_years" in bundle.data and bundle.data["edition_years"]:
            bundle.data["edition_years"] = ast.literal_eval(bundle.data.get("edition_years"))
        return bundle

    def hydrate(self, bundle, **kwargs):
        gresource = bundle.data
        # hack because hydrate can be called twice (https://github.com/toastdriven/django-tastypie/issues/390)
        if type(gresource) != dict:
            return bundle

        # create new id if necessary
        # TODO DRY with cresource hydrate
        if not gresource["id"]:
            useid = ''
            while not useid or not len(GlobalResource.objects.filter(id=useid)) == 0:
                useid = ''.join([random.choice(string.lowercase + string.digits) for i in range(12)])
                gresource["id"] = useid

        # normalize year TODO should we only allow ints
        if "year" in gresource:
            try:
                gresource["year"]  = int(gresource["year"])
            except:
                gresource["year"]  = None

        return bundle

    class Meta(CustomSaveHookResource.Meta):
        """
        Meta for global resource
        """
        queryset = GlobalResource.objects.all()
        resource_name = 'globalresource'

    def post_save_hook(self, bundle):
        # TODO decide when to make a new version
        if True:
            with reversion.create_revision():
                # TODO increment version number
                reversion.set_user(bundle.request.user)
                # TODO figure out these changes
                reversion.set_comment("changed global resource fields")
                bundle.obj.save()
        return bundle


class ConceptResourceResource(CustomSaveHookResource):
    concept = fields.ToOneField("apps.graph.api.ConceptResource", "concept")
    locations = fields.ToManyField(ResourceLocationResource, 'locations', full=True, related_name="cresource")
    global_resource = fields.ForeignKey(GlobalResourceResource, "global_resource", full=True)
    goals_covered = fields.ManyToManyField(GoalResource, "goals_covered")

    class Meta(CustomSaveHookResource.Meta):
        """
        ConceptResource meta
        """
        queryset = CResource.objects.all()
        resource_name = 'conceptresource'

    def post_save_hook(self, bundle):
        if bundle.obj.goals_covered.all().count() == 0 and len(bundle.data["goals_covered"]):
            # FIXME hack because of weird saving schedule in tastypie
            for gc in bundle.data["goals_covered"]:
                bundle.obj.goals_covered.add(gc.obj)

        # TODO decide when to make a new version
        if True:
            with reversion.create_revision():
                # TODO increment version number
                reversion.set_user(bundle.request.user)
                reversion.set_comment("changed resource")
                bundle.obj.concept.save()
        return bundle

    def dehydrate(self, bundle):
        # TODO why is this called > 1 times? and why doesn't this flag stop it?
        if not hasattr(self, "was_dehydrated"):
            self.was_dehydrated = True
        elif self.was_dehydrated:
            return bundle
        # bundle.data["goals_covered"] = [goal.id for goal in bundle.obj.goals_covered.all()]
        # bundle.data['location'] = json.loads(bundle.data['location'])
        adeps = bundle.data["additional_dependencies"]
        notes = bundle.data["notes"]
        if notes:
            try:
                bundle.data["notes"] = ast.literal_eval(notes)
            except:
                pass

        if type(adeps) == unicode:
            adeps = ast.literal_eval(adeps)
        for dep in adeps:
            if "id" in dep:
                dconcept = Concept.objects.get(id=dep["id"])
                dep["title"] = dconcept.title
                dep["tag"] = dconcept.tag
            elif "title" in dep:
                try:
                    dconcept = Concept.objects.get(title=dep["title"])
                    dep["title"] = dconcept.title
                    dep["tag"] = dconcept.tag
                    dep["id"] = dconcept.id
                except ObjectDoesNotExist:
                    # TODO
                    pass
        bundle.data["additional_dependencies"] = adeps

        return bundle

    def hydrate(self, bundle, **kwargs):
        """
        prep the resource data for the database
        """
        resource = bundle.data
        # hack because hydrate can be called twice (https://github.com/toastdriven/django-tastypie/issues/390)
        if type(resource) != dict:
            return bundle

        # if "concept" in resource:
        #     del resource["concept"]

        # create new id if necessary
        if not resource["id"]:
            useid = ''
            while not useid or not len(CResource.objects.filter(id=useid)) == 0:
                useid = ''.join([random.choice(string.lowercase + string.digits) for i in range(12)])
            resource["id"] = useid

        adeps_type = type(resource["additional_dependencies"])

        if adeps_type == str or adeps_type == unicode:
            adeps = ast.literal_eval(resource["additional_dependencies"])
        elif adeps_type == list:
            adeps = resource["additional_dependencies"]
        else:
            raise Exception("unable to parse additional dependencies for concept " + bundle.data["title"])
        save_adeps = []
        # if adeps don't have ids, try to associate an id with it -- only save the title if absolutely necessary
        for dep in adeps:
            did = ""
            if "id" in dep:
                did = dep["id"]
            elif "title" in dep:
                # try to find its id using the title
                # TODO which concepts should we filter on? e.g. all concepts, only approved concepts,
                # [probably best solution: approved or user concepts]
                tobjs = Concept.objects.filter(title=dep["title"])
                if len(tobjs):
                    # TODO what if title's are ambiguous
                    did = tobjs[0].id
                else:
                    # TODO if possible,
                    # search input graph for a match
                    pass
            else:
                raise Exception("additional resource dependency for concept "
                                + bundle.data["title"] + " does not have id or title specified")
            if did:
                save_adep = {"id": did}
            else:
                save_adep = {"title": dep["title"]}
            save_adeps.append(save_adep)

        return bundle


class ConceptResource(CustomSaveHookResource):
    """
    API for concepts, aka nodes
    """
    resources = fields.ToManyField(ConceptResourceResource, 'concept_resource', full=True, related_name="concept")
    goals = fields.ToManyField(GoalResource, 'goals', full=True, related_name="concept")

    def post_save_hook(self, bundle):
        # create profile if necessary
        csettings, csnew = ConceptSettings.objects.get_or_create(concept=bundle.obj)
        uprof, created = Profile.objects.get_or_create(pk=bundle.request.user.pk)
        csettings.edited_by.add(uprof)

        # create targetgraph if necessary
        tgraph, tnew = TargetGraph.objects.get_or_create(leaf=bundle.obj)
        if tnew:
            tgraph.concepts.add(bundle.obj)

        # create new reversion if reversion creating criteria is met (TODO implement on model)
        if True:
            with reversion.create_revision():
                # TODO increment version number
                reversion.set_user(bundle.request.user)
                reversion.set_comment("changed the concept")
                bundle.obj.save()

        return bundle

    class Meta(CustomSaveHookResource.Meta):
        """ ConceptResource Meta"""
        queryset = Concept.objects.all()
        resource_name = 'concept'
        authorization = ConceptAuthorization()

    def alter_deserialized_list_data(self, request, data):
        for concept in data["objects"]:
            data = normalize_concept(concept)
        return data

    def alter_deserialized_detail_data(self, request, data):
        data = normalize_concept(data)
        return data


class ConceptSegmentResource(CustomSaveHookResource):
    """
    API for concepts, aka nodes
    """
    goals = fields.ToManyField(GoalResource, 'goals', full=True, related_name="concept")

    def dehydrate(self, bundle):
        bundle.data["is_partial"] = True
        return bundle

    class Meta:
        """ ConceptSegmentResource Meta"""
        queryset = Concept.objects.all()
        authorization = ConceptAuthorization()
        fields = ["title", "summary", "id", "tag", "learn_time", "goals"]


class DependencyResource(CustomSaveHookResource):
    """
    API for Dependencies
    TODO handle deleting dependencies
    """
    source = fields.ToOneField(ConceptResource, 'source')
    target = fields.ToOneField(ConceptResource, 'target')
    source_goals = fields.ManyToManyField(GoalResource, "source_goals")
    target_goals = fields.ManyToManyField(GoalResource, "target_goals")

    class Meta(BaseResource.Meta):
        """
        DependencyResource Meta
        """
        queryset = Dependency.objects.all()
        resource_name = 'dependency'
        include_resource_uri = False
        # allow patch so we can update many deps at once
        list_allowed_methods = ('get', 'post', 'patch')

    def pre_save_hook(self, bundle, **kwargs):
        """
        updates target graphs when creating new dependencies
        """
        self.isnew = not Dependency.objects.filter(id=bundle.obj.id).exists()
        # check for cycles
        tarid = bundle.obj.target.id
        tg = bundle.obj.source.tgraph_leaf
        if tg.concepts.all().filter(id=tarid).exists():
            raise CreatesCycleException("Edge creates a cycle")
        return bundle

    def post_save_hook(self, bundle, **kwargs):
        """
        updates target graphs when creating new dependencies
        """

        # TODO decide when to make a new version
        if True:
            with reversion.create_revision():
                # TODO increment version number
                reversion.set_user(bundle.request.user)
                reversion.set_comment('change "' + bundle.obj.source.title + '" dependency')
                bundle.obj.target.save()

        if self.isnew:
            otarget = bundle.obj.target
            osource = bundle.obj.source
            concepts_to_traverse = [ol.target for ol in otarget.dep_source.all()]
            os_tgraph, created = TargetGraph.objects.get_or_create(leaf=osource)
            if created:
                os_tgraph.concepts.add(osource)
            add_concepts = os_tgraph.concepts.all()
            ot_tgraph, created = TargetGraph.objects.get_or_create(leaf=otarget)
            if created:
                ot_tgraph.concepts.add(otarget)
            prev_depth = ot_tgraph.depth
            ot_tgraph.depth = max(os_tgraph.depth + 1, prev_depth)
            depth_inc = 0
            if ot_tgraph.depth > prev_depth:
                depth_inc = ot_tgraph.depth - prev_depth
                ot_tgraph.save()
            otarget.tgraph_leaf.concepts.add(*add_concepts)
            otarget.tgraph_leaf.dependencies.add(*osource.tgraph_leaf.dependencies.all())
            otarget.tgraph_leaf.dependencies.add(bundle.obj)
            add_dependencies = otarget.tgraph_leaf.dependencies.all()
            concepts_traversed = {}

            # DFS to add concept/deps to the tgraph of concepts that have the target concept as a preq
            while len(concepts_to_traverse):
                cur_con = concepts_to_traverse.pop(0)
                if cur_con.id in concepts_traversed:
                    continue
                concepts_traversed[cur_con.id] = True
                # add all concepts
                cur_con.tgraph_leaf.concepts.add(*add_concepts)
                if depth_inc:
                    cur_con.tgraph_leaf.depth
                    cur_con.tgraph_leaf.save()
                # add all deps
                cur_con.tgraph_leaf.dependencies.add(*add_dependencies)
                for ol in cur_con.dep_source.all():
                    concepts_to_traverse.append(ol.target)
        return bundle


class GraphResource(CustomSaveHookResource):
    """
    NOTE: can't commit dependencies if concepts are not already present in graph'
    """
    concepts = fields.ManyToManyField(ConceptResource, 'concepts', null=True)
    dependencies = fields.ManyToManyField(DependencyResource, 'dependencies', null=True)

    def dehydrate(self, bundle):
        """
        Dehydrate with full=true specified in the url
        """
        show_full = bundle.request.GET.get('full', "false").lower() == "true"
        # awkward hack to allow the full parameter to be specified in the url
        if show_full:
            c_old_full = self.concepts.full
            self.concepts.full = True
            bundle.data['concepts'] = self.concepts.dehydrate(bundle)
            self.concepts.full = c_old_full
            d_old_full = self.dependencies.full
            self.dependencies.full = True
            bundle.data['dependencies'] = self.dependencies.dehydrate(bundle)
            self.dependencies.full = d_old_full

        return bundle

    def alter_deserialized_detail_data(self, request, data):
        # create the graph if it does not exist and associate the user with the graph
        id_to_concept = {}
        if data["concepts"]:
            for concept in data["concepts"]:
                if type(concept) != dict:     # if it's a Bundle, this function has already been called
                    continue
                concept = normalize_concept(concept)
                id_to_concept[concept["id"]] = concept

        return data

    def post_save_hook(self, bundle):
        # FIXME we're assuming a user is logged in
        gsettings, gsnew = GraphSettings.objects.get_or_create(graph=bundle.obj)
        uprof, created = Profile.objects.get_or_create(pk=bundle.request.user.pk)

        # TODO add check that the edit actally made a difference
        gsettings.edited_by.add(uprof)
        return bundle

    class Meta(BaseResource.Meta):
        """ GraphResource Meta """
        queryset = Graph.objects.all()
        resource_name = 'graph'

# helper methods
CONCEPT_SAVE_FIELDS = ["id", "tag", "title", "summary", "goals", "exercises",
                       "software", "pointers", "is_shortcut", "dependencies", "resources", "learn_time"]


def normalize_concept(in_concept):
    """
    Temporary hack to normalize tag/id for new and old data and remove client-side fields
    """

    if not in_concept["id"] or in_concept["id"][:4] == "-new":
        useid = ''
        while not useid or not len(Concept.objects.filter(id=useid)) == 0:
            useid = ''.join([random.choice(string.lowercase + string.digits) for i in range(8)])
    elif "sid" in in_concept and len(in_concept["sid"]):
        useid = in_concept["sid"]
    else:
        useid = in_concept["id"]
    in_concept["id"] = useid

    for field in in_concept.keys():
        if field not in CONCEPT_SAVE_FIELDS:
            del in_concept[field]

    return in_concept


class TargetGraphResource(NamespacedModelResource):
    """
    GET-only resource for target graphs (graphs with a single "target" concept and all dependenies)
    NB: this is _not_ a model resource
    """
    concepts = fields.ToManyField(ConceptSegmentResource, "concepts", full=True)
    dependencies = fields.ToManyField(DependencyResource, "dependencies", full=True)

    class Meta:
        """ TargetGraphResource Meta """
        allowed_methods = ["get"]
        list_allowed_methods = []
        include_resource_uri = False
        queryset = TargetGraph.objects.all()
        resource_name = 'targetgraph'


class FullTargetGraphResource(NamespacedModelResource):
    """
    GET-only full resource for target graphs (graphs with a single "target" concept and all dependenies)
    NB: this is _not_ a model resource
    """
    concepts = fields.ToManyField(ConceptResource, "concepts", full=True)
    dependencies = fields.ToManyField(DependencyResource, "dependencies", full=True)

    class Meta:
        """ TargetGraphResource Meta """
        allowed_methods = ["get"]
        list_allowed_methods = []
        include_resource_uri = False
        queryset = TargetGraph.objects.all()
        resource_name = 'fulltargetgraph'
