import os
import pdb
import numpy as np
import scipy.linalg
import config

class DirectedEdge:
    """A struct representing an abstract directed edge in the graph.

    from_tag -- the tag of the node which is a prereqisite
    to_tag -- the tag of the node which depends on from_tag
    reason -- a verbal description of the reason for the diedge
    """
    def __init__(self, from_tag=None, to_tag=None, reason=None):
        self.from_tag = from_tag
        self.to_tag = to_tag
        self.reason = reason

    def __setitem__(self, key, value):
        setattr(self, key, value)

    def __getitem__(self, key):
        return  self.__dict__[key]

    def __iter__(self):
        for key in self.__dict__:
            yield(key)

    def __repr__(self):
        return 'DirectedEdge(from_tag=%r, to_tag=%r, reason=%r)' % (self.from_tag, self.to_tag, self.reason)

    def as_dict(self):
        return {'from_tag': self.from_tag,
                'to_tag': self.to_tag,
                'reason': self.reason,
                }
    def add_json_content(self,jsonc):
        for attr in jsonc:
            self[attr] = jsonc[attr]


class Dependency(DirectedEdge):
    """A struct representing a dependency link in the graph.

    from_tag -- the tag of the node which is a prerequisite
    to_tag -- the tag of the node which depends on from_tag
    reason -- a verbal description of the reason for the dependency
    """
    def __repr__(self):
        return 'Dependency(from_tag=%r, to_tag=%r, reason=%r)' % (self.from_tag, self.to_tag, self.reason)

class Outlink(DirectedEdge):
    """A struct representing a outlink link in the graph.

    from_tag -- the tag of the node which is a prerequisite
    to_tag -- the tag of the node which depends on from_tag
    """
    def __repr__(self):
        return 'Outlink(from_tag=%r, to_tag=%r)' % (self.from_tag, self.to_tag)

    def as_dict(self):
        return {'from_tag': self.from_tag, 'to_tag': self.to_tag}


class Node:
    """A struct containing the information relevant to one node in the graph.

    tag -- a shorthand form to reference a node from elsewhere in the graph
    title -- the title which will be displayed to the user
    summary -- brief summary of the node's concept
    dependencies -- a list of Dependency objects giving the immediate dependencies
    pointers -- a list of Pointer objects representing the see-also links
    """
    def __init__(self, tag, title, summary, dependencies, pointers, resources, questions):
        self.tag = tag
        self.title = title
        self.summary = summary
        self.dependencies = dependencies
        self.pointers = pointers
        self.resources = resources
        self.questions = questions

    def copy(self):
        return Node(self.tag, self.title, self.summary, list(self.dependencies), self.pointers,
                    list(self.resources), list(self.questions))

    def __setitem__(self, key, value):
        setattr(self, key, value)

    def __getitem__(self, key):
        return getattr(self, key)

    def as_dict(self, user_nodes=None):
        d = {}

        if hasattr(self, 'title'):
            d['title'] = self.title
        if hasattr(self, 'summary'):
            d['summary'] = self.summary
        if hasattr(self, 'pointers'):
            d['pointers'] = self.pointers # [p.as_dict() for p in self.pointers]
        if hasattr(self, 'dependencies'):
            d['dependencies'] = [dep.as_dict() for dep in self.dependencies]
        if hasattr(self, 'resources'):
            d['resources'] = self.resources
        if hasattr(self, 'questions'):
            d['questions'] = self.questions
        if hasattr(self, 'outlinks'):
            d['outlinks'] = [ol.as_dict() for ol in self.outlinks]

        # add user-supplied data
        if user_nodes is not None and self.tag in user_nodes:
            d['user_data'] = user_nodes[self.tag]

        return d

    def get_resource_keys(self):
        keys = None
        if self.resources:
            keys = [rdic['source'] for rdic in self.resources]
        return keys

    def add_outlinks(self, outlink_list):
        self.outlinks = []
        for ol in outlink_list:
            self.outlinks.append(Outlink(self.tag, ol))
        

