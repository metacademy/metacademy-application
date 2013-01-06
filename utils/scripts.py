import os

import formats
import graphs



def generate_full_graph(path, outp_title, create_json=True):
    """Construct the full knowledge graph.

    path -- the location of the content, e.g. knoweldge-maps/content
    dot_file -- the output .dot file
    svg_file -- the output .svg file
    """
    nodes = formats.read_nodes(path)
    nodes = graphs.remove_missing_links(nodes)
    graph = graphs.Graph.from_node_dependencies(nodes)
    formats.write_graph(nodes, graph, outp_title, create_json)
    os.system('dot -Tsvg %s.dot -o %s.svg' % (outp_title, outp_title))

def visualize_related_nodes(path, tag, outp_title, create_json=True):
    """Construct the knowledge graph limited to the ancestors and descendants of a given node.
    Useful for understanding the bottleneck scores.

    path -- the location of the content, e.g. knoweldge-maps/content
    tag -- the tag to find ancestors and descendants of
    dot_file -- the output .dot file
    svg_file -- the output .svg file
    """
    nodes = formats.read_nodes(path) # TODO should we always read all nodes?
    nodes = graphs.remove_missing_links(nodes)
    graph = graphs.Graph.from_node_dependencies(nodes)

    ancestors = graphs.ancestors_set(nodes, graph, tag)
    descendants = graphs.descendants_set(nodes, graph, tag)
    relevant = set([tag]).union(ancestors).union(descendants)
    nodes = {tag: node for tag, node in nodes.items() if tag in relevant}
    nodes = graphs.remove_missing_links(nodes)
    graph = graphs.Graph.from_node_dependencies(nodes)
    
    formats.write_graph(nodes, graph, outp_title, create_json)
    os.system('dot -Tsvg %s.dot -o %s.svg' % (outp_title, outp_title))

if __name__ == "__main__":
    path = '/Users/cradreed/SideProjects/knowledge-maps/content/'
    generate_full_graph(path,'/Users/cradreed/SideProjects/knowledge-maps/frontend/maps/full_graph')
    visualize_related_nodes(path, 'variational-bayes', '/Users/cradreed/SideProjects/knowledge-maps/frontend/maps/subset', create_json=True)