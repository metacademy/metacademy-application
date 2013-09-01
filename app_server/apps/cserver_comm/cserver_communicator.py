from settings import CONTENT_SERVER
import urllib2
import urllib
import json


# globals
id_to_concept_dict = None

def get_search_json(search_term):
    """
    search the content server for the specified search_term
    """
    url_req = urllib2.Request("%s/search?q=%s" % (CONTENT_SERVER, urllib.quote_plus(search_term)))
    json_res = _get_json(url_req, 'search term %s' % search_term)
    return json_res

def get_id_to_concept_dict():
    """
    obtain the id to title dictionary from the content server
    """
    global id_to_concept_dict
    
    if id_to_concept_dict == None:
        # TODO check if content server content has changed
        url_req = urllib2.Request("%s/list" % CONTENT_SERVER)
        json_res = _get_json(url_req, 'concept list')
        id_to_concept_dict = {}
        for entry in json_res:
            id_to_concept_dict[entry['id']] = entry

    return id_to_concept_dict
    
def is_node_present(tag):
    """
    check if the node is present on the content server TODO
    """
    pass

def _get_json(req, json_title):
    """
    get json data using HTTPRequest object given in req
    """
    url_hand = urllib2.urlopen(req)
    try:
        sobj = json.load(url_hand)
    except ValueError:
        sobj = None
        print 'Error parsing json from content server: %s \n returning None' % json_title
    return sobj
