import os

import config
import formats
import global_resources

def resource_db_path():
    return os.path.join(config.CONTENT_PATH, global_resources.RESOURCE_DB_NAME)

class Resource:
    def __init__(self, key, title, location, resource_type, free, notes):
        self.key = key
        self.title = title
        self.location = location
        self.resource_type = resource_type
        self.free = free
        self.notes = notes

    def as_dict(self):
        return {'key': self.key,
                'title': self.title,
                'location': self.location,
                'resource_type': self.resource_type,
                'free': self.free,
                'notes': self.notes,
                }

def read_resources_file(fname):
    keys = {'key': str,
            'title': str,
            'location': (str, None),
            'resource_type': str,
            'free': (int, 0),
            }
    list_keys = {'note': str,
                 }
    dicts = formats.read_text_db(open(fname), keys, list_keys)
    resource_list = [Resource(d['key'], d['title'], d['location'], d['resource_type'], d['free'], d['note'])
                     for d in dicts]
    return {r.key: r for r in resource_list}

