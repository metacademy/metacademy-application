from django.conf.urls import patterns, url
from django.contrib.auth.views import login, logout
from django.contrib.auth.forms import AuthenticationForm

from apps.user_management import views

urlpatterns = patterns('',
                       url(r'^$', views.user_main, name='user_main'),
                       url(r'^login$', login, {'template_name': 'login.html'}, name='login'),
                       url(r'^logout$', logout, {'next_page': '/'}, name='logout'),
                       url(r'^register$', views.register, name='register'),
                       url(r'^learned/([^/]*)$', views.handle_learned_concepts, name='addlearned'), 
                       url(r'^starred/([^/]*)$', views.handle_starred_concepts, name='addlearned'), 
                       )
