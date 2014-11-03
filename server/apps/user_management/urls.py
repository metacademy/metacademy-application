from django.conf.urls import patterns, url
from django.contrib.auth.views import login, logout, password_reset, password_reset_done, password_reset_confirm, password_reset_complete
from django.views.generic.base import TemplateView
from apps.user_management import views
from apps.user_management.models import UserCreateForm as Form

urlpatterns = patterns('',
                       url(r'^$', views.user_main, name='user_main'),
                       url(r'^login$', login, {'template_name': 'user_management/login.html'}, name='login'),
                       url(r'^logout$', logout, {'next_page': '/'}, name='logout'),
                       url(r'^register$', views.register, name='register'),
                       url(r'^password_reset$', password_reset,
                           {'template_name': 'user_management/password_reset_form.html',
                            'email_template_name': 'user_management/password_reset_email.html',
                            'subject_template_name': 'user_management/password_reset_subject.txt',
                            'post_reset_redirect': "/user/password_reset/sent"}, name='password_reset'),
                       url('^password_reset/sent$', password_reset_complete,
                           {'template_name': "user_management/password_reset_complete.html"}, name="password_reset_complete"),
                       url(r'^password_reset/(?P<uidb64>[0-9A-Za-z_\-]+)/(?P<token>[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,20})/$',
                           password_reset_confirm, {'template_name': 'user_management/password_reset_confirm.html',
                                                    'post_reset_redirect': '/user/password_reset/success'}, name="password_reset_confirm"),
                       url(r'^password_reset/success$', password_reset_done,
                           {'template_name': 'user_management/password_reset_done.html'}, name='password_reset_done'),
                       url(r'^concepts/([^/]*)$', views.handle_concepts)
                       )
