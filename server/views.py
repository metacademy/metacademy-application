import pdb
import json
import urllib

from django.shortcuts import render
from django.views.generic.edit import FormView
from django.http import HttpResponse

from haystack.views import SearchView
from haystack.query import SearchQuerySet

from apps.graph.models import Concept, Tag
from apps.roadmaps.models import Roadmap
from apps.user_management.models import Profile
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

def get_browsing_view(request):
    """
    Return the list of concepts and roadmaps, sorted by category
    """
    tags = Tag.objects.exclude(title='Meta').extra(select={'lower_title': 'lower(title)'}).order_by("lower_title").all()
    tags = list(Tag.objects.filter(title='Meta').all()) + list(tags)     # Meta tag should appear first

    uncat_concepts = Concept.objects.filter(tags=None).extra(select={'lower_title': 'lower(title)'}).order_by("lower_title").all()
    uncat_concepts = filter(Concept.is_listed_in_main, uncat_concepts)
    
    uncat_roadmaps = Roadmap.objects.filter(tags=None, roadmapsettings__doc_type='Roadmap') \
                     .extra(select={'lower_title': 'lower(title)'}).order_by("lower_title").all()
    uncat_roadmaps = filter(Roadmap.is_listed_in_main, uncat_roadmaps)

    uncat_course_guides = Roadmap.objects.filter(tags=None, roadmapsettings__doc_type='Course Guide') \
                          .extra(select={'lower_title': 'lower(title)'}).order_by("lower_title").all()
    uncat_course_guides = filter(Roadmap.is_listed_in_main, uncat_course_guides)

    learned = None
    if request.user.is_authenticated():
        uprof, _ = Profile.objects.get_or_create(pk=request.user.pk)
        learned = [concept for cs in uprof.learned.all() for concept in Concept.objects.filter(id=cs.id).all()]

    return render(request, "browsing.html", {'tags': tags, 'uncat_concepts': uncat_concepts, 'uncat_roadmaps': uncat_roadmaps,
                                             'uncat_course_guides': uncat_course_guides, 'known_concepts': learned})
    
    


def autocomplete(request):
    """
    """
    # only autocomplete on concepts?
    acinp = request.GET.get("ac")
    if not acinp:
        return HttpResponse(status=501)
    sqs = SearchQuerySet()
    if (request.GET.get("onlyConcepts")):
        sqs = sqs.models(Concept)
    else:
        sqs = sqs.models(Concept, Roadmap)
        # concepts and roadmaps
    sqs = sqs.autocomplete(title=acinp).filter(is_listed_in_main_str="True")[:7]
    resp = [{"tag": acres.tag, "title": acres.title, "id": acres.id.split(".")[-1]} for acres in sqs]

    return HttpResponse(json.dumps(resp), "application/json")


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
        return {"concept_count": cct, "roadmap_count": rmct, "search_query": self.query, "url_search_query": urllib.quote(self.query)}


class ContactView(FormView):
    template_name = 'feedback.html'
    form_class = ContactForm
    success_url = '/thanks'

    def form_valid(self, form):
        form.send_email()
        return super(ContactView, self).form_valid(form)
