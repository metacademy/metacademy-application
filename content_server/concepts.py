import resources

class Dependency:
    """A struct representing a dependency on another concept."""
    def __init__(self, tag, reason):
        self.tag = tag
        self.reason = reason


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
        
        if graph is not None and self.tag in graph.outgoing:
            outlinks = [{'from_tag': self.tag, 'to_tag': t}
                        for t in graph.outgoing[self.tag]]
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
             }

        return d
             

    def get_resource_keys(self):
        keys = None
        if self.resources:
            keys = [rdic['source'] for rdic in self.resources]
        return keys

