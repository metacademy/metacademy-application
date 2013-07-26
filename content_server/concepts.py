import resources

class Dependency:
    """A struct representing a dependency on another concept."""
    def __init__(self, tag, reason, shortcut):
        self.tag = tag
        self.reason = reason
        assert type(shortcut) == int
        self.shortcut = shortcut


class Concept:
    """A struct containing the information relevant to a single concept node.

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
        return Concept(self.tag, self.title, self.summary, list(self.dependencies), self.pointers,
                       list(self.resources), list(self.questions))

    def json_repr(self, resource_dict, graph=None):
        res = [resources.add_defaults(r, resource_dict) for r in self.resources]
        
        if graph is not None and ('concept', self.tag) in graph.outgoing:
            outlinks = [{'from_tag': self.tag, 'to_tag': t}
                        for _, t in graph.outgoing['concept', self.tag]]
        else:
            outlinks = []

        dependencies = [{'from_tag': dep.tag, 'to_tag': self.tag, 'reason': dep.reason}
                        for dep in self.dependencies]

        d = {'title': self.title,
             'summary': self.summary,
             'pointers': self.pointers,
             'dependencies': dependencies,
             'resources': res,
             'questions': self.questions,
             'outlinks': outlinks,
             'is_shortcut': 0,
             }

        return d
             

    def get_resource_keys(self):
        keys = None
        if self.resources:
            keys = [rdic['source'] for rdic in self.resources]
        return keys

class Shortcut:
    """A struct contatining the information about a shortcut for a concept node.

    concept -- the Concept instance which this is a shortcut to
    dependencies -- a list of Dependency objects
    resources -- a list of resource dicts
    questions -- a list of comprehension questions

    A requirement for the graph is that the shortcut dependencies be a subset of the
    dependencies for the node itself.
    """
    def __init__(self, concept, dependencies, resources, questions):
        self.concept = concept
        self.dependencies = dependencies
        self.resources = resources
        self.questions = questions

    def copy(self):
        return Shortcut(self.concept.copy(), list(self.dependencies), list(self.resources))


    def json_repr(self, resource_dict, graph=None):
        res = [resources.add_defaults(r, resource_dict) for r in self.resources]
        
        if graph is not None and ('shortcut', self.concept.tag) in graph.outgoing:
            outlinks = [{'from_tag': self.concept.tag, 'to_tag': t}
                        for _, t in graph.outgoing['shortcut', self.concept.tag]]
        else:
            outlinks = []

        dependencies = [{'from_tag': dep.tag, 'to_tag': self.concept.tag, 'reason': dep.reason}
                        for dep in self.dependencies]
        
        d = {'title': self.concept.title,
             'summary': self.concept.summary,
             'pointers': self.concept.pointers,
             'dependencies': dependencies,
             'resources': res,
             'questions': self.questions,
             'outlinks': outlinks,
             'is_shortcut': 1,
             }

        return d
