from django.forms import ModelForm, Textarea, CharField, TextInput
import models

PLACEHOLDER_TXT = 'Optional: write a brief message explaining your change'
class RoadmapForm(ModelForm):
    commit_msg = CharField( max_length=200, widget=TextInput(attrs={'placeholder': PLACEHOLDER_TXT}))
    class Meta:
        model = models.Roadmap
        fields = ('title', 'author', 'audience', 'visibility', 'blurb', 'body')
        widgets = {
            'body': Textarea(attrs={'rows': 40}),
            }
    def clean(self):
        cleaned_data = super(RoadmapForm, self).clean()
        if cleaned_data['commit_msg'] == PLACEHOLDER_TXT:
           cleaned_data['commit_msg'] = '' 
        return cleaned_data


class RoadmapCreateForm(RoadmapForm):
    class Meta:
        model = models.Roadmap
        fields = ('title', 'url_tag', 'author', 'audience', 'visibility', 'blurb', 'body')
        widgets = {
            'body': Textarea(attrs={'cols': 80, 'rows': 30})
            }
        
