import pdb

from django.test import TestCase
from django.test.client import Client
from django.contrib.auth.models import User
from django.core.urlresolvers import reverse

# TODO test: sudo_listed_in_main, test failed roadmap creation (incorrect form)

"""
Fixtures:

+ roadmap_fixture.json

    -- Users (pw is always username for test fixtures) --
    basic user: test
    super user: test_super
    basic user that created a roadmap (at .../test): test_roadmap_creator

   -- Roadmaps --
   /roadmaps/test_roadmap_creator/test

"""

class TestRoadmapCreation(TestCase):
    fixtures = ["roadmap_fixture.json"]

    def setUp(self):
        self.rcreator_username = "test_roadmap_creator"
        self.normal_username = "test"
        self.superuser_username = "test_super"
        self.roadmap_name = "test"
        self.base_roadmap = {'title':'test publish_public_roadmap title', 'author': 'author 1 and author 2', 'audience': 'test programs!', 'blurb': 'this should work', 'url_tag': 'publish_public_roadmap', 'listed_in_main': 'on', 'body':'some test [[text]]', 'submitbutton':'Save'}

    ######
    # published public roadmap
    ######

    def publish_public_roadmap(self):
        """
        create/publish a public (listed in main) roadmap
        """
        client = Client()
        client.login(username=self.rcreator_username, password=self.rcreator_username)
        rmap_url_tag = 'publish_public_roadmap'
        rm_dict = self.base_roadmap.copy()
        rm_dict['submitbutton'] = 'Publish'
        resp = client.post(reverse('roadmaps:new'), rm_dict)
        # should redirect to temp view
        self.assertEqual(resp.status_code, 302)
        view_url = reverse("roadmaps:show", args=(self.rcreator_username, rmap_url_tag,))
        self.assertEqual(resp.url, 'http://testserver' + view_url)
        return view_url

    def test_publish_public_roadmap(self):
        """
        test: create and publish a public roadmap
        """
        self.publish_public_roadmap()

    def test_settings_publish_public_roadmap(self):
        """
        test: verify the correct settings of the published public roadmap
        """
        rmap_url = self.publish_public_roadmap()
        client = Client()
        resp = client.get(rmap_url)
        self.assertEqual(resp.status_code, 200)
        rm_settings = resp.context['roadmap_settings']
        self.assertEqual(rm_settings.is_published(), True)
        self.assertEqual(rm_settings.is_listed_in_main(), True)
        self.assertEqual(rm_settings.sudo_listed_in_main, True)

    def test_show_published_public_roadmap_unauth(self):
        """
        test: show the published public roadmap to the unauth user
        """
        rmap_url = self.publish_public_roadmap()
        client = Client()
        resp = client.get(rmap_url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.context['can_change_settings'], False)
        self.assertEqual(resp.context['can_edit'], False)

    ######
    # unpublished public roadmap
    ######

    def save_unpublished_public_roadmap(self):
        """
        create but don't publish a public roadmap
        """
        client = Client()
        client.login(username=self.rcreator_username, password=self.rcreator_username)
        rm_dict = self.base_roadmap.copy()
        rmap_url_tag = 'save_public_roadmap'
        rm_dict['url_tag'] = rmap_url_tag
        resp = client.post(reverse('roadmaps:new'), rm_dict)
        # should redirect to temp view
        self.assertEqual(resp.status_code, 302)
        view_url = reverse("roadmaps:show", args=(self.rcreator_username, rmap_url_tag,))
        self.assertEqual(resp.url, 'http://testserver' + view_url)
        return view_url

    def test_save_unpublished_public_roadmap(self):
        """
        test: create but don't publish a "link only" roadmap
        """
        self.save_unpublished_public_roadmap()

    def test_settings_save_unpublished_roadmap(self):
        """
        test: verify the correct settings of the unpublished public roadmap
        """
        rmap_url = self.save_unpublished_public_roadmap()
        client = Client()
        resp = client.get(rmap_url)
        self.assertEqual(resp.status_code, 404)

        # now login as the creator
        client.login(username=self.rcreator_username, password=self.rcreator_username)
        resp = client.get(rmap_url)
        rm_settings = resp.context['roadmap_settings']
        self.assertEqual(rm_settings.is_published(), False)
        self.assertEqual(rm_settings.is_listed_in_main(), False)
        self.assertEqual(rm_settings.sudo_listed_in_main, True)

    def test_show_unpublished_public_roadmap_unauth(self):
        """
        test: show the unpublished public roadmap to the unauth user
        """
        rmap_url = self.save_unpublished_public_roadmap()
        client = Client()
        resp = client.get(rmap_url)
        self.assertEqual(resp.status_code, 404)

    def test_show_unpublished_public_roadmap_normal(self):
        """
        test: show the unpublished public roadmap to the normal user
        """
        rmap_url = self.save_unpublished_public_roadmap()
        client = Client()
        client.login(username=self.normal_username, password=self.normal_username)
        resp = client.get(rmap_url)
        self.assertEqual(resp.status_code, 404)

    def show_unpublished_public_roadmap_success(self, un):
        """
        test: show the unpublished public roadmap to a user that can view/edit it
        """
        rmap_url = self.save_unpublished_public_roadmap()
        client = Client()
        client.login(username=un, password=un)
        resp = client.get(rmap_url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.context['can_change_settings'], True)
        self.assertEqual(resp.context['can_edit'], True)

    def test_show_unpublished_public_roadmap_rcreator(self):
        """
        test: show the unpublished public roadmap to the rcreator user
        """
        self.show_unpublished_public_roadmap_success(self.rcreator_username)

    def test_show_unpublished_public_roadmap_superuser(self):
        """
        test: show the unpublished public roadmap to the superuser
        """
        self.show_unpublished_public_roadmap_success(self.superuser_username)

    ######
    # published link-only public roadmap
    ######

    def publish_link_only_roadmap(self):
        """
        create/publish a "view with link only" roadmap
        """
        client = Client()
        client.login(username=self.rcreator_username, password=self.rcreator_username)

        rm_dict = self.base_roadmap.copy()
        rm_dict['submitbutton'] = 'Publish'
        rmap_url_tag = 'publish_link_only_rmap'
        rm_dict['url_tag'] = rmap_url_tag
        del rm_dict['listed_in_main']
        resp = client.post(reverse('roadmaps:new'), rm_dict)

        self.assertEqual(resp.status_code, 302)
        view_url = reverse("roadmaps:show", args=(self.rcreator_username, rmap_url_tag,))
        self.assertEqual(resp.url, 'http://testserver' + view_url)
        return view_url

    def test_publish_link_only_roadmap(self):
        """
        test: create/publish a "view with link only" roadmap
        """
        self.publish_link_only_roadmap()

    def test_settings_publish_link_only_roadmap(self):
        """
        test: verify the correct settings of the published link-only roadmap
        """
        rmap_url = self.publish_link_only_roadmap()
        client = Client()
        resp = client.get(rmap_url)
        self.assertEqual(resp.status_code, 200)
        rm_settings = resp.context['roadmap_settings']
        self.assertEqual(rm_settings.is_published(), True)
        self.assertEqual(rm_settings.is_listed_in_main(), False)
        self.assertEqual(rm_settings.sudo_listed_in_main, True)

    def test_show_link_only_roadmap_unauth(self):
        """
        test: show the link-only roadmap to the unauth user
        """
        rmap_url = self.publish_link_only_roadmap()
        client = Client()
        resp = client.get(rmap_url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.context['can_change_settings'], False)
        self.assertEqual(resp.context['can_edit'], False)

    def test_show_link_only_roadmap_normal(self):
        """
        test: show the link-only roadmap to the normal user
        """
        rmap_url = self.publish_link_only_roadmap()
        client = Client()
        client.login(username=self.normal_username, password=self.normal_username)
        resp = client.get(rmap_url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.context['can_change_settings'], False)
        self.assertEqual(resp.context['can_edit'], False)

    def show_link_only_roadmap_success_edit(self, un):
        """
        test: show the link-only public roadmap to a user that can view/edit it
        """
        rmap_url = self.publish_link_only_roadmap()
        client = Client()
        client.login(username=un, password=un)
        resp = client.get(rmap_url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.context['can_change_settings'], True)
        self.assertEqual(resp.context['can_edit'], True)

    def test_show_unpublished_public_roadmap_rcreator(self):
        """
        test: show the link-only public roadmap to the rcreator user
        """
        self.show_link_only_roadmap_success_edit(self.rcreator_username)

    def test_show_unpublished_public_roadmap_superuser(self):
        """
        test: show the link-only public roadmap to the superuser
        """
        self.show_link_only_roadmap_success_edit(self.superuser_username)



