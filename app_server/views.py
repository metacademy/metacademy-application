import pdb

from django.shortcuts import render_to_response
from django.template import RequestContext
from haystack.views import SearchView

from apps.cserver_comm.cserver_communicator import get_search_json


"""
Main application views that do not nicely fit into an app, i.e. because they span
multiple apps or are app agnostic
"""

class MultiSearchView(SearchView):
    """
    Class that searches both content-based and application-based data
    """
    def extra_context(self):
        """
        Adds the concept search (list) results for a given query
        """
        qstring = self.get_query()
        if len(qstring) == 0:
            search_data = None
            print 'WARNING: empty query parameter in get_search_view'
        else:
            search_data = get_search_json(qstring)

        return {"concepts_search_data": search_data, 'search_query': qstring}# render_to_response('search-results.html', {'search_data': search_data, 'search_query': qstring}, context_instance=RequestContext(request))
