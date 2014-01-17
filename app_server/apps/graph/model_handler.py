import pdb

from apps.graph.models import Concept, ConceptSettings, Graph, GraphSettings, Edge

from content_server.formats import Line

"""
This file contains functions for syncing client-side changes in graphs/concepts with the server-side models
"""

def sync_graph(in_graph):
    """
    Sync client graph changes with the server-side graph model
    """
    for node in in_graph:
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

    # handle nested list text fields
    nested_lists = ["pointers", "goals"]
    for nl_itm in nested_lists:
        nl = in_concept[nl_itm]
        parse_nl = type(nl) is unicode
        nl = unicode(nl)
        if is_new or getattr(concept, nl_itm) != nl:
            if parse_nl:
                nl = [Line.parse(line) for line in nl.split("\n")]
                nl = unicode(nl)
                # need to parse the text
            setattr(concept, nl_itm, nl)


    # handle prereqs: create concept place holders if they don't exist yet
    for in_inlink in in_concept["dependencies"]:
        inlink_id = in_inlink['sid']
        inlink_tag = in_inlink['source']
        inlink_reason = in_inlink['reason']
        #  create the concept first if it doesn't exist
        inlink_source, created = Concept.objects.get_or_create(id=inlink_id ,tag=inlink_tag)
        inlink, link_created = Edge.objects.get_or_create(source=inlink_source, target=concept)
        changed = changed or link_created or inlink.reason != in_inlink["reason"]
        inlink.reason = in_inlink["reason"];
        inlink.save()


    # handle flags - should have foreignkey relationship (get or create the flag)

    # handle resource (this should generalize for software and exercises as well)

    # don't update concept if it hasn't changed
    # TODO add revision history after dealing with current db schema
    if changed:
        pdb.set_trace()
        concept.save()
