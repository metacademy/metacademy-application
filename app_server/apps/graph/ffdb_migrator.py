"""
Flat file database content manager

use content_server_communicator to read previous data and django server api (tastypie api) to commit the data along with the appropriate id and tag

NB: the content server must be listening for requests
"""

import argparse
import pdb

from app_server.apps.cserver_comm.cserver_communicator import get_full_graph_data, get_tag_to_concept_dict, get_concept_data
def read_concept_from_cs(concept_tag):
    pass

def post_concept_to_django_api(concept_json):
    pass

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Process command line options for content migrator.')
    parser.add_argument('--onlynew', type=bool, default=False, help="only add new concepts from the ffdb (concepts not already present in the django server) (default: False)")
    args = parser.parse_args()

    if args.onlynew:
        pass
        # TODO
    else:
        # read all of the tags from the ffdb
        graph_data = get_full_graph_data()
        tag_to_concept = get_tag_to_concept_dict()
        # TODO figure out shortcuts
        for concept in graph_data["nodes"]:
            pdb.set_trace()
            full_concept_data = get_concept_data(concept["tag"])
            # normalize dependencies
            x = 5
            aflsksd
