import pdb

from django.db.models import CharField, BooleanField, ForeignKey, Model, SlugField, TextField, IntegerField, OneToOneField, ManyToManyField

import reversion

from apps.user_management.models import Profile

# TODO simplify the required fields
class Concept(Model):
    """
    Model that contains the concept data under version control
    """
    id = CharField(max_length=30, primary_key=True) # charfield for backwards compatability
    tag = CharField(max_length=30, unique=True, null=False) # charfield for backwards compatability
    title = CharField(max_length=100)
    summary = CharField(max_length=1000)
    goals = CharField(max_length=2000) # field type may change
    exercises = CharField(max_length=2000) # field type may change
    software = CharField(max_length=2000) # field type may change
    pointers = CharField(max_length=2000) # field type may change
    version_num = IntegerField(default=0)
    is_shortcut = BooleanField(default=False)
    is_provisional = BooleanField(default=True) # provisional = not moderated
    flags = ManyToManyField("Flag", blank=True, null=True)

class Flag(Model):
    text = CharField(max_length=30)

class Edge(Model):
    """
    Concept edge
    """
    source = ForeignKey("Concept", related_name="edge_source")
    target = ForeignKey("Concept", related_name="edge_target")
    reason = CharField(max_length=500)


class ConceptSettings(Model):
    """
    Model that contains the concept data not under version control
    """
    concept = OneToOneField(Concept, primary_key=True)
    status = CharField(max_length=100) # TODO {public, provisional, private}, maybe?
    editors = ManyToManyField(Profile, related_name="concept_editors")


class GlobalResource(Model):
    """
    Model to maintain a global set of resources -- users always enter local resources    and we extract the global set: can then use with e.g. autocomplete features
    for new concept resources
    """
    title = CharField(max_length=100)
    url = CharField(max_length=200)
    authors = CharField(max_length=200)
    year = IntegerField()
    free = BooleanField(default=False)
    signup = BooleanField(default=False)
    resource_type = CharField(max_length=100)
    edition = CharField(max_length=100)
    resource_level = CharField(max_length=100) # TODO use a set of options?
    description = CharField(max_length=500)
    note = CharField(max_length=500)
    resource_type = CharField(max_length=100)
    version_num = IntegerField(default=0)

class ConceptResource(Model):
    """
    Model to maintain concept specific resources
    NOTE: should use functions to obtain fields
     functions will query the GlobalResource if the ConceptResource does not have a value for the field
    """
    resource = ForeignKey(GlobalResource)
    location = CharField(max_length=1000)
    core = BooleanField(default=False)
    additional_prerequisites = ManyToManyField(Concept, "concept_additional_prerequisites")
    authors = CharField(max_length=200)
    year = IntegerField()
    free = BooleanField()
    signup = BooleanField()
    resource_type = CharField(max_length=100)
    edition = CharField(max_length=100)
    resource_level = CharField(max_length=100) # TODO use a set of options?
    description = CharField(max_length=500)
    note = CharField(max_length=500)
    resource_type = CharField(max_length=100)
    version_num = IntegerField(default=0)

class Graph(Model):
    """
    Model that contains graph data under version control
    """
    # TODO the concepts should save a freeze of the concept revisions
    id = CharField(max_length=30, primary_key=True)
    title = CharField(max_length=100)
    version_num = IntegerField(default=0)
    concepts = ManyToManyField(Concept, related_name="graph_concepts")


class GraphSettings(Model):
    """
    Model that contains graph data under version control. Effectively, a graph is a set of nodes, and for now, it's mostly used in the context of users creating graphs
    """
    graph = OneToOneField(Graph)
    editors = ManyToManyField(Profile, related_name="graph_editors")
