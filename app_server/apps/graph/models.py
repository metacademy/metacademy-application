import pdb

import reversion
from django.db.models import CharField, BooleanField, ForeignKey,\
    Model, IntegerField, OneToOneField, ManyToManyField, FloatField

from apps.user_management.models import Profile


class LoggedInEditable:
    def editable_by(self, user):
        return user.is_authenticated()


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

    def is_provisional(self):
        # "approved" concepts get their very own tag
        return self.tag == self.id

    def editable_by(self, user):
        return user.is_superuser or (user.is_authenticated()
                                     and (self.is_provisional() or (hasattr(self, "conceptsettings")
                                                                    and self.conceptsettings.is_editor(user))))

# maintain version control for the concept
reversion.register(Concept, follow=["goals", "dep_target", "concept_resource"])


class Goal(Model, LoggedInEditable):
    id = CharField(max_length=16, primary_key=True)
    concept = ForeignKey(Concept, related_name="goals")
    text = CharField(max_length=500)

# maintain version control for the goal but only access thru the concept
reversion.register(Goal)


class Dependency(Model, LoggedInEditable):
    """
    Concept edge
    """
    id = CharField(max_length=32, primary_key=True)
    source = ForeignKey(Concept, related_name="dep_source")
    target = ForeignKey(Concept, related_name="dep_target")
    reason = CharField(max_length=500)
    source_goals = ManyToManyField(Goal, related_name="source_goals")
    target_goals = ManyToManyField(Goal, related_name="target_goals")

    def editable_by(self, user):
        return user.is_superuser or self.target.is_provisional()

# maintain version control for the goal but only access thru the target concept
reversion.register(Dependency)


class ConceptSettings(Model, LoggedInEditable):
    """
    Model that contains the concept data not under version control
    """
    concept = OneToOneField(Concept, primary_key=True)
    # TODO {public, provisional, private}, maybe?
    status = CharField(max_length=100)
    editors = ManyToManyField(Profile, related_name="concept_editors")

    def is_editor(self, user):
        return self.editors.filter(user=user).exists()

    def get_absolute_url(self):
        return "http://www.example.com"


class GlobalResource(Model, LoggedInEditable):
    """
    Model to maintain resources used across concepts
    """
    id = CharField(max_length=16, primary_key=True)
    # fields specific to GlobalResource
    title = CharField(max_length=100)
    authors = CharField(max_length=200, null=True, blank=True)
    resource_type = CharField(max_length=100)
    year = IntegerField(null=True, blank=True)
    edition_years = CharField(max_length=100, null=True, blank=True)
    description = CharField(max_length=100)
    notes = CharField(max_length=200)
    version_num = IntegerField(default=0, null=True, blank=True)

    # fields that can be overwritten/used by ConceptResource
    access = CharField(max_length=4, choices=(("free", "free"), ("reg", "free but requires registration"), ("paid", "costs money")))

    # fields that can be overwritten/used by the ResourceLocation
    url = CharField(max_length=200)
reversion.register(GlobalResource)


class ConceptResource(Model, LoggedInEditable):
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

    # overrides GlobalResource field
    access = CharField(max_length=4, choices=(("free", "free"), ("reg", "free but requires registration"), ("paid", "costs money")))

    # concats GlobalResource field ?
    notes = CharField(max_length=500, null=True, blank=True)

# maintain version control for the concept
reversion.register(ConceptResource, follow=["locations"])


class ResourceLocation(Model, LoggedInEditable):
    """
    Specifies the location of the resources
    """
    id = CharField(max_length=16, primary_key=True)
    cresource = ForeignKey(ConceptResource, related_name='locations')
    url = CharField(max_length=100, null=True, blank=True)
    location_type = CharField(max_length=30)
    location_text = CharField(max_length=100, null=True, blank=True)
    version_num = IntegerField(default=0, null=True, blank=True)
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


class GraphSettings(Model, LoggedInEditable):
    """
    Model that contains graph data under version control.
    Effectively, a graph is a set of nodes, and for now, it's mostly used in the context of users creating graphs
    """
    graph = OneToOneField(Graph)
    editors = ManyToManyField(Profile, related_name="graph_editors")

    def get_absolute_url(self):
        return "/graphs/%s" % self.graph.id


class TargetGraph(Model, LoggedInEditable):
    """
    Model that contains target graph concept and dependency references
    """
    leaf = OneToOneField(Concept, primary_key=True, related_name="tgraph_leaf")
    concepts = ManyToManyField(Concept, related_name="target_graphs")
    dependencies = ManyToManyField(Dependency, related_name="targetgraph_dependencies")
