import collections
import numpy as np
import re
import scipy.optimize, scipy.special

MIN_TIME = 0.5    # all concepts' time estimates must be at least this many hours.

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
    def __init__(self, concept_id, resource_id, ltype_id, count, names):
        self.concept_id = concept_id
        self.resource_id = resource_id
        self.ltype_id = ltype_id
        self.count = count
        self.names = names

    def concept_tag(self):
        return self.names.concepts[self.concept_id]
    
    def resource_key(self):
        return self.names.resources[self.resource_id]

    def location_type(self):
        return self.names.location_types[self.ltype_id]

    def __repr__(self):
        return 'Observation(%r, %r, %r, %d)' % (self.concept_tag(), self.resource_key(), self.location_type(), self.count)

    @staticmethod
    def from_names(concept_tag, resource_key, ltype, count, names):
        return Observation(names.concepts.index(concept_tag), names.resources.index(resource_key), 
                           names.location_types.index(ltype), count, names)

    @staticmethod
    def from_resource(concept_tag, resource, names):
        if 'source' in resource:
            key = resource['source']
        else:
            key = 'unknown'

        if 'location' not in resource or len(resource['location']) == 0:
            return Observation.from_names(concept_tag, key, 'location', 1, names)

        ltype = None
        count = 0
        for loc in resource['location']:
            loc_type, loc_count = parse_location(loc.text)
            if ltype is None:
                ltype = loc_type

            # currently ignoring heterogeneous resources
            if loc_type == ltype:
                count += loc_count

        return Observation.from_names(concept_tag, key, ltype, count, names)

            
        


class ModelParams:
    def __init__(self, concept_work, resource_factors, ltype_factors):
        self.concept_work = concept_work
        self.resource_factors = resource_factors
        self.ltype_factors = ltype_factors

    @staticmethod
    def default_init(names):
        return ModelParams(
            concept_work = np.ones(len(names.concepts)),
            resource_factors = np.ones(len(names.resources)),
            ltype_factors = np.ones(len(names.location_types)),
            )


class LeastSquaresModel:
    def __init__(self, observations, names, fake_poisson=False):
        self.observations = observations
        self.names = names
        self.fake_poisson = fake_poisson

    def update_concept_work(self, params):
        sum_x_sq = np.zeros(len(self.names.concepts))
        sum_xy = np.zeros(len(self.names.concepts))

        # default to 1 when nothing is observed
        sum_x_sq[:] += 1e-5
        sum_xy[:] += 1e-5

        for obs in self.observations:
            if self.fake_poisson:
                weight = 1. / obs.count
            else:
                weight = 1.

            curr_x = params.resource_factors[obs.resource_id] * params.ltype_factors[obs.ltype_id]
            curr_y = obs.count

            sum_x_sq[obs.concept_id] += weight * curr_x ** 2
            sum_xy[obs.concept_id] += weight * curr_x * curr_y

        return sum_xy / sum_x_sq


    def update_ltype_factors(self, params):
        sum_x_sq = np.zeros(len(self.names.location_types))
        sum_xy = np.zeros(len(self.names.location_types))

        # default to 1 when nothing is observed
        sum_x_sq[:] += 1e-5
        sum_xy[:] += 1e-5

        for obs in self.observations:
            if self.fake_poisson:
                weight = 1. / obs.count
            else:
                weight = 1.

            curr_x = params.concept_work[obs.concept_id] * params.resource_factors[obs.resource_id]
            curr_y = obs.count

            sum_x_sq[obs.ltype_id] += weight * curr_x ** 2
            sum_xy[obs.ltype_id] += weight * curr_x * curr_y

        result = sum_xy / sum_x_sq
        result[self.names.location_types.index('location')] = 1.    # constrain generic location type to have value 1
        return result

    def update_resource_factors(self, params):
        sum_x_sq = np.zeros(len(self.names.resources))
        sum_xy = np.zeros(len(self.names.resources))


        for obs in self.observations:
            if self.fake_poisson:
                weight = 1. / obs.count
            else:
                weight = 1.

            curr_x = params.concept_work[obs.concept_id] * params.ltype_factors[obs.ltype_id]
            curr_y = obs.count

            sum_x_sq[obs.resource_id] += weight * curr_x ** 2
            sum_xy[obs.resource_id] += weight * curr_x * curr_y

        # regularize so that value should be close to 1
        sum_x_sq[:] += 1.
        sum_xy += 1.

        return sum_xy / sum_x_sq

    def fit(self):
        params = ModelParams.default_init(self.names)
        for i in range(200):
            params.concept_work = self.update_concept_work(params)
            params.ltype_factors = self.update_ltype_factors(params)
            if i > 100:
                params.resource_factors = self.update_resource_factors(params)
        return params

def poisson_loglik(lam, k):
    return -lam + \
           k * np.log(lam) + \
           -scipy.special.gammaln(k + 1)
    

