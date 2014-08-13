from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as AuthUserAdmin
from django.db.models import Count

from models import Profile, Concepts


class UserProfileInline(admin.StackedInline):
    model = Profile
    max_num = 1
    can_delete = False


class UserAdmin(AuthUserAdmin):
    inlines = [UserProfileInline]

# class ConceptsInline(admin.StackedInline):
#     model = Concepts
#     max_num = 1
#     can_delete = False

# class ConceptsAdmin(admin.ModelAdmin):
#     inlines = [ConceptsInline]

#     list_display = ('get_title', 'show_uprofile_count',)
#     filter_horizontal = ('uprofiles',)
#     readonly_fields = ('get_title', 'show_uprofile_count')
#     fields = ('get_title', 'show_uprofile_count', 'uprofiles',)

# #    def queryset(self, request):
# #        return 0

#     def show_uprofile_count(self, inst):
#          return inst.uprofiles_count
#     show_uprofile_count.admin_order_field = 'uprofiles_count'

admin.site.unregister(User)
admin.site.register(User, UserAdmin)
#admin.site.register(Concepts, ConceptsAdmin)