class RoadmapViewTestCase(TestCase):
    fixtures = ["roadmap_fixture.json"]

    def setUp(self):
        self.rcreator_username = "test_roadmap_creator"
        self.normal_username = "test"
        self.superuser_username = "test_super"
        self.roadmap_name = "test"

    def client_get_rm_login(self, reverse_str, un, url_args, resp_code):
        client = Client()
        client.login(username=un, password=un)
        resp = client.get(reverse(reverse_str, args=url_args))
        self.assertEqual(resp.status_code, resp_code)

    def test_user_list_resp_no_roadmap(self):
        client = Client()
        # TODO check number of roadmaps
        # superuser without roadmap
        resp = client.get(reverse('roadmaps:user-list', args=(self.superuser_username,)))
        self.assertEqual(resp.status_code, 200)
        # normal user without roadmap
        resp = client.get(reverse('roadmaps:user-list', args=(self.normal_username,)))
        self.assertEqual(resp.status_code, 200)

    def test_user_list_resp_with_roadmap(self):
        client = Client()
        resp = client.get(reverse('roadmaps:user-list', args=(self.rcreator_username,)))
        self.assertEqual(resp.status_code, 200)

    def revert_rm_to_0(self, un, resp_code):
        """
        helper funtion: test reversion w/auth
        """
        client = Client()
        client.login(username=un, password=un)
        resp = client.put(reverse('roadmaps:revert', args=(self.rcreator_username, self.roadmap_name, 0,)))
        self.assertEqual(resp.status_code, resp_code)

    def test_revert_resp_no_auth(self):
        client = Client()
        resp = client.put(reverse('roadmaps:revert', args=(self.rcreator_username, self.roadmap_name, 0,)))
        self.assertEqual(resp.status_code, 401)

    def test_revert_resp_normal(self):
        self.revert_rm_to_0(self.normal_username, 401)

    def test_revert_resp_superuser(self):
        self.revert_rm_to_0(self.superuser_username, 200)

    def test_revert_resp_rcreator(self):
        self.revert_rm_to_0(self.rcreator_username, 200)

    def view_rev_0(self, un, resp_code):
        """
        helper function to view revision 0
        """
        self.client_get_rm_login('roadmaps:version', un, (self.rcreator_username, self.roadmap_name,0,), resp_code)

    def test_version_resp_normal(self):
        self.view_rev_0(self.normal_username, 200)

    def test_version_resp_superuser(self):
        self.view_rev_0(self.superuser_username, 200)

    def test_version_resp_rcreator(self):
        self.view_rev_0(self.rcreator_username, 200)

    def view_settings(self, un, resp_code):
        self.client_get_rm_login('roadmaps:settings', un, (self.rcreator_username, self.roadmap_name,), resp_code)

    def test_settings_resp_normal(self):
        self.view_settings(self.normal_username, 401)

    def test_settings_resp_superuser(self):
        self.view_settings(self.superuser_username, 200)

    def test_settings_resp_rcreator(self):
        self.view_settings(self.rcreator_username, 200)

    def test_history_resp(self):
        client = Client()
        resp = client.get(reverse('roadmaps:history', args=(self.rcreator_username, self.roadmap_name,)))
        self.assertEqual(resp.status_code,200)

    def test_edit_get_resp(self):
        # TODO test edit post resp
        client = Client()
        resp = client.get(reverse('roadmaps:edit',args=(self.rcreator_username, self.roadmap_name,)))
        self.assertEqual(resp.status_code, 200)

    def test_show_resp(self):
        client = Client()
        resp = client.get(reverse('roadmaps:show', args=(self.rcreator_username, self.roadmap_name,)))
        self.assertEqual(resp.status_code, 200)

    def test_new_resp_unauth(self):
        client = Client()
        resp = client.get(reverse('roadmaps:new'))
        # should redirect to login
        self.assertEqual(resp.status_code, 302)

    def new_roadmap_get_resp(self, un, resp_code):
        client = Client()
        self.client_get_rm_login('roadmaps:new', un, (), resp_code)

    def test_new_resp_normal(self):
        self.new_roadmap_get_resp(self.normal_username, 200)

    def test_new_resp_superuser(self):
        self.new_roadmap_get_resp(self.superuser_username, 200)

    def test_new_resp_rmap_creator(self):
        self.new_roadmap_get_resp(self.rcreator_username, 200)
