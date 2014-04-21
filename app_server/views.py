import pdb

from django.shortcuts import render
from django.template import RequestContext
from django.http import HttpResponse
from django.views.generic.edit import FormView

from haystack.views import SearchView
from os import system

from apps.graph.models import Concept
from apps.cserver_comm.cserver_communicator import get_search_json
from forms import ContactForm


"""
Main application views that do not nicely fit into an app, i.e. because they span
multiple apps or are app agnostic
"""


def get_list_view(request):
    """
    Return the list of concepts

		TODO this should be cached
    """
    citms = []
    # previous starting letter
    prev_sl = ""
    for concept in Concept.objects.extra(select={'lower_title': 'lower(title)'}).order_by("lower_title"):
        if concept.is_provisional() or len(concept.title) == 0:
            continue
        sl = concept.title[0].upper()
        if sl != prev_sl:
            citms.append(sl)
            prev_sl = sl
        citms.append(concept)

    return render(request, "concept-list.html", {"citms": citms})


class MultiSearchView(SearchView):
    """
    Class that searches multiple models and includes their counts in the output
    """
    def extra_context(self):
        """
        Adds the model counts
        """
        cct = 0
        rmct = 0
        for res in self.results:
            if res.model_name == "concept":
                cct += 1
            else:
                rmct += 1
        return {"concept_count": cct, "roadmap_count": rmct, "search_query": self.query}


class ContactView(FormView):
    template_name = 'feedback.html'
    form_class = ContactForm
    success_url = '/thanks'

    def form_valid(self, form):
        form.send_email()
        return super(ContactView, self).form_valid(form)
