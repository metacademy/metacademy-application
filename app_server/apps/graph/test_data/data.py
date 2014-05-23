

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
            'id': 'tvat4s6ja6bhuxr',
            'pointers': 'mum see also',
            'resources': [{'access': '',
                           'additional_dependencies': [],
                           'concept': concept_uri('tvat4s6ja6bhuxr'),
                           'core': 0,
                           'edition': '',
                           'goals_covered': map(goal_uri, ["wiemte29", "sr1cxzjjor"]),
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
                           'locations': [{'cresource': concept_resource_uri('enixhzd7vi'),
                                          'location_text': '',
                                          'location_type': '',
                                          'url': ''}],
                           'notes': ''}],
            'software': 'mum software',
            'summary': 'mum summary',
            'tag': tag,
            'time': '',
            'title': 'mom',
            }

def concept2(tag_match=True):
    if tag_match:
        tag = 'uqdaziy5h4cxr'
    else:
        tag = 'nomatch2'

    return {'editNote': '',
            'exercises': 'yaya',
            'goals': [{'id': '749ylul3di', 'text': 'dad goal'}],
            'id': 'uqdaziy5h4cxr',
            'pointers': '',
            'resources': [{'access': '',
                           'additional_dependencies': [],
                           'concept': concept_uri('uqdaziy5h4cxr'),
                           'core': 0,
                           'goals_covered': [],
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
                           'locations': [{'cresource': concept_resource_uri('9ha4gkqpvi'),
                                          'location_text': '',
                                          'location_type': '',
                                          'url': ''}],
                           'notes': ''}],
            'software': '',
            'summary': 'dad summary',
            'tag': tag,
            'time': '',
            'title': 'dad'}


def concept3(tag_match=True):
    if tag_match:
        tag = '9jgljchjobc5wmi'
    else:
        tag = 'nomatch3'

    return {'editNote': '',
            'exercises': "here's some exercises (this will change)",
            'goals': [{'id': '32j5kfyldi', 'text': 'goal 2 for the child'},
                      {'id': 'kxktiysyvi', 'text': 'goal 1 for the child'}],
            'id': '9jgljchjobc5wmi',
            'pointers': 'see also (may change)',
            'resources': [{'access': 'reg',
                           'additional_dependencies': [{'title': 'logistic regression'},
                                                       {'title': 'gradient descent'}],
                           'concept': concept_uri('9jgljchjobc5wmi'),
                           'core': 0,
                           'edition': '3',
                           'goals_covered': [],
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
                           'locations': [{'cresource': concept_resource_uri('t8gk0dlsor'),
                                          'location_text': 'the one and only location display text',
                                          'location_type': 'chp',
                                          'url': 'http://www.google.com'}],
                           'notes': 'this is a note'}],
            'software': 'some software (will also change)',
            'summary': 'son summary',
            'tag': tag,
            'time': '',
            'title': 'son'}


def concept4(tag_match=True):
    if tag_match:
        tag = 'c95j43nx8dj4ne8'
    else:
        tag = 'nomatch4'

    return {'editNote': '',
            'exercises': "here's some exercises (this will change)",
            'flags': [],
            'goals': [{'id': '9c84hgiske', 'text': 'yet another goal'}],
            'id': 'c95j43nx8dj4ne8',
            'pointers': 'see also (may change)',
            'resources': [{'access': 'reg',
                           'additional_dependencies': [{'title': 'something'},
                                                       {'title': 'something else'}],
                           'concept': concept_uri('c95j43nx8dj4ne8'),
                           'core': 1,
                           'edition': '3',
                           'goals_covered': [goal_uri("9c84hgiske")],
                           'global_resource': {'access': '',
                                               'authors': ['somebody', 'nobody'],
                                               'description': "yet another resource",
                                               'edition_years': [],
                                               'id': 'c985jdic',
                                               'notes': '',
                                               'resource_type': 'some type!',
                                               'title': 'what a title',
                                               'url': 'http://www.somethingsomething.com',
                                               'year': '1994'},
                           'id': 'd8cu3bdd',
                           'locations': [{'cresource': concept_resource_uri('d8cu3bdd'),
                                          'location_text': 'some sort of text',
                                          'location_type': 'chp',
                                          'url': 'http://www.somethingelse.com'}],
                           'notes': 'this is another note'}],
            'software': 'some software (will also change)',
            'summary': 'yet another summary',
            'tag': tag,
            'time': '',
            'title': 'yet another concept'}


def concept_uri(id):
    return '/graphs/api/v1/concept/%s/' % id


def concept_resource_uri(id):
    return '/graphs/api/v1/conceptresource/%s/' % id


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


def dependency3():
    return {'id': 'c9erhj3n4oi8dhfwjen43',
            'reason': 'yet another reason',
            'source': concept_uri('tvat4s6ja6bhuxr'),
            'source_goals': map(goal_uri, ['sr1cxzjjor', 'wiemte29']),
            'target': concept_uri('uqdaziy5h4cxr'),
            'target_goals': map(goal_uri, ['749ylul3di'])}



# directly copied from a post request ()
def three_node_graph():
    return {'concepts': [concept1(), concept2(), concept3()],
            'dependencies': [dependency1(), dependency2()],
            'id': '5oxj6rjp',
            'title': 'A test graph'}

def initial_concepts(tag_match):
    return [concept1(tag_match), concept2(tag_match), concept3(tag_match)]

def new_concepts(tag_match):
    return [concept4(tag_match)]

def initial_dependencies():
    return [dependency1(), dependency2()]

def new_dependencies():
    return [dependency3()]
