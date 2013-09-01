from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as AuthUserAdmin

from apps.user_management.models import Profile, LearnedConcept

class UserProfileInline(admin.StackedInline):
    model = Profile
    max_num = 1
    can_delete = False

class UserAdmin(AuthUserAdmin):
    inlines = [UserProfileInline]

class LearnedConceptAdmin:
    pass

admin.site.unregister(User)
admin.site.register(User, UserAdmin)
admin.site.register(LearnedConcept)

