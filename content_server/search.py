import os
from whoosh import index
from whoosh.fields import Schema, TEXT, ID
from whoosh.qparser import MultifieldParser

import config
import formats

main_index = None

def get_schema():
    return Schema(title=TEXT(stored=True), tag=ID(stored=True), summary=TEXT)

def build_index(nodes, content_dir, index_dir):
    if not os.path.exists(index_dir):
        os.mkdir(index_dir)
    schema = get_schema()
    ix = index.create_in(index_dir, schema)
    writer = ix.writer()
    for tag, node in nodes.items():
        writer.add_document(title=unicode(node.title), tag=unicode(tag), summary=unicode(node.summary))
    writer.commit()
    
def build_main_index():
    nodes = formats.read_nodes(config.CONTENT_PATH)
    build_index(nodes, config.CONTENT_PATH, config.INDEX_PATH)

def load_main_index():
    global main_index
    if not os.path.exists(config.INDEX_PATH):
        build_main_index()
    main_index = index.open_dir(config.INDEX_PATH)

def answer_query(query):
    with main_index.searcher() as searcher:
        query = MultifieldParser(['title', 'summary'], main_index.schema).parse(unicode(query))
        results = searcher.search(query)
        tags = [r['tag'] for r in results]
        print list(results)
    return tags


        
