import ipdb

from datetime import datetime
import django.db.models as dbmodels
from django.db.models.signals import pre_delete, post_save
from django.dispatch import receiver
import reversion
from django.db.models import CharField, BooleanField, ForeignKey,\
    Model, IntegerField, OneToOneField, ManyToManyField, FloatField, DateTimeField
from django.core.urlresolvers import reverse
from haystack.exceptions import SearchBackendError

from apps.user_management.models import Profile


class LoggedInEditable:
    def editable_by(self, user):
        return user.is_authenticated()


class Tag(Model):
    id = CharField(max_length=30, primary_key=True)
    title = CharField(max_length=100)

    def __unicode__(self):
        return self.title

    def sorted_concepts(self):
        concepts = self.concepts.extra(select={'lower_title': 'lower(title)'}).order_by("lower_title").all()
        return filter(Concept.is_listed_in_main, concepts)

    def sorted_roadmaps(self):
        roadmaps = self.roadmaps.filter(roadmapsettings__doc_type='Roadmap').extra(select={'lower_title': 'lower(title)'}) \
                   .order_by("lower_title").all()
        return filter(lambda r: r.is_listed_in_main(), roadmaps)

    def sorted_course_guides(self):
        roadmaps = self.roadmaps.filter(roadmapsettings__doc_type='Course Guide').extra(select={'lower_title': 'lower(title)'}) \
                   .order_by("lower_title").all()
        return filter(lambda r: r.is_listed_in_main(), roadmaps)
    
class Concept(Model):
    """
    Model that contains the concept data under version control
    TODO simplify the required fields
    """
    # charfield for backwards compatability
    id = CharField(max_length=16, primary_key=True)
    # charfield for backwards compatability with text system
    tag = CharField(max_length=30, unique=True, null=False)
    title = CharField(max_length=100)
    summary = CharField(max_length=1000, null=True, blank=True)
    exercises = CharField(max_length=2000, null=True, blank=True)
    software = CharField(max_length=2000, null=True, blank=True)
    pointers = CharField(max_length=2000, null=True, blank=True)
    version_num = IntegerField(default=0, null=True, blank=True)
    is_shortcut = BooleanField(default=False)
    learn_time = FloatField(null=True, blank=True)
    last_mod = DateTimeField(auto_now=True, default=datetime.now)
    tags = ManyToManyField(Tag, related_name="concepts")


    def __unicode__(self):
        return self.title

    def is_listed_in_main(self):
        return not self.is_provisional() and len(self.title) > 0

    def is_listed_in_main_str(self):
        if self.is_listed_in_main():
            return 'True'
        else:
            return 'False'

    def get_edit_usernames(self):
        return [usr for usr in self.conceptsettings.edited_by.all()]

    def get_concept_graph_ids(self):
        return [gc.id for gc in self.graph_concepts.all()]

    def is_provisional(self):
        # "approved" concepts get their very own tag
        return self.tag == self.id

    def editable_by(self, user):
        return user.is_superuser or (user.is_authenticated()
                                     and (self.is_provisional() or (hasattr(self, "conceptsettings")
                                                                    and self.conceptsettings.is_editor(user))))

    def is_finished(self):
        return len(self.summary) > 0 and \
               self.concept_resource.count() > 0

# maintain version control for the concept
reversion.register(Concept, follow=["goals", "dep_target", "concept_resource"])


@receiver(pre_delete, sender=Concept)
def pre_concept_delete(sender, **kwargs):
    # find all target graphs that include the given concept and recompute without traversing the given concept
    # recompute target graphs

    dcon = kwargs['instance']
    inlinks = dcon.dep_target.all()
    for ilink in inlinks:
        ilink.delete()
    outlinks = dcon.dep_source.all()
    for olink in outlinks:
        olink.delete()

class Goal(Model):
    id = CharField(max_length=16, primary_key=True)
    concept = ForeignKey(Concept, related_name="goals")
    text = CharField(max_length=500)
    ordering = IntegerField(default=-1)
    last_mod = DateTimeField(auto_now=True, default=datetime.now)

    def editable_by(self, user):
        return self.concept.editable_by(user)

# maintain version control for the goal but only access thru the concept
reversion.register(Goal)
@receiver(post_save, sender=Goal)
def post_goal_save(sender, **kwargs):
    if kwargs.get("created"):
        # add the new goal to all of the outlinks of the dependency
        goal = kwargs['instance']
        outlinks = goal.concept.dep_source.all()
        for olink in outlinks:
            olink.source_goals.add(goal)
            olink.save()


class Dependency(Model):
    """
    Concept edge
    """
    id = CharField(max_length=32, primary_key=True)
    source = ForeignKey(Concept, related_name="dep_source")
    target = ForeignKey(Concept, related_name="dep_target")
    reason = CharField(max_length=500)
    source_goals = ManyToManyField(Goal, related_name="source_goals")
    target_goals = ManyToManyField(Goal, related_name="target_goals")
    ordering = IntegerField(default=-1)
    last_mod = DateTimeField(auto_now=True, default=datetime.now)

    def editable_by(self, user):
        return user.is_superuser or self.target.editable_by(user)

# maintain version control for the goal but only access thru the target concept
reversion.register(Dependency)


