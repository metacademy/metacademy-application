import random
import resources
import string

ID_LENGTH = 8

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
    def __init__(self, tag, id, title, summary, dependencies, pointers, resources, questions):
        self.tag = tag
        self.id = id
        self.title = title
        self.summary = summary
        self.dependencies = dependencies
        self.pointers = pointers
        self.resources = resources
        self.questions = questions

    def copy(self):
        return Concept(self.tag, self.id, self.title, self.summary, list(self.dependencies), [p.copy() for p in self.pointers],
                       list(self.resources), list(self.questions))

    def json_repr(self, db):
        res = [resources.json_repr(resources.add_defaults(r, db.resources), db) for r in self.resources]
        
        if db.graph is not None and ('concept', self.tag) in db.graph.outgoing:
            outlinks = [{'from_tag': self.tag, 'to_tag': t}
                        for _, t in db.graph.outgoing['concept', self.tag]]
        else:
            outlinks = []

        dependencies = [{'from_tag': dep.tag, 'to_tag': self.tag, 'reason': dep.reason}
                        for dep in self.dependencies]

        pointers = [p.json_repr(db.nodes) for p in self.pointers]

        d = {'tag': self.tag,
             'title': self.title,
             'id': self.id,
             'summary': self.summary,
             'pointers': pointers,
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


    def json_repr(self, db):
        res = [resources.json_repr(resources.add_defaults(r, db.resources), db) for r in self.resources]
        
        if db.graph is not None and ('shortcut', self.concept.tag) in db.graph.outgoing:
            outlinks = [{'from_tag': self.concept.tag, 'to_tag': t}
                        for _, t in db.graph.outgoing['shortcut', self.concept.tag]]
        else:
            outlinks = []

        dependencies = [{'from_tag': dep.tag, 'to_tag': self.concept.tag, 'reason': dep.reason}
                        for dep in self.dependencies]

        pointers = [p.json_repr(db.nodes) for p in self.concept.pointers]
        
        d = {'tag': self.concept.tag,
             'title': self.concept.title,
             'id': self.concept.id,
             'summary': self.concept.summary,
             'pointers': pointers,
             'dependencies': dependencies,
             'resources': res,
             'questions': self.questions,
             'outlinks': outlinks,
             'is_shortcut': 1,
             }

        return d

def random_id():
    """Generate a random ID for a concept. The IDs are arbitrary, apart from the requirement that they be distinct."""
    return ''.join([random.choice(string.lowercase + string.digits) for i in range(ID_LENGTH)])

