import collections
try:
    import numpy as np
except:
    pass
import re
try:
    import scipy.optimize, scipy.special
except:
    pass

from apps.graph import models


LECTURE_SEQUENCE_CONVERSION = 5              # suppose a lecture sequence contains this many lectures


LOCATION_TYPES = ['location', 'page']
DEFAULT_LOCATION_TYPE = 'location'


re_lecture_sequence = re.compile(r'[Ll]ecture sequence')
re_lecture_series = re.compile(r'[Ll]ecture series')
re_pages = re.compile(r'([Pp]ages?|[Pp]gs?\.?)\s*(\d+)((-|\s*to\s*)(\d+))?(.*)')


def parse_location(loc):
    if re_lecture_sequence.search(loc) or re_lecture_series.search(loc):
        return 'location', 5

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

    return DEFAULT_LOCATION_TYPE, 1


class Mapping:
    def __init__(self, names, objects=None):
        self.names = list(names)
        self.idxs = dict((n, i) for i, n in enumerate(self.names))
        self.count = len(self.names)
        if objects is not None:
            self.objects = list(objects)

class Observation:
    def __init__(self, concept_id, resource_id, ltype_id, count):
        self.concept_id = concept_id
        self.resource_id = resource_id
        self.ltype_id = ltype_id
        self.count = count

    @classmethod
    def from_names(cls, concept_tag, resource_key, ltype, count, mappings):
        return cls(mappings['concepts'].idxs[concept_tag], mappings['resources'].idxs[resource_key],
                           mappings['types'].idxs[ltype], count)

    @classmethod
    def from_resource(cls, resource, mappings):
        resource_idx = mappings['resources'].idxs[resource.global_resource.id]
        concept_idx = mappings['concepts'].idxs[resource.concept.id]

        if resource.locations.count() == 0:
            type_idx = mappings['types'].idxs[DEFAULT_LOCATION_TYPE]
            return cls(concept_idx, resource_idx, type_idx, 1)

        ltype = None
        count = 0
        for loc in resource.locations.all():
            curr_type, curr_count = parse_location(loc.location_text)
            if ltype is None:
                ltype = curr_type

            # currently ignoring heterogeneous resources
            if curr_type == ltype:
                count += curr_count

        type_idx = mappings['types'].idxs[ltype]

        return cls(concept_idx, resource_idx, type_idx, count)




class Params:
    def __init__(self, concept_weights, resource_weights, type_weights, bias):
        self.concept_weights = concept_weights
        self.resource_weights = resource_weights
        self.type_weights = type_weights
        self.bias = bias

    def to_vec(self):
        return np.concatenate([self.concept_weights, self.resource_weights, self.type_weights, [self.bias]])

    @classmethod
    def from_vec(cls, v, mappings):
        c1, c2, c3 = mappings['concepts'].count, mappings['resources'].count, mappings['types'].count
        assert v.size == c1 + c2 + c3 + 1
        return cls(v[:c1], v[c1:c1+c2], v[c1+c2:-1], v[-1])

    @classmethod
    def zeros(cls, mappings):
        return cls(np.zeros(mappings['concepts'].count), np.zeros(mappings['resources'].count),
                   np.zeros(mappings['types'].count), 0)

def poisson_log_likelihood(k, eta):
    return -np.exp(eta) + \
           k * eta + \
           -scipy.special.gammaln(k + 1)

def poisson_log_likelihood_gradient(k, eta):
    return -np.exp(eta) + k


class PoissonModel:
    def __init__(self, observations, reg_weight, mappings):
        self.observations = observations
        self.reg_weight = reg_weight
        self.mappings = mappings

    def log_likelihood(self, params):
        total = 0.
        for obs in self.observations:
            pred = params.concept_weights[obs.concept_id] + \
                   params.resource_weights[obs.resource_id] + \
                   params.type_weights[obs.ltype_id] + \
                   params.bias
            total += poisson_log_likelihood(obs.count, pred)
        return total

    def log_likelihood_gradient(self, params):
        grad = Params.zeros(self.mappings)
        for obs in self.observations:
            pred = params.concept_weights[obs.concept_id] + \
                   params.resource_weights[obs.resource_id] + \
                   params.type_weights[obs.ltype_id] + \
                   params.bias
            gx = poisson_log_likelihood_gradient(obs.count, pred)
            grad.concept_weights[obs.concept_id] += gx
            grad.resource_weights[obs.resource_id] += gx
            grad.type_weights[obs.ltype_id] += gx
            grad.bias += gx
        return grad

    def objfn(self, param_vec):
        return -self.log_likelihood(Params.from_vec(param_vec, self.mappings)) + \
               0.5 * self.reg_weight * np.sum(param_vec[:-1] ** 2)

    def grad(self, param_vec):
        reg_grad = self.reg_weight * param_vec
        reg_grad[-1] = 0.
        return -self.log_likelihood_gradient(Params.from_vec(param_vec, self.mappings)).to_vec() + \
               reg_grad
    
    def fit(self):
        init_vec = Params.zeros(self.mappings).to_vec()
        param_vec = scipy.optimize.fmin_cg(self.objfn, init_vec, self.grad)
        return Params.from_vec(param_vec, self.mappings)

    

def fit_model(reg_weight=1.):
    concepts = models.Concept.objects.all()
    concepts = [c for c in concepts if not c.is_provisional()]
    concept_names = [c.id for c in concepts]
    cmap = Mapping(concept_names, concepts)

    global_resources = models.GlobalResource.objects.all()
    resource_names = [r.id for r in global_resources]
    rmap = Mapping(resource_names, global_resources)

    tmap = Mapping(LOCATION_TYPES)
    mappings = {'concepts': cmap, 'resources': rmap, 'types': tmap}
    
    concept_resources = models.ConceptResource.objects.all()
    concept_resources = [r for r in concept_resources
                         if r.is_core() and not r.concept.is_provisional()]
    observations = [Observation.from_resource(r, mappings) for r in concept_resources]
    model = PoissonModel(observations, reg_weight, mappings)

    params = model.fit()

    #idxs = np.argsort(params.concept_weights)[::-1]

    existing_idxs = [i for i in range(len(concepts)) if concepts[i].learn_time]
    old_mean = np.mean([concepts[i].learn_time for i in existing_idxs])
    new_mean = np.mean(np.exp(params.concept_weights[existing_idxs]))
    mult = old_mean / new_mean

    ## if prnt:
    ##     for i in idxs:
    ##         old_lt = concepts[i].learn_time
    ##         if not old_lt:
    ##             old_lt = 0.
    ##         print '{:60s} {:1.3f}      {:1.3f}'.format(concepts[i].title, mult * np.exp(params.concept_weights[i]), old_lt)

    return {c.id: mult * np.exp(w) for c, w in zip(concepts, params.concept_weights)}









