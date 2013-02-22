import os
import re
import sys
import pdb

import graphs

WRAP_WIDTH = 12

############################ read nodes as directories #########################

def read_node(path, tag, assert_exists=False):
    """Read a Node object from a directory which optionally contains title.txt,
    dependencies.txt, key.txt, references.txt, summary.txt, and see-also.txt."""
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
    summary = ""
    if os.path.exists(summary_file):
        summary = open(summary_file).read().strip().replace('"',"'")

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

    return graphs.Node({'tag':tag, 'title':title, 'summary':summary, 'dependencies':dependencies, 'pointers':pointers})

def read_nodes(path, onlytitle=False):
    """Read all the nodes in a directory and return a dict mapping tags to Node objects."""
    tags = os.listdir(path)
    tags = filter(lambda(x): x[0] != '.' and x != 'README' ,tags) # remove hidden files and readme from list
    if onlytitle:
        return tags
    else:
        nodes = [read_node(path, tag) for tag in tags]
        return {node.tag: node for node in nodes}

def check_format(path):
    tags = os.listdir(path)
    tags = filter(lambda(x): x[0] != '.' and x != 'README' ,tags) # remove hidden files and readme from list

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
    node = nodes[tag]

    pt_arr = ['{"from_tag":"%s","to_tag":"%s","blurb":"%s"}' % (p.from_tag, p.to_tag, p.blurb)
              for p in node.pointers]
    pt_str = ','.join(pt_arr)
    dep_arr = ['{"from_tag":"%s","to_tag":"%s","reason":"%s"}' % (d.parent_tag, d.child_tag, d.reason)
               for d in node.dependencies]
    dep_str = ','.join(dep_arr)

    nvars = vars(node).copy() # copy so we don't alter the node object
    del(nvars["dependencies"])
    del(nvars["pointers"])
    nstring = ','.join('"%s":"%s"' % item for item in nvars.items())

    return '{%s,"dependencies":[%s],"pointers":[%s]}' % (nstring, dep_str, pt_str)
    


def write_graph_json(nodes, graph, outstr=None):
    if outstr is None:
        outstr = sys.stdout

    json_items = ['"%s":%s' % (tag.replace('-','_'), node_to_json(nodes, tag))
                  for tag in nodes.keys()]
    json_str = '{' + ','.join(json_items) +'}'
    outstr.write(json_str)

