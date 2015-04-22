from apps.graph.models import Concept
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    """
    Removes provisional concepts from the database
    """

    def handle(self, *args, **options):
        msg = 'Remove all provisional concepts from the database?'
        if raw_input("%s (y/N) " % msg).lower() == 'y':
            for concept in Concept.objects.all():
                if concept.is_provisional():
                    print "removing {}".format(concept.title)
                    concept.delete()
