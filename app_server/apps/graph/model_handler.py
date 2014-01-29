import pdb

from apps.graph.models import Concept, ConceptSettings, Graph, GraphSettings, Edge, Flag, ConceptResource

from content_server.formats import Line

"""
This file contains functions for syncing client-side changes in graphs/concepts with the server-side models
"""

def sync_graph(in_graph):
    """
    Sync client graph changes with the server-side graph model
    """
    for node in in_graph["items"]:
        sync_concept(node)


def sync_concept(in_concept):
    """
    Sync clience concept changes with the server-side concept model
    """
    # TODO normalize sid and change across systems once javascript is normalized
    if in_concept.has_key("sid") and len(in_concept["sid"]):
        useid = in_concept["sid"]
        usetag = in_concept["id"]
    else:
        useid = in_concept["id"]
        usetag = in_concept["id"]
    concept, is_new = Concept.objects.get_or_create(id=useid, tag=usetag)

    changed = False

    # direct translation fields
    trans_fields = ["title", "summary", "exercises", "software", "is_shortcut"]
    for tf in trans_fields:
        if is_new or getattr(concept, tf) != in_concept[tf]:
            changed = True
            setattr(concept, tf, in_concept[tf])

    # handle prereqs: create concept place holders if they don't exist yet
    for in_inlink in in_concept["dependencies"]:
        inlink_id = in_inlink['sid']
        inlink_tag = in_inlink['source']
        inlink_reason = in_inlink['reason']
        #  create the concept first if it doesn't exist
        inlink_source, created = Concept.objects.get_or_create(id=inlink_id ,tag=inlink_tag)
        inlink, link_created = Edge.objects.get_or_create(source=inlink_source.id, target=concept.id)
        changed = changed or link_created or inlink.reason != in_inlink["reason"]
        inlink.reason = in_inlink["reason"]
        inlink.save()


    # handle flags - should have foreignkey relationship (get or create the flag)
    for in_flag in in_concept["flags"]:
        if not len(concept.flags.filter(text=in_flag)):
            concept.flags.create(text=in_flag)
            changed = True

    # handle resource (this should generalize for software and exercises as well)
    for in_resource in in_concept["resources"]:
        pass
        #pdb.set_trace()
        # resource should have an id given to it from the server
        # the corresponding conceptid should already exist
    # don't update concept if it hasn't changed
    # TODO add revision history after dealing with current db schema
    if changed:
        concept.save()
