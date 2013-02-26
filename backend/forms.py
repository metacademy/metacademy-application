from django import forms
from django.forms import Select

class ResourceForm(forms.Form):
    """
    Simple form for adding resources to the resource database
    """
    key = forms.CharField()
    title = forms.CharField()
    location = forms.CharField(label='URL',required=False)
    resource_type = forms.CharField(required=False)
    cost = forms.CharField(required=False,
           widget=Select(choices=(('free','free'),('notfree','not free'))))
    notes = forms.CharField(required=False)
  