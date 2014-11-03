import os
import re

import concepts
import formats
import graphs
import resources
import work_estimates


class DatabaseFormatError(RuntimeError):
    pass

class Database:

    def __init__(self, nodes, shortcuts, graph, resources, id2tag, tag2id, flags, concept_times, shortcut_times):
        self.nodes = nodes
        self.shortcuts = shortcuts
        self.graph = graph
        self.resources = resources
        self.id2tag = id2tag
        self.tag2id = tag2id
        self.flags = flags
        self.concept_times = concept_times
        self.shortcut_times = shortcut_times

    @staticmethod
    def load(content_dir):
        nodes = read_nodes(content_dir)
        nodes = graphs.remove_missing_links(nodes)
        shortcuts = read_shortcuts(content_dir, nodes)
        graph = graphs.Graph.from_node_and_shortcut_dependencies(nodes, shortcuts)
        resource_dict = resources.read_resources_file(resources.resource_db_path())
        id2tag = dict([(node.id, tag) for tag, node in nodes.items()
                       if node.id is not None])
        tag2id = dict([(tag, node.id) for tag, node in nodes.items()
                       if node.id is not None])
        flags = read_flags(content_dir)
        concept_times, shortcut_times = read_time_estimates(content_dir)
        return Database(nodes, shortcuts, graph, resource_dict, id2tag, tag2id, flags,
                        concept_times, shortcut_times)

    def check(self):
        all_errors = {}

        for tag in self.nodes:
            curr_errors = []
            all_errors[tag] = curr_errors

            # shortcut dependencies should be a strict subset of concept dependencies
            if tag in self.shortcuts:
                for sdep in self.shortcuts[tag].dependencies:
                    found = False
                    for ndep in self.nodes[tag].dependencies:
                        if ndep.tag == sdep.tag:
                            found = True
                            if ndep.shortcut and not sdep.shortcut:
                                curr_errors.append('Shortcut allowed for dependency %s in full concept, but not in shortcut'
                                                   % sdep.tag)
                    if not found:
                        curr_errors.append('Dependency %s required for shortcut, but not full concept' % sdep.tag)

            # resources should have the required fields
            for r in self.nodes[tag].resources:
                if 'source' in r and r['source'] not in self.resources:
                    curr_errors.append('Resource with unknown source %s' % r['source'])
                r_with_defaults = resources.add_defaults(r, self.resources)

                if 'source' in r:
                    name = r['source']
                elif 'title' in r:
                    name = '"' + r['title'] + '"'
                else:
                    name = '???'

                REQUIRED_FIELDS = ['title', 'resource_type', 'url']
                for field in REQUIRED_FIELDS:
                    if field not in r_with_defaults:
                        curr_errors.append('Resource %s missing %s' % (name, field))

        return all_errors

    def full_graph_json(self):
        def format_dep(dep, node):
            if isinstance(node, concepts.Shortcut):
                return {'from_tag': dep.tag, 'to_tag': node.concept.tag, 'shortcut': dep.shortcut}
            else:
                return {'from_tag': dep.tag, 'to_tag': node.tag, 'shortcut': dep.shortcut}

        nodes = []
        for tag, node in self.nodes.items():
            item = {
                'tag': node.tag,
                'id': node.id,
                'title': node.title,
                'dependencies': [format_dep(dep, node) for dep in node.dependencies],
                'is_shortcut': 0,
                }
            if tag in self.concept_times:
                item['time'] = self.concept_times[tag]
            nodes.append(item)

        shortcuts = []
        for tag, shortcut in self.shortcuts.items():
            item = {
                'tag': shortcut.concept.tag,
                'id': shortcut.concept.id,
                'title': shortcut.concept.title,
                'dependencies': [format_dep(dep, shortcut) for dep in shortcut.dependencies],
                'is_shortcut': 1,
                }
            if tag in self.shortcut_times:
                item['time'] = self.shortcut_times[tag]
            shortcuts.append(item)

        return {'nodes': nodes, 'shortcuts': shortcuts}



def global_flags_file(content_path):
    return os.path.join(content_path, 'flags.txt')

def node_dir(content_path, tag):
    return os.path.join(content_path, 'concepts', tag)

def id_file(content_path, tag):
    return os.path.join(node_dir(content_path, tag), 'id.txt')

def title_file(content_path, tag):
    return os.path.join(node_dir(content_path, tag), 'title.txt')

def summary_file(content_path, tag):
    return os.path.join(node_dir(content_path, tag), 'summary.txt')

def goals_file(content_path, tag):
    return os.path.join(node_dir(content_path, tag), 'goals.txt')

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

def node_flags_file(content_path, tag):
    return os.path.join(node_dir(content_path, tag), 'flags.txt')

def shortcut_dir(content_path, tag):
    return os.path.join(content_path, 'shortcuts', tag)

def shortcut_goals_file(content_path, tag):
    return os.path.join(shortcut_dir(content_path, tag), 'goals.txt')

def shortcut_questions_file(content_path, tag):
    return os.path.join(shortcut_dir(content_path, tag), 'questions.txt')

