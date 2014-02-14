"""
Communicates programatically with the api
e.g. see http://django-tastypie.readthedocs.org/en/latest/search.html?q=build_bundle&check_keywords=yes&area=default
"""
import pdb
import requests
import json

from django.contrib.auth.models import User
from settings_local import tmp_super_user, tmp_super_pw

from apps.graph.api import GraphResource
from config import DEBUG


# for security, this should not be used in production
# comment out after using
def _post_to_api(purl, pdata):
    if not DEBUG:
        raise Exception("for security, api posts only allowed in debug mode")
    try:
        # login
        User.objects.create_superuser(tmp_super_user, "tmp@metacademy.org", tmp_super_pw)
        # TODO switch to auth keys once it's implemented
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


def get_graph(request, gid):
    """
    get json graph object for the given graph id (gid) and django http request object
    """
    gr = GraphResource()
    graph = gr.obj_get(gr.build_bundle(request=request), id=gid)
    gr_bundle = gr.build_bundle(obj=graph, request=request)
    return gr.serialize(request, gr.full_dehydrate(gr_bundle), "application/json")


def get_concept(cid):
    pass


def get_concept_dep_graph(cid):
    pass


def post_concept(cdata):
    # TODO fix hardcoding
    return _post_to_api("http://127.0.0.1:8080/graphs/api/v1/concept/", cdata)


def post_dependency(ddata):
    pass
