from django.contrib import admin

from models import Roadmap

class RoadmapAdmin(admin.ModelAdmin):
    model = Roadmap

admin.site.register(Roadmap, RoadmapAdmin)
