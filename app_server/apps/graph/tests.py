import datetime
import pdb
import ast
import json

from django.contrib.auth.models import User
from django.test.client import Client
from django.core.urlresolvers import reverse
from tastypie.test import ResourceTestCase

from apps.graph.models import Graph, Concept, Edge, ConceptResource
from apps.user_management.models import Profile
from test_data.data import THREE_NODE_GRAPH, THREE_CONCEPT_LIST, SINGLE_CONCEPT

class BaseResourceTest(ResourceTestCase):
    """
    base resource test for graph related models
    """

    def setUp(self):
        super(BaseResourceTest, self).setUp()
        # Create a normal user.
        self.username = 'test' # use un as pw
        self.user = User.objects.create_user(self.username, 'test@example.com', self.username)
        self.prof = Profile(user=self.user)
        self.prof.save()
        self.user.save()


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
        self.post_data = THREE_NODE_GRAPH
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

class ConceptResourceTest(BaseResourceTest):
    def setUp(self):
        super(ConceptResourceTest, self).setUp()
        self.concept_list_url = "/graphs/api/v1/concept/"
        self.concept_detail_url = self.concept_list_url + SINGLE_CONCEPT["id"] + "/"
        self.list_data = THREE_CONCEPT_LIST
        self.detail_data = SINGLE_CONCEPT

    def verb_concept(self, url=None, *args, **kwargs):
        resp = None
        verb = kwargs.pop("verb", None)
        data= kwargs.pop("data", None)
        if verb == "post":
            resp = self.api_client.post(url, format='json', data=data)
        elif verb == "put":
            resp = self.api_client.put(url, format='json', data=data)
        elif verb == "patch":
            resp = self.api_client.patch(url, format='json', data=data)
        elif verb == "get":
            resp = self.api_client.get(url)
        else:
            raise Exception("verb_concept argument 'verb' must be post, put, patch, or get not '" + verb + "'")
        return resp

    def verb_concept_detail(self, *args, **kwargs):
        return self.verb_concept(url=self.concept_detail_url, **kwargs)

    def verb_concept_list(self, *args, **kwargs):
        return self.verb_concept(url=self.concept_list_url, **kwargs)

    def auth_verb_concept(self, *args, **kwargs):
        vtype = kwargs.pop("vtype", None)
        resp = None
        self.api_client.client.login(username=self.username, password=self.username)
        if vtype == "list":
            resp = self.verb_concept_list(**kwargs)
        elif vtype == "detail":
            resp = self.verb_concept_detail(**kwargs)
        else:
            raise Exception("auth_verb_concept argument 'vtype' must be 'list' or 'detail', not '" + vtype + "'")
        self.api_client.client.logout()
        return resp

    def test_put_list_unauth(self):
        resp = self.verb_concept_list(verb="put", data=self.list_data)
        self.assertHttpUnauthorized(resp)

    def test_put_list_auth(self):
        resp = self.auth_verb_concept(verb="put", vtype="list", data=self.list_data)
        self.assertHttpOK(resp)
        self.assertEqual(Concept.objects.count(), len(self.list_data["objects"]))
        for in_concept in self.list_data["objects"]:
            self.verify_db_concept(in_concept)

    def test_patch_list_unauth(self):
        # TODO
        pass

    def test_patch_list_auth(self):
        # TODO
        pass

    def test_get_list_unauth(self):
        self.auth_verb_concept(verb="put", vtype="list", data=self.list_data)
        resp = self.verb_concept_list(verb="get")
        self.assertHttpOK(resp)
        for in_concept in json.loads(resp.content)["objects"]:
            self.verify_db_concept(in_concept)

    def test_get_list_auth(self):
        self.auth_verb_concept(verb="put", vtype="list", data=self.list_data)
        resp = self.auth_verb_concept(vtype="list", verb="get")
        self.assertHttpOK(resp)
        for in_concept in json.loads(resp.content)["objects"]:
            self.verify_db_concept(in_concept)

    def test_post_list_unauth(self):
        resp = self.verb_concept_list(verb="post", data=self.detail_data)
        self.assertHttpUnauthorized(resp)

    def test_post_list_auth(self):
        resp = self.auth_verb_concept(verb="post", vtype="list", data=self.detail_data)
        self.assertHttpCreated(resp)
        self.assertEqual(Concept.objects.count(), 1)
        self.verify_db_concept(self.detail_data)

    def test_put_detail_unauth(self):
        resp = self.verb_concept_detail(verb="put", data=self.detail_data)
        self.assertHttpUnauthorized(resp)

    def test_put_detail_auth(self):
        resp = self.auth_verb_concept(verb="put", vtype="detail", data=self.detail_data)
        self.assertHttpCreated(resp)
        self.assertEqual(Concept.objects.count(), 1)
        self.verify_db_concept(self.detail_data)

    def test_patch_detail_unauth(self):
        # TODO
        pass

    def test_patch_detail_auth(self):
        # TODO
        pass

    def test_get_detail_unauth(self):
        self.auth_verb_concept(verb="put", vtype="detail", data=self.detail_data)
        resp = self.verb_concept_detail(verb="get")
        # resp = self.verb_concept_list(verb="get")
        self.assertHttpOK(resp)
        self.verify_db_concept(json.loads(resp.content))

    def test_get_detail_auth(self):
        self.auth_verb_concept(verb="put", vtype="detail", data=self.detail_data)
        resp = self.auth_verb_concept(verb="get", vtype="detail")
        self.assertHttpOK(resp)
        self.verify_db_concept(json.loads(resp.content))

    # TODO need to test different id/tag (not allowed by default user)
    # TODO need to test changing accepted concepts
