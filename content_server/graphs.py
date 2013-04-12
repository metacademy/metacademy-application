import numpy as np
import scipy.linalg


class Node:
    """A struct containing the information relevant to one node in the graph.

    tag -- a shorthand form to reference a node from elsewhere in the graph
    title -- the title which will be displayed to the user
    summary -- brief summary of the node's concept
    dependencies -- a list of Dependency objects giving the immediate dependencies
    pointers -- a list of Pointer objects representing the see-also links
    """
    # TODO: perhaps we should be explicit about the attributes of the node? --CJR
    def __init__(self, *init_data, **kwargs):
            for dictionary in init_data:
                for key in dictionary:
                    setattr(self, key, dictionary[key])
            for key in kwargs:
                setattr(self, key, kwargs[key])

    def get_resource_keys(self):
        keys = None
        if self.resources:
            keys = [rdic['source'] for rdic in self.resources]
        return keys

    def as_dict(self):
        d = {}
        
        if hasattr(self, 'title'):
            d['title'] = self.title
        if hasattr(self, 'summary'):
            d['summary'] = self.summary
        if hasattr(self, 'pointers'):
            d['pointers'] = [p.as_dict() for p in self.pointers]
        if hasattr(self, 'dependencies'):
            d['dependencies'] = [dep.as_dict() for dep in self.dependencies]
        if hasattr(self, 'resources'):
            d['resources'] = self.resources
        if hasattr(self, 'ckeys'):
            d['ckeys'] = self.ckeys
        
        return d

# TODO add __repr__ method

class Dependency:
    """A struct representing a dependency link in the graph.

    parent_tag -- the tag of the node which is a prerequisite
    child_tag -- the tag of the node which depends on parent_tag
    reason -- a verbal description of the reason for the dependency
    """
    def __init__(self, parent_tag, child_tag, reason=None):
        self.parent_tag = parent_tag
        self.child_tag = child_tag
        if reason:
            self.reason = reason.replace('"',"'")
        else:
            self.reason = None

    def __repr__(self):
        return 'Dependency(parent_tag=%r, child_tag=%r, reason=%r)' % (self.parent_tag, self.child_tag, self.reason)

    def as_dict(self):
        return {'from_tag': self.parent_tag,
                'to_tag': self.child_tag,
                'reason': self.reason,
                }


class Pointer:
    """A struct representing a see-also link in the graph.

    from_tag -- the tag of the node doing the linking
    to_tag -- the tag of the node being linked to
    blurb -- a verbal annotation of why it's relevant
    """
    def __init__(self, from_tag, to_tag, blurb=None):
        self.from_tag = from_tag
        self.to_tag = to_tag
        if blurb:
            self.blurb = blurb.replace('"',"'")
        else:
            self.blurb = None

    def __repr__(self):
        return 'Pointer(from_tag=%r, to_tag=%r, blurb=%r)' % (self.from_tag, self.to_tag, self.blurb)

    def as_dict(self):
        return {'from_tag': self.from_tag,
                'to_tag': self.to_tag,
                'blurb': self.blurb,
                }

class Graph:
    """A representation of the dependency graph in a form that's more convenient for graph computations
    like Page Rank or the bottleneck score. Can be used to represent either the dependency graph or
    the see-also graph (or some other kind of graph).

    incoming -- a dict mapping tags to the list of parent tags
    outgoing -- a dict mapping tags to the list of child tags
    edges -- the set of all (parent_tag, child_tag) pairs
    """
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
        """Construct the dependency graph from a dict of nodes. Expects all the links to be present in the
        graph (so call remove_missing_links on nodes first)."""
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
        """Construct the see-also graph from a dict of nodes. Expects all the links to be present in the
        graph (so call remove_missing_links on nodes first)."""
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
    """Returns a new dict of node objects with all the missing links removed, i.e. all
    dependencies or see-also links which aren't contained in the set of nodes."""
    new_nodes = {}
    for tag, node in nodes.items():
        nprops = vars(node)
        nprops['dependencies'] = [d for d in node.dependencies if d.parent_tag in nodes]
        nprops['pointers'] = [p for p in node.pointers if p.to_tag in nodes]
        new_nodes[tag] = Node(nprops)
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
    """Construct a dict mapping a tag to the set of all tags which it depends on."""
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
    """Return a dict counting the total number of (long-range) dependencies for each node."""
    return sum([len(deps) for tag, deps in gather_dependencies(nodes).items()])

def bottleneck_score(nodes, tag):
    """Compute the bottleneck score for a tag, which is the total number of long-range dependencies which are
    eliminated when we delete the node, divided by the total number of long-range dependencies. If a node has
    a high bottleneck score, this indicates that the user has to sift through a lot of additional nodes
    as a result of this one being required. If the long-range dependencies seem to be mostly unnecessary,
    the node should be split into more precise chunks. If the long-range dependencies seem necessary even
    in the absence of this node, they should probably be added explicitly to the graph."""
    assert tag in nodes
    nodes_rem = dict(nodes)
    del nodes_rem[tag]
    orig = count_dependencies(nodes) - len(nodes[tag].dependencies)
    diff = orig - count_dependencies(nodes_rem)
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


def ancestors_set(nodes, graph, tag):
    """Compute the set of ancestor tags for a given node."""
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
    """Compute the set of descendant tags for a given node."""
    descendants = set(graph.outgoing[tag])
    queue = graph.outgoing[tag]

    while queue:
        curr, queue = queue[0], queue[1:]
        for child in graph.outgoing[curr]:
            if child not in descendants:
                descendants.add(child)
                queue.append(child)

    return descendants

def missing_dependencies(nodes):
    dependencies = set()
    for node in nodes.values():
        for d in node.dependencies:
            dependencies.add(d.parent_tag)

    return dependencies.difference(set(nodes.keys()))
