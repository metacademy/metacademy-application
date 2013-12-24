from django.contrib.auth.models import User
from django.db.models import CharField, BooleanField, ForeignKey, Model, SlugField, TextField, IntegerField, OneToOneField, ManyToManyField

import reversion

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

# maintain version control for the roadmap
reversion.register(Roadmap)

class RoadmapSettings(Model):
    """
    Model that contains the roadmap settings
    """
    roadmap = OneToOneField(Roadmap, primary_key=True)
    creator = ForeignKey(User) # TODO should this be a part of RoadmapSettings?
    owners = ManyToManyField(User, related_name="roadmap_owners")
    editors = ManyToManyField(User, related_name="roadmap_editors")
    listed_in_main = BooleanField('show this roadmap in the search results', default=False)
    url_tag = SlugField('URL tag', max_length=30, help_text='only letters, numbers, underscores, hyphens')

    class Meta:
        unique_together = ('creator', 'url_tag')

    def get_absolute_url(self):
        return '/roadmaps/%s/%s' % (self.creator.username, self.url_tag)

    def is_public(self):
        return self.listed_in_main # self.visibility in [self.VIS_PUBLIC, self.VIS_MAIN]

    def visible_to(self, user):
        return self.is_public() or (user.is_authenticated() and self.user.username == user.username) # TODO FIXME chould check if creator, owner, or editor

    def editable_by(self, user):
        return user.is_authenticated() and self.creator.username == user.username
        # TODO FIXME chould check if creator, owner, or editor

def load_roadmap_settings(username, tag):
    try:
        return RoadmapSettings.objects.get(creator__username__exact=username, url_tag__exact=tag)
    except Roadmap.DoesNotExist:
        return None
