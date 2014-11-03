import pdb

from django.db import models
from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from django.core.validators import validate_email

from captcha.fields import CaptchaField

class UserCreateForm(UserCreationForm):
    email = forms.CharField(validators=[validate_email],
        error_messages={'invalid': ('Please enter a valid email address.')})
    captcha = CaptchaField()
    tou = forms.BooleanField(initial=False)

    class Meta:
        model = User
        fields = ("username", "email", "password1", "password2", "captcha", "tou")

    def save(self, commit=True):
        user = super(UserCreateForm, self).save(commit=False)
        user.email = self.cleaned_data["email"]
        if commit:
            user.save()
        return user

    def clean_tou(self):
        tou = self.cleaned_data["tou"]
        if not tou:
            raise forms.ValidationError("You must agree to our terms of use.")

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

    The profile was originally conceived to allow easy future extension of the user model without dealing with messy schema changes
    """
    user = models.OneToOneField(User, primary_key=True)

    def __unicode__(self):
        return self.user.username

# FIXME WE NEED TO REMOVE THIS MODEL
class Concepts(models.Model):
    learned_uprofs = models.ManyToManyField(Profile, related_name="learned")
    starred_uprofs = models.ManyToManyField(Profile, related_name="starred")
    id = models.CharField(max_length=10, unique=True, primary_key=True)
