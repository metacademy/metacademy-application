import BaseHTTPServer
import cStringIO
import traceback
import urlparse

import os; print os.getcwd()

import config
from utils import formats, graphs


nodes = None
graph = None

def load_graph():
    global nodes, graph
    if nodes is None:
        nodes = formats.read_nodes(config.CONTENT_PATH)
        nodes = graphs.remove_missing_links(nodes)
        graph = graphs.Graph.from_node_dependencies(nodes)



class HTTPRequestHandler(BaseHTTPServer.BaseHTTPRequestHandler):
    server_version = 'AGFKDebug'

    def do_GET(self):
        load_graph()

        parse = urlparse.urlparse(self.path)
        
        parts = parse.path.lower().split('/')
        assert parts[0] == ''
        parts = parts[1:]

        query = urlparse.parse_qs(parse.query)
        if 'format' in query:
            fmt = query['format'][0]
        else:
            fmt = 'json'

        ctype = {'json': 'application/json',
                 'svg': 'image/svg+xml',
                 'dot': 'text/plain',
                 }[fmt]

        try:
            if parts[0] == 'full_graph':
                assert len(parts) == 1
                text = self.get_full_graph(fmt=fmt)
                ctype = 'application/json'
            elif parts[0] == 'nodes':
                node = parts[1]
                assert node in nodes
                if len(parts) == 2:
                    assert fmt == 'json'
                    text = self.get_node_json(parts[1])
                elif parts[2] == 'related':
                    assert len(parts) == 3
                    text = self.get_related_nodes(parts[1], fmt=fmt)
                elif parts[2] == 'map':
                    assert len(parts) == 3
                    text = self.get_map(parts[1], fmt=fmt)
                else:
                    raise RuntimeError('Invalid resource: %s' % self.path)
                ctype = 'application/json'
            else:
                raise RuntimeError('Invalid resource: %s' % self.path)
            self.send_text(text, ctype)
        except:
            self.send_error(404, traceback.format_exc())


    def send_text(self, text, ctype):
        self.send_response(200)
        self.send_header('Content-type', ctype)
        self.send_header('Content-length', len(text))
        self.end_headers()
        self.wfile.write(text)

    def format_graph(self, nodes, graph, fmt):
        if fmt == 'json':
            f = cStringIO.StringIO()
            formats.write_graph_json(nodes, graph, f)
            return f.getvalue()
        elif fmt == 'dot':
            f = cStringIO.StringIO()
            formats.write_graph_dot(nodes, graph, f)
            return f.getvalue()
        elif fmt == 'svg':
            dotfile = os.path.join(config.TEMP_PATH, 'graph.dot')
            svgfile = os.path.join(config.TEMP_PATH, 'graph.svg')
            formats.write_graph_dot(nodes, graph, open(dotfile, 'w'))
            os.system('dot -Tsvg %s -o %s' % (dotfile, svgfile))
            return open(svgfile, 'rb').read()
        else:
            raise RuntimeError('Unknown format: %s' % fmt)

    def get_full_graph(self, fmt):
        load_graph()
        return self.format_graph(nodes, graph, fmt)

    def get_related_nodes(self, tag, fmt):
        load_graph()

        ancestors = graphs.ancestors_set(nodes, graph, tag)
        descendants = graphs.descendants_set(nodes, graph, tag)
        relevant = set([tag]).union(ancestors).union(descendants)
        rel_nodes = {tag: node for tag, node in nodes.items() if tag in relevant}
        rel_nodes = graphs.remove_missing_links(rel_nodes)
        rel_graph = graphs.Graph.from_node_dependencies(rel_nodes)

        return self.format_graph(rel_nodes, rel_graph, fmt)

    def get_node_json(self, tag):
        load_graph()
        return formats.node_to_json(nodes, tag)

    def get_map(self, tag, fmt):
        load_graph()

        ancestors = graphs.ancestors_set(nodes, graph, tag)
        relevant = set([tag]).union(ancestors)
        rel_nodes = {tag: node for tag, node in nodes.items() if tag in relevant}
        rel_nodes = graphs.remove_missing_links(rel_nodes)
        rel_graph = graphs.Graph.from_node_dependencies(rel_nodes)

        return self.format_graph(rel_nodes, rel_graph, fmt)
        

    

def test():
    BaseHTTPServer.test(HandlerClass=HTTPRequestHandler)

if __name__ == '__main__':
    test()

