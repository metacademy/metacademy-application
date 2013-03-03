# -*- coding: utf-8 -*-
import os
import re
import sys
import urllib, urllib2
from xml.dom.minidom import parse as parseXML
import pdb
from backend import settings
from backend.db_handler import db

import graphs

WRAP_WIDTH = 12

############################ read nodes as directories #########################

def read_node(path, tag, assert_exists=False):
    """Read a Node object from a directory which optionally contains title.txt,
    dependencies.txt, key.txt, references.txt, summary.txt, and see-also.txt."""
    # TODO: normalize string cleaning (get rid of double quotes that mess up json)
    full_path = os.path.join(path, tag)

    ### process title
    title_file = os.path.join(full_path, 'title.txt')
    if os.path.exists(title_file):
        title = open(title_file).readlines()[0].strip()
    else:
        if assert_exists:
            raise RuntimeError('%s/title.txt does not exist' % tag)
        title = None

    ### process summary
    summary_file = os.path.join(full_path, 'summary.txt')
    wiki_summary_file = os.path.join(full_path, 'wiki-summary.txt')
    summary = ""
    usewiki = False
    if os.path.exists(summary_file):
        sfile = summary_file
    elif os.path.exists(wiki_summary_file):
        sfile = wiki_summary_file
        usewiki = True
    else:
        # try to obtain a wiki summary
        sfile = None
        if title:
            ttl = title
        else:
            ttl = tag
        wiki_ep = 'http://en.wikipedia.org/w/api.php'
        urlparams = '?action=query&redirects&prop=extracts&exintro&explaintext&exsectionformat=plain&exsentences=1&format=xml&titles=%s' %  urllib.quote_plus(ttl)
        rquest = urllib2.Request(wiki_ep + urlparams)
        xmlresp = parseXML(urllib2.urlopen(rquest))
        extxt = xmlresp.getElementsByTagName('extract')
        if len(extxt):
            summary = extxt[0].firstChild.wholeText.replace('\n',' ')
            usewiki = True
        else:
            summary = ''
        # cache the wiki summary
        with open(wiki_summary_file, 'w') as wikif:
            wikif.write(summary.encode('utf-8'))

    if sfile:
        summary = unicode(open(sfile).read().strip().replace('\\','\\\\').replace('"', '\\"'),'utf-8')

    if usewiki and len(summary):
        summary = '*Wiki*' + summary

    ### process resources
    resources_file = os.path.join(full_path, 'resources.txt')
    resources = []
    if os.path.exists(resources_file):
        with open(resources_file) as resource_entries:
            src = {}
            for line in resource_entries:
                line = line.strip().replace('"', '\\"')
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

    ### process comprehension key
    ckey_file = os.path.join(full_path,'key.txt')
    ckeys = []
    if os.path.exists(ckey_file):
        with open(ckey_file) as ckey_entries:
            for line in ckey_entries:
                line = line.strip()
                if len(line) > 0:
                    ckeys.append(line.replace('"',"'"))

    ### process dependencies
    dependencies_file = os.path.join(full_path, 'dependencies.txt')
    dependencies = []
    if os.path.exists(dependencies_file):
        for line_ in open(dependencies_file):
            line = line_.strip()

            if line == '':
                continue

            parts = line.split(':')
            if parts[0] == 'tag':
                parent_tag = parts[1].strip()
                curr_dep = graphs.Dependency(parent_tag, tag, None)
                dependencies.append(curr_dep)
            elif parts[0] == 'reason':
                curr_dep.reason = parts[1].strip()
            else:
                raise RuntimeError('Error reading line in %s/dependencies.txt: %s' % (tag, line))
    elif assert_exists:
        raise RuntimeError('%s/dependencies.txt does not exist' % tag)

    ### process see-also
    see_also_file = os.path.join(full_path, 'see-also.txt')
    pointers = []
    if os.path.exists(see_also_file):
        for line_ in open(see_also_file):
            line = line_.strip()

            m = re.match(r'(.*)\[(.*)\]', line)
            if m:
                blurb = m.group(1).strip()
                to_tag = m.group(2)
                ptr = graphs.Pointer(tag, to_tag, blurb)
                pointers.append(ptr)
    elif assert_exists:
        raise RuntimeError('%s/see-also.txt does not exist' % tag)

    return graphs.Node(
        {'tag': tag, 'resources': resources, 'title': title, 'summary': summary, 'dependencies': dependencies,
         'pointers': pointers, 'ckeys':ckeys})


def read_nodes(path, onlytitle=False):
    """Read all the nodes in a directory and return a dict mapping tags to Node objects."""
    tags = _filter_non_nodes(os.listdir(path))
    if onlytitle:
        return tags
    else:
        nodes = [read_node(path, tag) for tag in tags]
        return {node.tag: node for node in nodes}


def _filter_non_nodes(tags):
    return filter(lambda(x): x[0] != '.' and x != 'README' and x != 'resource_db.sqlite',
        tags) # remove hidden files and readme from list


def check_format(path):
    tags = _filter_non_nodes(os.listdir(path))
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
        usetag = tag.replace('-', '_')
        print >> outstr, '    %s [label="%s"];' % (usetag, wrap(node.title, WRAP_WIDTH))

    for parent, child in graph.edges:
        print >> outstr, '    %s -> %s;' % (parent.replace('-', '_'), child.replace('-', '_'))

    print >> outstr, '}'


#################################### JSON ######################################

def node_to_json(nodes, tag):
    ### select node and form title, summary, pointer and dependencies strings
    node = nodes[tag]
    ret_lst = []
    if node.title:
        ret_lst.append('"title":"%s"' % node.title)
    if node.summary:
        ret_lst.append('"summary":"%s"' % node.summary)
    if node.pointers:
        pt_arr = ['{"from_tag":"%s","to_tag":"%s","blurb":"%s"}' % (p.from_tag, p.to_tag, p.blurb)
                  for p in node.pointers]
        if pt_arr:
            ret_lst.append('"pointers":[%s]' % ','.join(pt_arr))
    if node.dependencies:
        dep_arr = ['{"from_tag":"%s","to_tag":"%s","reason":"%s"}' % (d.parent_tag, d.child_tag, d.reason)
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
        ret_lst.append('"ckeys":[' + ','.join(['"%s"' % ck for ck in node.ckeys]) + ']')


    ### return final node string
    return '{%s}' % ','.join(ret_lst)


def write_graph_json(nodes, graph, outstr=None):
    if outstr is None:
        outstr = sys.stdout

    # get the individual node data
    json_items = ['"%s":%s' % (tag.replace('-', '_'), node_to_json(nodes, tag))
                  for tag in nodes.keys()]

    ### make resources entry in json data
    # TODO perhaps make a "Nodes" object to simplify these statements
    resrc_keys = set(
        ['"' + rsrc + '"' for rlist in [nde.get_resource_keys() for nde in nodes.values() if nde.resources] for rsrc in
         rlist])
    rdb = db(settings.RESOURCE_DB)
    resrcs = rdb.fetch('SELECT * FROM %s WHERE key IN (%s)' % (settings.RESOURCE_DB_TABLE, ','.join(resrc_keys)))
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
    return '{' + ','.join(['"%s":"%s"' % (ikey, indict[ikey]) for ikey in indict.keys()]) + '}'