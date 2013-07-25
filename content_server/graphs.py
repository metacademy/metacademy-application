import os
import pdb
import numpy as np
import scipy.linalg
import config



class Graph:
    """A representation of the dependency graph in a form that's more convenient for graph computations
    like Page Rank or the bottleneck score. Can be used to represent either the dependency graph or
    the see-also graph (or some other kind of graph).

    incoming -- a dict mapping tags to the list of parent tags
    outgoing -- a dict mapping tags to the list of child tags
    edges -- the set of all (from_tag, to_tag) pairs
    """
    def __init__(self, vertices, incoming, outgoing, edges):
        self.vertices = vertices
        self.incoming = incoming
        self.outgoing = outgoing
        self.edges = edges

    def copy(self):
        vertices = set(self.vertices)
        incoming = {tag: list(parents) for tag, parents in self.incoming.items()}
        outgoing = {tag: list(children) for tag, children in self.outgoing.items()}
        edges = set(self.edges)
        return Graph(vertices, incoming, outgoing, edges)

    def add_edge(self, parent, child):
        assert parent, child not in self.edges
        self.outgoing[parent].append(child)
        self.incoming[child].append(parent)
        self.edges.add((parent, child))

    def remove_edge(self, parent, child):
        self.outgoing[parent].remove(child)
        self.incoming[child].remove(parent)
        self.edges.remove((parent, child))

    def remove_vertex(self, tag):
        # remove all incoming and outgoing edges
        incoming = list(self.incoming[tag])
        for parent in incoming:
            self.remove_edge(parent, tag)
        outgoing = list(self.outgoing[tag])
        for child in outgoing:
            self.remove_edge(tag, child)

        # remove the vertex itself
        self.vertices.remove(tag)
        del self.incoming[tag]
        del self.outgoing[tag]

    @staticmethod
    def init_empty(tags):
        outgoing = {tag: [] for tag in tags}
        incoming = {tag: [] for tag in tags}
        edges = set()
        return Graph(set(tags), incoming, outgoing, edges)

    @staticmethod
    def from_node_dependencies(nodes):
        """Construct the dependency graph from a dict of nodes. Expects all the links to be present in the
        graph (so call remove_missing_links on nodes first)."""
        graph = Graph.init_empty(nodes.keys())
        
        for tag, node in nodes.items():
            for dep in node.dependencies:
                graph.add_edge(dep.tag, tag)

        return graph

    @staticmethod
    def from_node_and_shortcut_dependencies(nodes, shortcuts):
        """Construct the dependency graph from dicts of nodes and shortcuts. Expects all the links to be
        present in the graph (so call remove_missing_liks on nodes first). Returns a dependency graph
        where shortcuts are represented separately from the concept nodes."""
        vertices = [('concept', tag) for tag in nodes] + [('shortcut', tag) for tag in shortcuts]
        graph = Graph.init_empty(vertices)
        
        for tag, node in nodes.items():
            for dep in node.dependencies:
                if dep.shortcut and dep.tag in shortcuts:
                    graph.add_edge(('shortcut', dep.tag), ('concept', tag))
                else:
                    graph.add_edge(('concept', dep.tag), ('concept', tag))

        for tag, shortcut in shortcuts.items():
            for dep in shortcut.dependencies:
                if dep.shortcut and dep.tag in shortcuts:
                    graph.add_edge(('shortcut', dep.tag), ('shortcut', tag))
                else:
                    graph.add_edge(('concept', dep.tag), ('shortcut', tag))

        return graph



class CycleException(Exception):
    pass

def remove_missing_links(nodes):
    """Returns a new dict of node objects with all the missing links removed, i.e. all
    dependencies or see-also links which aren't contained in the set of nodes."""
    new_nodes = {}
    for tag, node in nodes.items():
        new_node = node.copy()
        new_node.dependencies = [d for d in node.dependencies if d.tag in nodes]
        new_nodes[tag] = new_node
    return new_nodes


def topo_sort(graph):
    """Return a list of all tags topologically ordered such that if B depends on A, then
    A precedes B in the list."""
    graph = graph.copy()   # since we destructively modify it
    tags = graph.incoming.keys()
    
    # nodes with no dependencies
    start_tags = filter(lambda t: graph.incoming[t] == [], tags)

    sorted_deps = []
    while start_tags:
        s, start_tags = start_tags[0], start_tags[1:]
        sorted_deps.append(s)
        for child in list(graph.outgoing[s]):
            graph.remove_edge(s, child)
            if not graph.incoming[child]:
                start_tags.append(child)

    if graph.edges:
        raise CycleException()

    return sorted_deps

    
def gather_dependencies(graph):
    """Construct a dict mapping a tag to the set of all tags which it depends on."""
    tags = topo_sort(graph)

    dependencies = {}
    for tag in tags:
        curr_deps = set(graph.incoming[tag])
        for parent_tag in graph.incoming[tag]:
            curr_deps.update(dependencies[parent_tag])
        dependencies[tag] = curr_deps

    return dependencies

    
def count_dependencies(graph, ignore=None):
    """Count the total number of long-distance dependencies in a graph."""
    all_deps = gather_dependencies(graph)
    
    total = 0
    for vertex, deps in all_deps.items():
        if vertex[0] == 'concept' and vertex[1] != ignore:
            dep_tags = set(d[1] for d in deps)     # don't double count concepts and shortcuts
            if ignore in dep_tags:
                dep_tags.remove(ignore)
            total += len(dep_tags)

    return total


