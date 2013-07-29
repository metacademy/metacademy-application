from settings import CONTENT_SERVER
import urllib2
import urllib
import json
import pdb

def get_search_json(search_term):
    """
    search the content server for the specified search_term
    """
    url_req = urllib2.Request("%s/search?q=%s" % (CONTENT_SERVER, urllib.quote_plus(search_term)))
    url_hand = urllib2.urlopen(url_req)
    try:
        sobj = json.load(url_hand)
    except ValueError:
        sobj = None
        print 'Error parsing json for content server search: %s\n returning None' % search_term
    return sobj

def is_node_present(tag):
    """
    Check if the node is present on the content server TODO
    """
    pass
