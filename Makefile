#!/bin/bash
.PHONY: clean

# obtain the absolute path to metacademy-application
MAKEFILE_DIR := $(dir $(lastword $(MAKEFILE_LIST)))
MAKEFILE_DIR := $(realpath $(MAKEFILE_DIR))

# assumes the base project directory is the parent of metacademy-application
BASE_DIR := $(realpath $(MAKEFILE_DIR)/..)

# custom vars: define containing directory for local database directories
LOCAL_DBS_DIR = $(BASE_DIR)/local_dbs
# custom vars: define names of local database directories
DJANGO_DB_DIR = django_db
CONTENT_INDEX_DIR = content_index
APP_INDEX_DIR = app_index
# virtual environment directory location
VENV = $(BASE_DIR)/meta_venv
VENV_ACTIVATE = $(VENV)/bin/activate

# derived vars
LOCAL_DBS = $(LOCAL_DBS_DIR)/$(DJANGO_DB_DIR) $(LOCAL_DBS_DIR)/$(CONTENT_INDEX_DIR) $(LOCAL_DBS_DIR)/$(APP_INDEX_DIR)

# print the vars used in the makefile
$(info BASE_DIR has the value $(BASE_DIR))
$(info MAKEFILE_DIR has the value $(MAKEFILE_DIR))
$(info VENV has the value $(VENV))
$(info VENV_ACTIVATE has the value $(VENV_ACTIVATE))
$(info LOCAL_DBS has the value $(LOCAL_DBS))
$(info LOCAL_DBS_DIR has the value $(LOCAL_DBS_DIR))

app_server/static/lib/kmap/: |setup_django_dbs
	git clone "https://github.com/cjrd/kmap.git app_server/static/lib/kmap"

setup_django_dbs: config.py app_server/settings_local.py python_path $VENV $(LOCAL_DBS)
	python app_server/manage.py syncdb --no-input
	python app_server/manage.py migrate

config.py:
	cp config-template.py config.py

app_server/settings_local.py:
	cp app_server/settings_local-template.py app_server/settings_local.py

# append the meta-app path to the virtual env PYTHONPATH
python_path: |$VENV
	echo 'export PYTHONPATH=$(MAKEFILE_DIR):$(PYTHONPATH)' >> $(VENV_ACTIVATE)
	. $(VENV_ACTIVATE)

$VENV: $(VENV_ACTIVATE)

$(VENV_ACTIVATE): requirements.txt
	test -d $(VENV) || virtualenv $(VENV)
	. $(VENV_ACTIVATE); pip install -r requirements.txt
	touch $(VENV_ACTIVATE)

$(LOCAL_DBS): |$(LOCAL_DBS_DIR)
	mkdir $(LOCAL_DBS)

$(LOCAL_DBS_DIR):
	mkdir $(LOCAL_DBS_DIR)

clean:
	-rm -r $(VENV)
	-rm -r $(LOCAL_DBS)
	-rm -r $(LOCAL_DBS_DIR)
	-rm config.py
	-rm app_server/settings_local.py
