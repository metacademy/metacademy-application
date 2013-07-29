import cStringIO
import flask
app = flask.Flask(__name__)
import json
import os
import sys

import config
import database
import formats
import graphs
import search

"""This server responds to the following requests:

  GET nodes                           get a JSON object representing the full graph
  GET nodes/node-name                 get the JSON representation of a single node
  GET nodes/node-name?set=map             get the part of the graph that a node depends on
  GET nodes/node-name?set=related         get the part of the graph that's related to a node
                                         (ancestors/descendants)

  GET search                          process a search query, return a list of JSON objects for the results

It can also produce SVG and DOT output for all the graph requests.
You can specify this with a query field in the URL, e.g. (Will be deprecated in frontend V2)

  GET full_graph?format=svg

Example search query:

  GET search?q=gibbs+sampling

Start the server by typing (from the main knowledge-maps directory):

  python content_server/server.py 8000
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
    elif fmt == 'dot':
        f = cStringIO.StringIO()
        formats.write_graph_dot(db, full_tags, shortcut_tags, f, bottom_up=True)
        return f.getvalue()
    elif fmt == 'svg':
        dotfile = os.path.join(config.TEMP_PATH, 'graph.dot')
        svgfile = os.path.join(config.TEMP_PATH, 'graph.svg')
        formats.write_graph_dot(db, full_tags, shortcut_tags, open(dotfile, 'w'), bottom_up=True)
        os.system('dot -Tsvg %s -o %s' % (dotfile, svgfile))
        return open(svgfile, 'rb').read()
    else:
        raise RuntimeError('Unknown format: %s' % fmt)

def get_node_json(tag):
    load_graph()
    return formats.node_to_json(db, tag)

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
        flask.abort(NOT_FOUND)

    full, shortcut = compute_dependencies(tags)
    text = format_graph(full, shortcut, 'json')

    return make_response(text, 'json')
    
    

@app.route('/nodes/<node_name>')
def do_single_node(node_name=None):
    args = flask.request.args

    load_graph()
    if node_name in db.nodes:
        tag = node_name
    elif node_name in db.id2tag:
        tag = db.id2tag[node_name]
    else:
        flask.abort(NOT_FOUND)
    
    if 'set' in args:
        dset = args['set']
    else:
        dset = 'single'

    if 'format' in args:
        fmt = args['format'][0]
    else:
        fmt = 'json'

    if dset == 'single':
        assert fmt == 'json'
        text = get_node_json(tag)
    elif dset == 'related':
        full, shortcut = compute_relevant(tag)
        text = format_graph(full, shortcut, fmt)
    elif dset == 'map':
        full, shortcut = compute_dependencies(tag)
        text = format_graph(full, shortcut, fmt)
    else:
        flask.abort(NOT_FOUND)

    return make_response(text, fmt)

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


if __name__ == '__main__':
    if len(sys.argv) >= 2:
        port = int(sys.argv[1])
    else:
        port = 8000
    app.run(debug=config.DEBUG, port=port)

