import os

from django.forms import ModelForm, Textarea, CharField, TextInput

import models

PLACEHOLDER_TXT = 'Optional: write a brief message explaining your change'

class RoadmapForm(ModelForm):
    commit_msg = CharField( max_length=200, widget=TextInput(attrs={'placeholder': PLACEHOLDER_TXT}))
    class Meta:
        model = models.Roadmap
        fields = ('body', 'title', 'author', 'audience', 'blurb')
        widgets = {
            'body': Textarea(attrs={'rows': 40, 'maxlength': 200000}),
            'title': TextInput(attrs={'placeholder': 'Title for your roadmap'}),
            'author': TextInput(attrs={'placeholder': 'Separate authors with a comma'}),
            'audience': TextInput(attrs={'placeholder': 'Who do you want to read this roadmap?'}),
            'blurb': Textarea(attrs={'placeholder': 'briefly describe this roadmap -- this text is currently used for searching'}),
            }

    def clean(self):
        cleaned_data = super(RoadmapForm, self).clean()
        if cleaned_data['commit_msg'] == PLACEHOLDER_TXT:
           cleaned_data['commit_msg'] = ''
        return cleaned_data

class RoadmapSettingsForm(ModelForm):
    class Meta:
        model = models.RoadmapSettings
        fields = ('listed_in_main', 'url_tag', 'sudo_listed_in_main')
