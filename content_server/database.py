import os
import re

import concepts
import formats
import graphs
import resources

class DatabaseFormatError(RuntimeError):
    pass

class Database:
    def __init__(self, nodes, shortcuts, graph, resources, id2tag):
        self.nodes = nodes
        self.shortcuts = shortcuts
        self.graph = graph
        self.resources = resources
        self.id2tag = id2tag

    @staticmethod
    def load(content_dir):
        nodes = read_nodes(content_dir)
        nodes = graphs.remove_missing_links(nodes)
        shortcuts = read_shortcuts(content_dir, nodes)
        graph = graphs.Graph.from_node_and_shortcut_dependencies(nodes, shortcuts)
        resource_dict = resources.read_resources_file(resources.resource_db_path())
        id2tag = dict([(node.id, tag) for tag, node in nodes.items()
                       if node.id is not None])
        return Database(nodes, shortcuts, graph, resource_dict, id2tag)

        


def node_dir(content_path, tag):
    return os.path.join(content_path, 'nodes', tag)

def id_file(content_path, tag):
    return os.path.join(node_dir(content_path, tag), 'id.txt')

def title_file(content_path, tag):
    return os.path.join(node_dir(content_path, tag), 'title.txt')

def summary_file(content_path, tag):
    return os.path.join(node_dir(content_path, tag), 'summary.txt')

def wiki_summary_file(content_path, tag):
    return os.path.join(node_dir(content_path, tag), 'wiki-summary.txt')

def questions_file(content_path, tag):
    return os.path.join(node_dir(content_path, tag), 'questions.txt')

def node_resources_file(content_path, tag):
    return os.path.join(node_dir(content_path, tag), 'resources.txt')

def dependencies_file(content_path, tag):
    return os.path.join(node_dir(content_path, tag), 'dependencies.txt')

def see_also_file(content_path, tag):
    return os.path.join(node_dir(content_path, tag), 'see-also.txt')

def shortcut_dir(content_path, tag):
    return os.path.join(content_path, 'shortcuts', tag)

def shortcut_questions_file(content_path, tag):
    return os.path.join(shortcut_dir(content_path, tag), 'questions.txt')

def shortcut_resources_file(content_path, tag):
    return os.path.join(shortcut_dir(content_path, tag), 'resources.txt')

def shortcut_dependencies_file(content_path, tag):
    return os.path.join(shortcut_dir(content_path, tag), 'dependencies.txt')



def read_node(content_path, tag):
    """Read a Concept object from a directory which optionally contains title.txt,
    dependencies.txt, key.txt, references.txt, summary.txt, and see-also.txt."""
    # TODO: normalize string cleaning (get rid of double quotes that mess up json)
    
    ### process title
    if os.path.exists(title_file(content_path, tag)):
        title = formats.read_title(open(title_file(content_path, tag)))
    else:
        title = None

    ### process ID
    if os.path.exists(id_file(content_path, tag)):
        node_id = formats.read_id(open(id_file(content_path, tag)))
    else:
        node_id = None

    ### process summary
    summary = ""
    usewiki = False
    sfile = None
    if os.path.exists(summary_file(content_path, tag)):
        sfile = summary_file(content_path, tag)
    elif os.path.exists(wiki_summary_file(content_path, tag)):
        sfile = wiki_summary_file(content_path, tag)
        usewiki = True

    if sfile:
        summary = formats.read_summary(open(sfile))

    if usewiki and len(summary):
        summary = formats.mark_wiki(summary)


    # process resources
    if os.path.exists(node_resources_file(content_path, tag)):
        node_resources = formats.read_node_resources(open(node_resources_file(content_path, tag)))
    else:
        node_resources = []

    ### process questions
    if os.path.exists(questions_file(content_path, tag)):
        questions = formats.read_questions(open(questions_file(content_path, tag)))
    else:
        questions = []
            

    ### process dependencies
    if os.path.exists(dependencies_file(content_path, tag)):
        dependencies = formats.read_dependencies(open(dependencies_file(content_path, tag)))
    else:
        dependencies = []
    
    ### process see-also
    pointers = ""
    if os.path.exists(see_also_file(content_path, tag)):
        pointers = formats.read_see_also(open(see_also_file(content_path, tag)))

    return concepts.Concept(tag, node_id, title, summary, dependencies, pointers, node_resources, questions)

