import datetime
import pdb

from django.contrib.auth.models import User
from django.test.client import Client
from django.core.urlresolvers import reverse

from tastypie.test import ResourceTestCase
from apps.graph.models import Graph
from apps.user_management.models import Profile

class GraphResourceTest(ResourceTestCase):

    def setUp(self):
        super(GraphResourceTest, self).setUp()
        # Create a normal user.
        self.username = 'test' # use un as pw
        self.user = User.objects.create_user(self.username, 'test@example.com', self.username)
        self.prof = Profile(user=self.user)
        self.prof.save()
        self.user.save()
        # TODO this will likely change
        self.graph_api_url = "/graphs/api/v1/graph/"

        # The data we'll send on POST requests - copied from an actual post request
        self.post_data = {"id":"4dt4kusg",
                          "title":"A Test Title",
                          "concepts":[{"title":"test concept",
                                       "id":"kf9fp5hy",
                                       "exercises":"",
                                       "flags":[],
                                       "useCsrf":True,
                                       "goals":"",
                                       "pointers":"",
                                       "software":"",
                                       "x":519,
                                       "y":198,
                                       "isContracted":False,
                                       "hasContractedDeps":False,
                                       "hasContractedOLs":False,
                                       "sid":"",
                                       "summary":"A test summary",
                                       "time":"",
                                       "is_shortcut":0,
                                       "isNew":1,
                                       "editNote":"",
                                       "tag":"kf9fp5hy",
                                       "dependencies":[{"source":"hvd4kis8",
                                                        "id":"hvd4kis8kf9fp5hy",
                                                        "sid_source":"hvd4kis8",
                                                        "sid_target":"kf9fp5hy",
                                                        "reason":"a test reason",
                                                        "middlePts":[],
                                                        "isContracted":False}],
                                       "resources":[]},
                                      {"title":"test preq",
                                       "id":"hvd4kis8",
                                       "exercises":"",
                                       "flags":[],
                                       "useCsrf":True,
                                       "goals":"test ",
                                       "pointers":"",
                                       "software":"",
                                       "x":406,
                                       "y":131,
                                       "isContracted":False,
                                       "hasContractedDeps":False,
                                       "hasContractedOLs":False,
                                       "sid":"",
                                       "summary":"test preq summary",
                                       "time":"",
                                       "is_shortcut":0,
                                       "isNew":1,
                                       "editNote":"",
                                       "tag":"hvd4kis8",
                                       "dependencies":[],
                                       "resources":[]}]}

    def get_credentials(self):
        return self.create_basic(username=self.username, password=self.username)

    def test_post_list_unauthenticated(self):
        resp = self.api_client.post(self.graph_api_url, format='json', data=self.post_data)
        self.assertHttpUnauthorized(resp)

    # TODO figure out authentication key
    # def test_post_list(self):
    #     # Check how many are there first.
    #     self.assertEqual(Graph.objects.count(), 0)
    #     pdb.set_trace()
    #     resp = self.api_client.post(self.graph_api_url, format='json', data=self.post_data, authentication=self.get_credentials())
    #     self.assertHttpCreated(resp)
    #     # Verify a new one has been added.
    #     self.assertEqual(Graph.objects.count(), 1)


        # TODO figure out list/detail urls and write tests to verify
