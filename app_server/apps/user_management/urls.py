from django.conf.urls import patterns, url
from django.contrib.auth.views import login, logout
from django.contrib.auth.forms import AuthenticationForm

from apps.user_management import views

urlpatterns = patterns('',
                       url(r'^login$', login, {'template_name': 'login.html'}, name='login'),
                       url(r'^logout$', logout, {'next_page': '/'}, name='logout'),
                       url(r'^register$', views.register, name='register'),
                       url(r'^$', views.user_main, name='user_main'),
                       )
