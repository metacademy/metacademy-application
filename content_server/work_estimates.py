import numpy as np
import re


LOCATION_TYPES = ['location', 'page', 'lecture_sequence']

re_lecture_sequence = re.compile(r'[Ll]ecture sequence')
re_lecture_series = re.compile(r'[Ll]ecture series')
re_pages = re.compile(r'([Pp]ages?|[Pp]gs?\.?)\s*(\d+)((-|\s*to\s*)(\d+))?(.*)')


def parse_location(loc):
    if re_lecture_sequence.search(loc) or re_lecture_series.search(loc):
        return 'lecture_sequence', 1

    m = re_pages.search(loc)
    if m:
        count = 0
        rest = loc
        while True:
            m = re_pages.search(rest)
            if not m:
                break
            
            first_str, last_str, rest = m.group(2), m.group(5), m.group(6)
            try:
                first, last = int(first_str), int(last_str)
                assert last >= first
                count += last - first
            except:
                pass

        return 'page', max(count, 1)

    return 'location', 1
    


class Names:
    def __init__(self, concepts, resources, location_types=LOCATION_TYPES):
        self.concepts = concepts
        self.resources = resources
        self.location_types = location_types


class Observation:
    def __init__(self, concept_id, resource_id, location_type_id, count, names):
        self.concept_id = concept_id
        self.resource_id = resource_id
        self.location_type_id = location_type_id
        self.count = count
        self.names = names

    def concept_tag(self):
        return self.names.concepts[self.concept_id]
    
    def resource_key(self):
        return self.names.resources[self.resource_id]

    def location_type(self):
        return self.names.location_types[self.location_type_id]

    def __repr__(self):
        return 'Observation(%r, %r, %r, %d)' % (self.concept_tag(), self.resource_key(), self.location_type(), self.count)

    @staticmethod
    def from_names(concept_tag, resource_key, location_type, count, names):
        return Observation(names.concepts.index(concept_tag), names.resources.index(resource_key), 
                           names.location_types.index(location_type), count, names)

    @staticmethod
    def from_resource(concept_tag, resource, names):
        if 'source' in resource:
            key = resource['source']
        else:
            key = 'unknown'

        if 'location' not in resource or len(resource['location']) == 0:
            return Observation.from_names(concept_tag, key, 'location', 1, names)

        location_type = None
        count = 0
        for loc in resource['location']:
            loc_type, loc_count = parse_location(loc.text)
            if location_type is None:
                location_type = loc_type

            # currently ignoring heterogeneous resources
            if loc_type == location_type:
                count += loc_count

        return Observation.from_names(concept_tag, key, location_type, count, names)

            
        


class ModelParams:
    def __init__(self, concept_work, resource_factors, location_type_factors):
        self.concept_work = concept_work
        self.resource_factors = resource_factors
        self.location_type_factors = location_type_factors

    @staticmethod
    def default_init(names):
        return ModelParams(
            concept_work = np.ones(len(names.concepts)),
            resource_factors = np.ones(len(names.resources)),
            location_type_factors = np.ones(len(names.location_types)),
            )
    

def update_concept_work(params, observations, names):
    sum_x_sq = np.zeros(len(names.concepts))
    sum_xy = np.zeros(len(names.concepts))

    # default to 1 when nothing is observed
    sum_x_sq[:] += 1e-5
    sum_xy[:] += 1e-5

    for obs in observations:
        curr_x = params.resource_factors[obs.resource_id] * params.location_type_factors[obs.location_type_id]
        curr_y = obs.count

        sum_x_sq[obs.concept_id] += curr_x ** 2
        sum_xy[obs.concept_id] += curr_x * curr_y

    return sum_xy / sum_x_sq

def update_location_type_factors(params, observations, names):
    sum_x_sq = np.zeros(len(names.location_types))
    sum_xy = np.zeros(len(names.location_types))

    # default to 1 when nothing is observed
    sum_x_sq[:] += 1e-5
    sum_xy[:] += 1e-5

    for obs in observations:
        curr_x = params.concept_work[obs.concept_id] * params.resource_factors[obs.resource_id]
        curr_y = obs.count

        sum_x_sq[obs.location_type_id] += curr_x ** 2
        sum_xy[obs.location_type_id] += curr_x * curr_y

    result = sum_xy / sum_x_sq
    result[names.location_types.index('location')] = 1.    # constrain generic location type to have value 1
    return result

def update_resource_factors(params, observations, names):
    sum_x_sq = np.zeros(len(names.resources))
    sum_xy = np.zeros(len(names.resources))


    for obs in observations:
        curr_x = params.concept_work[obs.concept_id] * params.location_type_factors[obs.location_type_id]
        curr_y = obs.count

        sum_x_sq[obs.resource_id] += curr_x ** 2
        sum_xy[obs.resource_id] += curr_x * curr_y

    # regularize so that value should be close to 1
    sum_x_sq[:] += 1.
    sum_xy += 1.

    return sum_xy / sum_x_sq