class PoissonModel:
    def __init__(self, observations, names, reg_weight):
        self.observations = observations
        self.names = names
        self.reg_weight = reg_weight

        self.obs_by_concept = collections.defaultdict(list)
        self.obs_by_ltype = collections.defaultdict(list)
        self.obs_by_resource = collections.defaultdict(list)
        for obs in self.observations:
            self.obs_by_concept[obs.concept_id].append(obs)
            self.obs_by_ltype[obs.ltype_id].append(obs)
            self.obs_by_resource[obs.resource_id].append(obs)

    def obs_loglik(self, obs, params, concept_work=None, ltype_factor=None, resource_factor=None):
        if concept_work is None:
            concept_work = params.concept_work[obs.concept_id]
        if ltype_factor is None:
            ltype_factor = params.ltype_factors[obs.ltype_id]
        if resource_factor is None:
            resource_factor = params.resource_factors[obs.resource_id]
        
        pred = concept_work * ltype_factor * resource_factor
        return poisson_loglik(pred, obs.count)
    
    def regularization_term(self, params):
        return self.reg_weight * np.sum((params.resource_factors - 1.) ** 2)

    def fobj(self, params):
        return -np.sum([self.obs_loglik(o, params) for o in self.observations]) + \
               self.regularization_term(params)

    def fobj_concept(self, params, concept_id, concept_work):
        return -np.sum([self.obs_loglik(o, params, concept_work=concept_work)
                        for o in self.obs_by_concept[concept_id]])

    def fobj_ltype(self, params, ltype_id, ltype_factor):
        return -np.sum([self.obs_loglik(o, params, ltype_factor=ltype_factor)
                        for o in self.obs_by_ltype[ltype_id]])

    def fobj_resource(self, params, resource_id, resource_factor):
        loglik = np.sum([self.obs_loglik(o, params, resource_factor=resource_factor)
                         for o in self.obs_by_resource[resource_id]])
        return -loglik + self.reg_weight * (resource_factor - 1.) ** 2
    
    def update_concept_work(self, params):
        concept_work = params.concept_work.copy()
        for i in range(len(self.names.concepts)):
            concept_work[i] = scipy.optimize.fmin(lambda t: self.fobj_concept(params, i, t[0]),
                                                  concept_work[i], disp=False)[0]
        return concept_work

    def update_ltype_factors(self, params):
        ltype_factors = params.ltype_factors.copy()
        for i in range(len(self.names.location_types)):
            if self.names.location_types[i] == 'location':
                continue
            ltype_factors[i] = scipy.optimize.fmin(lambda t: self.fobj_ltype(params, i, t[0]),
                                                   ltype_factors[i], disp=False)[0]
        return ltype_factors

    def update_resource_factors(self, params):
        resource_factors = params.resource_factors.copy()
        for i in range(len(self.names.resources)):
            resource_factors[i] = scipy.optimize.fmin(lambda t: self.fobj_resource(params, i, t[0]),
                                                      resource_factors[i], disp=False)[0]
        return resource_factors

    def fit(self):
        params = ModelParams.default_init(self.names)
        for i in range(500):
            params.concept_work = self.update_concept_work(params)
            params.ltype_factors = self.update_ltype_factors(params)
            if i > 200:
                params.resource_factors = self.update_resource_factors(params)
            print i, self.fobj(params)
        return params



# I set the coversion factor at 45 minutes per work unit. This should correspond roughly to
# two hours for every one hour of video lecture. In the future, we'll fit this explicitly
# by scraping the lengths of the videos we link to.
CONVERSION_FACTOR = 0.75

def fit_model(db, model_name='poisson'):
    concepts = [(tag, False) for tag in db.nodes]
    shortcuts = [(tag, True) for tag in db.shortcuts]
    resources = db.resources.keys() + ['unknown']
    names = Names(concepts + shortcuts, resources)

    obs = []
    for tag, node in db.nodes.items():
        for resource in node.resources:
            if 'mark' in resource and 'star' in resource['mark']:
                obs.append(Observation.from_resource((tag, False), resource, names))
    for tag, shortcut in db.shortcuts.items():
        for resource in shortcut.resources:
            if 'mark' in resource and 'star' in resource['mark']:
                obs.append(Observation.from_resource((tag, True), resource, names))

    if model_name == 'least_squares':
        params = LeastSquaresModel(obs, names, False).fit()
    elif model_name == 'fake_poisson':
        params = LeastSquaresModel(obs, names, True).fit()
    elif model_name == 'poisson':
        params = PoissonModel(obs, names, 1.).fit()
    else:
        raise RuntimeError('Unknown model: %s' % model_name)

    concept_times, shortcut_times = {}, {}
    
    for idx, (tag, is_shortcut) in enumerate(names.concepts):
        if not any([o.concept_id == idx for o in obs]):
            continue

        if is_shortcut:
            shortcut_times[tag] = CONVERSION_FACTOR * params.concept_work[idx]
        else:
            concept_times[tag] = CONVERSION_FACTOR * params.concept_work[idx]

    return concept_times, shortcut_times
            