def read_shortcut(content_path, tag, concept_node):
    """Read a Shortcut object from a directory which contains dependencies.txt and resources.txt,
    and optionally questions.txt."""

    # process resources
    if not os.path.exists(shortcut_resources_file(content_path, tag)):
        raise DatabaseFormatError('Missing resources file for shortcut %s' % tag)
    shortcut_resources = formats.read_node_resources(open(shortcut_resources_file(content_path, tag)))

    # process dependencies
    if not os.path.exists(shortcut_resources_file(content_path, tag)):
        raise DatabaseFormatError('Missing dependencies file for shortcut %s' % tag)
    dependencies = formats.read_dependencies(open(shortcut_dependencies_file(content_path, tag)))

    # process questions
    if os.path.exists(shortcut_questions_file(content_path, tag)):
        questions = formats.read_questions(open(shortcut_questions_file(content_path, tag)))
    else:
        questions = []

    return concepts.Shortcut(concept_node, dependencies, shortcut_resources, questions)
    

    

def check_required_files(content_path, node_tag):
    if not os.path.exists(title_file(content_path, node_tag)):
        raise RuntimeError('No title for %s' % node_tag)
    if not os.path.exists(dependencies_file(content_path, node_tag)):
        raise RuntimeError('No dependencies for %s' % node_tag)
    if not os.path.exists(see_also_file(content_path, node_tag)):
        raise RuntimeError('No see-also for %s' % node_tag)


def read_nodes(content_path, onlytitle=False):
    """Read all the nodes in a directory and return a dict mapping tags to Concept objects."""
    nodes_path = os.path.join(content_path, 'nodes')
    tags = os.listdir(nodes_path)
    if onlytitle:
        return tags
    else:
        nodes = [read_node(content_path, tag) for tag in tags]
        return {node.tag: node for node in nodes}

def read_shortcuts(content_path, concept_nodes):
    shortcuts_path = os.path.join(content_path, 'shortcuts')
    if not os.path.exists(shortcuts_path):
        return {}
    tags = os.listdir(shortcuts_path)
    shortcuts = {}
    for tag in tags:
        try:
            shortcuts[tag] = read_shortcut(content_path, tag, concept_nodes[tag])
        except DatabaseFormatError:
            pass
    return shortcuts
    


def _filter_non_nodes(tags):
    return filter(lambda(x): x[0] != '.', tags) # remove hidden files from list


def check_format(content_path):
    nodes_path = os.path.join(content_path, 'nodes')
    tags = os.listdir(nodes_path)
    # make sure files exist and are formatted correctly
    nodes = []
    for tag in tags:
        try:
            nodes.append(read_node(content_path, tag, assert_exists=True))
        except RuntimeError as e:
            print e

    # make sure tags do not have spaces
    for node in nodes:
        if re.search(r'\s', node.tag):
            print 'Concept tag "%s" contains whitespace' % node.tag
        for d in node.dependencies:
            if re.search(r'\s', d.from_tag):
                print 'Concept "%s" has dependency "%s" which contains whitespace' % (node.tag, d.from_tag)
        for p in node.pointers:
            if re.search(r'\s', p.to_tag):
                print 'Concept "%s" has forward link "%s" which contains whitespace' % (node.tag, p.to_tag)


def assign_ids(content_path):
    """Assign unique IDs to all of the concepts which don't already have IDs."""
    nodes_path = os.path.join(content_path, 'nodes')
    tags = os.listdir(nodes_path)

    # read in current ID strings
    ids = set()
    for tag in tags:
        if os.path.exists(id_file(content_path, tag)):
            node_id = open(id_file(content_path, tag)).read().strip()
            ids.add(node_id)

    for tag in tags:
        if not os.path.exists(id_file(content_path, tag)):
            new_id = None
            while new_id is None or new_id in ids:
                new_id = concepts.random_id()
            open(id_file(content_path, tag), 'w').write(new_id)

def concepts_without_ids(content_path):
    nodes_path = os.path.join(content_path, 'nodes')
    tags = os.listdir(nodes_path)

    return [t for t in tags if not os.path.exists(id_file(content_path, t))]


