from django.contrib import admin
from models import Concept


class ConceptAdmin(admin.ModelAdmin):
    list_display = ('title', 'tag', 'is_provisional', 'last_mod', 'get_concept_graph_ids', 'get_edit_usernames')

admin.site.register(Concept, ConceptAdmin)
