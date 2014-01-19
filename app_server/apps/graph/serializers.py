import json
import pdb

from django.core.serializers.json import DjangoJSONEncoder
from tastypie.serializers import Serializer

from apps.graph.models import Concept

SAVE_FIELDS = ["id", "tag", "title", "summary", "goals", "exercises", "software", "pointers", "is_shortcut", "flags", "edge_target"]

def serialize_concept(in_concept):
    # TODO need to normalize client side to better agree with server representation
    # FIXME after migrating to concept-storing database
    if in_concept.has_key("sid") and len(in_concept["sid"]):
        useid = in_concept["sid"]
        usetag = in_concept["id"]
    else:
        useid = in_concept["id"]
        usetag = in_concept["id"]
    in_concept["id"] = useid
    in_concept["tag"] = usetag

    # handle flags TODO this shouldn't be necessary eventually
    if in_concept["flags"]:
        flag_arr = []
        for flag in in_concept["flags"]:
            flag_arr.append({"text": flag})
        in_concept["flags"] = flag_arr

    # handle prereqs: create concept place holders if they don't exist yet
    for i, in_inlink in enumerate(in_concept["dependencies"]):
        inlink = {}
        inlink['source'] = in_inlink['sid_source']
        inlink['target'] = in_inlink['sid_target']
        inlink['reason'] = in_inlink['reason']
        in_concept["dependencies"][i] = inlink
    in_concept["edge_target"] = in_concept["dependencies"]

    # remove non-save fields
    for field in in_concept.keys():
        if field not in SAVE_FIELDS:
            del in_concept[field]



        #  create the dep concept first if it doesn't exist FIXME hack for backwards compatability
        # inlink_source, created = Concept.objects.get_or_create(id=inlink_id ,tag=inlink_tag)
        # inlink, link_created = Edge.objects.get_or_create(source=inlink_source, target=concept)
        # changed = changed or link_created or inlink.reason != in_inlink["reason"]
        # inlink.reason = in_inlink["reason"]

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

        # have to change input to align with desired output...

        # get prereqs in desired format
