# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Concept'
        db.create_table(u'graph_concept', (
            ('id', self.gf('django.db.models.fields.CharField')(max_length=30, primary_key=True)),
            ('tag', self.gf('django.db.models.fields.CharField')(unique=True, max_length=30)),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('summary', self.gf('django.db.models.fields.CharField')(max_length=1000)),
            ('goals', self.gf('django.db.models.fields.CharField')(max_length=2000)),
            ('exercises', self.gf('django.db.models.fields.CharField')(max_length=2000)),
            ('software', self.gf('django.db.models.fields.CharField')(max_length=2000)),
            ('pointers', self.gf('django.db.models.fields.CharField')(max_length=2000)),
            ('version_num', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('is_shortcut', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('is_provisional', self.gf('django.db.models.fields.BooleanField')(default=True)),
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

        # Adding model 'Flag'
        db.create_table(u'graph_flag', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('text', self.gf('django.db.models.fields.CharField')(max_length=30)),
        ))
        db.send_create_signal(u'graph', ['Flag'])

        # Adding model 'Edge'
        db.create_table(u'graph_edge', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('source', self.gf('django.db.models.fields.related.ForeignKey')(related_name='edge_source', to=orm['graph.Concept'])),
            ('target', self.gf('django.db.models.fields.related.ForeignKey')(related_name='edge_target', to=orm['graph.Concept'])),
            ('reason', self.gf('django.db.models.fields.CharField')(max_length=500)),
        ))
        db.send_create_signal(u'graph', ['Edge'])

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
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('url', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('authors', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('year', self.gf('django.db.models.fields.IntegerField')()),
            ('free', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('signup', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('edition', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('resource_level', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('description', self.gf('django.db.models.fields.CharField')(max_length=500)),
            ('note', self.gf('django.db.models.fields.CharField')(max_length=500)),
            ('resource_type', self.gf('django.db.models.fields.CharField')(max_length=100)),
        ))
        db.send_create_signal(u'graph', ['GlobalResource'])

        # Adding M2M table for field additional_prerequisites on 'GlobalResource'
        m2m_table_name = db.shorten_name(u'graph_globalresource_additional_prerequisites')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('globalresource', models.ForeignKey(orm[u'graph.globalresource'], null=False)),
            ('concept', models.ForeignKey(orm[u'graph.concept'], null=False))
        ))
        db.create_unique(m2m_table_name, ['globalresource_id', 'concept_id'])

        # Adding model 'ConceptResource'
        db.create_table(u'graph_conceptresource', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('resource', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['graph.GlobalResource'])),
            ('location', self.gf('django.db.models.fields.CharField')(max_length=1000)),
            ('core', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('authors', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('year', self.gf('django.db.models.fields.IntegerField')()),
            ('free', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('signup', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('edition', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('resource_level', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('description', self.gf('django.db.models.fields.CharField')(max_length=500)),
            ('note', self.gf('django.db.models.fields.CharField')(max_length=500)),
            ('resource_type', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('version_num', self.gf('django.db.models.fields.IntegerField')(default=0)),
        ))
        db.send_create_signal(u'graph', ['ConceptResource'])

        # Adding M2M table for field additional_prerequisites on 'ConceptResource'
        m2m_table_name = db.shorten_name(u'graph_conceptresource_additional_prerequisites')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('conceptresource', models.ForeignKey(orm[u'graph.conceptresource'], null=False)),
            ('concept', models.ForeignKey(orm[u'graph.concept'], null=False))
        ))
        db.create_unique(m2m_table_name, ['conceptresource_id', 'concept_id'])

        # Adding model 'Graph'
        db.create_table(u'graph_graph', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('version_num', self.gf('django.db.models.fields.IntegerField')(default=0)),
        ))
        db.send_create_signal(u'graph', ['Graph'])

        # Adding model 'GraphSettings'
        db.create_table(u'graph_graphsettings', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=100)),
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

        # Deleting model 'Flag'
        db.delete_table(u'graph_flag')

        # Deleting model 'Edge'
        db.delete_table(u'graph_edge')

        # Deleting model 'ConceptSettings'
        db.delete_table(u'graph_conceptsettings')

        # Removing M2M table for field editors on 'ConceptSettings'
        db.delete_table(db.shorten_name(u'graph_conceptsettings_editors'))

        # Deleting model 'GlobalResource'
        db.delete_table(u'graph_globalresource')

        # Removing M2M table for field additional_prerequisites on 'GlobalResource'
        db.delete_table(db.shorten_name(u'graph_globalresource_additional_prerequisites'))

        # Deleting model 'ConceptResource'
        db.delete_table(u'graph_conceptresource')

        # Removing M2M table for field additional_prerequisites on 'ConceptResource'
        db.delete_table(db.shorten_name(u'graph_conceptresource_additional_prerequisites'))

        # Deleting model 'Graph'
        db.delete_table(u'graph_graph')

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
            'exercises': ('django.db.models.fields.CharField', [], {'max_length': '2000'}),
            'flags': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['graph.Flag']", 'symmetrical': 'False'}),
            'goals': ('django.db.models.fields.CharField', [], {'max_length': '2000'}),
            'id': ('django.db.models.fields.CharField', [], {'max_length': '30', 'primary_key': 'True'}),
            'is_provisional': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_shortcut': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'pointers': ('django.db.models.fields.CharField', [], {'max_length': '2000'}),
            'software': ('django.db.models.fields.CharField', [], {'max_length': '2000'}),
            'summary': ('django.db.models.fields.CharField', [], {'max_length': '1000'}),
            'tag': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'}),
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
        u'graph.edge': {
            'Meta': {'object_name': 'Edge'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'reason': ('django.db.models.fields.CharField', [], {'max_length': '500'}),
            'source': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'edge_source'", 'to': u"orm['graph.Concept']"}),
            'target': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'edge_target'", 'to': u"orm['graph.Concept']"})
        },
        u'graph.flag': {
            'Meta': {'object_name': 'Flag'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'text': ('django.db.models.fields.CharField', [], {'max_length': '30'})
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
        u'user_management.profile': {
            'Meta': {'object_name': 'Profile'},
            'user': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['auth.User']", 'unique': 'True', 'primary_key': 'True'})
        }
    }

    complete_apps = ['graph']