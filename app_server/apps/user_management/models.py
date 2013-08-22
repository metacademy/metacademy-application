from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    """
    This is a skeleton user profile model with a one-to-one relationship
    with users from the auth model
    """
    user = models.OneToOneField(User, primary_key=True)
    
    def __unicode__(self):
        return self.user.username

class LearnedConcept(models.Model):
    """
    Simple class to maintain learned concepts
    """
    id = models.CharField(max_length=10, unique=True, primary_key=True)
    uprofiles = models.ManyToManyField(Profile)
    
