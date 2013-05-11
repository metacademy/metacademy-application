import os
import config
import formats

RESOURCE_FIELDS = {'title': str,
                   'location': str,
                   'resource_type': str,
                   'free': int,
                   'edition': str,
                   'url': str,
                   'authors': lambda s: formats.parse_list(s, 'and'),
                   'dependencies': lambda s: formats.parse_list(s, ','),
                   }

RESOURCE_LIST_FIELDS = {'mark': str,
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
                    node_resource[field] += value
                else:
                    if check:
                        raise RuntimeError('Unknown field: %s' % field)
        del node_resource['source']
    return node_resource

