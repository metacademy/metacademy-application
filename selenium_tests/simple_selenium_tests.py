from selenium.webdriver.firefox.webdriver import WebDriver
from selenium.webdriver.common.action_chains import ActionChains

import time, unittest
from random import randint
import new
import pdb

def is_alert_present(wd):
    try:
        wd.switch_to_alert().text
        return True
    except:
        return False

class simple_selenium_tests(unittest.TestCase):
    def setUp(self):
        self.wd = WebDriver()
        self.wd.implicitly_wait(60)
        self.caps['name'] = 'Selenium Testing'
        if (os.environ.get('TRAVIS')):
            self.caps['tunnel-identifier'] = os.environ['TRAVIS_JOB_NUMBER']
            self.caps['build'] = os.environ['TRAVIS_BUILD_NUMBER']
            self.caps['tags'] = [os.environ['TRAVIS_PYTHON_VERSION'], 'CI']
        self.url = 'http://localhost:8080/'

        self.username = os.environ['SAUCE_USERNAME']
        self.key = os.environ['SAUCE_ACCESS_KEY']
        hub_url = "%s:%s@localhost:4445" % (self.username, self.key)
        self.driver = webdriver.Remote(desired_capabilities=self.caps,
                                       command_executor="http://%s/wd/hub" % hub_url)
        self.jobid = self.driver.session_id
        print "Sauce Labs job: https://saucelabs.com/jobs/%s" % self.jobid

    def test_simple_selenium_tests(self):
        success = True
        wd = self.wd
        wd.get("http://127.0.0.1:8080/")
        wd.find_element_by_link_text("Concept list").click()
        wd.find_element_by_link_text("Roadmap list").click()
        wd.find_element_by_link_text("Feedback/Questions").click()
        wd.find_element_by_link_text("About").click()
        wd.find_element_by_link_text("Sign in").click()
        wd.find_element_by_link_text("Sign up").click()
        self.assertTrue(success)

    def tearDown(self):
        self.wd.quit()

if __name__ == '__main__':
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
        d = dict(simple_selenium_tests.__dict__)
        name = "%s_%s_%s_%s" % (simple_selenium_tests.__name__,
                                platform['browserName'],
                                platform.get('platform', 'ANY'),
                                randint(0, 999))
        name = name.replace(" ", "").replace(".", "")
        d.update({'__test__': True,
                  'caps': platform,
                  })
        classes[name] = new.classobj(name, (simple_selenium_tests,), d)

    globals().update(classes)
    #unittest.main()
