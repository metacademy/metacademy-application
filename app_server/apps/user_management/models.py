from django.db import models
from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from captcha.fields import CaptchaField
from apps.cserver_comm.cserver_communicator import get_id_to_concept_dict

class UserCreateForm(UserCreationForm):
    email = forms.EmailField(required=True)
    captcha = CaptchaField()

    class Meta:
        model = User
        fields = ("username", "email", "password1", "password2", "captcha")

    def save(self, commit=True):
        user = super(UserCreateForm, self).save(commit=False)
        user.email = self.cleaned_data["email"]
        if commit:
            user.save()
        return user

    def get_credentials(self):
        return {
            'username': self.cleaned_data['username'],
            'password': self.cleaned_data['password1']}

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
    uprofiles = models.ManyToManyField(Profile)
    id = models.CharField(max_length=10, unique=True, primary_key=True)

    def __unicode__(self):
        return self.get_title()

    def get_title(self):
        if not hasattr(self, 'title'):
            id_concept_dict = get_id_to_concept_dict()
            self.title = id_concept_dict[self.id]['title']
        return self.title
    
class StarredConcept(models.Model):
    """
    Simple class to maintain starred concepts
    """
    uprofiles = models.ManyToManyField(Profile)
    id = models.CharField(max_length=10, unique=True, primary_key=True)

    def __unicode__(self):
        return self.get_title()

    def get_title(self):
        if not hasattr(self, 'title'):
            id_concept_dict = get_id_to_concept_dict()
            self.title = id_concept_dict[self.id]['title']
        return self.title
    
