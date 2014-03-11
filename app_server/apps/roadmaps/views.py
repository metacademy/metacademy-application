import difflib
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
from django.utils.html import escape
from django.views.decorators.csrf import csrf_exempt
from django.core.urlresolvers import reverse

from apps.cserver_comm import cserver_communicator as cscomm
from utils.roadmap_extension import RoadmapExtension
from utils.mathjax_extension import MathJaxExtension
from forms import RoadmapForm, RoadmapSettingsForm
import models


BLEACH_TAG_WHITELIST = ['a', 'b', 'blockquote', 'code', 'em', 'i', 'li', 'ol', 'strong', 'ul',
                        'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'pre',
                        'table', 'tr', 'th', 'tbody', 'thead', 'td']
BLEACH_ATTR_WHITELIST = {
    '*': ['id', 'class'],
    'a': ['href', 'rel']
}


# TODO what is this used for - Colorado
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
    if label in ttt_dict:
        return base + ttt_dict[label]
    else:
        return base + label


def markdown_to_html(markdown_text):
    """
    converts markdown text to html using the markdown python library
    """
    roadmap_ext = RoadmapExtension()
    mathjax_ext = MathJaxExtension()
    body_html = markdown.markdown(markdown_text,
                                  extensions=[roadmap_ext, mathjax_ext, 'toc', 'sane_lists', 'extra', 'wikilinks(base_url=/concepts/)'],
                                  extension_configs={'wikilinks(base_url=/concepts/)': [('build_url', wiki_link_url_builder)]})
    html = bleach.clean(body_html, tags=BLEACH_TAG_WHITELIST, attributes=BLEACH_ATTR_WHITELIST)
    return bleach.linkify(html, callbacks=[process_link])


def show(request, in_username, tag, vnum=-1):
    try:
        rm_dict = get_roadmap_objs(in_username, tag)
    except:
        return HttpResponse(status=404)

    roadmap = rm_dict["roadmap"]
    roadmap_settings = rm_dict["settings"]

    if not roadmap_settings.viewable_by(request.user):
        return HttpResponse(status=404)

    vnum = int(vnum)
    versions = _get_versions_obj(roadmap)
    num_versions = len(versions)

    if num_versions > vnum >= 0:
        roadmap = versions[vnum].object_version.object

    common_rm_dict = get_common_roadmap_dict(roadmap, roadmap_settings, request.user, in_username, tag)

    return render(request, 'roadmap.html', dict({
        'body_html': markdown_to_html(roadmap.body),
        'num_versions': num_versions,
        'page_class': "view"
    }, **common_rm_dict))


def format_diff_line(line):
    line = escape(line)
    if line[0] == '+':
        return '<ins>' + line + '</ins>'
    elif line[0] == '-':
        return '<del>' + line + '</del>'
    else:
        return line


def show_changes(request, in_username, tag, vnum=-1):
    try:
        rm_dict = get_roadmap_objs(in_username, tag)
    except:
        return HttpResponse(status=404)

    roadmap = rm_dict["roadmap"]
    roadmap_settings = rm_dict["settings"]

    if not roadmap_settings.viewable_by(request.user):
        return HttpResponse(status=404)

    vnum = int(vnum)
    versions = _get_versions_obj(roadmap)
    num_versions = len(versions)

    if num_versions > vnum >= 0:
        roadmap = versions[vnum].object_version.object

    curr_body = roadmap.body
    curr_lines = curr_body.splitlines()

    if vnum > 0:
        prev_roadmap = versions[vnum - 1].object_version.object
        prev_body = prev_roadmap.body
    else:
        prev_body = ''
    prev_lines = prev_body.splitlines()

    differ = difflib.Differ()
    diff_lines = differ.compare(prev_lines, curr_lines)
    diff_lines = filter(lambda l: l[0] != '?', diff_lines)
    diff = '\n'.join(map(format_diff_line, diff_lines))

    common_rm_dict = get_common_roadmap_dict(roadmap, roadmap_settings, request.user, in_username, tag)

    return render(request, 'roadmap-diff.html', dict({
        'diff': diff,
    }, **common_rm_dict))


