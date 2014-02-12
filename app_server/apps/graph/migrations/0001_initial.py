# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Concept'
        db.create_table(u'graph_concept', (
            ('id', self.gf('django.db.models.fields.CharField')(max_length=16, primary_key=True)),
            ('tag', self.gf('django.db.models.fields.CharField')(unique=True, max_length=30)),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('summary', self.gf('django.db.models.fields.CharField')(max_length=1000, null=True, blank=True)),
            ('exercises', self.gf('django.db.models.fields.CharField')(max_length=2000, null=True, blank=True)),
            ('software', self.gf('django.db.models.fields.CharField')(max_length=2000, null=True, blank=True)),
            ('pointers', self.gf('django.db.models.fields.CharField')(max_length=2000, null=True, blank=True)),
            ('version_num', self.gf('django.db.models.fields.IntegerField')(default=0, null=True, blank=True)),
            ('is_shortcut', self.gf('django.db.models.fields.BooleanField')(default=False)),
        ))
        db.send_create_signal(u'graph', ['Concept'])

        # Adding M2M table for field flags on 'Concept'
        m2m_table_name = db.shorten_name(u'graph_concept_flags')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('concept', models.ForeignKey(orm[u'graph.concept'], null=False)),
            ('flag', models.ForeignKey(orm[u'graph.flag'], null=False))
        ))
        db.create_unique(m2m_table_name, ['concept_id', 'flag_id'])

        # Adding model 'Goal'
        db.create_table(u'graph_goal', (
            ('id', self.gf('django.db.models.fields.CharField')(max_length=16, primary_key=True)),
            ('concept', self.gf('django.db.models.fields.related.ForeignKey')(related_name='goals', to=orm['graph.Concept'])),
            ('text', self.gf('django.db.models.fields.CharField')(max_length=500)),
        ))
        db.send_create_signal(u'graph', ['Goal'])

        # Adding model 'Flag'
        db.create_table(u'graph_flag', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('text', self.gf('django.db.models.fields.CharField')(max_length=100)),
        ))
        db.send_create_signal(u'graph', ['Flag'])

        # Adding model 'Dependency'
        db.create_table(u'graph_dependency', (
            ('id', self.gf('django.db.models.fields.CharField')(max_length=32, primary_key=True)),
            ('source', self.gf('django.db.models.fields.related.ForeignKey')(related_name='dep_source', to=orm['graph.Concept'])),
            ('target', self.gf('django.db.models.fields.related.ForeignKey')(related_name='dep_target', to=orm['graph.Concept'])),
            ('reason', self.gf('django.db.models.fields.CharField')(max_length=500)),
        ))
        db.send_create_signal(u'graph', ['Dependency'])

        # Adding M2M table for field source_goals on 'Dependency'
        m2m_table_name = db.shorten_name(u'graph_dependency_source_goals')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('dependency', models.ForeignKey(orm[u'graph.dependency'], null=False)),
            ('goal', models.ForeignKey(orm[u'graph.goal'], null=False))
        ))
        db.create_unique(m2m_table_name, ['dependency_id', 'goal_id'])

        # Adding M2M table for field target_goals on 'Dependency'
        m2m_table_name = db.shorten_name(u'graph_dependency_target_goals')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('dependency', models.ForeignKey(orm[u'graph.dependency'], null=False)),
            ('goal', models.ForeignKey(orm[u'graph.goal'], null=False))
        ))
        db.create_unique(m2m_table_name, ['dependency_id', 'goal_id'])

        # Adding model 'ConceptSettings'
        db.create_table(u'graph_conceptsettings', (
            ('concept', self.gf('django.db.models.fields.related.OneToOneField')(to=orm['graph.Concept'], unique=True, primary_key=True)),
            ('status', self.gf('django.db.models.fields.CharField')(max_length=100)),
        ))
        db.send_create_signal(u'graph', ['ConceptSettings'])

        # Adding M2M table for field editors on 'ConceptSettings'
        m2m_table_name = db.shorten_name(u'graph_conceptsettings_editors')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('conceptsettings', models.ForeignKey(orm[u'graph.conceptsettings'], null=False)),
            ('profile', models.ForeignKey(orm[u'user_management.profile'], null=False))
        ))
        db.create_unique(m2m_table_name, ['conceptsettings_id', 'profile_id'])

        # Adding model 'GlobalResource'
        db.create_table(u'graph_globalresource', (
            ('id', self.gf('django.db.models.fields.CharField')(max_length=16, primary_key=True)),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('authors', self.gf('django.db.models.fields.CharField')(max_length=200, null=True, blank=True)),
            ('resource_type', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('year', self.gf('django.db.models.fields.IntegerField')(null=True, blank=True)),
            ('edition_years', self.gf('django.db.models.fields.CharField')(max_length=100, null=True, blank=True)),
            ('description', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('notes', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('version_num', self.gf('django.db.models.fields.IntegerField')(default=0, null=True, blank=True)),
            ('access', self.gf('django.db.models.fields.CharField')(max_length=4)),
            ('url', self.gf('django.db.models.fields.CharField')(max_length=200)),
        ))
        db.send_create_signal(u'graph', ['GlobalResource'])

        # Adding model 'ConceptResource'
        db.create_table(u'graph_conceptresource', (
            ('global_resource', self.gf('django.db.models.fields.related.ForeignKey')(related_name='cresources', to=orm['graph.GlobalResource'])),
            ('id', self.gf('django.db.models.fields.CharField')(max_length=16, primary_key=True)),
            ('concept', self.gf('django.db.models.fields.related.ForeignKey')(related_name='concept_resource', to=orm['graph.Concept'])),
            ('core', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('additional_dependencies', self.gf('django.db.models.fields.CharField')(max_length=300, null=True, blank=True)),
            ('edition', self.gf('django.db.models.fields.CharField')(max_length=100, null=True, blank=True)),
            ('version_num', self.gf('django.db.models.fields.IntegerField')(default=0, null=True, blank=True)),
            ('access', self.gf('django.db.models.fields.CharField')(max_length=4)),
            ('notes', self.gf('django.db.models.fields.CharField')(max_length=500, null=True, blank=True)),
        ))
        db.send_create_signal(u'graph', ['ConceptResource'])

        # Adding M2M table for field goals_covered on 'ConceptResource'
        m2m_table_name = db.shorten_name(u'graph_conceptresource_goals_covered')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('conceptresource', models.ForeignKey(orm[u'graph.conceptresource'], null=False)),
            ('goal', models.ForeignKey(orm[u'graph.goal'], null=False))
        ))
        db.create_unique(m2m_table_name, ['conceptresource_id', 'goal_id'])

        # Adding model 'ResourceLocation'
        db.create_table(u'graph_resourcelocation', (
            ('id', self.gf('django.db.models.fields.CharField')(max_length=16, primary_key=True)),
            ('cresource', self.gf('django.db.models.fields.related.ForeignKey')(related_name='locations', to=orm['graph.ConceptResource'])),
            ('url', self.gf('django.db.models.fields.CharField')(max_length=100, null=True, blank=True)),
            ('location_type', self.gf('django.db.models.fields.CharField')(max_length=3)),
            ('location_text', self.gf('django.db.models.fields.CharField')(max_length=100, null=True, blank=True)),
            ('version_num', self.gf('django.db.models.fields.IntegerField')(default=0, null=True, blank=True)),
        ))
        db.send_create_signal(u'graph', ['ResourceLocation'])

        # Adding model 'Graph'
        db.create_table(u'graph_graph', (
            ('id', self.gf('django.db.models.fields.CharField')(max_length=16, primary_key=True)),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=100)),
        ))
        db.send_create_signal(u'graph', ['Graph'])

        # Adding M2M table for field concepts on 'Graph'
        m2m_table_name = db.shorten_name(u'graph_graph_concepts')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('graph', models.ForeignKey(orm[u'graph.graph'], null=False)),
            ('concept', models.ForeignKey(orm[u'graph.concept'], null=False))
        ))
        db.create_unique(m2m_table_name, ['graph_id', 'concept_id'])

        # Adding M2M table for field dependencies on 'Graph'
        m2m_table_name = db.shorten_name(u'graph_graph_dependencies')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('graph', models.ForeignKey(orm[u'graph.graph'], null=False)),
            ('dependency', models.ForeignKey(orm[u'graph.dependency'], null=False))
        ))
        db.create_unique(m2m_table_name, ['graph_id', 'dependency_id'])

        # Adding model 'GraphSettings'
        db.create_table(u'graph_graphsettings', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('graph', self.gf('django.db.models.fields.related.OneToOneField')(to=orm['graph.Graph'], unique=True)),
        ))
        db.send_create_signal(u'graph', ['GraphSettings'])

        # Adding M2M table for field editors on 'GraphSettings'
        m2m_table_name = db.shorten_name(u'graph_graphsettings_editors')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('graphsettings', models.ForeignKey(orm[u'graph.graphsettings'], null=False)),
            ('profile', models.ForeignKey(orm[u'user_management.profile'], null=False))
        ))
        db.create_unique(m2m_table_name, ['graphsettings_id', 'profile_id'])


    def backwards(self, orm):
        # Deleting model 'Concept'
        db.delete_table(u'graph_concept')

        # Removing M2M table for field flags on 'Concept'
        db.delete_table(db.shorten_name(u'graph_concept_flags'))

        # Deleting model 'Goal'
        db.delete_table(u'graph_goal')

        # Deleting model 'Flag'
        db.delete_table(u'graph_flag')

        # Deleting model 'Dependency'
        db.delete_table(u'graph_dependency')

        # Removing M2M table for field source_goals on 'Dependency'
        db.delete_table(db.shorten_name(u'graph_dependency_source_goals'))

        # Removing M2M table for field target_goals on 'Dependency'
        db.delete_table(db.shorten_name(u'graph_dependency_target_goals'))

        # Deleting model 'ConceptSettings'
        db.delete_table(u'graph_conceptsettings')

        # Removing M2M table for field editors on 'ConceptSettings'
        db.delete_table(db.shorten_name(u'graph_conceptsettings_editors'))

        # Deleting model 'GlobalResource'
        db.delete_table(u'graph_globalresource')

        # Deleting model 'ConceptResource'
        db.delete_table(u'graph_conceptresource')

        # Removing M2M table for field goals_covered on 'ConceptResource'
        db.delete_table(db.shorten_name(u'graph_conceptresource_goals_covered'))

        # Deleting model 'ResourceLocation'
        db.delete_table(u'graph_resourcelocation')

        # Deleting model 'Graph'
        db.delete_table(u'graph_graph')

        # Removing M2M table for field concepts on 'Graph'
        db.delete_table(db.shorten_name(u'graph_graph_concepts'))

        # Removing M2M table for field dependencies on 'Graph'
        db.delete_table(db.shorten_name(u'graph_graph_dependencies'))

        # Deleting model 'GraphSettings'
        db.delete_table(u'graph_graphsettings')

        # Removing M2M table for field editors on 'GraphSettings'
        db.delete_table(db.shorten_name(u'graph_graphsettings_editors'))


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
            'flags': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'to': u"orm['graph.Flag']", 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.CharField', [], {'max_length': '16', 'primary_key': 'True'}),
            'is_shortcut': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'pointers': ('django.db.models.fields.CharField', [], {'max_length': '2000', 'null': 'True', 'blank': 'True'}),
            'software': ('django.db.models.fields.CharField', [], {'max_length': '2000', 'null': 'True', 'blank': 'True'}),
            'summary': ('django.db.models.fields.CharField', [], {'max_length': '1000', 'null': 'True', 'blank': 'True'}),
            'tag': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'version_num': ('django.db.models.fields.IntegerField', [], {'default': '0', 'null': 'True', 'blank': 'True'})
        },
        u'graph.conceptresource': {
            'Meta': {'object_name': 'ConceptResource'},
            'access': ('django.db.models.fields.CharField', [], {'max_length': '4'}),
            'additional_dependencies': ('django.db.models.fields.CharField', [], {'max_length': '300', 'null': 'True', 'blank': 'True'}),
            'concept': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'concept_resource'", 'to': u"orm['graph.Concept']"}),
            'core': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'edition': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'global_resource': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'cresources'", 'to': u"orm['graph.GlobalResource']"}),
            'goals_covered': ('django.db.models.fields.related.ManyToManyField', [], {'blank': 'True', 'related_name': "'goals_covered'", 'null': 'True', 'symmetrical': 'False', 'to': u"orm['graph.Goal']"}),
            'id': ('django.db.models.fields.CharField', [], {'max_length': '16', 'primary_key': 'True'}),
            'notes': ('django.db.models.fields.CharField', [], {'max_length': '500', 'null': 'True', 'blank': 'True'}),
            'version_num': ('django.db.models.fields.IntegerField', [], {'default': '0', 'null': 'True', 'blank': 'True'})
        },
        u'graph.conceptsettings': {
            'Meta': {'object_name': 'ConceptSettings'},
            'concept': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['graph.Concept']", 'unique': 'True', 'primary_key': 'True'}),
            'editors': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'concept_editors'", 'symmetrical': 'False', 'to': u"orm['user_management.Profile']"}),
            'status': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        u'graph.dependency': {
            'Meta': {'object_name': 'Dependency'},
            'id': ('django.db.models.fields.CharField', [], {'max_length': '32', 'primary_key': 'True'}),
            'reason': ('django.db.models.fields.CharField', [], {'max_length': '500'}),
            'source': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'dep_source'", 'to': u"orm['graph.Concept']"}),
            'source_goals': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'source_goals'", 'symmetrical': 'False', 'to': u"orm['graph.Goal']"}),
            'target': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'dep_target'", 'to': u"orm['graph.Concept']"}),
            'target_goals': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'target_goals'", 'symmetrical': 'False', 'to': u"orm['graph.Goal']"})
        },
        u'graph.flag': {
            'Meta': {'object_name': 'Flag'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'text': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        u'graph.globalresource': {
            'Meta': {'object_name': 'GlobalResource'},
            'access': ('django.db.models.fields.CharField', [], {'max_length': '4'}),
            'authors': ('django.db.models.fields.CharField', [], {'max_length': '200', 'null': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'edition_years': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.CharField', [], {'max_length': '16', 'primary_key': 'True'}),
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
            'text': ('django.db.models.fields.CharField', [], {'max_length': '500'})
        },
        u'graph.graph': {
            'Meta': {'object_name': 'Graph'},
            'concepts': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'graph_concepts'", 'symmetrical': 'False', 'to': u"orm['graph.Concept']"}),
            'dependencies': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'graph_dependencies'", 'symmetrical': 'False', 'to': u"orm['graph.Dependency']"}),
            'id': ('django.db.models.fields.CharField', [], {'max_length': '16', 'primary_key': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        u'graph.graphsettings': {
            'Meta': {'object_name': 'GraphSettings'},
            'editors': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'graph_editors'", 'symmetrical': 'False', 'to': u"orm['user_management.Profile']"}),
            'graph': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['graph.Graph']", 'unique': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        },
        u'graph.resourcelocation': {
            'Meta': {'object_name': 'ResourceLocation'},
            'cresource': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'locations'", 'to': u"orm['graph.ConceptResource']"}),
            'id': ('django.db.models.fields.CharField', [], {'max_length': '16', 'primary_key': 'True'}),
            'location_text': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'location_type': ('django.db.models.fields.CharField', [], {'max_length': '3'}),
            'url': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'version_num': ('django.db.models.fields.IntegerField', [], {'default': '0', 'null': 'True', 'blank': 'True'})
        },
        u'user_management.profile': {
            'Meta': {'object_name': 'Profile'},
            'user': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['auth.User']", 'unique': 'True', 'primary_key': 'True'})
        }
    }

    complete_apps = ['graph']