class Graph:
    """A representation of the dependency graph in a form that's more convenient for graph computations
    like Page Rank or the bottleneck score. Can be used to represent either the dependency graph or
    the see-also graph (or some other kind of graph).

    incoming -- a dict mapping tags to the list of parent tags
    outgoing -- a dict mapping tags to the list of child tags
    edges -- the set of all (from_tag, to_tag) pairs
    """
    def __init__(self, incoming, outgoing, edges):
        self.incoming = incoming
        self.outgoing = outgoing
        self.edges = edges

    def copy(self):
        incoming = {tag: list(parents) for tag, parents in self.incoming.items()}
        outgoing = {tag: list(children) for tag, children in self.outgoing.items()}
        edges = set(self.edges)
        return Graph(incoming, outgoing, edges)

    def remove_edge(self, parent, child):
        self.outgoing[parent].remove(child)
        self.incoming[child].remove(parent)
        self.edges.remove((parent, child))

    def subset(self, tags):
        incoming = {tag: filter(lambda t: t in tags, self.incoming[tag])
                    for tag in tags}
        outgoing = {tag: filter(lambda t: t in tags, self.outgoing[tag])
                    for tag in tags}
        edges = set(filter(lambda (p, c): p in tags and c in tags, self.edges))
        return Graph(incoming, outgoing, edges)

    @staticmethod
    def from_node_dependencies(nodes):
        """Construct the dependency graph from a dict of nodes. Expects all the links to be present in the
        graph (so call remove_missing_links on nodes first)."""
        outgoing = {tag: [] for tag in nodes}
        incoming = {tag: [] for tag in nodes}
        edges = set()
        for tag, node in nodes.items():
            for dep in node.dependencies:
                outgoing[dep.from_tag].append(dep.to_tag)
                incoming[dep.to_tag].append(dep.from_tag)
                edges.add((dep.from_tag, dep.to_tag))

        return Graph(incoming, outgoing, edges)

    # April 12 2013: broken due to new pointer handling
    # @staticmethod
    # def from_node_pointers(nodes):
    #     """Construct the see-also graph from a dict of nodes. Expects all the links to be present in the
    #     graph (so call remove_missing_links on nodes first)."""
    #     outgoing = {tag: [] for tag in nodes}
    #     incoming = {tag: [] for tag in nodes}
    #     edges = set()
    #     for tag, node in nodes.items():
    #         for ptr in node.pointers:
    #             outgoing[ptr.from_tag].append(ptr.to_tag)
    #             incoming[ptr.to_tag].append(ptr.from_tag)
    #             edges.add((ptr.from_tag, ptr.to_tag))

    #     return Graph(incoming, outgoing, edges)



class CycleException(Exception):
    pass

def remove_missing_links(nodes):
    """Returns a new dict of node objects with all the missing links removed, i.e. all
    dependencies or see-also links which aren't contained in the set of nodes."""
    new_nodes = {}
    for tag, node in nodes.items():
        new_node = node.copy()
        new_node.dependencies = [d for d in node.dependencies if d.from_tag in nodes]
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

    
def gather_dependencies(graph, ignore=None):
    """Construct a dict mapping a tag to the set of all tags which it depends on."""
    tags = topo_sort(graph)

    dependencies = {}
    for tag in tags:
        curr_deps = set(graph.incoming[tag])
        for parent_tag in graph.incoming[tag]:
            curr_deps.update(dependencies[parent_tag])
        if ignore is not None and ignore in curr_deps:
            curr_deps.remove(ignore)
        dependencies[tag] = curr_deps

    return dependencies

    
def count_dependencies(graph, ignore=None):
    """Return a dict counting the total number of (long-range) dependencies for each node."""
    return sum([len(deps) for tag, deps in gather_dependencies(graph, ignore).items()])

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
    nodes_rem = remove_missing_links(nodes_rem)
    graph = Graph.from_node_dependencies(nodes)
    graph_rem = Graph.from_node_dependencies(nodes_rem)
    
    orig = count_dependencies(graph, ignore=tag) - len(graph.incoming[tag])
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
            dependencies.add(d.from_tag)

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
