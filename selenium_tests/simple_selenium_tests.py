import os
import sys
import new
from random import randint
import base64
import json
import httplib
import unittest
import unittest
from random import randint
import new
import pdb
import os

import nose
from nose.plugins.multiprocess import MultiProcess
from selenium import webdriver
from selenium.webdriver.firefox.webdriver import WebDriver
from selenium.webdriver.support.ui import WebDriverWait


def is_alert_present(wd):
    try:
        wd.switch_to_alert().text
        return True
    except:
        return False

class SimpleSelTest(unittest.TestCase):
    __test__ = False

    def setUp(self):
        self.caps['name'] = 'Selenium Testing'
        if (os.environ.get('TRAVIS')):
            self.caps['tunnel-identifier'] = os.environ['TRAVIS_JOB_NUMBER']
            self.caps['build'] = os.environ['TRAVIS_BUILD_NUMBER']
            self.caps['tags'] = [os.environ['TRAVIS_PYTHON_VERSION'], 'CI']
            self.username = os.environ['SAUCE_USERNAME']
            self.key = os.environ['SAUCE_ACCESS_KEY']
            hub_url = "%s:%s@localhost:4445" % (self.username, self.key)
            self.driver = webdriver.Remote(desired_capabilities=self.caps,
                                           command_executor="http://%s/wd/hub" % hub_url)
        else:
            self.driver = WebDriver()
        self.jobid = self.driver.session_id
        self.driver.implicitly_wait(60)
        print "Sauce Labs job: https://saucelabs.com/jobs/%s" % self.jobid

    def test_SimpleSelTest(self):
        success = True
        wd = self.driver
        wd.get("http://127.0.0.1:8080/")
        wd.find_element_by_link_text("Concept list").click()
        wd.find_element_by_link_text("Roadmap list").click()
        wd.find_element_by_link_text("Feedback/Questions").click()
        wd.find_element_by_link_text("About").click()
        wd.find_element_by_link_text("Sign in").click()
        wd.find_element_by_link_text("Sign up").click()
        self.assertTrue(success)

    def tearDown(self):
        self.driver.quit()

classes = {}
PLATFORMS = [
    {'browserName': 'firefox',
     'platform': 'LINUX',
     },
    # {'browserName': 'firefox',
    #  'platform': 'XP',
    #  },
    # {'browserName': 'firefox',
    #  'platform': 'VISTA',
    #  },
    # {'browserName': 'chrome',
    #  'platform': 'LINUX',
    #  },
    # {'browserName': 'chrome',
    #  'platform': 'XP',
    #  },
    # {'browserName': 'chrome',
    #  'platform': 'VISTA',
    #  },
    # {'browserName': 'internet explorer',
    #  'version': '10',
    #  'platform': 'WIN8',
    #  },
    # {'browserName': 'internet explorer',
    #  'version': '9',
    #  'platform': 'VISTA',
    #  }
    ]
for platform in PLATFORMS:
    d = dict(SimpleSelTest.__dict__)
    name = "%s_%s_%s_%s" % (SimpleSelTest.__name__,
                            platform['browserName'],
                            platform.get('platform', 'ANY'),
                            randint(0, 999))
    name = name.replace(" ", "").replace(".", "")
    d.update({'__test__': True,
              'caps': platform,
              })
    classes[name] = new.classobj(name, (SimpleSelTest,), d)

globals().update(classes)

# this is just handy. If __main__, just run the tests in multiple processes
if __name__ == "__main__":
    nose.core.run(argv=["nosetests", "-vv",
                        "--processes", len(PLATFORMS),
                        "--process-timeout", 180,
                        __file__],
                  plugins=[MultiProcess()])
    #unittest.main()
