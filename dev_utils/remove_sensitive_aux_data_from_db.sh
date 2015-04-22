#!/bin/bash

sqlite3 ../local_dbs/django_db/db.sqlite "DELETE FROM auth_permission; DELETE FROM SQLITE_SEQUENCE WHERE name='auth_permission';"
sqlite3 ../local_dbs/django_db/db.sqlite "DELETE FROM django_session; DELETE FROM SQLITE_SEQUENCE WHERE name='django_session';"
sqlite3 ../local_dbs/django_db/db.sqlite "DELETE FROM reversion_revision; DELETE FROM SQLITE_SEQUENCE WHERE name='reversion_revision';"
sqlite3 ../local_dbs/django_db/db.sqlite "DELETE FROM reversion_version; DELETE FROM SQLITE_SEQUENCE WHERE name='reversion_version';"
sqlite3 ../local_dbs/django_db/db.sqlite "DELETE FROM user_management_concepts; DELETE FROM SQLITE_SEQUENCE WHERE name='user_management_concepts';"


