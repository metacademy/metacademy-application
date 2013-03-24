# -*- coding: utf-8 -*-
import os
import re
import sys
import pdb
from backend import settings
from backend.db_handler import db
from backend.settings import RESOURCE_DB
from global_resources import NODE_COMPREHENSION_KEY, NODE_DEPENDENCIES, NODE_RESOURCES, WIKI_SUMMARY_PREFIX, WIKI_SUMMARY, NODE_SUMMARY, NODE_TITLE, NODE_SEE_ALSO, RESOURCE_DB_NAME, RESOURCE_DB_TABLE

import graphs

WRAP_WIDTH = 12

############################ read nodes as directories #########################

def read_node(path, tag, assert_exists=False):
    """Read a Node object from a directory which optionally contains title.txt,
    dependencies.txt, key.txt, references.txt, summary.txt, and see-also.txt."""
    # TODO: normalize string cleaning (get rid of double quotes that mess up json)
    full_path = os.path.join(path, tag)

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


def read_nodes(path, onlytitle=False):
    """Read all the nodes in a directory and return a dict mapping tags to Node objects."""
    tags = map(normalize_input_tag,_filter_non_nodes(os.listdir(path)))
    if onlytitle:
        return tags
    else:
        nodes = [read_node(path, tag) for tag in tags]
        return {node.tag: node for node in nodes}


def _filter_non_nodes(tags):
    return filter(lambda(x): x[0] != '.' and x != 'README' and x != RESOURCE_DB_NAME,
        tags) # remove hidden files and readme from list


def check_format(path):
    tags = map(normalize_input_tag,os.listdir(path))
    # make sure files exist and are formatted correctly
    nodes = []
    for tag in tags:
        try:
            nodes.append(read_node(path, tag, assert_exists=True))
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
    ### select node and form title, summary, pointer and dependencies strings
    node = nodes[tag]
    ret_lst = []
    ret_lst.append('"id":"%s"' % tag)
    if node.title:
        ret_lst.append('"title":"%s"' % normalize_json_text(node.title))
    if node.summary:
        ret_lst.append('"summary":"%s"' % normalize_json_text(node.summary))
    if node.pointers:
        pt_arr = ['{"from_tag":"%s","to_tag":"%s","reason":"%s"}' % (p.from_tag, p.to_tag, normalize_json_text(p.blurb))
                  for p in node.pointers]
        if pt_arr:
            ret_lst.append('"pointers":[%s]' % ','.join(pt_arr))
    if node.dependencies:
        dep_arr = ['{"from_tag":"%s","to_tag":"%s","reason":"%s"}' % (d.parent_tag, d.child_tag, normalize_json_text(d.reason))
                   for d in node.dependencies]
        if dep_arr:
            ret_lst.append('"dependencies":[%s]' % ','.join(dep_arr))

    ### add the relevant resources info
    if node.resources:
        rscrc_lst = []
        for resrc in node.resources:
            rscrc_lst.append('%s' % dict_to_json(resrc))
        if rscrc_lst:
            res_str = '[' + ','.join(rscrc_lst) + ']'
            ret_lst.append('"resources":%s' % res_str)

    if node.ckeys:
        ret_lst.append('"ckeys":[' + ','.join(['"%s"' % normalize_json_text(ck) for ck in node.ckeys]) + ']')


    ### return final node string
    return '{%s}' % ','.join(ret_lst)


def write_graph_json(nodes, graph, outstr=None):
    if outstr is None:
        outstr = sys.stdout

    # get the individual node data
    json_items = ['"nodes":{%s}' % ','.join(['"%s":%s' % (tag, node_to_json(nodes, tag))
                  for tag in nodes.keys()])]

    ### make resources entry in json data
    # TODO perhaps make a "Nodes" object to simplify these statements
    resrc_keys = set(
        ['"' + rsrc + '"' for rlist in [nde.get_resource_keys() for nde in nodes.values() if nde.resources] for rsrc in
         rlist])
    rdb = db(RESOURCE_DB)

    # TODO should this be a separate ajax call?
    resrcs = rdb.fetch('SELECT * FROM %s WHERE key IN (%s)' % (RESOURCE_DB_TABLE, ','.join(resrc_keys)))
    res_list = []
    for res in resrcs:
        res_list.append('"%s":%s' % (res["key"], dict_to_json(res)))
    if res_list:
        res_str = '{' + ','.join(res_list) + '}'
    else:
        res_str = '{}'

    json_items.append('"node_resources":%s' % res_str)
    #    json_items.encode('utf-8')
    ### write total json object with node and resources data
    json_str = '{' + ','.join(json_items) + '}'
    outstr.write(json_str.encode('utf-8'))


def dict_to_json(indict):
    return '{' + ','.join(['"%s":"%s"' % (normalize_json_text(ikey), normalize_json_text(indict[ikey])) for ikey in indict.keys()]) + '}'

def normalize_input_tag(itag):
    """Make sure node id (tags) only have valid characters and are in a common format"""
    return re.sub(r'[^a-z0-9]', '_', itag.strip().lower()).replace('-','_')

def normalize_json_text(jdata):
    if isinstance(jdata,basestring):
        return jdata.strip().replace('\\', '\\\\').replace('"', '\\"')
    else:
        return jdata
