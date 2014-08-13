from django.contrib import admin
from models import Concept


class ConceptAdmin(admin.ModelAdmin):
    list_display = ('title', 'tag', 'is_provisional', 'last_mod')

admin.site.register(Concept, ConceptAdmin)
