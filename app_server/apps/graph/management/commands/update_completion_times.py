import collections
import numpy as np
import re

from django.core.management.base import BaseCommand

try:
    import scipy.optimize
    import scipy.special
except:
    pass
try:
    import pandas as pd
except:
    pass

from apps.graph.models import Concept

# obtained using Counter([rl.location_type for rl in ResourceLocation.objects.all()])
# and then manually mapping
LOCMAP = {'textbook': 'textbook',
          'online lectures': 'olecture',
          'online textbook': 'textbook',
          'online course': 'olecture',
          'lecture notes': "lnotes",
          'wiki': "webpage",
          'paper': "paper",
          'video lecture': 'olecture',
          'youtube videos': 'olecture',
          'review paper': 'paper',
          'video lectures': 'olecture',
          'thesis': 'paper',
          'tutorial': 'paper',
          'forum': 'webpage',
          'online compendium': 'textbook',
          'technical report': 'paper',
          'video': 'olecture',
          'reference': 'textbook',
          'book': 'textbook',
          'visualization and text': 'webpage',
          'tutorial paper': 'paper',
          'survey paper': 'paper',
          'video tutorials': 'olecture',
          'online lecture': 'olecture',
          'blog post': 'webpage',
          'research paper': 'paper'}

LOCATION_TYPES = ['tpage']

# TODO add ignore case and more types
# TODO investigate the actual resource data
re_lecture_sequence = re.compile(r'[Ll]ecture sequence')
re_lecture_series = re.compile(r'[Ll]ecture series')
re_pages = re.compile(r'(p(age|g)?s?\.?)\s*(\d+)((-|\s*to\s*)(\d+))?(.*)', re.IGNORECASE)


def parse_location(loc, retype):
    ltext = loc.location_text
    if retype == "textbook":
        m = re_pages.search(ltext)
        if m:
            count = 0
            rest = ltext
            while m:
                first_str, last_str, rest = m.group(2), m.group(5), m.group(6)
                first = int(first_str)
                if last_str:
                    last = int(last_str)
                else:
                    last = first + 1
                count += last - first
                m = re_pages.search(rest)
            return "tb-page", count
        else:
            # TODO try to decipher the number of [subsections]
            NUM_SEC_PGS = 5
            return "tb-page", NUM_SEC_PGS

    if re_lecture_sequence.search(loc) or re_lecture_series.search(loc):
        return 'lecture_sequence', 1

    return 'location', 1


class Command(BaseCommand):
    """
    update the completion times in the django db
    """

    def handle(self, *args, **options):
        # read in all of the concepts & their resources & location
        ldata = []
        for concept in Concept.objects.all():
            ctag = concept.tag
            # TODO need to compute the depth!
            for cres in concept.concept_resource.all():
                # only core resources
                # TODO change once we fully migrate to goal-based resources
                all_locs = cres.locations.all()
                if not cres.core or all_locs.count() == 0:
                    continue
                prevloc_type = LOCMAP[all_locs[0].location_type]
                for ict, loc in enumerate(cres.locations):
                    re_loc_type = LOCMAP[loc.location_type]
                    # TODO handle multifarious resource location types



                # obtain the counts TODO incorporate video times, word counts, etc
                crdata = []
                crdata.append(ctag)
                crdata.append(cres.id)
