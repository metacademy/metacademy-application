import graphs

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

    def __setitem__(self, key, value):
        setattr(self, key, value)

    def __getitem__(self, key):
        return getattr(self, key)

    def as_dict(self):
        d = {'title': self.title,
             'summary': self.summary,
             'pointers': self.pointers,
             'dependencies': [dep.as_dict() for dep in self.dependencies],
             'resources': self.resources,
             'questions': self.questions,
             }

        if hasattr(self, 'outlinks'):
            d['outlinks'] = [ol.as_dict() for ol in self.outlinks]

        return d
             

    def get_resource_keys(self):
        keys = None
        if self.resources:
            keys = [rdic['source'] for rdic in self.resources]
        return keys

    def add_outlinks(self, outlink_list):
        self.outlinks = []
        for ol in outlink_list:
            self.outlinks.append(graphs.Outlink(self.tag, ol))