def show_history(request, in_username, tag):
    try:
        rm_dict = get_roadmap_objs(in_username, tag)
    except:
        return HttpResponse(status=404)
    roadmap = rm_dict["roadmap"]
    roadmap_settings = rm_dict["settings"]

    if not roadmap_settings.viewable_by(request.user):
        return HttpResponse(status=404)

    cur_version_num = roadmap.version_num

    revs = _get_versions_obj(roadmap)[::-1]
    common_rm_dict = get_common_roadmap_dict(roadmap, roadmap_settings, request.user, in_username, tag)
    return render(request, 'roadmap-history.html',
                  dict({"revs": revs,
                        'page_class': "history",
                        'cur_version_num': cur_version_num,
                        'show_change_button': True,
                        'show_preview_button': True
                        }, **common_rm_dict))


@csrf_exempt
def update_to_revision(request, in_username, tag, vnum):
    """
    update the given roadmap to the specified reversion number (simply copies over the previous entry)
    """
    if not request.method == "PUT":
        return HttpResponse(status=403)

    try:
        rm_dict = get_roadmap_objs(in_username, tag)
    except:
        return HttpResponse(status=404)

    roadmap = rm_dict["roadmap"]
    roadmap_settings = rm_dict["settings"]

    can_edit = roadmap_settings.editable_by(request.user)
    if not can_edit:
        return HttpResponse(status=401)

    vnum = int(vnum)
    versions = _get_versions_obj(roadmap)
    num_versions = len(versions)

    if 0 > vnum or vnum >= num_versions:
        return HttpResponse(status=404)
    versions[vnum].revision.revert()

    return HttpResponse(status=200)


def _get_versions_obj(obj):
    return reversion.get_for_object(obj).order_by("id")


@transaction.atomic
def edit(request, in_username, tag):
    try:
        rm_dict = get_roadmap_objs(in_username, tag)
    except:
        return HttpResponse(status=404)

    roadmap = rm_dict["roadmap"]
    roadmap_settings = rm_dict["settings"]

    if not roadmap_settings.viewable_by(request.user):
        return HttpResponse(status=404)

    common_rm_dict = get_common_roadmap_dict(roadmap, roadmap_settings, request.user, in_username, tag)

    can_edit = roadmap_settings.editable_by(request.user)

    if request.method == 'POST':
        if not (request.user.is_authenticated() and can_edit):
            # TODO inform the user that they cannot edit
            return HttpResponse(status=401)

        form = RoadmapForm(request.POST, instance=roadmap)

        if form.is_valid():
            versions = _get_versions_obj(roadmap)
            cur_vn = len(versions) + 1
            smodel = form.save(commit=False)
            smodel.version_num = cur_vn
            with reversion.create_revision():
                smodel.save()
                reversion.set_user(request.user)
                reversion.set_comment(form.cleaned_data['commit_msg'])

            if request.POST["submitbutton"] == "Publish" and common_rm_dict['can_change_settings']:
                roadmap_settings.published = True
                roadmap_settings.save()
                return HttpResponseRedirect('/roadmaps/%s/%s' % (in_username, tag))

    elif request.method == 'GET':
        form = RoadmapForm(instance=roadmap)
    else:
        return HttpResponse(status=403)

    return render(request, 'roadmap-edit.html', dict({
        'form': form,
        'page_class': "edit",
    }, **common_rm_dict))


