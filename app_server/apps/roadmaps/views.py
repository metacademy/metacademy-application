import os
from operator import attrgetter
import pdb

import bleach
import markdown
import re
import urlparse
import reversion

from django.db import transaction
from django.contrib.auth.models import User
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.utils import safestring
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User

import apps.cserver_comm.cserver_communicator as cscomm
from utils.roadmap_extension import RoadmapExtension
from forms import RoadmapForm, RoadmapCreateForm
import models
import settings



MIT_6_438_FILE = os.path.join(settings.CLIENT_SERVER_PATH, 'static', 'text', 'mit_6_438.txt')

BLEACH_TAG_WHITELIST = ['a', 'b', 'blockquote', 'code', 'em', 'i', 'li', 'ol', 'strong', 'ul',
                        'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div']
BLEACH_ATTR_WHITELIST = {
    '*': ['id', 'class'],
    'a': ['href', 'rel']
}

# temporary: list of users who can edit
EDIT_USERS = ['rgrosse', 'cjrd']

def metacademy_domains():
    return ['']

def is_internal_link(url):
    p = urlparse.urlparse(url)
    if p.netloc not in metacademy_domains():
        return False
    return p.path.find('/concepts/') != -1

re_tag = re.compile(r'/concepts/(\w+)')
def parse_tag(url):
    m = re_tag.match(url)
    if m:
        return m.group(1)
    else:
        return None

def process_link(attrs, new=False):
    if is_internal_link(attrs['href']):
        if cscomm.is_node_present(parse_tag(attrs['href'])):
            attrs['class'] = 'internal-link'
        else:
            attrs['class'] = 'internal-link missing-link'
    else:
        attrs['class'] = 'external-link'
    attrs['target'] = '_blank'
    return attrs

def markdown_to_html(markdown_text):
    roadmap_ext = RoadmapExtension()
    body_html = markdown.markdown(markdown_text, extensions=[roadmap_ext, 'toc'])
    html = bleach.clean(body_html, tags=BLEACH_TAG_WHITELIST, attributes=BLEACH_ATTR_WHITELIST)
    return bleach.linkify(html, callbacks=[process_link])

# todo a class-based view will simplify this
def show(request, username, tag, vnum=-1):
    roadmap = models.load_roadmap(username, tag)

    if roadmap is None:
        return HttpResponse(status=404)

    if not roadmap.visible_to(request.user):
        return HttpResponse(status=404)

    vnum = int(vnum) 
    versions = get_versions_obj(roadmap)
    num_versions = len(versions)

    fdict = {}

    if num_versions > vnum >= 0 : 
        roadmap = versions[vnum].object_version.object
    can_edit = roadmap.editable_by(request.user)
    base_url = '/roadmaps/%s/%s' % (username, tag) # TODO remove hardcoding
    edit_url = base_url + "/edit"
    history_url = base_url + "/history"

    # temporary: editing disabled on server
    if username not in EDIT_USERS:
        can_edit = False

    return render(request, 'roadmap.html', {
        'body_html': markdown_to_html(roadmap.body),
        'roadmap': roadmap,
        'show_edit_link': can_edit,
        'username': username,
        'tag': tag,
        'edit_url': edit_url,
        'base_url': base_url,
        'history_url': history_url,
        'num_versions': num_versions,
        'page_class': "view",
        })

def show_history(request, username, tag):
    roadmap = models.load_roadmap(username, tag)
    if roadmap is None:
        return HttpResponse(status=404)
    cur_version_num = roadmap.version_num
    can_edit = roadmap.editable_by(request.user)

    if not roadmap.visible_to(request.user):
        return HttpResponse(status=404)

    revs = get_versions_obj(roadmap)[::-1]
    base_url = '/roadmaps/%s/%s' % (username, tag) # TODO remove hardcoding
    edit_url = base_url + "/edit"
    history_url = base_url + "/history"

    return render(request, 'roadmap-history.html',
                  {"revs": revs,
                   'username': username,
                   'tag': tag,
                   'edit_url': edit_url,
                   'base_url': base_url,
                   'history_url': history_url,
                   'page_class': "history",
                   'roadmap': roadmap,
                   'cur_version_num':cur_version_num,
                   'can_edit': can_edit,
               })

