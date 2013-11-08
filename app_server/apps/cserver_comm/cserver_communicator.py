from settings import CONTENT_SERVER
import urllib2
import urllib
import json

# TODO consider making this a CserverComm object

# globals
id_to_concept_dict = None
tag_to_concept_dict = None
full_graph_json_str = None
full_graph_json = None
tag_to_data = {}

def get_concept_data(concept_tag):
    """
    get the dependency data for concept_tag from the server
    """
    if not tag_to_data.has_key(concept_tag):
        url_req = urllib2.Request("%s/concepts/%s" % (CONTENT_SERVER, concept_tag))
        tag_to_data[concept_tag] = _get_json(url_req, "concept acquisition")
    return tag_to_data[concept_tag]
        

def get_search_json(search_term):
    """
    search the content server for the specified search_term
    """
    url_req = urllib2.Request("%s/search?q=%s" % (CONTENT_SERVER, urllib.quote_plus(search_term)))
    json_res = _get_json(url_req, 'search term %s' % search_term)
    return json_res

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

def _load_dicts():
    global id_to_concept_dict, tag_to_concept_dict
    
    if id_to_concept_dict is None:
        url_req = urllib2.Request("%s/list" % CONTENT_SERVER)
        json_res = _get_json(url_req, 'concept list')
        id_to_concept_dict = {}
        tag_to_concept_dict = {}
        for entry in json_res:
            id_to_concept_dict[entry['id']] = entry
            tag_to_concept_dict[entry['tag']] = entry

def _load_full_graph_json_str():
    global full_graph_json_str, full_graph_json
    url_req = urllib2.Request("%s/full_graph" % CONTENT_SERVER)
    full_graph_json = _get_json(url_req, 'full_graph')
    full_graph_json_str = json.dumps(full_graph_json)
            
def get_full_graph_json_str():
    global full_graph_json_str
    if not full_graph_json_str:
        _load_full_graph_json_str()
    return full_graph_json_str

def get_full_graph_data():
    global full_graph_json
    if not full_graph_json:
        _load_full_graph_json_str()
    return full_graph_json
    

def get_id_to_concept_dict():
    """
    obtain the id to title dictionary from the content server
    """
    _load_dicts()
    return id_to_concept_dict
    
def is_node_present(tag):
    """
    check if the node is present on the content server TODO
    """
    _load_dicts()
    return tag in tag_to_concept_dict

