import datetime
import pdb
import ast
import json
import unittest

from django.contrib.auth.models import User
from django.test.client import Client
from django.core.urlresolvers import reverse
from tastypie.test import ResourceTestCase

from apps.graph.models import Graph, Concept, Edge, ConceptResource
from apps.user_management.models import Profile
from test_data.data import three_node_graph, three_concept_list, single_concept

class BaseResourceTest(ResourceTestCase):
    """
    base resource test for graph related models
    """

    def setUp(self):
        super(BaseResourceTest, self).setUp()

        # Create a normal user.
        self.username = 'test' # use un as pw
        user = User.objects.create_user(self.username, 'test@example.com', self.username)
        prof = Profile(user=user)
        prof.save()
        user.save()

        # create a super user
        self.super_username = 'super_test' # use un as pw
        suser = User.objects.create_superuser(self.super_username, self.super_username + "@test.com", self.super_username)
        suser.save()
        sprof = Profile(user=suser)
        sprof.save()

    def verify_db_graph(self, in_graph):
        """
        verify in_graph (python obj) corresponds with the associated graph in the db
        """
        graph = Graph.objects.get(id=self.graph_id)

        # check the flat attribs
        flat_attrs = ["title", "id"]
        for atrb in flat_attrs:
            self.assertEqual(in_graph[atrb], getattr(graph,atrb))
        self.assertEqual(graph.concepts.count(), len(in_graph["concepts"]))

        # verify concepts in graph
        post_concepts = in_graph["concepts"]
        self.assertEqual(len(post_concepts), graph.concepts.count())
        for in_concept in post_concepts:
            self.verify_db_concept(in_concept)

    def verify_db_concept(self, in_concept):
        """
        Arguments:
        - `in_concept`: a python dictionary obj with the desired concept attributes
        """

        concept = Concept.objects.get(id=in_concept["id"])
        # verify flat attributes
        flat_attrs = ["id", "tag", "title", "goals", "pointers", "software", "exercises", "summary"]
        for attr in flat_attrs:
            self.assertEqual(in_concept[attr], getattr(concept, attr))

        ## verify complex attributes ##

        # verify dependencies
        for in_dep in in_concept["dependencies"]:
            if in_dep.has_key("id"):
                dep = Edge.objects.get(id=in_dep["id"])
                self.assertEqual(dep.id, in_dep["id"])
            else:
                dep = Edge.objects.get(source=in_dep["source"], target=concept.id)
            self.assertEqual(dep.source, in_dep["source"])
            self.assertEqual(dep.target, concept.id)
            self.assertEqual(dep.reason, in_dep["reason"])

        # verify resources
        res_flat_attrs = ["id", "title", "url", "specific_url_base", "resource_type", "edition", "extra", "note", "level", "description"]
        res_eval_attrs = ["location", "additional_dependencies", "authors"]
        res_int_attrs = ["year"]
        res_boolean_attrs = ["core", "free", "requires_signup"]

        all_attribs = set().union(res_eval_attrs).union(res_int_attrs).union(res_boolean_attrs)
        for in_res in in_concept["resources"]:
            res = ConceptResource.objects.get(id=in_res["id"])
            for atrb in all_attribs:
                if in_res.has_key(atrb):
                    if atrb in res_flat_attrs:
                        self.assertEqual(unicode(in_res[atrb]), getattr(res, atrb))
                    elif atrb in res_eval_attrs:
                        self.assertEqual(in_res[atrb], ast.literal_eval(getattr(res, atrb)))
                    elif atrb in res_int_attrs:
                        self.assertEqual(int(in_res[atrb]), getattr(res, atrb))
                    elif atrb in res_boolean_attrs:
                        self.assertEqual(bool(int(in_res[atrb])), getattr(res, atrb))

