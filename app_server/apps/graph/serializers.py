import json
import pdb
import string
import random

from django.core.serializers.json import DjangoJSONEncoder
from tastypie.serializers import Serializer

from apps.graph.models import Concept

CONCEPT_SAVE_FIELDS = ["id", "tag", "title", "summary", "goals", "exercises", "software", "pointers", "is_shortcut", "flags", "dependencies", "resources"]

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

    for resource in in_concept["resources"]:
        try:
            resource["year"] = int(resource["year"])
        except:
            resource["year"] = None
        if not resource.has_key("id"):
            resource["id"] = ''.join([random.choice(string.lowercase + string.digits) for i in range(12)])
           # FIXME this shouldn't exist here, or at least, it should check
           # that the id doesn't exist (for that 1 in 4.7x10^18 chance)
        resource["concept"] = {"id": in_concept["id"], "tag": in_concept["tag"]}
        # resource["additional_dependencies"] = resource["dependencies"]  # TODO figure these out
        del resource["dependencies"]
        # pdb.set_trace()

        # FIXME TEMPORARY HACK FOR EXPLORATION- CJR
        del resource['url']
        del resource['title']
        if resource.has_key('specific_url_base'):
            del resource['specific_url_base']
        if resource.has_key('edition_years'):
            del resource['edition_years']

    # handle flags TODO this shouldn't be necessary eventually
    if in_concept["flags"]:
        flag_arr = []
        for flag in in_concept["flags"]:
            flag_arr.append({"text": flag})
        in_concept["flags"] = flag_arr

    # handle format of structured lists  TODO NEXT

    # handle prereqs: create concept place holders if they don't exist yet
    for i, in_inlink in enumerate(in_concept["dependencies"]):
        inlink = {}
        inlink['source'] = {"id": in_inlink['sid_source']}
        inlink['target'] = {"id": in_inlink['sid_target']}
        inlink['reason'] = in_inlink['reason']
        if not in_inlink.has_key("id"):
            inlink["id"] = in_inlink["sid_source"] + in_inlink["sid_target"]
        else:
            inlink["id"] = in_inlink["id"]
        in_concept["dependencies"][i] = inlink

    # remove non-save fields
    for field in in_concept.keys():
        if field not in CONCEPT_SAVE_FIELDS:
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
