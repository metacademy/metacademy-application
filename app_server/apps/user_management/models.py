import pdb

from django.db import models
from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from django.core.validators import validate_email

from captcha.fields import CaptchaField
from apps.cserver_comm.cserver_communicator import get_id_to_concept_dict

class UserCreateForm(UserCreationForm):
    email = forms.CharField(validators=[validate_email],
        error_messages={'invalid': ('Please enter a valid email address.')})
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

    def clean_email(self):
        email = self.cleaned_data["email"]
        if len(User.objects.filter(email=email)) > 0:
            raise forms.ValidationError("This email address is already registered to an account -- use the username/password reminder (below) to obtain the credentials for this email.")
        return email

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

class Concepts(models.Model):

    learned_uprofs = models.ManyToManyField(Profile, related_name="learned")
    starred_uprofs = models.ManyToManyField(Profile, related_name="starred")
    id = models.CharField(max_length=10, unique=True, primary_key=True)
        
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
    
