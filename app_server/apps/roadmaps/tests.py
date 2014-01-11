import pdb

from django.test import TestCase
from django.test.client import Client
from django.contrib.auth.models import User
from django.core.urlresolvers import reverse

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

    # define reusable test functions
    def publish_public_roadmap(self):
        """
        create/publish a public (listed in main) roadmap
        """
        pass

    def save_unpublished_public_roadmap(self):
        """
        create but don't publish a public roadmap
        """
        pass

    def publish_link_only_roadmap(self):
        """
        create/publish a "view with link only" roadmap
        """
        pass

    def save_link_only_roadmap(self):
        """
        create but don't publish a "link only" roadmap
        """
        pass

    # define unit test cases
    def test_publish_public_roadmap(self):
        """
        test: create and publish a public roadmap
        """
        self.publish_public_roadmap()

    def test_save_unpublished_public_roadmap(self):
        """
        test: create but don't publish a "link only" roadmap
        """
        self.save_unpublished_public_roadmap()

    def test_publish_link_only_roadmap(self):
        """
        test: create/publish a "view with link only" roadmap
        """
        self.publish_link_only_roadmap()

    def test_save_link_only_roadmap(self):
        """
        test: create but don't publish a "link only" roadmap
        """
        self.save_link_only_roadmap()

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
