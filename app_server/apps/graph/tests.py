import pdb
import ast
import json
import unittest
import copy

from django.contrib.auth.models import User
from tastypie.test import ResourceTestCase

from apps.graph.models import Graph, Dependency, Concept, ConceptResource
from apps.user_management.models import Profile
from test_data.data import three_node_graph, three_concept_list, single_concept, two_dependency_list, concept1, concept2, concept3, dependency1, dependency2


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
            self.assertEqual(in_graph[atrb], getattr(graph, atrb))
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
        flat_attrs = ["id", "tag", "title", "pointers", "software", "exercises", "summary"]
        for attr in flat_attrs:
            self.assertEqual(in_concept[attr], getattr(concept, attr))

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

    def succeeds(self):
        return self.correct_response_code() in ['OK', 'Created', 'Accepted']

    def check_response_code(self, resp):
        rc = self.correct_response_code()

        # treat successful response codes as interchangeable
        if rc == 'OK' and resp.status_code in [200, 201, 202, 204]:
            return

        getattr(self, 'assertHttp' + rc)(resp)


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
        if verb == "create":
            no_dep_data = copy.deepcopy(self.post_data)
            no_dep_data["dependencies"] = []
            #resp1 = self.api_client.post(self.graph_list_api_url, format='json', data=no_dep_data)
            resp1 = self.api_client.put(self.graph_list_api_url + self.graph_id + "/", format='json', data=no_dep_data)
            resp2 = self.api_client.put(self.graph_list_api_url + self.graph_id + "/", format='json', data=self.post_data)
            return resp1, resp2
        # TODO should we test PUT separately?
        elif verb == "get":
            resp = self.api_client.get(self.graph_detail_api_url)
        return resp

    def auth_verb_graph(self, verb):
        self.api_client.client.login(username=self.username, password=self.username)
        resps = self.verb_graph(verb)
        self.api_client.client.logout()
        return resps

    def auth_create_graph(self):
        return self.auth_verb_graph("create")

    # def auth_put_graph(self):
    #     return self.auth_verb_graph("put")

    def test_create_list_unauthenticated(self):
        (resp1, resp2) = self.verb_graph("create")
        self.assertHttpUnauthorized(resp1)
        self.assertHttpUnauthorized(resp2)

    # TODO figure out authentication key
    def test_create_list_session_auth(self):
        # temporary
        import config; config.TCLSA = True
        
        # Check how many graphs exist
        self.assertEqual(Graph.objects.count(), 0)
        # create a graph
        #pdb.set_trace()
        resp1, resp2 = self.auth_create_graph()
        self.assertHttpCreated(resp1)
        self.assertEqual(resp2.status_code, 204)  # 204 = no content
        # Verify a new one has been added to the db.
        self.assertEqual(Graph.objects.count(), 1)
        self.verify_db_graph(self.post_data)

    # def test_put_list_session_auth(self):
    #     # Check how many graphs exist
    #     self.assertEqual(Graph.objects.count(), 0)
    #     # create a graph
    #     resp = self.auth_put_graph()
    #     self.assertHttpCreated(resp)
    #     # Verify a new one has been added to the db.
    #     self.assertEqual(Graph.objects.count(), 1)
    #     self.verify_db_graph(self.post_data)

    def test_patch_list_unauth(self):
        self.auth_create_graph()
        resp = self.api_client.patch(self.graph_detail_api_url, format='json', data=self.patch_data)
        self.assertHttpUnauthorized(resp)

    def test_patch_detail_session_auth(self):
        self.auth_create_graph()
        self.api_client.client.login(username=self.username, password=self.username)
        resp = self.api_client.patch(self.graph_detail_api_url, format='json', data=self.patch_data)
        self.assertHttpAccepted(resp)
        self.assertEqual(Graph.objects.get(id=self.graph_id).title, self.patch_data["title"])

    def test_patch_id_session_auth(self):
        self.auth_create_graph()
        self.api_client.client.login(username=self.username, password=self.username)
        resp = self.api_client.patch(self.graph_detail_api_url, format='json', data={"id": "a_new_id"})
        self.assertHttpUnauthorized(resp)
        self.assertEqual(Graph.objects.count(), 1)
        self.assertEqual(Graph.objects.all()[0].id, self.graph_id)

    def get_detail_test(self, auth=False):
        self.auth_create_graph()
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
        self.auth_create_graph()
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

    def list_data(self):
        return three_concept_list()

    def detail_data(self):
        return single_concept()

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
        tdata = self.detail_data()
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
        try:
            self.assertHttpOK(resp)
        except:
            self.assertEqual(resp.status_code, 204)
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

    def list_data(self):
        return three_concept_list(self.tag_match)

    def detail_data(self):
        return single_concept(self.tag_match)

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
            return 'MethodNotAllowed'
        if self.vtype == 'list' and self.verb == 'patch':
            return 'MethodNotAllowed'

        # nobody can PUT to a list
        if self.vtype == 'list' and self.verb == 'put':
            return 'MethodNotAllowed'

        # patch to nonexistent resource
        if self.vtype == 'detail' and self.verb == 'patch' and self.existing_concept == 'none':
            return 'NotFound'

        # legal PUT, POST, or PATCH request
        if self.user_type == 'super':
            return 'OK'
        elif self.user_type == 'auth':
            if not self.tag_match:
                return 'Unauthorized'
            if self.existing_concept == 'accepted':
                return 'Unauthorized'
            return 'OK'
        elif self.user_type == 'unauth':
            return 'Unauthorized'


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
        elif self.verb == 'patch' and self.vtype == 'detail' and self.succeeds():
            full_data = self.detail_data()
            if self.existing_concept == 'accepted':
                full_data['tag'] = 'nomatch'
            for k, v in self.get_data().items():
                full_data[k] = v
            self.verify_db_concept(full_data)
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
        if self.vtype == 'detail' and self.verb == 'patch':
            return {'title': 'new title'}
        elif self.data_type() == 'list':
            data = self.list_data()
        elif self.data_type() == 'detail':
            data = self.detail_data()
        elif self.data_type() == 'none':
            data = None
        else:
            raise RuntimeError('Unknown data_type: %s' % self.data_type())

        return data

    def tst_auth(self):
        # name disguised so test discoverer doesn't pick it up
        
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


