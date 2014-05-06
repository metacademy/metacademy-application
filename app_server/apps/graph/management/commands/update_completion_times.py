import pdb
import re

from django.core.management.base import BaseCommand

try:
    import pandas as pd
except:
    print "could not import optional pandas dependency -- updating time estimates may not work"

from apps.graph.models import Concept
from aux.ctime import SimpleModel

# obtained using Counter([rl.location_type for rl in ResourceLocation.objects.all()])
# and then manually mapping
LOCMAP = {'textbook': 'tpage',
          'online lectures': 'olecture',
          'online textbook': 'tpage',
          'online course': 'olecture',
          'lecture notes': "ppage",
          'wiki': "wpwords",
          'paper': "ppage",
          'video lecture': 'olecture',
          'youtube videos': 'olecture',
          'review paper': 'ppage',
          'video lectures': 'olecture',
          'thesis': 'ppage',
          'tutorial': 'ppage',
          'forum': 'wpwords',
          'online compendium': 'tpage',
          'technical report': 'ppage',
          'video': 'olecture',
          'reference': 'tpage',
          'book': 'tpage',
          'visualization and text': 'wpwords',
          'tutorial paper': 'ppage',
          'survey paper': 'ppage',
          'video tutorials': 'olecture',
          'online lecture': 'olecture',
          'blog post': 'wpwords',
          'research paper': 'ppage'}

LOCATION_TYPES = ['tpage', 'ppage', 'wpwords', 'olecture']

# TODO add ignore case and more types
# TODO investigate the actual resource data
#re_lecture_sequence = re.compile(r'[Ll]ecture sequence')
#re_lecture_series = re.compile(r'[Ll]ecture series')
re_pages = re.compile(r'(p(age|g)?s?\.?)\s*(?P<fpage>\d+)((-|\s*to\s*)(?P<lpage>\d+))?(?P<rest>.*)', re.IGNORECASE)


def parse_location(loc, retype):
    ltext = loc.location_text
    if retype in ["tpage", "ppage"]:
        m = re_pages.search(ltext)
        if m:
            count = 0
            rest = ltext
            while m:
                gdict = m.groupdict()
                first_str = gdict["fpage"]
                last_str = gdict["lpage"]
                rest = gdict["rest"]
                first = int(first_str)
                if last_str:
                    last = int(last_str)
                else:
                    last = first + 1
                count += last - first
                m = re_pages.search(rest)
            return count
        else:
            # TODO try to decipher the number of [subsections]
            NUM_SEC_PGS = 3
            return NUM_SEC_PGS
    elif retype == "wpwords":
        # TODO collect the number of words from the given website and divide by some number
        return 1

    #  TODO parse the time of online lectures
    return 1


def build_dataset():
    # read in all of the concepts & their resources & location
    ldata = []
    for concept in Concept.objects.all():
        ctag = concept.tag
        cdepth = concept.tgraph_leaf.depth

        # TODO need to compute the depth!
        for cres in concept.concept_resource.all():
            # only core resources
            # TODO change once we fully migrate to goal-based resources
            all_locs = cres.locations.all()
            if not cres.core or all_locs.count() == 0:
                continue
            ltype = all_locs[0].location_type
            if ltype not in LOCMAP:
                continue
            prevloc_type = LOCMAP[ltype]

            # obtain the counts TODO incorporate video times, word counts, etc
            cnts = 0
            for loc in cres.locations.all():
                loc_type = LOCMAP[loc.location_type]
                if prevloc_type != loc_type:
                # TODO handle multifarious resource location types
                    continue
                cnts += parse_location(loc, loc_type)
            # TODO add depth
            ldata.append([ctag, cres.id, cdepth, prevloc_type, cnts])
    pdata = pd.DataFrame(ldata)
    pdata.columns = ("ctag", "rid", "depth", "ltype", "cnt")
    return pdata


class Command(BaseCommand):
    """
    update the completion times in the django db
    """

    def handle(self, *args, **options):
        pdata = build_dataset()
        smodel = SimpleModel(pdata)
        print smodel.llh()
        smodel.gibbs_sampling(20)
        import pprint
        import operator
        pprint.pprint(sorted(smodel.rel_complex.iteritems(), key=operator.itemgetter(1)))
        pprint.pprint(smodel.lambdas0)
        pdb.set_trace()
