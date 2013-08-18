from django.conf.urls import patterns, url
from django.contrib.auth.views import login, logout
from django.contrib.auth.forms import AuthenticationForm

from apps.user_management import views

urlpatterns = patterns('',
                       url(r'^login$', login, {'template_name': 'login.html'}),
                       url(r'^logout$', logout, {'next_page': '/'}),
                       url(r'^register$', views.register),
                       url(r'^$', views.user_main),
                       )
