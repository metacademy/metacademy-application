import os

from haystack import indexes
from apps.roadmaps.models import Roadmap

class RoadmapIndex(indexes.SearchIndex, indexes.Indexable):
    text = indexes.CharField(document=True, model_attr="body", use_template=True)
    author = indexes.CharField(model_attr='author')
    visibility = indexes.CharField(model_attr='visibility')
    def get_model(self):
        return Roadmap

    def index_queryset(self, using=None):
        """Used when the entire index for model is updated."""
        return self.get_model().objects
