# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Prerequisite'
        db.create_table(u'graph_prerequisite', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('prerequisite', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['graph.Concept'])),
            ('reason', self.gf('django.db.models.fields.CharField')(max_length=500)),
        ))
        db.send_create_signal(u'graph', ['Prerequisite'])

        # Adding field 'Concept.tag'
        db.add_column(u'graph_concept', 'tag',
                      self.gf('django.db.models.fields.CharField')(default='', unique=True, max_length=30, blank=True),
                      keep_default=False)

        # Adding field 'Concept.is_provisional'
        db.add_column(u'graph_concept', 'is_provisional',
                      self.gf('django.db.models.fields.BooleanField')(default=True),
                      keep_default=False)


    def backwards(self, orm):
        # Deleting model 'Prerequisite'
        db.delete_table(u'graph_prerequisite')

        # Deleting field 'Concept.tag'
        db.delete_column(u'graph_concept', 'tag')

        # Deleting field 'Concept.is_provisional'
        db.delete_column(u'graph_concept', 'is_provisional')


    models = {
        u'auth.group': {
            'Meta': {'object_name': 'Group'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        u'auth.permission': {
            'Meta': {'ordering': "(u'content_type__app_label', u'content_type__model', u'codename')", 'unique_together': "((u'content_type', u'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['contenttypes.ContentType']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        u'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "u'user_set'", 'blank': 'True', 'to': u"orm['auth.Group']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "u'user_set'", 'blank': 'True', 'to': u"orm['auth.Permission']"}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        u'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        u'graph.concept': {
            'Meta': {'object_name': 'Concept'},
            'exercises': ('django.db.models.fields.CharField', [], {'max_length': '2000'}),
            'goals': ('django.db.models.fields.CharField', [], {'max_length': '2000'}),
            'id': ('django.db.models.fields.CharField', [], {'max_length': '30', 'primary_key': 'True'}),
            'is_provisional': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_shortcut': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'pointers': ('django.db.models.fields.CharField', [], {'max_length': '2000'}),
            'prerequisites': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'concept_prerequisites'", 'symmetrical': 'False', 'to': u"orm['graph.Prerequisite']"}),
            'software': ('django.db.models.fields.CharField', [], {'max_length': '2000'}),
            'summary': ('django.db.models.fields.CharField', [], {'max_length': '1000'}),
            'tag': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30', 'blank': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'version_num': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        u'graph.conceptresource': {
            'Meta': {'object_name': 'ConceptResource'},
            'additional_prerequisites': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['graph.Concept']", 'symmetrical': 'False'}),
            'authors': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'core': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '500'}),
            'edition': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'free': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'location': ('django.db.models.fields.CharField', [], {'max_length': '1000'}),
            'note': ('django.db.models.fields.CharField', [], {'max_length': '500'}),
            'resource': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['graph.GlobalResource']"}),
            'resource_level': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'resource_type': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'signup': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'version_num': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'year': ('django.db.models.fields.IntegerField', [], {})
        },
        u'graph.conceptsettings': {
            'Meta': {'object_name': 'ConceptSettings'},
            'concept': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['graph.Concept']", 'unique': 'True', 'primary_key': 'True'}),
            'editors': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'concept_editors'", 'symmetrical': 'False', 'to': u"orm['user_management.Profile']"}),
            'status': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        u'graph.globalresource': {
            'Meta': {'object_name': 'GlobalResource'},
            'additional_prerequisites': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'global_additional_prerequisites'", 'symmetrical': 'False', 'to': u"orm['graph.Concept']"}),
            'authors': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '500'}),
            'edition': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'free': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'note': ('django.db.models.fields.CharField', [], {'max_length': '500'}),
            'resource_level': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'resource_type': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'signup': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'url': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'year': ('django.db.models.fields.IntegerField', [], {})
        },
        u'graph.graph': {
            'Meta': {'object_name': 'Graph'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'version_num': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        u'graph.graphsettings': {
            'Meta': {'object_name': 'GraphSettings'},
            'editors': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'graph_editors'", 'symmetrical': 'False', 'to': u"orm['user_management.Profile']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        u'graph.prerequisite': {
            'Meta': {'object_name': 'Prerequisite'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'prerequisite': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['graph.Concept']"}),
            'reason': ('django.db.models.fields.CharField', [], {'max_length': '500'})
        },
        u'user_management.profile': {
            'Meta': {'object_name': 'Profile'},
            'user': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['auth.User']", 'unique': 'True', 'primary_key': 'True'})
        }
    }

    complete_apps = ['graph']