def shortcut_resources_file(content_path, tag):
    return os.path.join(shortcut_dir(content_path, tag), 'resources.txt')

def shortcut_dependencies_file(content_path, tag):
    return os.path.join(shortcut_dir(content_path, tag), 'dependencies.txt')

def concept_time_estimates_file(content_path):
    return os.path.join(content_path, 'time_estimates', 'concepts.txt')

def shortcut_time_estimates_file(content_path):
    return os.path.join(content_path, 'time_estimates', 'shortcuts.txt')



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
    pointers = []
    if os.path.exists(see_also_file(content_path, tag)):
        pointers = formats.read_nested_list(open(see_also_file(content_path, tag)))

    ### process goals
    goals = ""
    if os.path.exists(goals_file(content_path, tag)):
        goals = formats.read_nested_list(open(goals_file(content_path, tag)))

    ### process flags
    if os.path.exists(node_flags_file(content_path, tag)):
        flags = formats.read_node_flags(open(node_flags_file(content_path, tag)))
    else:
        flags = []

    return concepts.Concept(tag, node_id, title, summary, goals, dependencies, pointers, node_resources, questions, flags)

def read_shortcut(content_path, tag, concept_node):
    """Read a Shortcut object from a directory which contains dependencies.txt and resources.txt,
    and optionally questions.txt."""

    # process goals
    goals = []
    if os.path.exists(shortcut_goals_file(content_path, tag)):
        goals = formats.read_nested_list(open(shortcut_goals_file(content_path, tag)))

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

    return concepts.Shortcut(concept_node, goals, dependencies, shortcut_resources, questions)




def check_required_files(content_path, node_tag):
    errors = []
    if not os.path.exists(title_file(content_path, node_tag)):
        errors.append('Missing title')
    if not os.path.exists(dependencies_file(content_path, node_tag)):
        errors.append('Missing dependencies')
    if not os.path.exists(id_file(content_path, node_tag)):
        errors.append('Missing machine-readable ID')

    if os.path.exists(shortcut_dir(content_path, node_tag)):
        if not os.path.exists(shortcut_dependencies_file(content_path, node_tag)):
            errors.append('Missing dependencies for shortcut')
        if not os.path.exists(shortcut_resources_file(content_path, node_tag)):
            errors.append('Missing resources for shortcut')

    return errors

def check_node_format(content_path, tag):
    errors = check_required_files(content_path, tag)

    fname = node_resources_file(content_path, tag)
    if os.path.exists(fname):
        errors.append({'resources.txt': formats.check_resources_format(open(fname))})

    fname = dependencies_file(content_path, tag)
    if os.path.exists(fname):
        errors.append({'dependencies.txt': formats.check_dependencies_format(open(fname))})

    fname = shortcut_resources_file(content_path, tag)
    if os.path.exists(fname):
        errors.append({'shortcut resources.txt': formats.check_resources_format(open(fname))})

    fname = shortcut_dependencies_file(content_path, tag)
    if os.path.exists(fname):
        errors.append({'shortcut dependencies.txt': formats.check_dependencies_format(open(fname))})

    return errors

IGNORE_NODE_TAGS = ['.DS_Store', 'ANNOTATED_EXAMPLE']

def all_concept_tags(content_path):
    tags = os.listdir(os.path.join(content_path, 'concepts'))
    return filter(lambda t: not t in IGNORE_NODE_TAGS, tags)

def check_all_node_formats(content_path):
    tags = all_concept_tags(content_path)
    errors = {}
    for tag in tags:
        errors[tag] = check_node_format(content_path, tag)
    return errors


def read_nodes(content_path, onlytitle=False):
    """Read all the nodes in a directory and return a dict mapping tags to Concept objects."""
    tags = all_concept_tags(content_path)
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
    tags = all_concept_tags(content_path)
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
    tags = all_concept_tags(content_path)

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
    tags = all_concept_tags(content_path)

    return [t for t in tags if not os.path.exists(id_file(content_path, t))]


def read_flags(content_path):
    fname = global_flags_file(content_path)
    if os.path.exists(fname):
        fields = {'key': str, 'text': str}
        items = formats.read_text_db(open(fname), fields)
        return {item['key']: item['text'] for item in items}
    else:
        return {}

def save_time_estimates(content_path):
    db = Database.load(content_path)
    concept_times, shortcut_times = work_estimates.fit_model(db)

    outstr = open(concept_time_estimates_file(content_path), 'w')
    for tag, time in concept_times.items():
        print >> outstr, tag, time
    outstr.close()

    outstr = open(shortcut_time_estimates_file(content_path), 'w')
    for tag, time in shortcut_times.items():
        print >> outstr, tag, time
    outstr.close()

def read_time_estimates(content_path):
    concept_times = {}
    fname = concept_time_estimates_file(content_path)
    if os.path.exists(fname):
        for line in open(fname):
            tag, time_str = line.strip().split()
            concept_times[tag] = float(time_str)

    shortcut_times = {}
    fname = shortcut_time_estimates_file(content_path)
    if os.path.exists(fname):
        for line in open(fname):
            tag, time_str = line.strip().split()
            shortcut_times[tag] = float(time_str)

    return concept_times, shortcut_times
