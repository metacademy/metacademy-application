import os
import config
import formats
import re

class Location:
    def __init__(self, text, link=None):
        self.text = text
        self.link = link

    def json_repr(self):
        if self.link is not None:
            return {'text': self.text, 'link': self.link}
        else:
            return {'text': self.text}
        

re_link = re.compile(r'(.*)\[([^\]]+)\]\s*$')

def parse_location(line):
    m = re_link.match(line)
    if m:
        text, link = m.groups()
        return [Location(text, link)]
    else:
        parts = line.split(';')
        return [Location(p) for p in parts]

    

RESOURCE_FIELDS = {'title': str,
                   'resource_type': str,
                   'free': int,
                   'edition': str,
                   'url': str,
                   'level': str,
                   'specific_url_base': str,
                   'authors': lambda s: formats.parse_list(s, ' and '),
                   'dependencies': lambda s: formats.parse_list(s, ',')
                   }

RESOURCE_LIST_FIELDS = {'location': parse_location,
                        'mark': str,
                        'extra': str,
                        'note': str
                        }

RESOURCE_DEFAULTS = {'free': 0,
                     }



def resource_db_path(content_path=config.CONTENT_PATH):
    return os.path.join(content_path, 'resources.txt')


def read_resources_file(fname, check=False):
    fields = dict(RESOURCE_FIELDS)
    fields['key'] = str
    list_fields = dict(RESOURCE_LIST_FIELDS)
    dicts = formats.read_text_db(open(fname), fields, list_fields, require_all=False)

    result = {}
    for d in dicts:
        if 'key' not in d:
            if check:
                raise RuntimeError('Resource missing key: %r' % d)
            else:
                continue

        for k, v in RESOURCE_DEFAULTS.items():
            if k not in d:
                d[k] = v

        key = d['key']
        del d['key']
        result[key] = d

    return result

def add_defaults(node_resource, defaults, check=False):
    node_resource = dict(node_resource)
    if 'source' in node_resource:
        key = node_resource['source']
        if key in defaults:
            for field, value in defaults[key].items():
                if field in RESOURCE_FIELDS:
                    if field not in node_resource:
                        node_resource[field] = value
                elif field in RESOURCE_LIST_FIELDS:
                    if field not in node_resource:
                        node_resource[field] = []
                    node_resource[field] = node_resource[field] + value
                else:
                    if check:
                        raise RuntimeError('Unknown field: %s' % field)
        del node_resource['source']
    return node_resource

def json_repr(resource, db):
    resource = dict(resource)

    # note is a deprecated synonym for extra
    if 'note' in resource:
        if 'extra' in resource:
            resource['extra'] = resource['extra'] + resource['note']
        else:
            resource['extra'] = resource['note']

    if 'dependencies' in resource:
        resource['dependencies'] = [{'title': db.nodes[dep].title, 'link': dep}
                                    for dep in resource['dependencies']
                                    if dep in db.nodes]

    if 'location' in resource:
        resource['location'] = [item.json_repr() for item in resource['location']]

    return resource
