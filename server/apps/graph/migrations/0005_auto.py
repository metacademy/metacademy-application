# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding M2M table for field learned_by on 'Concept'
        m2m_table_name = db.shorten_name(u'graph_concept_learned_by')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('concept', models.ForeignKey(orm[u'graph.concept'], null=False)),
            ('profile', models.ForeignKey(orm[u'user_management.profile'], null=False))
        ))
        db.create_unique(m2m_table_name, ['concept_id', 'profile_id'])

        # Adding M2M table for field starred_by on 'Concept'
        m2m_table_name = db.shorten_name(u'graph_concept_starred_by')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('concept', models.ForeignKey(orm[u'graph.concept'], null=False)),
            ('profile', models.ForeignKey(orm[u'user_management.profile'], null=False))
        ))
        db.create_unique(m2m_table_name, ['concept_id', 'profile_id'])


    def backwards(self, orm):
        # Removing M2M table for field learned_by on 'Concept'
        db.delete_table(db.shorten_name(u'graph_concept_learned_by'))

        # Removing M2M table for field starred_by on 'Concept'
        db.delete_table(db.shorten_name(u'graph_concept_starred_by'))


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
            'exercises': ('django.db.models.fields.CharField', [], {'max_length': '2000', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.CharField', [], {'max_length': '16', 'primary_key': 'True'}),
            'is_shortcut': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_mod': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now', 'auto_now': 'True', 'blank': 'True'}),
            'learn_time': ('django.db.models.fields.FloatField', [], {'null': 'True', 'blank': 'True'}),
            'learned_by': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'learned_concepts'", 'symmetrical': 'False', 'to': u"orm['user_management.Profile']"}),
            'pointers': ('django.db.models.fields.CharField', [], {'max_length': '2000', 'null': 'True', 'blank': 'True'}),
            'software': ('django.db.models.fields.CharField', [], {'max_length': '2000', 'null': 'True', 'blank': 'True'}),
            'starred_by': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'starred_concepts'", 'symmetrical': 'False', 'to': u"orm['user_management.Profile']"}),
            'summary': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'blank': 'True'}),
            'tag': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'}),
            'tags': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'concepts'", 'symmetrical': 'False', 'to': u"orm['graph.Tag']"}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'version_num': ('django.db.models.fields.IntegerField', [], {'default': '0', 'null': 'True', 'blank': 'True'})
        },
        u'graph.conceptresource': {
            'Meta': {'object_name': 'ConceptResource'},
            'additional_dependencies': ('django.db.models.fields.CharField', [], {'max_length': '300', 'null': 'True', 'blank': 'True'}),
            'concept': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'concept_resource'", 'to': u"orm['graph.Concept']"}),
            'core': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'edition': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'global_resource': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'cresources'", 'to': u"orm['graph.GlobalResource']"}),
            'goals_covered': ('django.db.models.fields.related.ManyToManyField', [], {'blank': 'True', 'related_name': "'goals_covered'", 'null': 'True', 'symmetrical': 'False', 'to': u"orm['graph.Goal']"}),
            'id': ('django.db.models.fields.CharField', [], {'max_length': '16', 'primary_key': 'True'}),
            'last_mod': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now', 'auto_now': 'True', 'blank': 'True'}),
            'notes': ('django.db.models.fields.CharField', [], {'max_length': '500', 'null': 'True', 'blank': 'True'}),
            'ordering': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'version_num': ('django.db.models.fields.IntegerField', [], {'default': '0', 'null': 'True', 'blank': 'True'})
        },
        u'graph.conceptsettings': {
            'Meta': {'object_name': 'ConceptSettings'},
            'concept': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['graph.Concept']", 'unique': 'True', 'primary_key': 'True'}),
            'edited_by': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'edited_concept'", 'symmetrical': 'False', 'to': u"orm['user_management.Profile']"}),
            'status': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        u'graph.dependency': {
            'Meta': {'object_name': 'Dependency'},
            'id': ('django.db.models.fields.CharField', [], {'max_length': '32', 'primary_key': 'True'}),
            'last_mod': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now', 'auto_now': 'True', 'blank': 'True'}),
            'ordering': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'reason': ('django.db.models.fields.CharField', [], {'max_length': '500'}),
            'source': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'dep_source'", 'to': u"orm['graph.Concept']"}),
            'source_goals': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'source_goals'", 'symmetrical': 'False', 'to': u"orm['graph.Goal']"}),
            'target': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'dep_target'", 'to': u"orm['graph.Concept']"}),
            'target_goals': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'target_goals'", 'symmetrical': 'False', 'to': u"orm['graph.Goal']"})
        },
        u'graph.globalresource': {
            'Meta': {'object_name': 'GlobalResource'},
            'access': ('django.db.models.fields.CharField', [], {'max_length': '4'}),
            'authors': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '200'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'edition_years': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.CharField', [], {'max_length': '16', 'primary_key': 'True'}),
            'last_mod': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now', 'auto_now': 'True', 'blank': 'True'}),
            'notes': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'resource_type': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'url': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'version_num': ('django.db.models.fields.IntegerField', [], {'default': '0', 'null': 'True', 'blank': 'True'}),
            'year': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'})
        },
        u'graph.goal': {
            'Meta': {'object_name': 'Goal'},
            'concept': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'goals'", 'to': u"orm['graph.Concept']"}),
            'id': ('django.db.models.fields.CharField', [], {'max_length': '16', 'primary_key': 'True'}),
            'last_mod': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now', 'auto_now': 'True', 'blank': 'True'}),
            'ordering': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'text': ('django.db.models.fields.CharField', [], {'max_length': '500'})
        },
        u'graph.graph': {
            'Meta': {'object_name': 'Graph'},
            'concepts': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'graph_concepts'", 'symmetrical': 'False', 'to': u"orm['graph.Concept']"}),
            'dependencies': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'graph_dependencies'", 'symmetrical': 'False', 'to': u"orm['graph.Dependency']"}),
            'id': ('django.db.models.fields.CharField', [], {'max_length': '16', 'primary_key': 'True'}),
            'last_mod': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now', 'auto_now': 'True', 'blank': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        u'graph.graphsettings': {
            'Meta': {'object_name': 'GraphSettings'},
            'edited_by': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'edited_graph'", 'symmetrical': 'False', 'to': u"orm['user_management.Profile']"}),
            'graph': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['graph.Graph']", 'unique': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        },
        u'graph.resourcelocation': {
            'Meta': {'object_name': 'ResourceLocation'},
            'cresource': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'locations'", 'to': u"orm['graph.ConceptResource']"}),
            'id': ('django.db.models.fields.CharField', [], {'max_length': '16', 'primary_key': 'True'}),
            'last_mod': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now', 'auto_now': 'True', 'blank': 'True'}),
            'location_text': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'location_type': ('django.db.models.fields.CharField', [], {'max_length': '30'}),
            'ordering': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'url': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'version_num': ('django.db.models.fields.IntegerField', [], {'default': '0', 'null': 'True', 'blank': 'True'})
        },
        u'graph.tag': {
            'Meta': {'object_name': 'Tag'},
            'id': ('django.db.models.fields.CharField', [], {'max_length': '30', 'primary_key': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        u'graph.targetgraph': {
            'Meta': {'object_name': 'TargetGraph'},
            'concepts': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'target_graphs'", 'symmetrical': 'False', 'to': u"orm['graph.Concept']"}),
            'dependencies': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'targetgraph_dependencies'", 'symmetrical': 'False', 'to': u"orm['graph.Dependency']"}),
            'depth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'leaf': ('django.db.models.fields.related.OneToOneField', [], {'related_name': "'tgraph_leaf'", 'unique': 'True', 'primary_key': 'True', 'to': u"orm['graph.Concept']"})
        },
        u'user_management.profile': {
            'Meta': {'object_name': 'Profile'},
            'user': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['auth.User']", 'unique': 'True', 'primary_key': 'True'})
        }
    }

    complete_apps = ['graph']