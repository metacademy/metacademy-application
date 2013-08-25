import config
import database
import graphs

db = None
def load_db():
    global db
    db = database.Database.load(config.CONTENT_PATH)
    
def find_references(key):
    global db
    if db is None:
        load_db()

    print 'The following concepts depend on it:'
    for tag, node in db.nodes.items():
        for dep in node.dependencies:
            if dep.tag == key:
                print '   ', tag

    print 'The following shortcuts depend on it:'
    for tag, shortcut in db.shortcuts.items():
        for dep in shortcut.dependencies:
            if dep.tag == key:
                print '   ', tag

    print 'The following concepts point to it:'
    for tag, node in db.nodes.items():
        for line in node.pointers:
            for item in line.items:
                if hasattr(item, 'link') and item.link == key:
                    print '   ', tag


def rank_bottleneck_scores():
    global db
    if db is None:
        load_db()

    graphs.rank_bottleneck_scores(db.nodes, db.graph)

def list_missing_dependencies():
    global db
    if db is None:
        load_db()

    nodes = database.read_nodes(config.CONTENT_PATH)
    for tag, node in nodes.items():
        for dep in node.dependencies:
            if dep.tag not in nodes:
                print tag, 'depends on', dep.tag


