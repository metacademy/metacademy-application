from django.db import models
from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from captcha.fields import CaptchaField

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
    
