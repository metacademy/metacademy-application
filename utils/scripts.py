import os

import formats
import graphs



def generate_full_graph(path, dot_file, png_file):
    """Construct the full knowledge graph.

    path -- the location of the content, e.g. knoweldge-maps/content
    dot_file -- the output .dot file
    png_file -- the output .png file
    """
    nodes = formats.read_nodes(path)
    nodes = graphs.remove_missing_links(nodes)
    graph = graphs.Graph.from_node_dependencies(nodes)
    formats.write_graph(nodes, graph, dot_file)
    os.system('dot -Tpng %s -o %s' % (dot_file, png_file))

def visualize_related_nodes(path, tag, dot_file, png_file):
    """Construct the knowledge graph limited to the ancestors and descendants of a given node.
    Useful for understanding the bottleneck scores.

    path -- the location of the content, e.g. knoweldge-maps/content
    tag -- the tag to find ancestors and descendants of
    dot_file -- the output .dot file
    png_file -- the output .png file
    """
    nodes = formats.read_nodes(path)
    nodes = graphs.remove_missing_links(nodes)
    graph = graphs.Graph.from_node_dependencies(nodes)

    ancestors = graphs.ancestors_set(nodes, graph, tag)
    descendants = graphs.descendants_set(nodes, graph, tag)
    relevant = set([tag]).union(ancestors).union(descendants)
    nodes = {tag: node for tag, node in nodes.items() if tag in relevant}
    nodes = graphs.remove_missing_links(nodes)
    graph = graphs.Graph.from_node_dependencies(nodes)
    
    formats.write_graph(nodes, graph, dot_file)
    os.system('dot -Tpng %s -o %s' % (dot_file, png_file))
