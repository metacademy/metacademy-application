import pdb
import time

from numpy import log, exp, random

try:
    from scipy.special import gammaln
except:
    print "could not import optional scipy dependency -- updating time estimates may not work"

try:
    import pandas as pd
except:
    print "could not import optional pandas dependency -- updating time estimates may not work"


class SimpleModel:

    def __init__(self, pdata):
        """
        pdata is a pandas dataframe with columns:
        TODO
        """
        # init the model data and helpfuls
        self.pdata = pdata
        self.ctags = pdata.ctag.unique()
        self.ctag_to_rct = {ct: pdata[pdata.ctag == ct].shape[0] for ct in self.ctags}
        self.ctag_to_depth = {ct: pdata[pdata.ctag == ct].iloc[0].depth for ct in self.ctags}

        # learn shape TODO explore other learn shape multiplicities
        self.gammas0 = 1.

        # count scale per resource type
        self.restypes = pdata.ltype.unique()
        self.lambdas0 = {}
        for ltype in pdata.ltype.unique():
            self.lambdas0[ltype] = pdata[pdata.ltype == ltype].cnt.mean()

        # init the alphas and beta
        ndeplevs = pdata.depth.max() + 1
        self.ndeps = ndeplevs
        self.alphas0 = [1] * ndeplevs
        self.betas0 = [1] * ndeplevs
        # init the learn units
        self.ucr = {rid: 1. for rid in pdata.rid}
        self.rel_complex = {cid: 1. for cid in self.ctags}

    def llh(self):
        """
        compute the log-likelihood
        """
        llh = 0
        added = {}
        for index, crline in self.pdata.iterrows():
            ctag = crline.ctag
            depth = crline.depth
            if ctag not in added:
                added[ctag] = 1
                # # # concept complexity term # # #
                cterm = SimpleModel.log_gamma(self.rel_complex[ctag], self.alphas0[depth], self.betas0[depth])
                llh += cterm

            # # # learn units term # # #
            ucr = self.ucr[crline.rid]
            uterm = SimpleModel.log_gamma(ucr, self.gammas0, self.rel_complex[ctag])
            llh += uterm

            # # # resources count term # # #
            lamterm = ucr * self.lambdas0[crline.ltype]
            ctterm = SimpleModel.log_poisson(crline.cnt, lamterm)
            llh += ctterm
        return llh

    def gibbs_sampling(self, nsamples, mhsamps=1):
        """
        gibbs sampling
        """
        print "starting llh", self.llh()

        for ns in xrange(nsamples):
            # update the rvs
            ## update the relative complexity
            stime = time.time()
            for ctag in self.ctags:
                cdep = self.ctag_to_depth[ctag]
                aval = self.ctag_to_rct[ctag] * self.gammas0 + self.alphas0[cdep]
                # TODO inefficient: slice and dice in the initializer
                rsum = sum([self.ucr[rid] for rid in self.pdata[self.pdata.ctag == ctag].rid])
                bval = self.betas0[cdep] + rsum
                self.rel_complex[ctag] = random.gamma(aval, 1. / bval)
                # TODO add optional llh calc here

            ## update the ucr
            for index, crline in self.pdata.iterrows():
                aval = self.gammas0 + crline.cnt
                bval = self.rel_complex[crline.ctag] + self.lambdas0[crline.ltype]
                self.ucr[crline.rid] = random.gamma(aval, 1. / bval)

            # TODO add optional llh calc here

            # update the params: metropolis sampling with uninformative prior
            # # # TODO DRY this section # # #

            ## update the alpha and beta
            pllh = self.llh()
            for mhs in xrange(mhsamps):
                for i in xrange(self.ndeps):
                    # alpha
                    curalpha = self.alphas0[i]
                    # TODO make more efficient
                    self.alphas0[i] = random.normal(curalpha, curalpha / 10.)
                    llh = self.llh()
                    rval = exp(llh - pllh)
                    if random.rand() > rval:
                        # change back
                        self.alphas0[i] = curalpha
                    else:
                        pllh = llh

                    # beta
                    curbeta = self.betas0[i]
                    self.betas0[i] = random.normal(curbeta, curbeta / 10.)
                    llh = self.llh()
                    rval = exp(llh - pllh)
                    if random.rand() > rval:
                        # change back
                        self.betas0[i] = curbeta
                    else:
                        pllh = llh

                ## update the lambda scale
                for rt in self.restypes:
                    curlam = self.lambdas0[rt]
                    self.lambdas0[rt] = random.normal(curlam, curlam / 10.)
                    llh = self.llh()
                    rval = exp(llh - pllh)
                    if random.rand() > rval:
                        self.lambdas0[rt] = curlam
                    else:
                        pllh = llh

                ## update the learn shape
                curgam = self.gammas0
                self.gammas0 = random.normal(curgam, curgam / 10.)
                llh = self.llh()
                rval = exp(llh - pllh)
                if random.rand() > rval:
                    self.curgam = curgam
                else:
                    pllh = llh

            print "{llh:10.1f}, {time:4.2f}".format(llh=pllh, time=(time.time() - stime))
            stime = time.time()

    @staticmethod
    def log_gamma(x, alpha, beta):
        return alpha * log(beta) - gammaln(alpha) + (alpha - 1) * log(x) - beta * x

    @staticmethod
    def log_poisson(k, lam):
        return k * log(lam) - gammaln(k + 1) - lam
