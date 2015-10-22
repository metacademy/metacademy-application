# # """
# # Testing class for checking broken links
# # Due to computational demand, this script should not be executed
# # from a URL -- executing from the admin interface seems reasonable

# # This script should write a list of broken links to current_broken_links.txt
# # in this directory

# # """
# import pdb
# import urllib2
# import urllib
# from httplib import BadStatusLine

# from django.core.urlresolvers import reverse
# from bs4 import BeautifulSoup

# from settings import APP_SERVER
# from apps.cserver_comm.cserver_communicator import get_full_graph_data


# class HeadRequest(urllib2.Request):
#     def get_method(self):
#         return "HEAD"

# def is_valid_link(link):
#     try:
# #        pdb.set_trace()
#         test_hr = HeadRequest(link)
#         response = urllib2.urlopen(test_hr)
#     except urllib2.HTTPError:
#         try:
#             # also try a get request (slower, but when head requests don't work...)
#             response = urllib2.urlopen(urllib2.Request(link))
#         except urllib2.HTTPError:
#             return False
#         except BadStatusLine:
#             return False
#     except BadStatusLine:
#         return False
#     code = response.code
#     return code < 400


# def get_broken_links_concepts():
#     # get all concepts
#     graph_data = get_full_graph_data()
#     blinks = []
#     base_concept_url = APP_SERVER + "/graphs/concepts/"

#     # TODO also check shortcut references
#     for concept_obj in graph_data["nodes"]:
#         concept = concept_obj["tag"]
#         conurl = base_concept_url + concept
#         req = urllib2.Request(conurl)
#         urlhand = urllib2.urlopen(req)
#         soup = BeautifulSoup(urlhand.read()).find(id="main")
#         for anch in soup.find_all('a'):
#             test_link = anch.attrs["href"]
#             if test_link.find("http") == -1:
#                 test_link = APP_SERVER + test_link

#             if not is_valid_link(test_link):
#                 blinks.append((concept, test_link))

#     return blinks
