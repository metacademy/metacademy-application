"""
Flat file database content manager

use content_server_communicator to read previous data and django
server api (tastypie api) to commit the data along with the appropriate id and tag

NB: the content server must be listening for requests
"""

import pdb

from django.core.management.base import BaseCommand
from apps.graph.api_communicator import post_concept, post_dependency
from apps.graph.views import check_model_id
from app_server.apps.cserver_comm.cserver_communicator import get_full_graph_data, get_concept_data, get_tag_to_concept_dict
from apps.graph.models import Concept


def markdown_obj_to_markdown(mdobj):
    mdarr = []
    for mobj in mdobj:
        dep = int(mobj.get("depth"))
        txtarr = []
        for itm in mobj.get("items"):
            if "link" in itm:
                txtarr.append("[" + itm.get("text") + "](" + itm.get("link") + ")")
            else:
                txtarr.append(itm.get("text"))
        mdtxt = " ".join(txtarr)
        mdarr.append(("*" * dep) + " " + mdtxt)
    return "\n".join(mdarr)


class Command(BaseCommand):
    """
    Transfers the flat file database to the django database
    """

    def handle(self, *args, **options):
        graph_data = get_full_graph_data()
        tag_to_concept_dict = get_tag_to_concept_dict()

            # questions : transfer to goals

            # ignoring is_shortcut and outlinks

        # TODO figure out shortcuts
        direct_copy_fields = ["title", "summary", "tag", "id", "flags"]
        # match global resources using this field
        gres_match_field = "title"
        gres_direct_copy_fields = ["description", "authors", "year", "url", "resource_type", "title", "edition_years"]
        global_res_dicts = {}
        # parse the dependencies after the concepts
        all_deps = []
        conct = 0
        for concept_skeleton in graph_data["nodes"]:
            # break
            # conct += 1
            # if conct > 100:
            #     break

            concept = get_concept_data(concept_skeleton["tag"])
            api_con = {}

            # create goal objects
            api_goal_list = []
            goal_arr = []
            if concept.get("goals"):
                for goal in concept.get("goals"):
                    if int(goal.get("depth")) == 1:
                        if goal_arr:
                            mtxt = markdown_obj_to_markdown(goal_arr)
                            # FIXME TODO goals are added multiple times if concept already exists in DB
                            api_goal_list.append({"id": check_model_id("goal"), "text": mtxt})
                        goal_arr = [goal]
                    else:
                        goal_arr.append(goal)
                # TODO fix DRY
                if goal_arr:
                    mtxt = markdown_obj_to_markdown(goal_arr)
                    api_goal_list.append({"id": check_model_id("goal"), "text": mtxt})
            api_con["goals"] = api_goal_list

            # create see-also object
            if "pointers" in concept and concept["pointers"]:

                api_con["pointers"] = markdown_obj_to_markdown(concept["pointers"])

            # save the deps for later
            if "dependencies" in concept:
                for dep in concept.get("dependencies"):
                    all_deps.append(dep)

            for dcf in direct_copy_fields:
                api_con[dcf] = concept.get(dcf)
            api_con["learn_time"] = concept.get("time")

            # TODO FIXME need to figure out "goals covered"

            ### RESOURCES ###
            api_resources = []
            for res in concept["resources"]:
                res_obj = {}
                api_resources.append(res_obj)
                res_obj["id"] = check_model_id("resource")

                # TODO FIXME we must unparse the note field
                if "note" in res:
                    res_obj["notes"] = res.get("note")
                if "core" in res:
                    res_obj["core"] = res.get("core")
                else:
                    res_obj["core"] = 0

                # determine access
                if res.get("free"):
                    res_obj["access"] = "free"
                elif res.get("requires_signup"):
                    res_obj["access"] = "reg"
                else:
                    res_obj["access"] = "paid"
                res_obj["edition"] = res.get("edition")

                # build locations
                rlocs = []
                res_obj["locations"] = rlocs
                if "location" in res:
                    for loc in res.get("location"):
                        loc_obj = {}
                        loc_obj["url"] = loc.get("link")
                        loc_obj["location_text"] = loc.get("text")
                        # TODO add location type to previous resources
                        loc_obj["id"] = check_model_id("resource_location")
                        loc_obj["location_type"] = res["resource_type"]
                        rlocs.append(loc_obj)

                # handle additional dependencies
                res_obj["additional_dependencies"] = []
                if "dependencies" in res:
                    for adep in res.get("dependencies"):
                        # adep_id = tag_to_concept_dict[adep["link"]]["id"]
                        res_obj["additional_dependencies"].append({"title": adep["title"]})

                # determine global resource
                if res[gres_match_field] in global_res_dicts:
                    global_res = global_res_dicts[res[gres_match_field]]
                else:
                    global_res = {}
                    for gres_dcf in gres_direct_copy_fields:
                        global_res[gres_dcf] = res.get(gres_dcf)
                    global_res["access"] = res_obj.get("access")
                    global_res["id"] = check_model_id("global_resource")
                    global_res_dicts[res[gres_match_field]] = global_res
                res_obj["global_resource"] = global_res
            api_con["resources"] = api_resources
            post_concept(api_con)

        # now send the deps
        for dep in all_deps:
            api_dep = {}
            src = tag_to_concept_dict[dep["from_tag"]]
            target = tag_to_concept_dict[dep["to_tag"]]
            api_dep["id"] = src["id"] + target["id"]
            api_dep["source"] = "/graphs/api/v1/concept/" + src["id"] + "/"
            api_dep["target"] = "/graphs/api/v1/concept/" + target["id"] + "/"
            api_dep["reason"] = dep["reason"]
            api_dep["source_goals"] = ["/graphs/api/v1/goal/" + sgoal.id + "/"
                                       for sgoal in Concept.objects.get(id=src["id"]).goals.all()]
            api_dep["target_goals"] = ["/graphs/api/v1/goal/" + tgoal.id + "/"
                                       for tgoal in Concept.objects.get(id=target["id"]).goals.all()]
            post_dependency(api_dep)
