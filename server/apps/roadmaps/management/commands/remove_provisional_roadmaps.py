from apps.roadmaps.models import Roadmap
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    """
    Removes provisional concepts from the database
    """

    def handle(self, *args, **options):
        msg = 'Remove all _ROADMAPS_ from the database?'
        if raw_input("%s (y/N) " % msg).lower() == 'y':
            for rmap in Roadmap.objects.all():
                if not rmap.is_listed_in_main():
                    print "deleting roadmap: {}".format(rmap.title)
                    rmap.delete()