class DependencyResourceAuthTest(BaseConceptResourceTest):
    def __init__(self, verb, vtype, user_type, dependency_exists):
        BaseResourceTest.__init__(self, 'tst_auth')
        self.verb = verb
        self.vtype = vtype
        self.user_type = user_type
        self.dependency_exists = dependency_exists

        if self.dependency_exists:
            self.initial_count = 2
        else:
            self.initial_count = 0


    def dependency_list_url(self):
        return '/graphs/api/v1/dependency/'

    def dependency_detail_url(self, dep_id):
        return self.dependency_list_url() + dep_id + '/'


    def __str__(self):
        return 'DependencyResourceAuthTest(verb=%s, vtype=%s, user_type=%s, dependency_exists=%s)' % \
               (self.verb, self.vtype, self.user_type, self.dependency_exists)

    def setUp(self):
        super(DependencyResourceAuthTest, self).setUp()

        # login as superuser
        self.api_client.client.login(username=self.super_username, password=self.super_username)

        # add initial concepts
        for concept in [concept1(False), concept2(False), concept3(False)]:
            self.api_client.post(self.concept_list_url, format='json', data=concept)

        if self.dependency_exists:
            # add initial dependencies
            for dep in [dependency1(), dependency2()]:
                self.api_client.post(self.dependency_list_url(), format='json', data=dep)

        # log out superuser
        self.api_client.client.logout()

    def get_data(self):
        if self.vtype == 'list' and self.verb != 'post':
            return two_dependency_list()
        else:
            return dependency1()

    def verb_dependency(self, verb, vtype, data, user_type):
        resp = None

        if vtype == "detail":
            url = self.dependency_detail_url(dependency1()['id'])
        elif vtype == "list":
            url = self.dependency_list_url()
        else:
            raise RuntimeError("Unrecognized vtype: %s" % vtype)

        if user_type == "super":
            self.api_client.client.login(username=self.super_username, password=self.super_username)
        elif user_type == "non_editor":
            self.api_client.client.login(username=self.username, password=self.username)
        elif user_type == "anon":
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

        if user_type != 'anon':
            self.api_client.client.logout()

        return resp




    def correct_response_code(self):
        if self.verb == 'get':
            if self.vtype == 'list' or self.dependency_exists:
                return 'OK'
            else:
                return 'NotFound'

        if self.vtype == 'detail' and self.verb == 'post':
            return 'MethodNotAllowed'
        if self.vtype == 'list' and self.verb == 'patch':
            return 'MethodNotAllowed'

        # nobody can PUT to a list
        if self.vtype == 'list' and self.verb == 'put':
            return 'MethodNotAllowed'

        # PATCH to nonexistent dependency
        if self.vtype == 'detail' and self.verb == 'patch' and not self.dependency_exists:
            return 'NotFound'

        # legal PUT, POST, or PATCH request
        if self.user_type in ['anon', 'non_editor']:
            return 'Unauthorized'
        elif self.user_type in ['editor', 'super']:
            return 'OK'
        else:
            raise RuntimeError('Unknown user_type: %s' % self.user_type)

    def verify_db_dependency(self, in_dep):
        dep = Dependency.objects.get(id=in_dep['id'])

        def extract_id(uri):
            return uri.split('/')[-2]
        
        self.assertEqual(dep.source.id, extract_id(in_dep['source']))
        self.assertEqual(dep.target.id, extract_id(in_dep['target']))
        self.assertEqual(dep.reason, in_dep['reason'])
        self.assertEqual(set(sg.id for sg in dep.source_goals.all()),
                         set(map(extract_id, in_dep['source_goals'])))
        self.assertEqual(set(sg.id for sg in dep.target_goals.all()),
                         set(map(extract_id, in_dep['target_goals'])))
        

    def check_result(self, resp, data):
        # check results of GET operations against database
        if self.verb == 'get' and self.vtype == 'list' and self.succeeds():
            objects = json.loads(resp.content)['objects']
            self.assertEqual(len(objects), self.initial_count)
            for in_dep in objects:
                self.verify_db_dependency(in_dep)
        if self.verb == 'get' and self.vtype == 'detail' and self.succeeds():
            self.verify_db_dependency(json.loads(resp.content))

        # check successful modification operations
        if self.verb == 'post' and self.succeeds():
            self.verify_db_dependency(data)
        if self.verb == 'put' and self.vtype == 'detail' and self.succeeds():
            self.verify_db_dependency(data)
        if self.verb == 'put' and self.vtype == 'list' and self.succeeds():
            self.assertEqual(len(Concept.objects.all()),len(data['objects']))

        # check that unsuccessful modifications don't do anything
        if self.verb in ['put', 'post', 'patch'] and not self.succeeds():
            self.assertEqual(len(Dependency.objects.all()), self.initial_count)

    def tst_auth(self):
        # name disguised so test discoverer doesn't pick it up
        if self.verb == 'patch':
            raise unittest.SkipTest()
        if self.user_type == 'editor':
            raise unittest.SkipTest()

        data = self.get_data()
        resp = self.verb_dependency(verb=self.verb, vtype=self.vtype, data=data, user_type=self.user_type)
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

    for verb in ['get', 'post', 'put', 'patch']:
        for vtype in ['detail', 'list']:
            for user_type in ['anon', 'non_editor', 'editor', 'super']:
                for dependency_exists in [False, True]:
                    suite.addTest(DependencyResourceAuthTest(verb, vtype, user_type, dependency_exists))

    return suite
