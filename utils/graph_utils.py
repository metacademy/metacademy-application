"""
graph_utils.py

Functions to extract information from a graph (TODO make this a GraphProcessor object?)
"""
import cStringIO
import os
import config
from utils import formats, graphs


nodes = None
graph = None

def load_graph():
    global nodes, graph
    if nodes is None:
        nodes = formats.read_nodes(config.CONTENT_PATH)
        nodes = graphs.remove_missing_links(nodes)
        graph = graphs.Graph.from_node_dependencies(nodes)

def format_graph(nodes, graph, fmt):
    if fmt == 'json':
        f = cStringIO.StringIO()
        formats.write_graph_json(nodes, graph, f)
        return f.getvalue()
    elif fmt == 'dot':
        f = cStringIO.StringIO()
        formats.write_graph_dot(nodes, graph, f)
        return f.getvalue()
    elif fmt == 'svg':
        dotfile = os.path.join(config.TEMP_PATH, 'graph.dot')
        svgfile = os.path.join(config.TEMP_PATH, 'graph.svg')
        formats.write_graph_dot(nodes, graph, open(dotfile, 'w'))
        os.system('dot -Tsvg %s -o %s' % (dotfile, svgfile))
        return open(svgfile, 'rb').read()
    else:
        raise RuntimeError('Unknown format: %s' % fmt)

def get_all_nodes(fmt):
    load_graph()
    return format_graph(nodes, graph, fmt)

def get_related_nodes(tag, fmt):
    load_graph()

    ancestors = graphs.ancestors_set(nodes, graph, tag)
    descendants = graphs.descendants_set(nodes, graph, tag)
    relevant = set([tag]).union(ancestors).union(descendants)
    rel_nodes = {tag: node for tag, node in nodes.items() if tag in relevant}
    rel_nodes = graphs.remove_missing_links(rel_nodes)
    rel_graph = graphs.Graph.from_node_dependencies(rel_nodes)

    return format_graph(rel_nodes, rel_graph, fmt)

def get_node_json(tag):
    load_graph()
    return formats.node_to_json(nodes, tag)

def get_map( tag, fmt):
    load_graph()

    ancestors = graphs.ancestors_set(nodes, graph, tag)
    relevant = set([tag]).union(ancestors)
    rel_nodes = {tag: node for tag, node in nodes.items() if tag in relevant}
    rel_nodes = graphs.remove_missing_links(rel_nodes)
    rel_graph = graphs.Graph.from_node_dependencies(rel_nodes)

    return format_graph(rel_nodes, rel_graph, fmt)