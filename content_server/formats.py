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

def remove_comments_stream(instr):
    for line in instr:
        if not is_comment(line):
            yield line

def read_text_db(instr, fields, list_fields={}, require_all=True, check=False):
    items = []
    new_item = True
    curr = {}
    errors = []

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
            errors.append('Not a valid field/value pair: %s' % line)
            continue
        field = line[:pos]
        value = line[pos+1:].strip()

        if new_item:
            curr = {}
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
            errors.append('Unknown field: %s' % field)
            continue

        if new_item:
            items.append(curr)

        new_item = False

    # Check that all required fields were filled
    for item in items:
        for field, value in item.items():
            if value is Missing:
                if require_all:
                    errors.append('Missing field %s for item %r' % (field, item))
                del item[field]

    if check:
        return items, errors
    else:
        return items

def check_text_db_format(instr, fields, list_fields={}, require_all=True):
    _, errors = read_text_db(instr, fields, list_fields, require_all, True)
    return errors


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

def check_resources_format(f):
    fields = dict(resources.RESOURCE_FIELDS)
    fields['source'] = str
    list_fields = dict(resources.RESOURCE_LIST_FIELDS)
    return check_text_db_format(f, fields, list_fields, require_all=False)
    

def read_node_resources(f):
    fields = dict(resources.RESOURCE_FIELDS)
    fields['source'] = str
    list_fields = dict(resources.RESOURCE_LIST_FIELDS)
    node_resources = read_text_db(f, fields, list_fields, require_all=False)

    for r in node_resources:
        if 'location' in r and len(r['location']) > 0 and type(r['location'][0]) == list:
            r['location'] = reduce(list.__add__, r['location'])

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

def check_dependencies_format(f):
    fields = {'tag': normalize_input_tag,
              'reason': (str, None),
              'shortcut': (int, 0),
              }
    return check_text_db_format(f, fields)

def read_dependencies(f):
    fields = {'tag': normalize_input_tag,
              'reason': (str, None),
              'shortcut': (int, 0),
              }
    dependencies_dicts = read_text_db(f, fields)
    return [concepts.Dependency(d['tag'], d['reason'], d['shortcut'])
            for d in dependencies_dicts]

class SeeAlsoText:
    def __init__(self, text):
        self.text = text

    def copy(self):
        return SeeAlsoText(self.text)

    def __repr__(self):
        return 'SeeAlsoText(%r)' % self.text

    def json_repr(self, nodes):
        return {'text': self.text}

class SeeAlsoLink:
    def __init__(self, text, link):
        self.text = text
        self.link = link

    def copy(self):
        return SeeAlsoLink(self.text, self.link)

    def __repr__(self):
        return 'SeeAlsoLink(%r, %r)' % (self.text, self.link)

    def json_repr(self, nodes):
        if self.link in nodes:
            return {'text': self.text, 'link': self.link}
        else:
            return {'text': self.text}

class SeeAlsoOldLink:
    def __init__(self, link):
        self.link = link

    def copy(self):
        return SeeAlsoOldLink(self.link)

    def __repr__(self):
        return 'SeeAlsoOldLink(%r)' % self.link

    def json_repr(self, nodes):
        if self.link in nodes:
            return {'text': ' (go to concept)', 'link': self.link}
        else:
            return None

class SeeAlsoLine:
    re_depth = re.compile(r'(\**)\s*(.*)')
    re_old_link = re.compile(r'(.*)\[([^\]]+)\]\s*$')
    re_link = re.compile(r'([^"]*)"([^"]*)":(\w*)(.*)')
    
    def __init__(self, depth, items):
        self.depth = depth
        self.items = items

    def copy(self):
        return SeeAlsoLine(self.depth, [item.copy() for item in self.items])

    @staticmethod
    def parse(line):
        if line.strip() == '':
            return None
        
        # compute depth
        m = SeeAlsoLine.re_depth.match(line)
        if not m:
            return None
        stars, rest = m.groups()
        depth = len(stars)

        # process old-style links
        m = SeeAlsoLine.re_old_link.match(rest)
        if m:
            rest, old_link = m.groups()
        else:
            old_link = None

        items = []

        # process new-style links
        while True:
            m = SeeAlsoLine.re_link.match(rest)
            if not m:
                break

            text, link_text, link, rest = m.groups()
            items.append(SeeAlsoText(text))
            items.append(SeeAlsoLink(link_text, normalize_input_tag(link)))

        if rest:
            items.append(SeeAlsoText(rest))
        if old_link:
            items.append(SeeAlsoOldLink(normalize_input_tag(old_link)))

        return SeeAlsoLine(depth, items)

    def __repr__(self):
        return 'SeeAlsoLine(%r, %r)' % (self.depth, self.items)

    def json_repr(self, nodes):
        item_list = [item.json_repr(nodes) for item in self.items]
        item_list = [item for item in item_list if item is not None]
        return {'depth': self.depth, 'items': item_list}
        
        

def read_see_also(f):
    lines = [SeeAlsoLine.parse(line) for line in remove_comments_stream(f)]
    return [line for line in lines if line is not None]

def read_node_flags(f):
    return [line.strip() for line in f.readlines() if line.strip() != '']


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
        return json.dumps(db.shortcuts[tag].json_repr(db))
    else:
        return json.dumps(db.nodes[tag].json_repr(db))

def write_graph_json(db, full_tags, shortcut_tags, outstr=None):
    if outstr is None:
        outstr = sys.stdout

    node_items = {}
    for tag in full_tags:
        node_items[tag] = db.nodes[tag].json_repr(db)
    for tag in shortcut_tags:
        node_items[tag] = db.shortcuts[tag].json_repr(db)

    titles = {node.tag: node.title for node in db.nodes.values()}
    
    items = {'nodes': node_items, 'titles': titles}
    json.dump(items, outstr)

def node_resources(node, resource_defaults):
    return [resources.add_defaults(r, resource_defaults) for r in node.resources]


