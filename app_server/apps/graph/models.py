import pdb

from django.db.models import CharField, BooleanField, ForeignKey, Model, SlugField, TextField, IntegerField, OneToOneField, ManyToManyField

import reversion

from apps.user_management.models import Profile

# TODO simplify the required fields
class Concept(Model):
    """
    Model that contains the concept data under version control
    """
    id = CharField(max_length=12, primary_key=True) # charfield for backwards compatability
    tag = CharField(max_length=30, unique=True, null=False) # charfield for backwards compatability with text system
    title = CharField(max_length=100)
    summary = CharField(max_length=1000, null=True, blank=True)
    goals = CharField(max_length=2000, null=True, blank=True) # field type may change
    exercises = CharField(max_length=2000,  null=True, blank=True) # field type may change
    software = CharField(max_length=2000, null=True, blank=True) # field type may change
    pointers = CharField(max_length=2000, null=True, blank=True) # field type may change
    version_num = IntegerField(default=0, null=True, blank=True)
    flags = ManyToManyField("Flag", blank=True, null=True)
    is_shortcut = BooleanField(default=False)

    def is_provisional(self):
        # "approved" concepts get their very own tag
        return self.tag == self.id

    def editable_by(self, user):
        return user.is_superuser or (user.is_authenticated() and (self.is_provisional() or self.conceptsettings.is_editor(user)))


class Flag(Model):
    text = CharField(max_length=100)

class Edge(Model):
    """
    Concept edge
    """
    id = CharField(max_length=30, primary_key=True)
    # use charfield because foreignkey causes race conditions with tastypie api
    source = CharField(max_length=12)
    target = CharField(max_length=12)
    reason = CharField(max_length=500)

    def editable_by(self, user):
        # TODO figure out non-provisional authentication scheme
        return user.is_authenticated()

    class Meta:
        unique_together = (("source", "target"),)

class ConceptSettings(Model):
    """
    Model that contains the concept data not under version control
    """
    concept = OneToOneField(Concept, primary_key=True)
    status = CharField(max_length=100) # TODO {public, provisional, private}, maybe?
    editors = ManyToManyField(Profile, related_name="concept_editors")

    def is_editor(self, user):
        return self.editors.filter(user=user).exists()

    def get_absolute_url(self):
        return "http://www.example.com"

class ConceptResource(Model):
    """
    Model to maintain concept specific resources
    NOTE: should use functions to obtain fields
    """
    id = CharField(max_length=12, primary_key=True)
    title = CharField(max_length=100)
    url = CharField(max_length=200)
    concept = ForeignKey(Concept, related_name="concept_resource")
    location = CharField(max_length=1000)
    core = BooleanField(default=False)
    additional_dependencies = CharField(max_length=200, null=True, blank=True)
    authors = CharField(max_length=200, null=True, blank=True)
    year = IntegerField(null=True, blank=True)
    edition_years = CharField(max_length=100, null=True, blank=True)
    specific_url_base = CharField(max_length=100, null=True, blank=True)
    free = BooleanField(default=False)
    requires_signup = BooleanField(default=False)
    resource_type = CharField(max_length=100, null=True, blank=True)
    edition = CharField(max_length=100, null=True, blank=True)
    level = CharField(max_length=100, null=True, blank=True) # TODO use a set of options
    description = CharField(max_length=500, null=True, blank=True)
    extra = CharField(max_length=500, null=True, blank=True)
    note = CharField(max_length=500, null=True, blank=True)
    resource_type = CharField(max_length=100, null=True, blank=True)
    version_num = IntegerField(default=0, null=True, blank=True)

class Graph(Model):
    """
    Model that contains graph data under version control
    """
    # TODO the concepts should save a freeze of the concept revisions
    id = CharField(max_length=12, primary_key=True)
    title = CharField(max_length=100)
    concepts = ManyToManyField(Concept, related_name="graph_concepts")

    def editable_by(self, user):
        return user.is_authenticated()


class GraphSettings(Model):
    """
    Model that contains graph data under version control. Effectively, a graph is a set of nodes, and for now, it's mostly used in the context of users creating graphs
    """
    graph = OneToOneField(Graph)
    editors = ManyToManyField(Profile, related_name="graph_editors")

    def get_absolute_url(self):
        return "/graphs/%s" % self.graph.id