class GraphResourceTest(BaseResourceTest):
    """
    Tests to add:
      - post/patch/put to list
      - delete to list/detail
    """

    def setUp(self):
        super(GraphResourceTest, self).setUp()

        # The data we'll send on POST requests - copied from an actual post request
        self.post_data = three_node_graph()
        self.graph_id = "4dt4kusg"
        self.graph_title = "first graph title"
        self.post_data["id"] = self.graph_id
        self.post_data["title"] = self.graph_title
        self.graph_list_api_url = "/graphs/api/v1/graph/"
        self.graph_detail_api_url = self.graph_list_api_url + self.graph_id + "/"

        self.patch_data = {"title": "A patched title!"}

    def verb_graph(self, verb):
        resp = None
        if verb == "post":
            resp = self.api_client.post(self.graph_list_api_url, format='json', data=self.post_data)
        elif verb == "put":
            resp = self.api_client.put(self.graph_detail_api_url, format='json', data=self.post_data)
        elif verb == "get":
            resp = self.api_client.get(self.graph_detail_api_url)
        return resp

    def auth_verb_graph(self, verb):
        self.api_client.client.login(username=self.username, password=self.username)
        resp = self.verb_graph(verb)
        self.api_client.client.logout()
        return resp

    def auth_post_graph(self):
        return self.auth_verb_graph("post")

    def auth_put_graph(self):
        return self.auth_verb_graph("put")

    def test_post_list_unauthenticated(self):
        resp = self.verb_graph("post")
        self.assertHttpUnauthorized(resp)

    # TODO figure out authentication key
    def test_post_list_session_auth(self):
        # Check how many graphs exist
        self.assertEqual(Graph.objects.count(), 0)
        # create a graph
        resp = self.auth_post_graph()
        self.assertHttpCreated(resp)
        # Verify a new one has been added to the db.
        self.assertEqual(Graph.objects.count(), 1)
        self.verify_db_graph(self.post_data)

    def test_put_list_session_auth(self):
        # Check how many graphs exist
        self.assertEqual(Graph.objects.count(), 0)
        # create a graph
        resp = self.auth_put_graph()
        self.assertHttpCreated(resp)
        # Verify a new one has been added to the db.
        self.assertEqual(Graph.objects.count(), 1)
        self.verify_db_graph(self.post_data)

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

    def get_detail_test(self, auth=False):
        self.auth_post_graph()
        if auth:
            self.api_client.client.login(username=self.username, password=self.username)
        resp = self.api_client.get(self.graph_detail_api_url)
        self.assertValidJSONResponse(resp)
        jgraph = json.loads(resp.content)
        self.verify_db_graph(jgraph)

    def test_get_detail_unauth(self):
        self.get_detail_test()

    def test_get_detail_auth(self):
        self.get_detail_test(auth=True)

    def get_list_test(self, auth=False):
        self.auth_post_graph()
        if auth:
            self.api_client.client.login(username=self.username, password=self.username)
        resp = self.api_client.get(self.graph_list_api_url)
        self.assertValidJSONResponse(resp)
        jgraph_list = json.loads(resp.content)
        self.assertEqual(jgraph_list["meta"]["total_count"], 1)
        self.assertEqual(len(jgraph_list["objects"]), 1)
        jgraph = jgraph_list["objects"][0]
        self.verify_db_graph(jgraph)

    def test_get_list_unauth(self):
        self.get_list_test()

    def test_get_list_auth(self):
        self.get_list_test(auth=True)



    

class BaseConceptResourceTest(BaseResourceTest):
    def setUp(self):
        super(BaseConceptResourceTest, self).setUp()
        self.concept_list_url = "/graphs/api/v1/concept/"
        self.concept_detail_url = self.concept_list_url + single_concept()["id"] + "/"
        self.list_data = three_concept_list()
        self.detail_data = single_concept()

    def verb_concept(self, verb, vtype, data, user_type):
        resp = None

        if vtype == "detail":
            url = self.concept_detail_url
        elif vtype == "list":
            url = self.concept_list_url
        else:
            raise RuntimeError("Unrecognized vtype: %s" % vtype)

        if user_type == "super":
            self.api_client.client.login(username=self.super_username, password=self.super_username)
        elif user_type == "auth":
            self.api_client.client.login(username=self.username, password=self.username)
        elif user_type == "unauth":
            pass
        else:
            raise RuntimeError("Unrecognized user_type: %s" % user_type)
        
        if verb == "post":
            resp = self.api_client.post(url, format='json', data=data)
        elif verb == "put":
            resp = self.api_client.put(url, format='json', data=data)
        elif verb == "patch":
            resp = self.api_client.patch(url, format='json', data=data)
        elif verb == "get":
            resp = self.api_client.get(url)
        else:
            raise RuntimeError("Unknown verb: %s" % verb)

        if user_type in ["super", "auth"]:
            self.api_client.client.logout()
        
        return resp

    def create_concept(self, provisional):
        tdata = self.detail_data.copy()
        if not provisional:
            tdata["tag"] = "nomatch"
        return self.verb_concept(verb="put", vtype="detail", user_type="super", data=tdata), tdata

class ConceptResourceTest(BaseConceptResourceTest):
    def test_put_detail_accepted_concept_normal_user(self):
        # create an "accepted" concept
        fresp, tdata = self.create_concept(False)
        otitle = tdata["title"]
        tdata["title"] = "a different title"
        #resp = self.auth_verb_concept(verb="put", vtype="detail", data=tdata)
        resp = self.verb_concept(verb="put", vtype="detail", user_type="auth", data=tdata)
        self.assertHttpUnauthorized(resp)
        self.assertEqual(Concept.objects.all()[0].title, otitle)

    def test_put_detail_accepted_concept_super_user(self):
        # create an "accepted" concept
        fresp, tdata = self.create_concept(False)
        otitle = tdata["title"]
        tdata["title"] = "a different title"
        #resp = self.super_auth_verb_concept(verb="put", vtype="detail", data=tdata)
        resp = self.verb_concept(verb="put", vtype="detail", user_type="super", data=tdata)
        self.assertHttpOK(resp)
        self.assertEqual(Concept.objects.all()[0].title, tdata["title"])


