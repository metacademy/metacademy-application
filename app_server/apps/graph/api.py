import pdb
import string
import random
import ast

# myapp/api.py
from tastypie import fields
from tastypie.resources import ModelResource, Resource
from tastypie.authorization import DjangoAuthorization
from tastypie.exceptions import Unauthorized, NotFound, ImmediateHttpResponse
from django.core.exceptions import ObjectDoesNotExist

from apps.graph.models import Concept, Dependency, Flag, Graph, GraphSettings, ConceptSettings, ResourceLocation, GlobalResource, Goal
# avoid name collision
from apps.graph.models import ConceptResource as CResource
from apps.user_management.models import Profile

# global TODOs
# hydrate should prepare bundle.obj, not bundle.data (probably the reason hydrate is called so many times)


def get_api_object(ObjRes, request, oid):
    """
    helper function
    get resource object from the tastypie api
    """
    ob_res = ObjRes()
    robj = ob_res.obj_get(ob_res.build_bundle(request=request), id=oid)
    ores_bundle = ob_res.build_bundle(obj=robj, request=request)
    return ob_res.serialize(request, ob_res.full_dehydrate(ores_bundle), "application/json")


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

        # for obj in object_list:
        #     if not obj.editable_by(bundle.request.user):
        #         raise Unauthorized('not authorized to edit concept')

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

        try:
            return bundle.obj.editable_by(bundle.request.user)
        except:
            return True

        #return bundle.obj.editable_by(bundle.request.user)

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


class CustomReversionResource(ModelResource):
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

        self.pre_save_hook(bundle)

        # Save FKs just in case.
        self.save_related(bundle)

        # Save the main object. # CJR TODO we can somehow check if we should save here (are we calling from an edge?)
        try:
            bundle.obj.save()
        except Exception, e:
            pdb.set_trace()
        bundle.objects_saved.add(self.create_identifier(bundle.obj))

        # Now pick up the M2M bits. (must occur after the main obj)
        m2m_bundle = self.hydrate_m2m(bundle)
        ## try:
        ##     m2m_bundle = self.hydrate_m2m(bundle)
        ## except Exception, e:
        ##     pdb.set_trace()

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
        return super(ModelResource, self).obj_create(bundle, **kwargs)

    def obj_update(self, bundle, **kwargs):
        return super(ModelResource, self).obj_update(bundle, **kwargs)

    def obj_get(self, bundle, **kwargs):
        return super(ModelResource, self).obj_get(bundle, **kwargs)


class GoalResource(CustomReversionResource):
    """
    """
    concept = fields.ToOneField("apps.graph.api.ConceptResource", "concept")

    class Meta:
        """ GoalResource Meta"""
        max_limit = 0
        queryset = Goal.objects.all()
        resource_name = 'goal'
        authorization = ModAndUserObjectsOnlyAuthorization()
        allowed_methods = ("get", "post", "put", "delete", "patch")
        always_return_data = True


class FlagResource(CustomReversionResource):

    class Meta:
        max_limit = 0
        fields = ("text",)
        include_resource_uri = False
        queryset = Flag.objects.all()
        resource_name = 'flag'
        authorization = ModAndUserObjectsOnlyAuthorization()


class ResourceLocationResource(CustomReversionResource):
    cresource = fields.ForeignKey("apps.graph.api.ConceptResourceResource", "cresource")

    class Meta:
        max_limit = 0
        authorization = ModAndUserObjectsOnlyAuthorization()
        queryset = ResourceLocation.objects.all()
        resource_name = 'resourcelocation'
        always_return_data = True

    def dehydrate(self, bundle, **kwargs):
        del bundle.data["cresource"]
        return bundle


class GlobalResourceResource(CustomReversionResource):
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

    class Meta:
        max_limit = 0
        queryset = GlobalResource.objects.all()
        resource_name = 'globalresource'
        authorization = ModAndUserObjectsOnlyAuthorization()
        always_return_data = True


class ConceptResourceResource(CustomReversionResource):
    concept = fields.ToOneField("apps.graph.api.ConceptResource", "concept")
    locations = fields.ToManyField(ResourceLocationResource, 'locations', full=True, related_name="cresource")
    global_resource = fields.ForeignKey(GlobalResourceResource, "global_resource", full=True)

    class Meta:
        max_limit = 0
        queryset = CResource.objects.all()
        resource_name = 'conceptresource'
        authorization = ModAndUserObjectsOnlyAuthorization()
        always_return_data = True

    def dehydrate(self, bundle):
        # TODO why is this called > 1 times? and why doesn't this flag stop it?
        if not hasattr(self, "was_dehydrated"):
            self.was_dehydrated = True
        elif self.was_dehydrated:
            return bundle

        # bundle.data['location'] = json.loads(bundle.data['location'])
        adeps = bundle.data["additional_dependencies"]

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

        if "concept" in resource:
            del resource["concept"]

        # create new id if necessary
        if not resource["id"]:
            useid = ''
            while not useid or not len(CResource.objects.filter(id=useid)) == 0:
                useid = ''.join([random.choice(string.lowercase + string.digits) for i in range(12)])
            resource["id"] = useid

        # FIXME this shouldn't exist here, or at least, it should check
        # that the id doesn't exist (for that 1 in 4.7x10^18 chance)
        if not "id" in resource:
            resource["id"] = ''.join([random.choice(string.lowercase + string.digits) for i in range(8)])

        adeps_type = type(resource["additional_dependencies"])
        if adeps_type == str:
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


