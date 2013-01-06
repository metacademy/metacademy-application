import os
import re
import sys
import pdb

import graphs

WRAP_WIDTH = 12

############################ read nodes as directories #########################

def read_node(path, tag):
    """Read a Node object from a directory which optionally contains title.txt,
    dependencies.txt, and see-also.txt."""
    full_path = os.path.join(path, tag)

    title_file = os.path.join(full_path, 'title.txt')
    if os.path.exists(title_file):
        title = open(title_file).readlines()[0].strip()
    else:
        title = None

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

    return graphs.Node(tag, title, dependencies, pointers)

def read_nodes(path):
    """Read all the nodes in a directory and return a dict mapping tags to Node objects."""
    tags = os.listdir(path)
    tags = filter(lambda(x): x[0] != '.' and x != 'README' ,tags) # remove hidden files and readme from list
    nodes = [read_node(path, tag) for tag in tags]
    return {node.tag: node for node in nodes}



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
        print 'warning nonetype'
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


def write_graph(nodes, graph, outp_title=None, write_json=False):
    """Write a .dot file corresponding to a dict of nodes and a Graph object giving the connections and a corresponding json file."""
    if outp_title is None:
        outstr = sys.stdout
        write_json = False
    else:
        outstr = open(outp_title + '.dot', 'w')
        if write_json:
            json_items = []

    print >> outstr, 'digraph G {'

    tags = nodes.keys()
    for t in tags:
        title = nodes[t].title
        usetag = t.replace('-', '_')
        print >> outstr, '    %s [label="%s"];' % (usetag, wrap(title, WRAP_WIDTH))
        if write_json:
            node = nodes[t]
            pt_arr = map(lambda(x): '{"from_tag":"%s","to_tag":"%s","blurb":"%s"}' % (x.from_tag, x.to_tag, x.blurb), node.pointers)
            pt_str = ','.join(pt_arr)
            dep_arr = map(lambda(x): '{"from_tag":"%s","to_tag":"%s","reason":"%s"}' % (x.parent_tag, x.child_tag, x.reason), node.dependencies)
            dep_str = ','.join(dep_arr)
            json_items.append('"%s":{"title":"%s","dependencies":[%s],"pointers":[%s]}' % (usetag, title, dep_str, pt_str))

    for parent, child in graph.edges:
        print >> outstr, '    %s -> %s;' % (parent.replace('-', '_'), child.replace('-', '_'))
    
    print >> outstr, '}'
    outstr.close()

    if write_json:
        json_str = '{' + ','.join(json_items) +'}'
        json_outf = open(outp_title +'.json', 'w')
        json_outf.write(json_str)
        json_outf.close()