import cStringIO
import flask
app = flask.Flask(__name__)
import json
import os
import sys
import pdb

import config
import database
import formats
import graphs
import search

"""The API for this server responds to the following requests:

  GET  /dependencies                get a JSON representation of the dependency graph of the supplied concept(s) (specify via the 'concepts' or 'ids' parameter)
  GET  /concepts/<concept_name>     get a JSON representation of <concept_name>              
  GET  search                       process a search query, return a list of JSON objects for the results

EXMAPLES

obtain the full dependency graph for gibbs sampling:

  GET /dependencies?concepts=gibbs_sampling

obtain the full dependency graph for gibbs sampling and indian buffet process:

  GET /dependencies?concepts=gibbs_sampling&concepts=indian_buffet_process

obtain the full dependency graph for gibbs sampling and indian buffet process using their permanent ids:

  GET /dependencies?ids=n4mru8iv&ids=5638xo54

obtain a all data for gibbs sampling:

  GET /concepts/gibbs_sampling

search query:

  GET search?q=gibbs+sampling


Start the server by typing (from /metacademy-application):

  python content_server/server.py 9080 # for port 9080
"""


db = None

NOT_FOUND = 404

CONTENT_TYPES = {'json': 'application/json',
                 'svg': 'image/svg+xml',
                 'dot': 'text/plain',
                 }


def load_graph():
    global db
    if db is None:
        db = database.Database.load(config.CONTENT_PATH)

        # load search index
        search.load_main_index()

def format_graph(full_tags, shortcut_tags, fmt):
    """Return graph in desired format"""
    if fmt == 'json':
        f = cStringIO.StringIO()
        formats.write_graph_json(db, full_tags, shortcut_tags, f)
        return f.getvalue()
    else:
        raise RuntimeError('Unknown format: %s' % fmt)

def get_node_json(tag, shortcut=False):
    load_graph()
    return formats.node_to_json(db, tag, shortcut)

def compute_dependencies(tags):
    load_graph()

    full, short = set(), set()
    for tag in tags:
        curr_full, curr_short = graphs.get_ancestors(db.graph, tag)
        full.update(curr_full)
        short.update(curr_short)
    full = set([tag]).union(full)
    short = short.difference(full)
    return full, short

def compute_relevant(tag):
    load_graph()

    ancestors_full, ancestors_shortcut = graphs.get_ancestors(db.graph, tag)
    descendants_full, descendants_shortcut = graphs.get_descendants(db.graph, tag)
    relevant_full = set([tag]).union(ancestors_full).union(descendants_full)
    relevant_shortcut = ancestors_shortcut.union(descendants_shortcut).difference(relevant_full)
    return relevant_full, relevant_shortcut

def make_response(text, fmt):
    if fmt in CONTENT_TYPES:
        ctype = CONTENT_TYPES[fmt]
    else:
        flask.abort(NOT_FOUND)
    
    resp = flask.make_response(text)
    resp.headers['Content-Type'] = ctype + ';charset=utf-8'
    resp.headers['Access-Control-Allow-Origin'] = '*'
    resp.headers['Access-Control-Max-Age'] = '86400'
    resp.headers['Access-Control-Allow-Headers'] = 'x-requested-with,Content-Type'
    return resp

@app.route('/dependencies')
def do_dependencies():
    args = flask.request.args
    load_graph()
    tags = set()
    if 'concepts' in args:
        query_tags = args.getlist('concepts')
        tags.update([t for t in query_tags if t in db.nodes])
    if 'ids' in args:
        query_ids = args.getlist('ids')
        tags.update([db.id2tag[i] for i in query_ids if i in db.id2tag])
    if len(tags) == 0:
        return make_response('{}', 'json')

    full, shortcut = compute_dependencies(tags)
    text = format_graph(full, shortcut, 'json')

    return make_response(text, 'json')

@app.route('/concepts/<node_name>')
def do_concept(node_name=None):
    args = flask.request.args
    load_graph()
    if node_name not in db.nodes:
        return make_response('{}', 'json')

    shortcut = ('shortcut' in args and args['shortcut'] != '0')

    text = get_node_json(node_name, shortcut=shortcut)

    return make_response(text, 'json')    

@app.route('/list')
def do_list():
    load_graph()
    args = flask.request.args
    results = {}
    if 'course' in args:
        tags = []
        # setval = args['course']
        # TODO load course list
    elif 'ids' in args:
        # TODO should this functionality go under /concepts? (ids to titles, essentially)
        # TODO this is problematic, what if we want to request 500 ids at once? The URL will be too long 
        query_ids = args.getlist('ids')
        tags = [db.id2tag[i] for i in query_ids if i in db.id2tag]
    else:
        tags = [tag for tag in db.nodes]
    
    results = [{'tag': tag, 'id': db.tag2id[tag], 'title': db.nodes[tag].title}
               for tag in tags
               if tag in db.tag2id]    
    text = json.dumps(results)
    return make_response(text, 'json')
    
        
@app.route('/search')
def do_search():
    args = flask.request.args
    if 'q' not in args:
        flask.abort(404)
    q = args['q']

    load_graph()

    tags = search.answer_query(q)
    tags = filter(lambda t: t in db.nodes, tags)
    result_nodes = [db.nodes[t] for t in tags]
    results = [{'tag': node.tag, 'title': node.title, 'summary': node.summary}
               for node in result_nodes]
    text = json.dumps(results)

    # TODO: for security reasons, make the response an object rather than an array
    return make_response(text, 'json')

@app.route('/full_graph')
def do_full_graph():
    load_graph()
    text = json.dumps(db.full_graph_json())
    return make_response(text, 'json')


if __name__ == '__main__':
    if len(sys.argv) >= 2:
        port = int(sys.argv[1])
    else:
        port = 8000
    app.run(debug=config.DEBUG, port=port)

