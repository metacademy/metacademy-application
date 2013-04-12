# -*- coding: utf-8 -*-
import json
import os
import re
import sys
from global_resources import NODE_COMPREHENSION_KEY, NODE_DEPENDENCIES, NODE_RESOURCES, WIKI_SUMMARY_PREFIX, WIKI_SUMMARY, NODE_SUMMARY, NODE_TITLE, NODE_SEE_ALSO

import graphs

WRAP_WIDTH = 12

############################ read nodes as directories #########################

def read_node(content_path, tag, assert_exists=False):
    """Read a Node object from a directory which optionally contains title.txt,
    dependencies.txt, key.txt, references.txt, summary.txt, and see-also.txt."""
    # TODO: normalize string cleaning (get rid of double quotes that mess up json)
    full_path = os.path.join(content_path, 'nodes', tag)

    ### process title
    title_file = os.path.join(full_path, NODE_TITLE)
    if os.path.exists(title_file):
        title = open(title_file).readlines()[0].strip()
    else:
        if assert_exists:
            raise RuntimeError('%s/%s does not exist' % (tag, NODE_TITLE))
        title = None

    ### process summary
    summary_file = os.path.join(full_path, NODE_SUMMARY)
    wiki_summary_file = os.path.join(full_path, WIKI_SUMMARY)
    summary = ""
    usewiki = False
    sfile = None
    if os.path.exists(summary_file):
        sfile = summary_file
    elif os.path.exists(wiki_summary_file):
        sfile = wiki_summary_file
        usewiki = True

    if sfile:
        summary = unicode(open(sfile).read(), 'utf-8')

    if usewiki and len(summary):
        summary = "%s%s" % (WIKI_SUMMARY_PREFIX, summary) # TODO should we use a wiki flag instead?

    ### process resources
    resources_file = os.path.join(full_path, NODE_RESOURCES)
    resources = []
    if os.path.exists(resources_file):
        with open(resources_file) as resource_entries:
            src = {}
            for line in resource_entries:
#                line = line.strip().replace('"', '\\"')
                if line[:6] == "source":
                    if src:
                        resources.append(src)
                    src = {}
                try:
                    attrs = line.strip().split(':')
                    if len(attrs) > 1 and len(attrs[0]) > 0:
                        src[attrs[0].strip()] = ':'.join(attrs[1:]).strip()
                except IndexError:
                    raise RuntimeError('%s/resources has incorrect format: %s' % (tag, line))
            if src:
                resources.append(src)

    ### process comprehension key
    ckey_file = os.path.join(full_path, NODE_COMPREHENSION_KEY)
    ckeys = []
    if os.path.exists(ckey_file):
        with open(ckey_file) as ckey_entries:
            for line in ckey_entries:
                line = line.strip()
                if len(line) > 0:
                    ckeys.append(line)#line.replace('"', "'"))

    ### process dependencies
    dependencies_file = os.path.join(full_path, NODE_DEPENDENCIES)
    dependencies = []
    if os.path.exists(dependencies_file):
        for line_ in open(dependencies_file):
            line = line_.strip()

            if line == '':
                continue

            parts = line.split(':')
            if parts[0] == 'tag':
                parent_tag = normalize_input_tag(parts[1])
                curr_dep = graphs.Dependency(parent_tag, tag, None)
                dependencies.append(curr_dep)
            elif parts[0] == 'reason':
                curr_dep.reason = parts[1].strip()
            else:
                raise RuntimeError('Error reading line in %s/%s: %s' % (tag, NODE_DEPENDENCIES, line))
    elif assert_exists:
        raise RuntimeError('%s/%s does not exist' % (tag, NODE_DEPENDENCIES))

    ### process see-also
    see_also_file = os.path.join(full_path, NODE_SEE_ALSO)
    pointers = []
    if os.path.exists(see_also_file):
        for line_ in open(see_also_file):
            line = line_.strip()

            m = re.match(r'(.*)\[(.*)\]', line)
            if m:
                blurb = m.group(1).strip()
                to_tag = normalize_input_tag(m.group(2))
                ptr = graphs.Pointer(tag, to_tag, blurb)
                pointers.append(ptr)
    elif assert_exists:
        raise RuntimeError('%s/%s does not exist' % (tag, NODE_SEE_ALSO))

    return graphs.Node(
        {'tag': tag, 'resources': resources, 'title': title, 'summary': summary, 'dependencies': dependencies,
         'pointers': pointers, 'ckeys': ckeys})


def read_nodes(content_path, onlytitle=False):
    """Read all the nodes in a directory and return a dict mapping tags to Node objects."""
    nodes_path = os.path.join(content_path, 'nodes')
    tags = map(normalize_input_tag,_filter_non_nodes(os.listdir(nodes_path)))
    if onlytitle:
        return tags
    else:
        nodes = [read_node(content_path, tag) for tag in tags]
        return {node.tag: node for node in nodes}


def _filter_non_nodes(tags):
    return filter(lambda(x): x[0] != '.', tags) # remove hidden files from list


def check_format(content_path):
    nodes_path = os.path.join(content_path, 'nodes')
    tags = map(normalize_input_tag,os.listdir(nodes_path))
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
            print 'Node tag "%s" contains whitespace' % node.tag
        for d in node.dependencies:
            if re.search(r'\s', d.parent_tag):
                print 'Node "%s" has dependency "%s" which contains whitespace' % (node.tag, d.parent_tag)
        for p in node.pointers:
            if re.search(r'\s', p.to_tag):
                print 'Node "%s" has forward link "%s" which contains whitespace' % (node.tag, p.to_tag)


################################# write .dot files #############################

def underscorify(s):
    """Convert a string to a form that can be used in filenames, URLs, etc. by making everything
    lowercase and replacing non-letters with underscores."""
    temp = s.lower()
    temp = re.sub(r'[^a-z ]', ' ', temp)
    temp = temp.strip()
    return re.sub(r'\W+', '_', temp)

def wrap(s, width):
    """Wrap a long string to avoid elongated graph nodes."""
    if s is None:
        return ''

    parts = s.split()
    result = ''
    total = 0
    for p in parts:
        result += p
        total += len(p)
        if total > width:
            result += '\\n'
            total = 0
        else:
            result += " "
            total += 1
    return result


def write_graph_dot(nodes, graph, outstr=None):
    if outstr is None:
        outstr = sys.stdout

    print >> outstr, 'digraph G {'

    for tag, node in nodes.items():
        usetag = tag
        print >> outstr, '    %s [label="%s"];' % (usetag, wrap(node.title, WRAP_WIDTH))

    for parent, child in graph.edges:
        print >> outstr, '    %s -> %s;' % (parent, child)

    print >> outstr, '}'


#################################### JSON ######################################

def node_to_json(nodes, tag):
    node = nodes[tag]
    return json.dumps(node.as_dict())

def write_graph_json(nodes, graph, resource_dict=None, outstr=None):
    if outstr is None:
        outstr = sys.stdout

    items = {node.tag: node.as_dict() for node in nodes.values()}

    if resource_dict is not None:
        resrc_keys = set(
            [rsrc
             for rlist in [nde.get_resource_keys() for nde in nodes.values() if nde.resources]
             for rsrc in rlist
             if rsrc in resource_dict])
        res_dict = {key: resource_dict[key].as_dict() for key in resrc_keys}
        items['node_resources'] = res_dict

    json.dump(items, outstr)
    
def normalize_input_tag(itag):
    """Make sure node id (tags) only have valid characters and are in a common format"""
    return re.sub(r'[^a-z0-9]', '_', itag.strip().lower()).replace('-','_')

