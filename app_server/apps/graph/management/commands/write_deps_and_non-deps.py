"""
Flat file database content manager

use content_server_communicator to read previous data and django
server api (tastypie api) to commit the data along with the appropriate id and tag

NB: the content server must be listening for requests
"""

import pdb
import random
from django.core.management.base import BaseCommand
from apps.graph.models import Concept, Dependency


class Command(BaseCommand):
    """
    writes the dependencies to "positive.txt" and a random sample of non-deps to "negative.txt"
    """

    def handle(self, *args, **options):
        with open("positives.txt", "w") as pout:
            for dep in Dependency.objects.all():
                pout.write("(" + dep.source.title + ", " + dep.target.title + ")\n")
            # now do random sample of nondeps
            ct  = 0
        with open("negatives.txt", "w") as nout:
            ncons = len(Concept.objects.all())
            added = {}
            while ct < 1000:
                if ct % 50 == 0:
                    print str(ct)
                parent = Concept.objects.all()[random.randint(0, ncons - 1)]
                ndep = len(parent.dep_target.all())
                if ndep < 2:
                    continue
                c1 = parent.dep_target.all()[random.randint(0, ndep - 1)].source
                c2 = parent.dep_target.all()[random.randint(0, ndep - 1)].source
                tcat = c1.title + c2.title
                do_write = not (added.get(tcat) or c1.tgraph_leaf.concepts.filter(id=c2.id).exists()
                                or c2.tgraph_leaf.concepts.filter(id=c1.id).exists())
                if do_write:
                    added[tcat] = True
                    nout.write("(" + c1.title + ", " + c2.title + ")\n")
                    ct += 1