def bottleneck_score(graph, tag):
    """Compute the bottleneck score for a tag, which is the total number of long-range dependencies which are
    eliminated when we delete the node, divided by the total number of long-range dependencies. If a node has
    a high bottleneck score, this indicates that the user has to sift through a lot of additional nodes
    as a result of this one being required. If the long-range dependencies seem to be mostly unnecessary,
    the node should be split into more precise chunks. If the long-range dependencies seem necessary even
    in the absence of this node, they should probably be added explicitly to the graph."""
    graph_rem = graph.copy()
    graph_rem.remove_vertex(('concept', tag))
    if ('shortcut', tag) in graph_rem.vertices:
        graph_rem.remove_vertex(('shortcut', tag))
    
    orig = count_dependencies(graph, ignore=tag)
    diff = orig - count_dependencies(graph_rem)
    return diff / float(orig)

def rank_bottleneck_scores(nodes):
    """Print the list of nodes sorted by their bottleneck scores."""
    scores = {tag: bottleneck_score(nodes, tag) for tag in nodes}
    order = sorted(nodes.keys(), key=lambda t: scores[t], reverse=True)
    for tag in order:
        print '%10.5f %s' % (scores[tag], nodes[tag].title)


def page_rank(nodes, damping=0.25):
    """Compute the page rank scores for the nodes in the graph. This is defined as the stationary distribution
    of the Markov chain where in each step, a surfer (a) follows a link uniformly at random from the set of
    dependencies and see-also links with probability 1 - damping, or (b) chooses a node uniformly at random
    from the graph with probability damping. This should give centrality measure of nodes in the graph, which
    may be useful for prioritizing development of the content. The results for damping=0.25 generally seem
    fairly intuitive."""
    nodes = remove_missing_links(nodes)
    dgraph = Graph.from_node_dependencies(nodes)
    pgraph = Graph.from_node_pointers(nodes)

    id2tag = nodes.keys()
    tag2id = {tag: i for i, tag in enumerate(id2tag)}
    N = len(id2tag)
    
    T = np.zeros((N, N))
    for i, tag in enumerate(id2tag):
        neighbors = set(pgraph.outgoing[tag] + dgraph.incoming[tag])
        if neighbors:
            for n in neighbors:
                T[tag2id[n], i] = 1. / len(neighbors) * (1. - damping)
            T[:, i] += damping / N
        else:
            T[:, i] += 1. / N

    d, V = scipy.linalg.eig(T)
    idx = np.argmin(np.abs(d - 1.))   # the relevant eigenvector has an eigenvalue of 1
    assert np.allclose(d[idx], 1.)
    v = V[:, idx].astype(float)
    assert np.allclose(np.dot(T, v), v)

    if v[0] < 0.:
        v = -v
    assert np.all(v >= 0)

    v /= v.sum()

    return {t: v[tag2id[t]] for t in nodes.keys()}

    

def print_page_ranks(nodes, damping):
    """Print the list of nodes sorted by their page ranks."""
    scores = page_rank(nodes, damping)
    order = sorted(nodes.keys(), key=lambda t: scores[t], reverse=True)
    for tag in order:
        print '%10.5f %s' % (scores[tag], nodes[tag].title)
    
            
def missing_titles(nodes):
    """List the tags of all nodes with missing titles."""
    return [tag for tag in nodes if nodes[tag].title is None]


def ancestors_set(graph, vertex):
    """Compute the set of ancestor tags for a given node."""
    ancestors = set(graph.incoming[vertex])
    queue = graph.incoming[vertex]

    while queue:
        curr, queue = queue[0], queue[1:]
        for parent in graph.incoming[curr]:
            if parent not in ancestors:
                ancestors.add(parent)
                queue.append(parent)

    return ancestors

def get_ancestors(graph, tag):
    ancestors = ancestors_set(graph, ('concept', tag))
    full_tags = set([tag for label, tag in ancestors if label == 'concept'])
    shortcut_tags = set([tag for label, tag in ancestors if label == 'shortcut'])
    shortcut_tags = shortcut_tags.difference(full_tags)
    return full_tags, shortcut_tags

def descendants_set(graph, vertex):
    """Compute the set of descendant tags for a given node."""
    descendants = set(graph.outgoing[vertex])
    queue = graph.outgoing[vertex]

    while queue:
        curr, queue = queue[0], queue[1:]
        for child in graph.outgoing[curr]:
            if child not in descendants:
                descendants.add(child)
                queue.append(child)

    return descendants

def get_descendants(graph, tag):
    descendants = descendants_set(graph, ('concept', tag))
    full_tags = set([tag for label, tag in descendants if label == 'concept'])
    shortcut_tags = set([tag for label, tag in descendants if label == 'shortcut'])
    shortcut_tags = shortcut_tags.difference(full_tags)
    return full_tags, shortcut_tags

def missing_dependencies(nodes):
    dependencies = set()
    for node in nodes.values():
        for d in node.dependencies:
            dependencies.add(d.tag)

    return dependencies.difference(set(nodes.keys()))

def remove_redundant_edges(graph):
    graph = graph.copy()
    ancestors = gather_dependencies(graph)
    tags = graph.incoming.keys()

    for tag in tags:
        parents = list(graph.incoming[tag])
        for p in parents:
            for p2 in parents:
                if p in ancestors[p2] and (p, tag) in graph.edges:
                    graph.remove_edge(p, tag)

    return graph
