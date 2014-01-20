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
            ('summary', self.gf('django.db.models.fields.CharField')(max_length=1000, null=True, blank=True)),
            ('goals', self.gf('django.db.models.fields.CharField')(max_length=2000, null=True, blank=True)),
            ('exercises', self.gf('django.db.models.fields.CharField')(max_length=2000, null=True, blank=True)),
            ('software', self.gf('django.db.models.fields.CharField')(max_length=2000, null=True, blank=True)),
            ('pointers', self.gf('django.db.models.fields.CharField')(max_length=2000, null=True, blank=True)),
            ('version_num', self.gf('django.db.models.fields.IntegerField')(default=0, null=True, blank=True)),
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
            ('id', self.gf('django.db.models.fields.CharField')(max_length=30, primary_key=True)),
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
            ('url', self.gf('django.db.models.fields.CharField')(unique=True, max_length=200)),
            ('authors', self.gf('django.db.models.fields.CharField')(max_length=200, null=True, blank=True)),
            ('year', self.gf('django.db.models.fields.IntegerField')(null=True, blank=True)),
            ('free', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('requires_signup', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('edition', self.gf('django.db.models.fields.CharField')(max_length=100, null=True, blank=True)),
            ('level', self.gf('django.db.models.fields.CharField')(max_length=100, null=True, blank=True)),
            ('description', self.gf('django.db.models.fields.CharField')(max_length=500, null=True, blank=True)),
            ('extra', self.gf('django.db.models.fields.CharField')(max_length=500, null=True, blank=True)),
            ('note', self.gf('django.db.models.fields.CharField')(max_length=500, null=True, blank=True)),
            ('resource_type', self.gf('django.db.models.fields.CharField')(max_length=100, null=True, blank=True)),
            ('version_num', self.gf('django.db.models.fields.IntegerField')(default=0, null=True, blank=True)),
        ))
        db.send_create_signal(u'graph', ['GlobalResource'])

        # Adding model 'ConceptResource'
        db.create_table(u'graph_conceptresource', (
            ('id', self.gf('django.db.models.fields.CharField')(max_length=30, primary_key=True)),
            ('resource', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['graph.GlobalResource'], null=True)),
            ('concept', self.gf('django.db.models.fields.related.ForeignKey')(related_name='concept_resource', to=orm['graph.Concept'])),
            ('location', self.gf('django.db.models.fields.CharField')(max_length=1000)),
            ('core', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('authors', self.gf('django.db.models.fields.CharField')(max_length=200, null=True, blank=True)),
            ('year', self.gf('django.db.models.fields.IntegerField')(null=True, blank=True)),
            ('free', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('requires_signup', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('edition', self.gf('django.db.models.fields.CharField')(max_length=100, null=True, blank=True)),
            ('level', self.gf('django.db.models.fields.CharField')(max_length=100, null=True, blank=True)),
            ('description', self.gf('django.db.models.fields.CharField')(max_length=500, null=True, blank=True)),
            ('extra', self.gf('django.db.models.fields.CharField')(max_length=500, null=True, blank=True)),
            ('note', self.gf('django.db.models.fields.CharField')(max_length=500, null=True, blank=True)),
            ('resource_type', self.gf('django.db.models.fields.CharField')(max_length=100, null=True, blank=True)),
            ('version_num', self.gf('django.db.models.fields.IntegerField')(default=0, null=True, blank=True)),
        ))
        db.send_create_signal(u'graph', ['ConceptResource'])

        # Adding M2M table for field additional_dependencies on 'ConceptResource'
        m2m_table_name = db.shorten_name(u'graph_conceptresource_additional_dependencies')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('conceptresource', models.ForeignKey(orm[u'graph.conceptresource'], null=False)),
            ('concept', models.ForeignKey(orm[u'graph.concept'], null=False))
        ))
        db.create_unique(m2m_table_name, ['conceptresource_id', 'concept_id'])

        # Adding model 'Graph'
        db.create_table(u'graph_graph', (
            ('id', self.gf('django.db.models.fields.CharField')(max_length=30, primary_key=True)),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('version_num', self.gf('django.db.models.fields.IntegerField')(default=0)),
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

        # Deleting model 'ConceptResource'
        db.delete_table(u'graph_conceptresource')

        # Removing M2M table for field additional_dependencies on 'ConceptResource'
        db.delete_table(db.shorten_name(u'graph_conceptresource_additional_dependencies'))

        # Deleting model 'Graph'
        db.delete_table(u'graph_graph')

        # Removing M2M table for field concepts on 'Graph'
        db.delete_table(db.shorten_name(u'graph_graph_concepts'))

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
            'goals': ('django.db.models.fields.CharField', [], {'max_length': '2000', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.CharField', [], {'max_length': '30', 'primary_key': 'True'}),
            'is_provisional': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
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
            'additional_dependencies': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'to': u"orm['graph.Concept']", 'null': 'True', 'blank': 'True'}),
            'authors': ('django.db.models.fields.CharField', [], {'max_length': '200', 'null': 'True', 'blank': 'True'}),
            'concept': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'concept_resource'", 'to': u"orm['graph.Concept']"}),
            'core': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '500', 'null': 'True', 'blank': 'True'}),
            'edition': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'extra': ('django.db.models.fields.CharField', [], {'max_length': '500', 'null': 'True', 'blank': 'True'}),
            'free': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'id': ('django.db.models.fields.CharField', [], {'max_length': '30', 'primary_key': 'True'}),
            'level': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'location': ('django.db.models.fields.CharField', [], {'max_length': '1000'}),
            'note': ('django.db.models.fields.CharField', [], {'max_length': '500', 'null': 'True', 'blank': 'True'}),
            'requires_signup': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'resource': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['graph.GlobalResource']", 'null': 'True'}),
            'resource_type': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'version_num': ('django.db.models.fields.IntegerField', [], {'default': '0', 'null': 'True', 'blank': 'True'}),
            'year': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'})
        },
        u'graph.conceptsettings': {
            'Meta': {'object_name': 'ConceptSettings'},
            'concept': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['graph.Concept']", 'unique': 'True', 'primary_key': 'True'}),
            'editors': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'concept_editors'", 'symmetrical': 'False', 'to': u"orm['user_management.Profile']"}),
            'status': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        u'graph.edge': {
            'Meta': {'object_name': 'Edge'},
            'id': ('django.db.models.fields.CharField', [], {'max_length': '30', 'primary_key': 'True'}),
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
            'authors': ('django.db.models.fields.CharField', [], {'max_length': '200', 'null': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '500', 'null': 'True', 'blank': 'True'}),
            'edition': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'extra': ('django.db.models.fields.CharField', [], {'max_length': '500', 'null': 'True', 'blank': 'True'}),
            'free': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'level': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'note': ('django.db.models.fields.CharField', [], {'max_length': '500', 'null': 'True', 'blank': 'True'}),
            'requires_signup': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'resource_type': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'url': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '200'}),
            'version_num': ('django.db.models.fields.IntegerField', [], {'default': '0', 'null': 'True', 'blank': 'True'}),
            'year': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'})
        },
        u'graph.graph': {
            'Meta': {'object_name': 'Graph'},
            'concepts': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'graph_concepts'", 'symmetrical': 'False', 'to': u"orm['graph.Concept']"}),
            'id': ('django.db.models.fields.CharField', [], {'max_length': '30', 'primary_key': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'version_num': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        u'graph.graphsettings': {
            'Meta': {'object_name': 'GraphSettings'},
            'editors': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'graph_editors'", 'symmetrical': 'False', 'to': u"orm['user_management.Profile']"}),
            'graph': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['graph.Graph']", 'unique': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        },
        u'user_management.profile': {
            'Meta': {'object_name': 'Profile'},
            'user': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['auth.User']", 'unique': 'True', 'primary_key': 'True'})
        }
    }

    complete_apps = ['graph']