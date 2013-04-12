import os

import config
import global_resources

def resource_db_path():
    return os.path.join(config.CONTENT_PATH, global_resources.RESOURCE_DB_NAME)

class Resource:
    def __init__(self, key):
        self.key = key
        self.title = None
        self.location = None
        self.resource_type = None
        self.free = 0
        self.notes = []

    def as_dict(self):
        return {'key': self.key,
                'title': self.title,
                'location': self.location,
                'resource_type': self.resource_type,
                'free': self.free,
                }

def read_resources_file(fname):
    resource_list = []
    for line_ in open(fname):
        line = line_.strip()

        if line == '':
            continue

        pos = line.find(':')
        assert pos != -1
        field = line[:pos]
        value = line[pos+1:].strip()

        if field == 'key':
            curr = Resource(value)
            resource_list.append(curr)
        elif field == 'title':
            curr.title = value
        elif field == 'location':
            curr.location = value
        elif field == 'resource_type':
            curr.resource_type = value
        elif field == 'free':
            curr.free = int(value)
        elif field == 'note':
            curr.notes.append(value)
        else:
            raise RuntimeError('Unknown field: %s' % field)

    return {r.key: r for r in resource_list}

