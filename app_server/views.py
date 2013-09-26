from django.shortcuts import render_to_response
from django.template import RequestContext
from django.views.generic.base import View

from apps.cserver_comm.cserver_communicator import get_search_json


"""
Main application views that do not nicely fit into an app, i.e. because they span
multiple apps or are app agnostic
"""
class SearchView(View):

    def get(self, request):
        """
        Returns the search (list) view for a given query
        """
        qstring = request.GET['q']
        if len(qstring) == 0:
            search_data = None
            print 'WARNING: empty query parameter in get_search_view'
        else:
            search_data = get_search_json(qstring)

        return render_to_response('search-results.html', {'search_data': search_data, 'search_query': qstring}, context_instance=RequestContext(request))
