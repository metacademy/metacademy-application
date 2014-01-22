import json
import pdb
import string
import random

from django.core.serializers.json import DjangoJSONEncoder
from tastypie.serializers import Serializer

from apps.graph.models import Concept

CONCEPT_SAVE_FIELDS = ["id", "tag", "title", "summary", "goals", "exercises", "software", "pointers", "is_shortcut", "flags", "dependencies", "resources"]

def serialize_concept(in_concept):
    # remove non-save fields -- this must be done here and not in hydrate because of the janky way tastypie was written
    if in_concept.has_key("sid") and len(in_concept["sid"]):
        useid = in_concept["sid"]
        usetag = in_concept["id"]
    else:
        useid = in_concept["id"]
        usetag = in_concept["id"]
    in_concept["id"] = useid
    in_concept["tag"] = usetag

    for field in in_concept.keys():
        if field not in CONCEPT_SAVE_FIELDS:
            del in_concept[field]
    return in_concept


class ConceptSerializer(Serializer):
    formats = ['json']
    content_types = {
        'json': 'application/json'
    }
    def to_json(self, data, options=None):
        options = options or {}
        data = self.to_simple(data, options)
        return json.dumps(data, cls=DjangoJSONEncoder, sort_keys=True)

    def from_json(self, content):
        data = json.loads(content)
        data = serialize_concept(data)
        return data



class GraphSerializer(Serializer):
    formats = ['json']
    content_types = {
        'json': 'application/json'
    }

    def to_json(self, data, options=None):
        options = options or {}
        data = self.to_simple(data, options)
        return json.dumps(data, cls=DjangoJSONEncoder, sort_keys=True)

    def from_json(self, content):
        data = json.loads(content)
        for i, concept in enumerate(data["concepts"]):
            data["concepts"][i] = serialize_concept(concept)
        return data
