import datetime
import pdb

from django.contrib.auth.models import User
from django.test.client import Client
from django.core.urlresolvers import reverse

from tastypie.test import ResourceTestCase
from apps.graph.models import Graph, Concept
from apps.user_management.models import Profile

class GraphResourceTest(ResourceTestCase):
    """
    Tests to add:
      - verify graph fields after save
      - post/patch/put to list
      - delete to list/detail
      - GET requests to detail/list
    """

    def setUp(self):
        super(GraphResourceTest, self).setUp()
        # Create a normal user.
        self.username = 'test' # use un as pw
        self.user = User.objects.create_user(self.username, 'test@example.com', self.username)
        self.prof = Profile(user=self.user)
        self.prof.save()
        self.user.save()
        # TODO this will likely change
        self.graph_id = "4dt4kusg"
        self.graph_title = "first graph title"
        self.graph_list_api_url = "/graphs/api/v1/graph/"
        self.graph_detail_api_url = "/graphs/api/v1/graph/" + self.graph_id + "/"

        # The data we'll send on POST requests - copied from an actual post request
        self.post_data = {"id": self.graph_id, "title": self.graph_title, "concepts":[{"title":"test concept", "id":"kf9fp5hy", "exercises":"", "flags":[], "useCsrf":True, "goals":"", "pointers":"", "software":"", "x":519, "y":198, "isContracted":False, "hasContractedDeps":False, "hasContractedOLs":False, "sid":"", "summary":"A test summary", "time":"", "is_shortcut":0, "isNew":1, "editNote":"", "tag":"kf9fp5hy", "dependencies":[{"source":"hvd4kis8", "id":"hvd4kis8kf9fp5hy", "sid_source":"hvd4kis8", "sid_target":"kf9fp5hy", "reason":"a test reason", "middlePts":[], "isContracted":False}], "resources":[]}, {"title":"test preq", "id":"hvd4kis8", "exercises":"", "flags":[], "useCsrf":True, "goals":"test ", "pointers":"", "software":"", "x":406, "y":131, "isContracted":False, "hasContractedDeps":False, "hasContractedOLs":False, "sid":"", "summary":"test preq summary", "time":"", "is_shortcut":0, "isNew":1, "editNote":"", "tag":"hvd4kis8", "dependencies":[], "resources":[]}]}
        self.patch_data = {"title": "A patched title!"}

    def test_post_list_unauthenticated(self):
        resp = self.api_client.post(self.graph_list_api_url, format='json', data=self.post_data)
        self.assertHttpUnauthorized(resp)

    def auth_verb_graph(self, verb):
        self.api_client.client.login(username=self.username, password=self.username)
        if verb == "post":
            resp = self.api_client.post(self.graph_list_api_url, format='json', data=self.post_data)
        elif verb == "put":
            resp = self.api_client.put(self.graph_detail_api_url, format='json', data=self.post_data)
        self.api_client.client.logout()
        return resp

    def auth_post_graph(self):
        return self.auth_verb_graph("post")

    def auth_put_graph(self):
        return self.auth_verb_graph("put")

    def verify_graph_fields(self):
        graph = Graph.objects.get(id=self.graph_id)
        self.assertEqual(graph.title, self.graph_title)
        self.assertEqual(graph.id, self.graph_id)
        self.assertEqual(graph.concepts.count(), len(self.post_data["concepts"]))
        post_concepts = self.post_data["concepts"]

        # verify the basic text fields
        post_concepts_ids = [pc["id"] for pc in post_concepts]
        post_concepts_titles = [pc["title"] for pc in post_concepts]
        post_concepts_tags = [pc["tag"] for pc in post_concepts]
        for concept in graph.concepts.all():
            self.assertEqual(concept.id in post_concepts_ids, True)
            self.assertEqual(concept.title in post_concepts_titles, True)
            self.assertEqual(concept.tag in post_concepts_tags, True)

    # TODO figure out authentication key
    def test_post_list_session_auth(self):
        # Check how many graphs exist
        self.assertEqual(Graph.objects.count(), 0)
        # create a graph
        resp = self.auth_post_graph()
        self.assertHttpCreated(resp)
        # Verify a new one has been added to the db.
        self.assertEqual(Graph.objects.count(), 1)
        self.verify_graph_fields()

    def test_put_list_session_auth(self):
        # Check how many graphs exist
        self.assertEqual(Graph.objects.count(), 0)
        # create a graph
        resp = self.auth_put_graph()
        self.assertHttpCreated(resp)
        # Verify a new one has been added to the db.
        self.assertEqual(Graph.objects.count(), 1)

    def test_patch_list_unauth(self):
        self.auth_post_graph()
        resp = self.api_client.patch(self.graph_detail_api_url, format='json', data=self.patch_data)
        self.assertHttpUnauthorized(resp)

    def test_patch_detail_session_auth(self):
        self.auth_post_graph()
        self.api_client.client.login(username=self.username, password=self.username)
        resp = self.api_client.patch(self.graph_detail_api_url, format='json', data=self.patch_data)
        self.assertHttpAccepted(resp)
        self.assertEqual(Graph.objects.get(id=self.graph_id).title, self.patch_data["title"])

    def test_patch_id_session_auth(self):
        self.auth_post_graph()
        self.api_client.client.login(username=self.username, password=self.username)
        resp = self.api_client.patch(self.graph_detail_api_url, format='json', data={"id": "a_new_id"})
        self.assertHttpUnauthorized(resp)
        self.assertEqual(Graph.objects.count(), 1)
        self.assertEqual(Graph.objects.all()[0].id, self.graph_id)


        # TODO figure out list/detail urls and write tests to verify
