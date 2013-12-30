import pdb

import os
from operator import attrgetter

import bleach
import markdown
import re
import urlparse
import reversion
from lazysignup.templatetags.lazysignup_tags import is_lazy_user

from django.db import transaction
from django.contrib.auth.models import User
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.utils import safestring
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.core.urlresolvers import reverse

from apps.cserver_comm import cserver_communicator as cscomm
from utils.roadmap_extension import RoadmapExtension
from utils.mathjax_extension import MathJaxExtension
from forms import RoadmapForm, RoadmapSettingsForm
import models
import settings


BLEACH_TAG_WHITELIST = ['a', 'b', 'blockquote', 'code', 'em', 'i', 'li', 'ol', 'strong', 'ul',
                        'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'pre',
                        'table', 'tr', 'th', 'tbody', 'thead', 'td']
BLEACH_ATTR_WHITELIST = {
    '*': ['id', 'class'],
    'a': ['href', 'rel']
}

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

def wiki_link_url_builder(label, base, end):
    """
    TODO allow tags and titles (how to distinguish?)
    """
    ttt_dict = cscomm.get_title_to_tag_dict()
    if ttt_dict.has_key(label):
        return base + ttt_dict[label]
    else:
        return base + label

def markdown_to_html(markdown_text):
    """
    converts markdown text to html using the markdown python library
    """
    roadmap_ext = RoadmapExtension()
    mathjax_ext = MathJaxExtension()
    body_html = markdown.markdown(markdown_text, extensions=[roadmap_ext, mathjax_ext, 'toc', 'sane_lists', 'extra', 'wikilinks(base_url=/concepts/)'], extension_configs={'wikilinks(base_url=/concepts/)' : [('build_url', wiki_link_url_builder)]})
    html = bleach.clean(body_html, tags=BLEACH_TAG_WHITELIST, attributes=BLEACH_ATTR_WHITELIST)
    return bleach.linkify(html, callbacks=[process_link])

# todo a class-based view will simplify this
def show(request, username, tag, vnum=-1):
    try:
        roadmap_settings = models.load_roadmap_settings(username, tag)
        roadmap = roadmap_settings.roadmap # TODO correct?
    except:
        return HttpResponse(status=404)

    if roadmap is None:
        return HttpResponse(status=404)

    vnum = int(vnum)
    versions = get_versions_obj(roadmap)
    num_versions = len(versions)

    if num_versions > vnum >= 0 :
        roadmap = versions[vnum].object_version.object

    can_edit = roadmap_settings.editable_by(request.user)
    base_url = '/roadmaps/%s/%s' % (username, tag) # TODO remove hardcoding
    edit_url = base_url + "/edit"
    history_url = base_url + "/history"
    settings_url = base_url + "/settings"

    return render(request, 'roadmap.html', {
        'body_html': markdown_to_html(roadmap.body),
        'roadmap': roadmap,
        'roadmap_settings': roadmap_settings,
        'can_change_settings': roadmap_settings.can_change_settings(request.user),
        'username': username,
        'tag': tag,
        'edit_url': edit_url,
        'base_url': base_url,
        'history_url': history_url,
        'settings_url': settings_url,
        'num_versions': num_versions,
        'page_class': "view",
        })

def show_history(request, username, tag):
    roadmap_settings = models.load_roadmap_settings(username, tag)
    roadmap = roadmap_settings.roadmap # TODO correct?

    if roadmap is None:
        return HttpResponse(status=404)
    cur_version_num = roadmap.version_num
    can_edit = roadmap_settings.editable_by(request.user)

    revs = get_versions_obj(roadmap)[::-1]
    base_url = '/roadmaps/%s/%s' % (username, tag) # TODO remove hardcoding
    edit_url = base_url + "/edit"
    history_url = base_url + "/history"
    settings_url = base_url + "/settings"

    return render(request, 'roadmap-history.html',
                  {"revs": revs,
                   'username': username,
                   'tag': tag,
                   'edit_url': edit_url,
                   'base_url': base_url,
                   'history_url': history_url,
                   'settings_url': settings_url,
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

    try:
        roadmap_settings = models.load_roadmap_settings(username, tag)
        roadmap = roadmap_settings.roadmap  # TODO correct?
    except:
        return HttpResponse(status=404)

    if roadmap is None:
        return HttpResponse(status=404)

    can_edit = roadmap_settings.editable_by(request.user)

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

    roadmap_settings = models.load_roadmap_settings(username, tag)
    roadmap = roadmap_settings.roadmap  # TODO correct?

    if roadmap is None:
        return HttpResponse(status=404)

    can_edit = roadmap_settings.editable_by(request.user)

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
    settings_url = base_url + "/settings"

    return render(request, 'roadmap-edit.html', {
        'form': form,
        'tag': roadmap_settings.url_tag,
        'edit_url': edit_url,
        'base_url': base_url,
        'history_url': history_url,
        "settings_url": settings_url,
        'page_class': "edit",
        'roadmap': roadmap,
        'can_edit': can_edit,
        })

def new(request):
    if not request.user.is_authenticated() or is_lazy_user(request.user):
        return HttpResponseRedirect(reverse("user:login"))

    if request.method == 'POST':
        form = RoadmapForm(request.POST)
        settings_form = RoadmapSettingsForm(request.POST)
        if form.is_valid() and settings_form.is_valid():
            with reversion.create_revision():
                roadmap = form.save(commit=False)
                roadmap.save()
                reversion.set_user(request.user)
            rms = settings_form.save(commit=False)
            rms.roadmap = roadmap
            prof = request.user.profile
            rms.creator = prof
            rms.save()
            rms.owners.add(prof)
            rms.save()

            return HttpResponseRedirect('/roadmaps/%s/%s'
                                        % (request.user.username,
                                           settings_form.cleaned_data['url_tag']))
    else:
        try:
            initial_txt = open(os.path.join(os.path.dirname(os.path.realpath(__file__)), "templates/roadmap-instructions.txt")).read()
        except:
            sys.stderr.write("unable to open roadmap instructions txt\n")
            initial_txt = ""
        form = RoadmapForm(initial={'body': initial_txt})
        settings_form = RoadmapSettingsForm()

    return render(request, 'roadmap-new.html', {
        'form': form,
        'settings_form': settings_form,
        'can_edit': True
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
    roadmaps = filter(lambda r: r.roadmapsettings.is_listed_in_main() and r.roadmapsettings.is_published() , roadmaps)
    roadmaps = sorted(roadmaps, key=lambda x: x.title.lower())

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

    # TODO FIXME so it gets all roadmaps that the user is in the creators list for
    roadmaps = models.RoadmapSettings.objects.filter(creator__exact=user.username)
    roadmaps = filter(lambda r: r.is_public(), roadmaps)
    roadmaps.sort(key=attrgetter("title"))

    include_create = request.user.is_authenticated() and request.user.username == username

    return render(request, 'roadmap-list.html', {
        'roadmaps': roadmaps,
        'include_create': include_create,
        'empty_message': 'This user has not made any roadmaps.'
        })
