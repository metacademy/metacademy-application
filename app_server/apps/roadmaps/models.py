from django.contrib.auth.models import User
from django.db.models import CharField, ForeignKey, Model, SlugField, TextField

MAX_USERNAME_LENGTH = 30   # max length in Django's User class



class Roadmap(Model):
    user = ForeignKey(User)
    url_tag = SlugField(max_length=30)
    title = CharField(max_length=100)
    author = CharField(max_length=100)
    audience = CharField(max_length=100)
    body = TextField()

    VIS_PRIVATE = 'PRIVATE'
    VIS_PUBLIC = 'PUBLIC'
    VIS_MAIN = 'PUB_MAIN'
    VISIBILITY_CHOICES = [(VIS_PRIVATE, 'Private'),
                          (VIS_PUBLIC, 'Public'),
                          (VIS_MAIN, 'Public, listed in main page'),
                          ]
    visibility = CharField(max_length=20, choices=VISIBILITY_CHOICES)

    class Meta:
        unique_together = ('user', 'url_tag')

    def is_public(self):
        return self.visibility in [self.VIS_PUBLIC, self.VIS_MAIN]

    def visible_to(self, user):
        return self.is_public() or self.user.username == user.username

    def editable_by(self, user):
        return self.user.username == user.username

    
    
def load_roadmap(username, roadmap_name, request_user):
    try:
        return Roadmap.objects.get(user__name__exact=username, url_tag__exact=roadmap_name)
    except Roadmap.DoesNotExist:
        return None




