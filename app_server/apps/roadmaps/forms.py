from django.forms import ModelForm, Textarea, CharField, TextInput
import models

class RoadmapForm(ModelForm):
    commit_msg = CharField( max_length=200, widget=TextInput(attrs={'placeholder': 'Optional: write a brief message explaining your change'}))
    class Meta:
        model = models.Roadmap
        fields = ('title', 'author', 'audience', 'visibility', 'blurb', 'body')
        widgets = {
            'body': Textarea(attrs={'rows': 40}),
            }


class RoadmapCreateForm(RoadmapForm):
    class Meta:
        model = models.Roadmap
        fields = ('title', 'url_tag', 'author', 'audience', 'visibility', 'blurb', 'body')
        widgets = {
            'body': Textarea(attrs={'cols': 80, 'rows': 30})
            }
        
