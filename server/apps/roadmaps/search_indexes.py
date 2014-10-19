import os

from haystack import indexes
from apps.roadmaps.models import Roadmap

class RoadmapIndex(indexes.SearchIndex, indexes.Indexable):
    text = indexes.CharField(document=True, use_template=True)
    title = indexes.EdgeNgramField(model_attr="title", boost=5.0)  # FIXME boost doesn't seem to work
    author = indexes.CharField(model_attr='author')
    is_published_str = indexes.CharField(model_attr='is_published_str')
    is_listed_in_main_str = indexes.CharField(model_attr='is_listed_in_main_str')

    def get_model(self):
        return Roadmap

    def index_queryset(self, using=None):
        """Used when the entire index for model is updated."""

        return self.get_model().objects
