import pdb

import reversion
import django.db.models as dbmodels
from django.db.models import CharField, BooleanField, ForeignKey, Model, SlugField, TextField, IntegerField, OneToOneField, ManyToManyField

from apps.user_management.models import Profile


MAX_USERNAME_LENGTH = 30   # max length in Django's User class

class Roadmap(Model):
    """
    Model that contains the roadmap content
    """
    title = CharField('Title', max_length=100)
    author = CharField('Author(s)', max_length=100)
    audience = CharField('Target audience', max_length=100)
    blurb = TextField('Blurb', blank=True)
    body = TextField()
    version_num = IntegerField(default=0)

    def is_listed_in_main_str(self):
        ret_str = "False"
        if hasattr(self, "roadmapsettings") and self.roadmapsettings.is_listed_in_main():
            ret_str = "True"
        return ret_str

    def is_published_str(self):
        ret_str = "False"
        if hasattr(self, "roadmapsettings") and self.roadmapsettings.is_published():
            ret_str = "True"
        return ret_str

# maintain version control for the roadmap
reversion.register(Roadmap)


class RoadmapSettings(Model):
    """
    Model that contains the roadmap settings
    """
    roadmap = OneToOneField(Roadmap, primary_key=True)
    creator = ForeignKey(Profile, related_name="roadmap_creator") # TODO should this be a part of RoadmapSettings?
    owners = ManyToManyField(Profile, related_name="roadmap_owners")
    editors = ManyToManyField(Profile, related_name="roadmap_editors")
    listed_in_main = BooleanField('show this roadmap in the search results', default=False)
    anyone_can_edit = BooleanField('anyone can edit this roadmap', default=False)
    sudo_listed_in_main = BooleanField('superuser only: allow this roadmap in the search results', default=True)
    published = BooleanField(default=False)
    url_tag = SlugField('URL tag', max_length=30, help_text='only letters, numbers, underscores, hyphens')

    class Meta:
        unique_together = ('creator', 'url_tag')

    def get_absolute_url(self):
        return '/roadmaps/%s/%s' % (self.creator.user.username, self.url_tag)

    def is_published(self):
        return self.published

    def is_listed_in_main(self):
        return self.is_published() and self.listed_in_main and self.sudo_listed_in_main

    def can_change_settings(self, user):
        # superusers and owners can change settings
        return user.is_superuser or (user.is_authenticated() and self.owners.filter(user=user).exists())

    def editable_by(self, user):
        # superusers, owners and editors can edit
        return user.is_superuser or (user.is_authenticated() and (self.anyone_can_edit or self.owners.filter(user=user).exists() or self.editors.filter(user=user).exists()))

    def viewable_by(self, user):
        return self.is_published() or self.editable_by(user)

def reindex_roadmap(sender, **kwargs):
    # placed here to avoid circular imports
    from search_indexes import RoadmapIndex
    RoadmapIndex().update_object(kwargs['instance'].roadmap)
dbmodels.signals.post_save.connect(reindex_roadmap, sender=RoadmapSettings)

def load_roadmap_settings(username, tag):
    try:
        return RoadmapSettings.objects.get(creator__user__username__exact=username, url_tag__exact=tag)
    except Roadmap.DoesNotExist:
        return None