# pre-delete: update all necessary target graphs
@receiver(pre_delete, sender=Dependency)
def pre_dep_delete(sender, **kwargs):

    ddep = kwargs['instance']
    tgraphs = ddep.targetgraph_dependencies.all()
    ddep_id = ddep.id

    for tg in tgraphs:
        # reset the tg
        tg.concepts.clear()
        tg.dependencies.clear()

        to_traverse = [tg.leaf]
        added = {}
        while len(to_traverse):
            curnode = to_traverse.pop()
            tg.concepts.add(curnode)
            deps = curnode.dep_target.all()
            for dep in deps:
                if dep.id != ddep_id:
                    tg.dependencies.add(dep)
                    srcid = dep.source.id
                    if not added.get(srcid):
                        to_traverse.append(dep.source)
                        added[srcid] = True
        tg.save()


class ConceptSettings(Model, LoggedInEditable):
    """
    Model that contains the concept data not under version control
    """
    concept = OneToOneField(Concept, primary_key=True)
    status = CharField(max_length=100)
    edited_by = ManyToManyField(Profile, related_name="edited_concept")

    def is_editor(self, user):
        return self.edited_by.filter(user=user).exists()

    def get_absolute_url(self):
        return reverse("graphs:concepts", args=(self.concept.tag,))


def reindex_concept(sender, **kwargs):
    # placed here to avoid circular imports
    from search_indexes import ConceptIndex
    try:
        ConceptIndex().update_object(kwargs['instance'].concept)
    except SearchBackendError:
        pass
dbmodels.signals.post_save.connect(reindex_concept, sender=ConceptSettings)


class GlobalResource(Model):
    """
    Model to maintain resources used across concepts
    """
    id = CharField(max_length=16, primary_key=True)
    # fields specific to GlobalResource
    title = CharField(max_length=100)
    authors = CharField(max_length=200, default='')
    resource_type = CharField(max_length=100)
    year = IntegerField(null=True, blank=True)
    edition_years = CharField(max_length=100, null=True, blank=True)
    description = CharField(max_length=100)
    notes = CharField(max_length=200)
    version_num = IntegerField(default=0, null=True, blank=True)
    last_mod = DateTimeField(auto_now=True, default=datetime.now)

    # fields that can be overwritten/used by ConceptResource
    access = CharField(max_length=4, choices=(("free", "free"), ("reg", "free but requires registration"), ("paid", "costs money")))

    # fields that can be overwritten/used by the ResourceLocation
    url = CharField(max_length=200)

    def editable_by(self, user):
        """
        global resource is editable if all of its concept resources are editable
        """
        return all([cr.editable_by(user) for cr in self.cresources.all()])

reversion.register(GlobalResource)


class ConceptResource(Model):
    """
    Model to maintain concept specific resources
    NOTE: should use functions to obtain fields
    """
    # ConceptResource specific
    global_resource = ForeignKey(GlobalResource, related_name="cresources")
    id = CharField(max_length=16, primary_key=True)
    concept = ForeignKey(Concept, related_name="concept_resource")
    goals_covered = ManyToManyField(Goal, related_name="goals_covered", null=True, blank=True)
    core = BooleanField(default=False)
    additional_dependencies = CharField(max_length=300, null=True, blank=True)
    edition = CharField(max_length=100, null=True, blank=True)
    version_num = IntegerField(default=0, null=True, blank=True)
    ordering = IntegerField(default=-1)
    last_mod = DateTimeField(auto_now=True, default=datetime.now)

    # concats GlobalResource field ?
    notes = CharField(max_length=500, null=True, blank=True)

    def editable_by(self, user):
        return self.concept.editable_by(user)

    def is_core(self):
        return self.core or self.goals_covered.count() == self.concept.goals.count()


# maintain version control for the concept
reversion.register(ConceptResource, follow=["locations"])


class ResourceLocation(Model):
    """
    Specifies the location of the resources
    """
    id = CharField(max_length=16, primary_key=True)
    cresource = ForeignKey(ConceptResource, related_name='locations')
    url = CharField(max_length=100, null=True, blank=True)
    location_type = CharField(max_length=30)
    location_text = CharField(max_length=100, null=True, blank=True)
    version_num = IntegerField(default=0, null=True, blank=True)
    ordering = IntegerField(default=-1)
    last_mod = DateTimeField(auto_now=True, default=datetime.now)

    def editable_by(self, user):
        return self.cresource.editable_by(user)

# maintain vc for resource location
reversion.register(ResourceLocation)


class Graph(Model, LoggedInEditable):
    """
    Model that contains graph data under version control
    """
    # TODO the concepts should save a freeze of the concept revisions
    id = CharField(max_length=16, primary_key=True)
    title = CharField(max_length=100)
    concepts = ManyToManyField(Concept, related_name="graph_concepts")
    dependencies = ManyToManyField(Dependency, related_name="graph_dependencies")
    last_mod = DateTimeField(auto_now=True, default=datetime.now)


class GraphSettings(Model, LoggedInEditable):
    """
    Model that contains graph data under version control.
    Effectively, a graph is a set of nodes, and for now, it's mostly used in the context of users creating graphs
    """
    graph = OneToOneField(Graph)
    edited_by = ManyToManyField(Profile, related_name="edited_graph")

    def get_absolute_url(self):
        return reverse("graphs:existing-edit", args=(self.graph.id,))


class TargetGraph(Model, LoggedInEditable):
    """
    Model that contains target graph concept and dependency references
    """
    leaf = OneToOneField(Concept, primary_key=True, related_name="tgraph_leaf")
    depth = IntegerField(default=0)
    concepts = ManyToManyField(Concept, related_name="target_graphs")
    dependencies = ManyToManyField(Dependency, related_name="targetgraph_dependencies")
