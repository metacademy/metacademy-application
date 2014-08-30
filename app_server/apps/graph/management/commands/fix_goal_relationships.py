from django.core.management.base import BaseCommand
from apps.graph.models import Dependency


class Command(BaseCommand):
    """
    Fill source and dep goals that are empty
    """
    def handle(self, *args, **options):
        empty_sgoals = [dep for dep in Dependency.objects.all() if len(dep.source_goals.all()) == 0 and len(dep.source.goals.all()) > 0]

        for sdep in empty_sgoals:
            sdep.source_goals = sdep.source.goals.all()
            sdep.save()

        empty_tgoals = [dep for dep in Dependency.objects.all() if len(dep.target_goals.all()) == 0 and len(dep.target.goals.all()) > 0]

        for tdep in empty_tgoals:
            tdep.target_goals = tdep.target.goals.all()
            tdep.save()



