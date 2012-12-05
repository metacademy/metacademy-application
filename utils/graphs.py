import numpy as np
import scipy.linalg


class Node:
    def __init__(self, tag, title, dependencies, pointers):
        self.tag = tag
        self.title = title
        self.dependencies = dependencies
        self.pointers = pointers

    def __repr__(self):
        return 'Node(tag=%r, title=%r, dependencies=%r, pointers=%r)' % (self.tag, self.title, self.dependencies,
                                                                         self.pointers)

class Dependency:
    def __init__(self, parent_tag, child_tag, reason):
        self.parent_tag = parent_tag
        self.child_tag = child_tag
        self.reason = reason

    def __repr__(self):
        return 'Dependency(parent_tag=%r, child_tag=%r, reason=%r)' % (self.parent_tag, self.child_tag, self.reason)

class Pointer:
    def __init__(self, from_tag, to_tag, blurb):
        self.from_tag = from_tag
        self.to_tag = to_tag
        self.blurb = blurb

    def __repr__(self):
        return 'Pointer(from_tag=%r, to_tag=%r, blurb=%r)' % (self.from_tag, self.to_tag, self.blurb)

class Graph:
    def __init__(self, incoming, outgoing, edges):
        self.incoming = incoming
        self.outgoing = outgoing
        self.edges = edges

    def remove_edge(self, parent, child):
        self.outgoing[parent].remove(child)
        self.incoming[child].remove(parent)
        self.edges.remove((parent, child))

    @staticmethod
    def from_node_dependencies(nodes):
        # compute set of nodes which directly require a given node
        outgoing = {tag: [] for tag in nodes}
        incoming = {tag: [] for tag in nodes}
        edges = set()
        for tag, node in nodes.items():
            for dep in node.dependencies:
                outgoing[dep.parent_tag].append(dep.child_tag)
                incoming[dep.child_tag].append(dep.parent_tag)
                edges.add((dep.parent_tag, dep.child_tag))

        return Graph(incoming, outgoing, edges)

    @staticmethod
    def from_node_pointers(nodes):
        # compute set of nodes which directly require a given node
        outgoing = {tag: [] for tag in nodes}
        incoming = {tag: [] for tag in nodes}
        edges = set()
        for tag, node in nodes.items():
            for ptr in node.pointers:
                outgoing[ptr.from_tag].append(ptr.to_tag)
                incoming[ptr.to_tag].append(ptr.from_tag)
                edges.add((ptr.from_tag, ptr.to_tag))

        return Graph(incoming, outgoing, edges)



class CycleException(Exception):
    pass

def remove_missing_links(nodes):
    new_nodes = {}
    for tag, node in nodes.items():
        new_deps = [d for d in node.dependencies if d.parent_tag in nodes]
        new_pointers = [p for p in node.pointers if p.to_tag in nodes]
        new_nodes[tag] = Node(node.tag, node.title, new_deps, new_pointers)
    return new_nodes


def topo_sort(nodes):
    """Return a list of all tags topologically ordered such that if B depends on A, then
    A precedes B in the list."""

    # so that we only consider edges between existing nodes
    nodes = remove_missing_links(nodes)

    graph = Graph.from_node_dependencies(nodes)

    # nodes with no dependencies
    start_tags = [tag for tag, node in nodes.items() if not graph.incoming[tag]]

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

    
def gather_dependencies(nodes):
    tags = topo_sort(nodes)

    dependencies = {}
    for tag in tags:
        node = nodes[tag]
        parent_tags = [dep.parent_tag for dep in node.dependencies]
        curr_deps = set(parent_tags)
        for parent_tag in parent_tags:
            if parent_tag in nodes:
                curr_deps.update(dependencies[parent_tag])
        dependencies[tag] = curr_deps

    return dependencies
    
def count_dependencies(nodes):
    return sum([len(deps) for tag, deps in gather_dependencies(nodes).items()])

def bottleneck_score(nodes, tag):
    assert tag in nodes
    nodes_rem = dict(nodes)
    del nodes_rem[tag]
    orig = count_dependencies(nodes) - len(nodes[tag].dependencies)
    diff = orig - count_dependencies(nodes_rem)
    return diff / float(orig)

def rank_bottleneck_scores(nodes):
    scores = {tag: bottleneck_score(nodes, tag) for tag in nodes}
    order = sorted(nodes.keys(), key=lambda t: scores[t], reverse=True)
    for tag in order:
        print '%10.5f %s' % (scores[tag], nodes[tag].title)


def page_rank(nodes, damping):
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
    scores = page_rank(nodes, damping)
    order = sorted(nodes.keys(), key=lambda t: scores[t], reverse=True)
    for tag in order:
        print '%10.5f %s' % (scores[tag], nodes[tag].title)
    
            
def missing_titles(nodes):
    return [tag for tag in nodes if nodes[tag].title is None]


def ancestors_set(nodes, graph, tag):
    ancestors = set(graph.incoming[tag])
    queue = graph.incoming[tag]

    while queue:
        curr, queue = queue[0], queue[1:]
        for parent in graph.incoming[curr]:
            if parent not in ancestors:
                ancestors.add(parent)
                queue.append(parent)

    return ancestors

def descendants_set(nodes, graph, tag):
    descendants = set(graph.outgoing[tag])
    queue = graph.outgoing[tag]

    while queue:
        curr, queue = queue[0], queue[1:]
        for child in graph.outgoing[curr]:
            if child not in descendants:
                descendants.add(child)
                queue.append(child)

    return descendants
