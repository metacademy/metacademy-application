import pdb
import json

from django.core.urlresolvers import reverse
from django.test import TestCase
from django.contrib.auth.models import User
from django.test.client import RequestFactory

from apps.user_management.models import LearnedConcept, Profile
from apps.user_management.views import user_main

class TestUserManagementViews(TestCase):
    def test_register_index(self):
        resp = self.client.get(reverse('user:register'))
        self.assertEqual(resp.status_code, 200)

    def test_user_creation_and_data_persistence(self):
        # create a user and corresponding profile
        testuser = 'testuser'
        testpw = 'testpw'
        testemail = 'test@doesnotexist.com'
        self.user = User.objects.create_user(testuser, testemail, testpw)
        self.user.save()
        self.prof = Profile(user=self.user)
        self.prof.save()

        # create 5 learned concepts and add the previously created user to each concepts learned list
        learned_concepts = []
        for i in xrange(5):
            learned_concept_id = i
            learned_concepts.append(i)
            lc, created = LearnedConcept.objects.get_or_create(id=learned_concept_id)
            lc.uprofiles.add(self.prof)
            self.assertEqual(int(self.prof.learnedconcept_set.all()[i].pk), learned_concept_id)

        # check the /user page before authentication
        resp = self.client.get(reverse('user:user_main'))
        self.assertEqual(resp.status_code, 302) # should return a redirect

        # login
        self.client.login(username=testuser, password=testpw)
        resp = self.client.get(reverse('user:user_main'))
        # should not redirect
        self.assertEqual(resp.status_code, 200)
        # learned concepts should contain the added concepts
        self.assertEqual(set([int(lc) for lc in
                              json.loads(resp.context['lconcepts'])]), set(learned_concepts))