class ConceptResourceAuthTest(BaseConceptResourceTest):
    def __init__(self, verb, vtype, user_type, tag_match, existing_concept):
        self.verb = verb
        self.vtype = vtype
        self.user_type = user_type
        self.tag_match = tag_match
        self.existing_concept = existing_concept
        if existing_concept in ['provisional', 'accepted']:
            self.initial_count = 1
        else:
            self.initial_count = 0
        BaseConceptResourceTest.__init__(self, 'tst_auth')

    def __str__(self):
        return 'ConceptResourceAuthTest(verb=%s, vtype=%s, user_type=%s, tag_match=%s, existing_concept=%s)' % \
               (self.verb, self.vtype, self.user_type, self.tag_match, self.existing_concept)


    def correct_response_code(self):
        if self.verb == 'get':
            if self.existing_concept is not 'none' or self.vtype == 'list':
                return 'OK'
            else:
                return 'NotFound'

        if self.vtype == 'detail' and self.verb == 'post':
            return 'NotImplemented'
        if self.vtype == 'list' and self.verb == 'patch':
            return 'NotImplemented'

        # legal PUT, POST, or PATCH request
        if self.user_type == 'super':
            return 'Created'
        elif self.user_type == 'auth':
            if not self.tag_match:
                return 'Unauthorized'
            if self.existing_concept == 'accepted':
                return 'Unauthorized'
            return 'Created'
        elif self.user_type == 'unauth':
            return 'Unauthorized'

    def succeeds(self):
        return self.correct_response_code() in ['OK', 'Created']

    def check_response_code(self, resp):
        rc = self.correct_response_code()

        # returns 200 instead of 201 for PUT to list, which is fine
        if rc == 'Created' and resp.status_code == 200:
            return
        
        getattr(self, 'assertHttp' + rc)(resp)

    def check_result(self, resp, data):
        # check results of GET operations against database
        if self.verb == 'get' and self.vtype == 'list' and self.succeeds():
            for in_concept in json.loads(resp.content)["objects"]:
                self.verify_db_concept(in_concept)
        if self.verb == 'get' and self.vtype == 'detail' and self.succeeds():
            self.verify_db_concept(json.loads(resp.content))

        # check successful modification operations
        if self.verb == 'post' and self.succeeds():
            self.verify_db_concept(data)
        if self.verb == 'put' and self.vtype == 'detail' and self.succeeds():
            self.verify_db_concept(data)
        if self.verb == 'put' and self.vtype == 'list' and self.succeeds():
            self.assertEqual(len(Concept.objects.all()),len(data['objects']))
            if not self.tag_match:
                self.assertEqual(Concept.objects.get(id=data["objects"][0]["id"]).tag, unicode("nomatch"))
        # TODO: PATCH

        # check that unsuccessful modifications don't do anything
        if self.verb in ['put', 'post', 'patch'] and not self.succeeds():
            self.assertEqual(len(Concept.objects.all()), self.initial_count)


    def data_type(self):
        if self.verb == 'get':
            return 'none'
        elif self.verb == 'put' and self.vtype == 'list':
            return 'list'
        else:
            return 'detail'

    def get_data(self):
        if self.data_type() == 'list':
            data = self.list_data.copy()
            if not self.tag_match:
                data["objects"][0]["tag"] = "nomatch"
        elif self.data_type() == 'detail':
            data = self.detail_data.copy()
            if not self.tag_match:
                data["tag"] = "nomatch"
        elif self.data_type() == 'none':
            data = None
        else:
            raise RuntimeError('Unknown data_type: %s' % self.data_type())

        return data

    def tst_auth(self):
        # name disguised so test discoverer doesn't pick it up
        if self.verb == 'patch':
            raise unittest.SkipTest()

        if self.existing_concept == 'provisional':
            self.create_concept(True)
        elif self.existing_concept == 'accepted':
            self.create_concept(False)
        elif self.existing_concept == 'none':
            pass
        else:
            raise RuntimeError('Unrecognized existing_concept: %s' % self.existing_concept)
            
        data = self.get_data()
        resp = self.verb_concept(verb=self.verb, vtype=self.vtype, data=data, user_type=self.user_type)
        self.check_response_code(resp)
        self.check_result(resp, data)

        

def load_tests(loader, suite, pattern):
    for verb in ['get', 'post', 'put', 'patch']:
        for vtype in ['detail', 'list']:
            for user_type in ['unauth', 'auth', 'super']:
                for tag_match in [False, True]:
                    for existing_concept in ['none', 'provisional', 'accepted']:
                        suite.addTest(ConceptResourceAuthTest(verb, vtype, user_type,
                                                              tag_match, existing_concept))

    return suite

    


