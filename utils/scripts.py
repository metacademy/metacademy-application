import os

import formats
import graphs

import config


def generate_full_graph(path, outp_title):
    """Construct the full knowledge graph.

    path -- the location of the content, e.g. knoweldge-maps/content
    dot_file -- the output .dot file
    svg_file -- the output .svg file
    """
    dot_file = '%s.dot' % outp_title
    svg_file = '%s.svg' % outp_title
    json_file = '%s.json' % outp_title
    
    nodes = formats.read_nodes(path)
    nodes = graphs.remove_missing_links(nodes)
    graph = graphs.Graph.from_node_dependencies(nodes)

    formats.write_graph_dot(nodes, graph, open(dot_file, 'w'))
    os.system('dot -Tsvg %s -o %s' % (dot_file, svg_file))
    formats.write_graph_json(nodes, graph, open(json_file, 'w'))

        

def visualize_related_nodes(path, tag, outp_title):
    """Construct the knowledge graph limited to the ancestors and descendants of a given node.
    Useful for understanding the bottleneck scores.

    path -- the location of the content, e.g. knoweldge-maps/content
    tag -- the tag to find ancestors and descendants of
    dot_file -- the output .dot file
    svg_file -- the output .svg file
    """
    dot_file = '%s.dot' % outp_title
    svg_file = '%s.svg' % outp_title
    json_file = '%s.json' % outp_title
    
    nodes = formats.read_nodes(path) # TODO should we always read all nodes?
    nodes = graphs.remove_missing_links(nodes)
    graph = graphs.Graph.from_node_dependencies(nodes)

    ancestors = graphs.ancestors_set(nodes, graph, tag)
    descendants = graphs.descendants_set(nodes, graph, tag)
    relevant = set([tag]).union(ancestors).union(descendants)
    nodes = {tag: node for tag, node in nodes.items() if tag in relevant}
    nodes = graphs.remove_missing_links(nodes)
    graph = graphs.Graph.from_node_dependencies(nodes)
    
    formats.write_graph_dot(nodes, graph, open(dot_file, 'w'))
    os.system('dot -Tsvg %s -o %s' % (dot_file, svg_file))
    formats.write_graph_json(nodes, graph, open(json_file, 'w'))