class ConceptResource(CustomReversionResource):
    """
    API for concepts, aka nodes
    """
    resources = fields.ToManyField(ConceptResourceResource, 'concept_resource', full=True, related_name="concept")
    flags = fields.ManyToManyField(FlagResource, 'flags', full=True)
    goals = fields.ToManyField(GoalResource, 'goals', full=True, related_name="concept")

    def post_save_hook(self, bundle):
        csettings, csnew = ConceptSettings.objects.get_or_create(concept=bundle.obj)
        uprof, created = Profile.objects.get_or_create(pk=bundle.request.user.pk)
        csettings.editors.add(uprof)
        csettings.save()
        return bundle

    class Meta:
        """ ConceptResource Meta"""
        max_limit = 0
        queryset = Concept.objects.all()
        resource_name = 'concept'
        authorization = ConceptAuthorization()
        allowed_methods = ("get", "post", "put", "delete", "patch")
        always_return_data = True

    def alter_deserialized_list_data(self, request, data):
        for concept in data["objects"]:
            normalize_concept(concept)
        return data

    def alter_deserialized_detail_data(self, request, data):
        normalize_concept(data)
        return data

    def hydrate_flags(self, bundle):
        in_concept = bundle.data
        if in_concept.get("flags") and type(in_concept.get("flags")[0]) == unicode:
            flag_arr = []
            for flag in in_concept["flags"]:
                flag_arr.append({"text": flag})
            in_concept["flags"] = flag_arr
        return bundle


class DependencyResource(CustomReversionResource):
    """
    API for Dependencies
    """
    source = fields.ToOneField(ConceptResource, 'source')
    target = fields.ToOneField(ConceptResource, 'target')
    source_goals = fields.ManyToManyField(GoalResource, "source_goals")
    target_goals = fields.ManyToManyField(GoalResource, "target_goals")

    class Meta:
        max_limit = 0
        queryset = Dependency.objects.all()
        resource_name = 'dependency'
        authorization = ModAndUserObjectsOnlyAuthorization()
        allowed_methods = ("get", "post", "put", "delete", "patch")
        always_return_data = True,
        include_resource_uri = False

    ## def hydrate(self, bundle):
    ##     import config
    ##     #if hasattr(config, 'TCLSA'):
    ##     #    pdb.set_trace()
    ##     return bundle


class GraphResource(CustomReversionResource):
    """
    NOTE: can't commit dependencies if concepts are not already present in graph'
    """
    concepts = fields.ManyToManyField(ConceptResource, 'concepts', full=True, null=True)
    dependencies = fields.ManyToManyField(DependencyResource, 'dependencies', full=True, null=True)

    def alter_deserialized_detail_data(self, request, data):
        # create the graph if it does not exist and associate the user with the graph
        id_to_concept = {}
        if data["concepts"]:
            for concept in data["concepts"]:
                if type(concept) != dict:     # if it's a Bundle, this function has already been called
                    continue
                normalize_concept(concept)
                id_to_concept[concept["id"]] = concept

        return data

    def dehydrate(self, bundle, **kwargs):
        return bundle

    def post_save_hook(self, bundle):
        # FIXME we're assuming a user is logged in
        gsettings, gsnew = GraphSettings.objects.get_or_create(graph=bundle.obj)
        uprof, created = Profile.objects.get_or_create(pk=bundle.request.user.pk)

        # TODO add check that the edit actally made a difference
        gsettings.editors.add(uprof)
        gsettings.save()
        return bundle

    class Meta:
        """ GraphResource Meta """
        allowed_methods = ("get", "post", "put", "delete", "patch")
        max_limit = 0
        include_resource_uri = False
        queryset = Graph.objects.all()
        resource_name = 'graph'
        authorization = ModAndUserObjectsOnlyAuthorization()

# helper methods
CONCEPT_SAVE_FIELDS = ["id", "tag", "title", "summary", "goals", "exercises",
                       "software", "pointers", "is_shortcut", "flags", "dependencies", "resources"]


def normalize_concept(in_concept):
    """
    Temporary hack to normalize tag/id for new and old data and remove client-side fields
    """
    if type(in_concept) != dict:
        return

    if 'id' not in in_concept:
        pdb.set_trace()

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


class TargetGraphResource(Resource):
    """
    GET-only resource for target graphs (graphs with a single "target" concept and all dependenies)
    NB: this is _not_ a model resource
    """
    # concepts = fields.ToManyField(ConceptResource, "concept", full=True)
    # dependencies = fields.ToManyField(DependencyResource, "dependency", full=True)

    class Meta:
        allowed_methods = ["get"]
        list_allowed_methods = []

    def obj_get(self, bundle, **kwargs):
        id_or_tag = kwargs.get("pk")
        leaf = None

        try:
            try:
                leaf = Concept.objects.get(id=id_or_tag)
            except ObjectDoesNotExist:
                leaf = Concept.objects.get(tag=id_or_tag)
        except ObjectDoesNotExist:
            raise NotFound("could not find concept with id or tag: " + id_or_tag)

        concepts = []
        dependencies = []

        concepts_to_add = [leaf]
        concepts_added = {}

        while len(concepts_to_add):
            cur_con = concepts_to_add.pop(0)
            if cur_con.id in concepts_added:
                continue
            concepts.append(get_api_object(ConceptResource, bundle.request, cur_con.id))
            concepts_added[cur_con.id] = True
            for dep in cur_con.dep_target.all():
                dependencies.append(get_api_object(DependencyResource, bundle.request, dep.id))
                src = dep.source
                concepts_to_add.append(src)
        bundle.data = {"concepts": concepts, "dependencies": dependencies}

        return bundle.data

    def full_dehydrate(self, bundle):
        """
        prepare the TargetGraph data
        """
        bundle.data = bundle.obj
        return bundle
