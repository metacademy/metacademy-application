import pdb
import ast
import json
import copy

from django.contrib.auth.models import User
from tastypie.test import ResourceTestCase

from apps.graph.models import Graph, Dependency, Concept, ConceptResource
from apps.user_management.models import Profile
import test_data
from test_data.data import three_node_graph

# TODO are we checking the global resources?

ALLOWED_PAIRS = [('get', 'detail'), ('get', 'list'), ('put', 'detail'), ('patch', 'detail'),
                 ('post', 'list')]


def concept_list_url():
    return '/graphs/api/v1/concept/'


def concept_detail_url(cid):
    return concept_list_url() + cid + '/'


def dependency_list_url():
    return '/graphs/api/v1/dependency/'


def dependency_detail_url(dep_id):
    return dependency_list_url() + dep_id + '/'


class BaseResourceTest(ResourceTestCase):
    """
    base resource test for graph related models
    """

    def setUp(self):
        super(BaseResourceTest, self).setUp()

        # Create a normal user.
        self.username = 'test'  # use un as pw
        user = User.objects.create_user(self.username, 'test@example.com', self.username)
        prof = Profile(user=user)
        prof.save()
        user.save()

        # create a super user
        self.super_username = 'super_test'  # use un as pw
        suser = User.objects.create_superuser(self.super_username, self.super_username + "@test.com", self.super_username)
        suser.save()
        sprof = Profile(user=suser)
        sprof.save()

        self.populate_initial_graph()

    def init_tag_match(self):
        return True

    def data_type(self):
        if self.verb == 'get':
            return 'none'
        elif self.verb == 'put' and self.vtype == 'list':
            return 'list'
        else:
            return 'detail'

    def populate_initial_graph(self):
        # login as superuser
        self.api_client.client.login(username=self.super_username, password=self.super_username)

        for concept in test_data.data.initial_concepts(self.init_tag_match()):
            self.api_client.post(concept_list_url(), format='json', data=concept)
        for dep in test_data.data.initial_dependencies():
            self.api_client.post(dependency_list_url(), format='json', data=dep)

        # log out superuser
        self.api_client.client.logout()

    def detail_data(self):
        return self.list_data()[0]

    def get_request_data(self):
        if self.vtype == 'detail' and self.verb == 'patch':
            return self.patch_data()
        elif self.data_type() == 'list':
            return self.list_data()
        elif self.data_type() == 'detail':
            return self.detail_data()
        elif self.data_type() == 'none':
            return None
        else:
            raise RuntimeError('Unknown data_type: %s' % self.data_type())

    def do_request(self, url, verb, vtype, data, user_type):
        resp = None

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
        res_m2m_attrs = ["goals_covered"]

        all_attribs = set().union(res_eval_attrs).union(res_int_attrs).union(res_boolean_attrs).union(res_m2m_attrs)

        for in_res in in_concept["resources"]:
            res = ConceptResource.objects.get(id=in_res["id"])
            for atrb in all_attribs:
                if atrb in in_res:
                    if atrb in res_flat_attrs:
                        self.assertEqual(unicode(in_res[atrb]), getattr(res, atrb))
                    elif atrb in res_eval_attrs:
                        self.assertEqual(in_res[atrb], ast.literal_eval(getattr(res, atrb)))
                    elif atrb in res_int_attrs:
                        self.assertEqual(int(in_res[atrb]), getattr(res, atrb))
                    elif atrb in res_boolean_attrs:
                        self.assertEqual(bool(int(in_res[atrb])), getattr(res, atrb))
                    elif atrb in res_m2m_attrs:
                        if in_res[atrb] == []:
                            self.assertEqual(getattr(res, atrb).all().count(), 0)
                        else:
                            api_keys = map(lambda akey: akey.split("/")[-2], in_res[atrb])
                            db_keys = map(lambda g: g.id, res.goals_covered.all())
                            for akey in api_keys:
                                # if akey not in db_keys:
                                #     pdb.set_trace()
                                self.assertEqual(akey in db_keys, True)

    def check_result(self, resp, data):
        # check results of GET operations against database
        if self.verb == 'get' and self.vtype == 'list' and self.succeeds():
            for in_concept in json.loads(resp.content)["objects"]:
                self.verify_db_obj(in_concept)
        if self.verb == 'get' and self.vtype == 'detail' and self.succeeds():
            self.verify_db_obj(json.loads(resp.content))

        # check successful modification operations
        if self.verb == 'post' and self.succeeds():
            self.verify_db_obj(data)
        if self.verb == 'put' and self.vtype == 'detail' and self.succeeds():
            self.verify_db_obj(data)
        elif self.verb == 'patch' and self.vtype == 'detail' and self.succeeds():
            full_data = self.detail_data()
            for k, v in self.patch_data().items():
                full_data[k] = v
            self.verify_db_obj(full_data)

        # check that unsuccessful modifications don't do anything
        if self.verb in ['put', 'post', 'patch'] and not self.succeeds():
            self.assertEqual(len(self.objects_in_db()), self.initial_count())


