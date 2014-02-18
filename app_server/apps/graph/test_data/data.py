
def concept1(tag_match=True):
    if tag_match:
        tag = 'tvat4s6ja6bhuxr'
    else:
        tag = 'nomatch1'

    return {'editNote': '',
            'exercises': 'mum exercises',
            'goals': [{'id': 'wiemte29', 'text': 'a third goal for mom'},
                      {'id': 'f5oln2ke29', 'text': 'another goal for mom'},
                      {'id': 'sr1cxzjjor', 'text': 'a goal for mom'}],
            'hasContractedDeps': False,
            'hasContractedOLs': False,
            'id': 'tvat4s6ja6bhuxr',
            'isContracted': False,
            'isNew': 1,
            'is_shortcut': 0,
            'pointers': 'mum see also',
            'resources': [{'access': '',
                           'additional_dependencies': [],
                           'concept': {'id': 'tvat4s6ja6bhuxr'},
                           'core': 0,
                           'edition': '',
                           'global_resource': {'access': '',
                                               'authors': [],
                                               'description': "it's edx",
                                               'edition_years': [],
                                               'id': 'o2g0wo2yb9',
                                               'notes': '',
                                               'resource_type': 'edx!',
                                               'title': 'EdX',
                                               'url': 'http://www.edx.org',
                                               'year': ''},
                           'id': 'enixhzd7vi',
                           'locations': [{'concept_resource': {'id': 'enixhzd7vi'},
                                          'location_text': '',
                                          'location_type': '',
                                          'url': ''}],
                           'notes': ''}],
            'sid': '',
            'software': 'mum software',
            'summary': 'mum summary',
            'tag': tag,
            'time': '',
            'title': 'mom',
            'useCsrf': True,
            'x': 443.6666666666667,
            'y': 154}

def concept2(tag_match=True):
    if tag_match:
        tag = 'uqdaziy5h4cxr'
    else:
        tag = 'nomatch2'

    return {'editNote': '',
            'exercises': 'yaya',
            'goals': [{'id': '749ylul3di', 'text': 'dad goal'}],
            'hasContractedDeps': False,
            'hasContractedOLs': False,
            'id': 'uqdaziy5h4cxr',
            'isContracted': False,
            'isNew': 1,
            'is_shortcut': 0,
            'pointers': '',
            'resources': [{'access': '',
                           'additional_dependencies': [],
                           'concept': {'id': 'uqdaziy5h4cxr'},
                           'core': 0,
                           'edition': '',
                           'global_resource': {'access': '',
                                               'authors': [],
                                               'description': '',
                                               'edition_years': [],
                                               'id': 'zmsz41jor',
                                               'notes': '',
                                               'resource_type': '',
                                               'title': '',
                                               'url': '',
                                               'year': ''},
                           'id': '9ha4gkqpvi',
                           'locations': [{'concept_resource': {'id': '9ha4gkqpvi'},
                                          'location_text': '',
                                          'location_type': '',
                                          'url': ''}],
                           'notes': ''}],
            'sid': '',
            'software': '',
            'summary': 'dad summary',
            'tag': tag,
            'time': '',
            'title': 'dad',
            'useCsrf': True,
            'x': 613.6666666666667,
            'y': 154}

def concept3(tag_match=True):
    if tag_match:
        tag = '9jgljchjobc5wmi'
    else:
        tag = 'nomatch3'

    return {'editNote': '',
            'exercises': "here's some exercises (this will change)",
            'goals': [{'id': '32j5kfyldi', 'text': 'goal 2 for the child'},
                      {'id': 'kxktiysyvi', 'text': 'goal 1 for the child'}],
            'hasContractedDeps': False,
            'hasContractedOLs': False,
            'id': '9jgljchjobc5wmi',
            'isContracted': False,
            'isNew': 1,
            'is_shortcut': 0,
            'pointers': 'see also (may change)',
            'resources': [{'access': 'reg',
                           'additional_dependencies': [{'title': 'logistic regression'},
                                                       {'title': 'gradient descent'}],
                           'concept': {'id': '9jgljchjobc5wmi'},
                           'core': 1,
                           'edition': '3',
                           'global_resource': {'access': '',
                                               'authors': ['larry page', 'serge brin'],
                                               'description': "here's a resource",
                                               'edition_years': [],
                                               'id': 'qdo8yqfr',
                                               'notes': '',
                                               'resource_type': 'google!',
                                               'title': 'a test resource',
                                               'url': 'http://www.google.com',
                                               'year': '1998'},
                           'id': 't8gk0dlsor',
                           'locations': [{'concept_resource': {'id': 't8gk0dlsor'},
                                          'location_text': 'the one and only location display text',
                                          'location_type': 'chp',
                                          'url': 'http://www.google.com'}],
                           'notes': 'this is a note'}],
            'sid': '',
            'software': 'some software (will also change)',
            'summary': 'son summary',
            'tag': tag,
            'time': '',
            'title': 'son',
            'useCsrf': True,
            'x': 528.6666666666667,
            'y': 284}

def concept_uri(id):
    return '/graphs/api/v1/concept/%s/' % id

def goal_uri(id):
    return '/graphs/api/v1/goal/%s/' % id

def dependency1():
    return {'id': 'tvat4s6ja6bhuxr9jgljchjobc5wmi',
            'reason': "she's my mum",
            'source': concept_uri('tvat4s6ja6bhuxr'),
            'source_goals': map(goal_uri, ['sr1cxzjjor', 'wiemte29']),
            'target': concept_uri('9jgljchjobc5wmi'),
            'target_goals': map(goal_uri, ['kxktiysyvi', '32j5kfyldi'])}

def dependency2():
    return {'id': 'uqdaziy5h4cxr9jgljchjobc5wmi',
            'reason': "he's my dad",
            'source': concept_uri('uqdaziy5h4cxr'),
            'source_goals': map(goal_uri, ['749ylul3di']),
            'target': concept_uri('9jgljchjobc5wmi'),
            'target_goals': map(goal_uri, ['kxktiysyvi'])}


# directly copied from a post request ()
def three_node_graph():
    return {'concepts': [concept1(), concept2(), concept3()],
            'dependencies': [dependency1(), dependency2()],
            'id': '5oxj6rjp',
            'title': 'A test graph'}

def three_concept_list(tag_match=True):
    data = {'objects': [concept1(), concept2(), concept3()]}
    if not tag_match:
        data['objects'][0]['tag'] = 'nomatch'
    return data

def single_concept(tag_match=True):
    concept = concept3()
    if not tag_match:
        concept['tag'] = 'nomatch'
    return concept

def two_dependency_list():
    return {'objects': [dependency1(), dependency2()]}
