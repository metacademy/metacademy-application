from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    """
    Removes provisional concepts from the database
    """

    def handle(self, *args, **options):
        msg = 'Remove all USERS from the database?'
        if raw_input("%s (y/N) " % msg).lower() == 'y':
            for user in User.objects.all():
                user.delete()
