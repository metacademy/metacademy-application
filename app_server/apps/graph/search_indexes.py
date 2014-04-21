import os

from haystack import indexes
from models import Concept

class ConceptIndex(indexes.SearchIndex, indexes.Indexable):
    text = indexes.CharField(document=True, use_template=True)
    title = indexes.CharField(model_attr="title")
    summary = indexes.CharField(model_attr="summary")
    tag = indexes.CharField(model_attr="tag")
    is_listed_in_main_str = indexes.CharField(model_attr="is_listed_in_main_str")

    def get_model(self):
        return Concept

    def index_queryset(self, using=None):
        """Used when the entire index for model is updated."""
        return self.get_model().objects
