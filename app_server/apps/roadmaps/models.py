from django.contrib.auth.models import User
from django.db.models import CharField, BooleanField, ForeignKey, Model, SlugField, TextField, IntegerField

import reversion

MAX_USERNAME_LENGTH = 30   # max length in Django's User class


class Roadmap(Model):
    user = ForeignKey(User)
    url_tag = SlugField('URL tag', max_length=30, help_text='only letters, numbers, underscores, hyphens')
    title = CharField('Title', max_length=100)
    author = CharField('Author(s)', max_length=100)
    audience = CharField('Target audience', max_length=100)
    blurb = TextField('Blurb', blank=True)
    body = TextField()
    version_num = IntegerField(default=0)
    listed_in_main = BooleanField(default=False);
    class Meta:
        unique_together = ('user', 'url_tag')

    def get_absolute_url(self):
        return '/roadmaps/%s/%s' % (self.user.username, self.url_tag)

    def is_public(self):
        return self.listed_in_main # self.visibility in [self.VIS_PUBLIC, self.VIS_MAIN]

    def listed_in_main(self):
        return self.listed_in_main #visibility == self.VIS_MAIN

    def visible_to(self, user):
        return self.is_public() or (user.is_authenticated() and self.user.username == user.username)

    def editable_by(self, user):
        return user.is_authenticated() and self.user.username == user.username
# use version control with roadmaps
reversion.register(Roadmap)


def load_roadmap(username, roadmap_name):
    try:
        return Roadmap.objects.get(user__username__exact=username, url_tag__exact=roadmap_name)
    except Roadmap.DoesNotExist:
        return None
