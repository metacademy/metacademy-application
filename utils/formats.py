import os
import re
import sys

import graphs

WRAP_WIDTH = 12


def read_node(path, tag):
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
    tags = os.listdir(path)
    tags.remove('README')
    nodes = [read_node(path, tag) for tag in tags]
    return {node.tag: node for node in nodes}


def underscorify(s):
    temp = s.lower()
    temp = re.sub(r'[^a-z ]', ' ', temp)
    temp = temp.strip()
    return re.sub(r'\W+', '_', temp)

def wrap(s, width):
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


def write_graph(nodes, graph, outfile=None):
    if outfile is None:
        outstr = sys.stdout
    else:
        outstr = open(outfile, 'w')

    print >> outstr, 'digraph G {'

    tags = nodes.keys()
    for t in tags:
        title = nodes[t].title
        print >> outstr, '    %s [label="%s"];' % (t.replace('-', '_'), wrap(title, WRAP_WIDTH))

    for parent, child in graph.edges:
        print >> outstr, '    %s -> %s;' % (parent.replace('-', '_'), child.replace('-', '_'))
    
    print >> outstr, '}'