class ResourceAuthTest(BaseResourceTest):
    def __init__(self):
        BaseResourceTest.__init__(self, 'tst_auth')

    def correct_response_code(self):
        if (self.verb, self.vtype) not in ALLOWED_PAIRS:
            return 'MethodNotAllowed'

        if self.verb == 'get':
            if self.vtype == 'list' or self.resource_exists():
                return 'OK'
            else:
                return 'NotFound'

        # PATCH to nonexistent dependency
        if self.vtype == 'detail' and self.verb == 'patch' and not self.resource_exists():
            return 'NotFound'

        if self.user_can_edit():
            return 'OK'
        else:
            return 'Unauthorized'

    def succeeds(self):
        return self.correct_response_code() in ['OK', 'Created', 'Accepted']

    def check_response_code(self, resp):
        rc = self.correct_response_code()

        # treat successful response codes as interchangeable
        if rc == 'OK' and resp.status_code in [200, 201, 202, 204]:
            return

        getattr(self, 'assertHttp' + rc)(resp)

    def tst_auth(self):
        # name disguised so test discoverer doesn't pick it up

        data = self.get_request_data()
        resp = self.do_request(self.resource_url(), verb=self.verb, vtype=self.vtype, data=data,
                               user_type=self.user_type)
        self.check_response_code(resp)
        self.check_result(resp, data)


class ConceptResourceAuthTest(ResourceAuthTest):
    def __init__(self, verb, vtype, user_type, tag_match, existing_concept):
        ResourceAuthTest.__init__(self)
        self.verb = verb
        self.vtype = vtype
        self.user_type = user_type
        self.tag_match = tag_match
        self.existing_concept = existing_concept

    def initial_count(self):
        return len(test_data.data.initial_concepts(True))

    def __str__(self):
        return 'ConceptResourceAuthTest(verb=%s, vtype=%s, user_type=%s, tag_match=%s, existing_concept=%s)' % \
               (self.verb, self.vtype, self.user_type, self.tag_match, self.existing_concept)

    def init_tag_match(self):
        return self.existing_concept == 'provisional'

    def resource_url(self):
        if self.vtype == 'detail':
            return concept_detail_url(self.detail_data()['id'])
        else:
            return concept_list_url()

    def user_can_edit(self):
        return self.user_type == 'super' or \
            (self.user_type == 'auth' and self.tag_match and self.existing_concept != 'accepted')

    def list_data(self):
        if self.existing_concept in ['provisional', 'accepted']:
            return test_data.data.initial_concepts(self.tag_match)
        elif self.existing_concept == 'none':
            return test_data.data.new_concepts(self.tag_match)
        else:
            raise RuntimeError('Unknown existing_concept: %s' % self.existing_concept)

    def patch_data(self):
        if self.tag_match:
            return {'title': 'new title', 'tag': self.detail_data()['id']}
        else:
            return {'title': 'new title', 'tag': 'nomatch'}

    def verify_db_obj(self, in_obj):
        self.verify_db_concept(in_obj)

    def objects_in_db(self):
        return Concept.objects.all()

    def resource_exists(self):
        return self.existing_concept in ['provisional', 'accepted']


class DependencyResourceAuthTest(ResourceAuthTest):

    def __init__(self, verb, vtype, user_type, dependency_exists):
        ResourceAuthTest.__init__(self)
        self.verb = verb
        self.vtype = vtype
        self.user_type = user_type
        self.dependency_exists = dependency_exists

    def init_tag_match(self):
        return False

    def initial_count(self):
        return len(test_data.data.initial_dependencies())

    def resource_url(self):
        if self.vtype == 'detail':
            return dependency_detail_url(self.detail_data()['id'])
        else:
            return dependency_list_url()

    def __str__(self):
        return 'DependencyResourceAuthTest(verb=%s, vtype=%s, user_type=%s, dependency_exists=%s)' % \
               (self.verb, self.vtype, self.user_type, self.dependency_exists)

    def patch_data(self):
        return {'reason': 'because I can'}

    def list_data(self):
        if self.dependency_exists:
            return test_data.data.initial_dependencies()
        else:
            return test_data.data.new_dependencies()

    def user_can_edit(self):
        return self.user_type == 'super'

    def verify_db_obj(self, in_dep):
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

    def objects_in_db(self):
        return Dependency.objects.all()

    def resource_exists(self):
        return self.dependency_exists


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


def load_tests(loader, suite, pattern):
    for verb in ['get', 'post', 'put', 'patch']:
        for vtype in ['detail', 'list']:
            if (verb, vtype) in ALLOWED_PAIRS:
                for user_type in ['unauth', 'auth', 'super']:
                    for tag_match in [False, True]:
                        for existing_concept in ['none', 'provisional', 'accepted']:
                            suite.addTest(ConceptResourceAuthTest(verb, vtype, user_type,
                                                              tag_match, existing_concept))
            else:
                suite.addTest(ConceptResourceAuthTest(verb, vtype, 'super', True, 'none'))

    for verb in ['get', 'post', 'put', 'patch']:
        for vtype in ['detail', 'list']:
            if (verb, vtype) in ALLOWED_PAIRS:
                for user_type in ['unauth', 'auth', 'super']:
                    for dependency_exists in [False, True]:
                        suite.addTest(DependencyResourceAuthTest(verb, vtype, user_type, dependency_exists))
            else:
                suite.addTest(DependencyResourceAuthTest(verb, vtype, 'super', False))

    return suite