@csrf_exempt
def update_to_revision(request, username, tag, vnum):
    """
    update the given roadmap to the specified reversion number (simply copies over the previous entry)
    """

    if not request.method == "PUT":
        return HttpResponse(status=403)

    roadmap = models.load_roadmap(username, tag)
    if roadmap is None:
        return HttpResponse(status=404)
    
    can_edit = roadmap.editable_by(request.user)

    if not can_edit:
        return HttpResponse(status=403)

    vnum = int(vnum) 
    versions = get_versions_obj(roadmap)
    num_versions = len(versions)

    if 0 > vnum or vnum >= num_versions:
        return HttpResponse(status=404)

    versions[vnum].revert()
    
    return HttpResponse(status=200)

def get_versions_obj(obj):
    return reversion.get_for_object(obj).order_by("id")

@transaction.atomic
def edit(request, username, tag):

    roadmap = models.load_roadmap(username, tag)
    if roadmap is None:
        return HttpResponse(status=404)

    if not roadmap.visible_to(request.user):
        return HttpResponse(status=404)

    can_edit = roadmap.editable_by(request.user)
    
    if request.method == 'POST':
        if not (request.user.is_authenticated() and can_edit):
            # TODO inform the user that they cannot edit
            return HttpResponse(status=401)
        
        form = RoadmapForm(request.POST, instance=roadmap)

        if form.is_valid():
            versions = get_versions_obj(roadmap)
            cur_vn = len(versions) + 1
            smodel = form.save(commit=False)
            smodel.version_num = cur_vn
            with reversion.create_revision():
                smodel.save()
                reversion.set_user(request.user)
                reversion.set_comment(form.cleaned_data['commit_msg'])

            return HttpResponseRedirect('/roadmaps/%s/%s' % (username, tag))

    else:
        form = RoadmapForm(instance=roadmap)
    
    
    base_url = '/roadmaps/%s/%s' % (username, tag) # TODO remove hardcoding
    edit_url = base_url + "/edit"
    history_url = base_url + "/history"

    return render(request, 'roadmap-edit.html', {
        'form': form,
        'tag': roadmap.url_tag,
        'edit_url': edit_url,
        'base_url': base_url,
        'history_url': history_url,
        'page_class': "edit",
        'roadmap': roadmap,
        'can_edit': can_edit,
        })

def new(request):
    # temporary: editing disabled on server
    can_edit = request.user.is_authenticated() and request.user.username in EDIT_USERS
    if not can_edit:
        return HttpResponse(status=404)

    if not request.user.is_authenticated():
        return HttpResponse(status=404)

    if request.method == 'POST':
        form = RoadmapCreateForm(request.POST)
        if form.is_valid():
            with reversion.create_revision():
                roadmap = form.save(commit=False)
                roadmap.user = request.user
                roadmap.save()
                reversion.set_user(request.user)
            
            return HttpResponseRedirect('/roadmaps/%s/%s' % (request.user.username, roadmap.url_tag))
    else:
        form = RoadmapCreateForm()
        
    return render(request, 'roadmap-new.html', {
        'form': form,
        'can_edit': can_edit
        })


@csrf_exempt  # this is a POST request because it contains data, but there are no side effects 
def preview(request):
    if request.method != 'POST':
        return HttpResponse(status=404)

    roadmap = {
        'title': request.POST['title'] if 'title' in request.POST else '',
        'author': request.POST['author'] if 'author' in request.POST else '',
        'audience': request.POST['audience'] if 'audience' in request.POST else '',
        }
    body = request.POST['body'] if 'body' in request.POST else ''

    body_html = markdown_to_html(body)


    
    return render(request, 'roadmap-content.html', {
        'roadmap': roadmap,
        'body_html': safestring.mark_safe(body_html),
        'show_edit_link': False
        })


def list(request):
    roadmaps = models.Roadmap.objects.all()
    roadmaps = filter(lambda r: r.listed_in_main(), roadmaps)
    roadmaps.sort(key=attrgetter("title"))

    return render(request, 'roadmap-list.html', {
        'roadmaps': roadmaps,
        'include_create': True,
        'empty_message': 'Nobody has made any roadmaps yet.'
        })
    
def list_by_user(request, username):
    try:
        user = User.objects.get(username__exact=username)
    except User.DoesNotExist:
        return HttpResponse(status=404)

    roadmaps = models.Roadmap.objects.filter(user__username__exact=user.username)
    roadmaps = filter(lambda r: r.is_public(), roadmaps)
    roadmaps.sort(key=attrgetter("title"))

    include_create = request.user.is_authenticated() and request.user.username == username

    return render(request, 'roadmap-list.html', {
        'roadmaps': roadmaps,
        'include_create': include_create,
        'empty_message': 'This user has not made any roadmaps.'
        })
    
