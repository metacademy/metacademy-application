# -*- coding: utf-8 -*-
import json
import os
import re
import sys
import pdb

import concepts
import graphs
import resources

WRAP_WIDTH = 12





############################## utility functions ###############################

class Missing:
    pass

def is_comment(line):
    return len(line) >= 1 and line[0] == '#'

def remove_comments(text):
    lines = text.split('\n')
    lines = filter(lambda l: not is_comment(l), lines)
    return '\n'.join(lines)

def read_text_db(instr, fields, list_fields={}, require_all=True):
    items = []
    new_item = True
    curr = {}

    # Fields without default values indicate required fields
    fields = dict(fields)
    for k, v in fields.items():
        if not isinstance(v, tuple):
            fields[k] = (v, Missing)
    
    for line_ in instr:
        if is_comment(line_):
            continue
        line = line_.strip()

        if line == '':
            new_item = True
            continue

        pos = line.find(':')
        if pos == -1:
            raise RuntimeError('Error reading line: %s' % line)
        field = line[:pos]
        value = line[pos+1:].strip()

        if new_item:
            curr = {}
            items.append(curr)
            for field_name, (tp, default) in fields.items():
                curr[field_name] = default

        if field in fields:
            tp, _ = fields[field]
            curr[field] = tp(value)
        elif field in list_fields:
            tp = list_fields[field]
            if field not in curr:
                curr[field] = []
            curr[field].append(tp(value))
        else:
            raise RuntimeError('Unknown field: %s ' % field)

        new_item = False

    # Check that all required fields were filled
    for item in items:
        for field, value in item.items():
            if value is Missing:
                if require_all:
                    raise RuntimeError('Missing field %s for item %r' % (field, item))
                else:
                    del item[field]

    return items


def normalize_input_tag(itag):
    """Make sure node id (tags) only have valid characters and are in a common format"""
    return re.sub(r'[^a-z0-9]', '_', itag.strip().lower()).replace('-','_')

def remove_empty_keys(d):
    d = dict(d)
    for k, v in d.items():
        if v is None or v == []:
            del d[k]
    return d

def parse_list(s, sep):
    parts = s.split(sep)
    parts = [p.strip() for p in parts]
    return parts



############################ read nodes as directories #########################



def read_title(f):
    return f.readlines()[0].strip()

def read_id(f):
    return f.read().strip()

def read_summary(f):
    return remove_comments(unicode(f.read(), 'utf-8'))

def read_node_resources(f):
    fields = dict(resources.RESOURCE_FIELDS)
    fields['source'] = str
    list_fields = dict(resources.RESOURCE_LIST_FIELDS)
    node_resources = read_text_db(f, fields, list_fields, require_all=False)
    return map(remove_empty_keys, node_resources)

def read_questions(f):
    questions = []
    for line in f:
        if is_comment(line):
            continue
        line = line.strip()
        if len(line) > 0:
            questions.append({"text":line})
    return questions

def read_dependencies(f):
    fields = {'tag': normalize_input_tag,
              'reason': (str, None),
              'shortcut': (int, 0),
              }
    dependencies_dicts = read_text_db(f, fields)
    return [concepts.Dependency(d['tag'], d['reason'], d['shortcut'])
            for d in dependencies_dicts]

def read_see_also(f):
    return remove_comments(f.read())

def mark_wiki(summary):
    return '%s%s' % ("Wikipedia's first sentence: ", summary)



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


def write_graph_dot(db, full_tags, shortcut_tags, outstr=None, bottom_up=False):
    if outstr is None:
        outstr = sys.stdout
    tags = set(full_tags).union(set(shortcut_tags))

    print >> outstr, 'digraph G {'

    if bottom_up:
        print >> outstr, '    rankdir=BT;'

    for tag in tags:
        node = db.nodes[tag]
        print >> outstr, '    %s [label="%s"];' % (tag, wrap(node.title, WRAP_WIDTH))

    for parent, child in db.graph.edges:
        parent_tag, child_tag = parent[1], child[1]
        if parent_tag in tags and child_tag in tags:
            print >> outstr, '    %s -> %s;' % (parent_tag, child_tag)

    print >> outstr, '}'


#################################### JSON ######################################

def node_to_json(db, tag, shortcut=False):
    if shortcut and tag in db.shortcuts:
        return json.dumps(db.shortcuts[tag].json_repr(db.resources))
    else:
        return json.dumps(db.nodes[tag].json_repr(db.resources))

def write_graph_json(db, full_tags, shortcut_tags, outstr=None):
    if outstr is None:
        outstr = sys.stdout

    node_items = {}
    for tag in full_tags:
        node_items[tag] = db.nodes[tag].json_repr(db.resources, db.graph)
    for tag in shortcut_tags:
        node_items[tag] = db.shortcuts[tag].json_repr(db.resources, db.graph)

    titles = {node.tag: node.title for node in db.nodes.values()}
    
    items = {'nodes': node_items, 'titles': titles}
    json.dump(items, outstr)

def node_resources(node, resource_defaults):
    return [resources.add_defaults(r, resource_defaults) for r in node.resources]