def settings(request, in_username, tag):
    # check that the user is logged in
    if not request.user.is_authenticated() or is_lazy_user(request.user):
        return HttpResponseRedirect(reverse("user:login"))

    # get the roadmap and settings
    try:
        rm_dict = get_roadmap_objs(in_username, tag)
    except:
        return HttpResponse(status=404)
    roadmap = rm_dict["roadmap"]
    roadmap_settings = rm_dict["settings"]

    # make sure the user is capable of changing the settings
    if (not roadmap_settings.can_change_settings(request.user)):
        return HttpResponse(status=401)

    if request.method == 'POST':
        form = RoadmapSettingsForm(request.POST, instance=roadmap_settings)
        rms_sudo_listed_in_main = roadmap_settings.sudo_listed_in_main
        if form.is_valid():
            rs = form.save(commit=False)
            if not request.user.is_superuser:
                rs.sudo_listed_in_main = rms_sudo_listed_in_main
            rs.save()

            return HttpResponseRedirect('/roadmaps/%s/%s' % (in_username, form.data['url_tag']))
    elif request.method == 'GET':
        form = RoadmapSettingsForm(instance=roadmap_settings)
    else:
        return HttpResponse(status=403)

    common_rm_dict = get_common_roadmap_dict(roadmap, roadmap_settings, request.user, in_username, tag)

    return render(request, 'roadmap-settings.html', dict({
        'settings_form': form,
        'page_class': "settings",
        }, **common_rm_dict))


# TODO refactor with edit
def new(request):
    if not request.user.is_authenticated() or is_lazy_user(request.user):
        return HttpResponseRedirect(reverse("user:login"))

    if request.method == 'POST':
        form = RoadmapForm(request.POST)
        settings_form = RoadmapSettingsForm(request.POST)
        is_publish = request.POST["submitbutton"] == "Publish"

        if form.is_valid() and settings_form.is_valid():
            with reversion.create_revision():
                roadmap = form.save(commit=False)
                roadmap.save()
                reversion.set_user(request.user)

            rms = settings_form.save(commit=False)
            if not request.user.is_superuser:
                rms.sudo_listed_in_main = models.RoadmapSettings._meta.get_field_by_name('sudo_listed_in_main')[0].default # TODO hack

            if is_publish:
                rms.published = True

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
    roadmaps = filter(lambda r: r.roadmapsettings.is_listed_in_main() and r.roadmapsettings.is_published(), roadmaps)
    roadmaps = sorted(roadmaps, key=lambda x: x.title.lower())

    return render(request, 'roadmap-list.html', {
        'roadmaps': roadmaps,
        'include_create': True,
        'empty_message': 'Nobody has made any roadmaps yet.'
    })


def list_by_user(request, in_username):
    try:
        user = User.objects.get(username__exact=in_username)
    except User.DoesNotExist:
        return HttpResponse(status=404)

    roadmaps_setting = models.RoadmapSettings.objects.filter(creator=user.profile)
    roadmaps = [rs.roadmap for rs in roadmaps_setting if rs.is_listed_in_main()]
    roadmaps.sort(key=attrgetter("title"))

    include_create = request.user.is_authenticated() and request.user.username == in_username

    return render(request, 'roadmap-list.html', {
        'roadmaps': roadmaps,
        'include_create': include_create,
        'empty_message': 'This user has not made any public roadmaps.'
    })


def get_common_roadmap_dict(roadmap, roadmap_settings, user, rm_username, tag):
    base_url = '/roadmaps/%s/%s' % (rm_username, tag)  # TODO remove hardcoding
    return {
        'roadmap': roadmap,
        'roadmap_settings': roadmap_settings,
        'username': rm_username,
        'tag': tag,
        'edit_url': base_url + "/edit",
        'base_url': base_url,
        'is_published': roadmap_settings.is_published(),
        'history_url': base_url + "/history",
        'settings_url': base_url + '/settings',
        'can_change_settings': roadmap_settings.can_change_settings(user),
        'can_edit': roadmap_settings.editable_by(user),
        'base_rev_url': base_url + '/version/'
    }


def get_roadmap_objs(username, tag):
    roadmap_settings = models.load_roadmap_settings(username, tag)
    roadmap = roadmap_settings.roadmap
    assert(roadmap is not None)
    return {'roadmap': roadmap, 'settings': roadmap_settings}
