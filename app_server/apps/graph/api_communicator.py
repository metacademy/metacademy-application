"""
Communicates programatically with the api
e.g. see http://django-tastypie.readthedocs.org/en/latest/search.html?q=build_bundle&check_keywords=yes&area=default
"""
import pdb
import requests
import json

from django.contrib.auth.models import User
try:
    from settings_local import tmp_super_user, tmp_super_pw
except:
    pass

from apps.graph.api import get_api_object, GraphResource, ConceptResource, DependencyResource, TargetGraphResource

from config import DEBUG

ss = None


# for security, this should not be used in production
# comment out after using
def _post_to_api(purl, pdata):
    global ss
    if not DEBUG:
        raise Exception("for security, api posts only allowed in debug mode")
    try:
        # login

        if not User.objects.all().filter(username=tmp_super_user).exists():
            User.objects.create_superuser(tmp_super_user, "tmp@metacademy.org", tmp_super_pw)
        # TODO switch to auth keys once it's implemented
        if not ss:
            ss = requests.Session()
            lresp = ss.get("http://127.0.0.1:8080/user/login")
            ss.post("http://127.0.0.1:8080/user/login",
                    data={"username": tmp_super_user, "password": tmp_super_pw},
                    cookies=lresp.cookies,
                    headers={"X-CSRFToken": lresp.cookies["csrftoken"]},
                    allow_redirects=True)

        pheaders = {
            "Content-Type": "application/json"
        }
        resp = ss.post(purl, data=json.dumps(pdata), headers=pheaders)
        if not resp.ok:
            print resp.text
            pdb.set_trace()
    finally:
        tmp_user = User.objects.get(username=tmp_super_user)
        tmp_user.delete()


def get_graph(request, gid, serialize=True):
    """
    get json graph object for the given graph id (gid) and django http request object
    """
    return get_api_object(GraphResource, request, gid, serialize=serialize)


def get_concept(request, cid, serialize=True):
    """
    get concept object for the given concept id (cid) and django http request object
    """
    return get_api_object(ConceptResource, request, cid, serialize=serialize)


def get_dependency(request, did, serialize=True):
    """
    get dependency object for the given dependency id (did) and django http request object
    """
    return get_api_object(DependencyResource, request, did, serialize=serialize)


def post_concept(cdata):
    # TODO fix hardcoding
    return _post_to_api("http://127.0.0.1:8080/graphs/api/v1/concept/", cdata)


def post_dependency(ddata):
    return _post_to_api("http://127.0.0.1:8080/graphs/api/v1/dependency/", ddata)
