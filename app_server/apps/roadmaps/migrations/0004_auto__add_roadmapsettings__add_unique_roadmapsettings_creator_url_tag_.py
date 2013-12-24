# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Removing unique constraint on 'Roadmap', fields ['user', 'url_tag']
        db.delete_unique(u'roadmaps_roadmap', ['user_id', 'url_tag'])

        # Adding model 'RoadmapSettings'
        db.create_table(u'roadmaps_roadmapsettings', (
            ('roadmap', self.gf('django.db.models.fields.related.OneToOneField')(to=orm['roadmaps.Roadmap'], unique=True, primary_key=True)),
            ('creator', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('url_tag', self.gf('django.db.models.fields.SlugField')(max_length=30)),
        ))
        db.send_create_signal(u'roadmaps', ['RoadmapSettings'])

        # Adding M2M table for field owners on 'RoadmapSettings'
        m2m_table_name = db.shorten_name(u'roadmaps_roadmapsettings_owners')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('roadmapsettings', models.ForeignKey(orm[u'roadmaps.roadmapsettings'], null=False)),
            ('user', models.ForeignKey(orm[u'auth.user'], null=False))
        ))
        db.create_unique(m2m_table_name, ['roadmapsettings_id', 'user_id'])

        # Adding M2M table for field editors on 'RoadmapSettings'
        m2m_table_name = db.shorten_name(u'roadmaps_roadmapsettings_editors')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('roadmapsettings', models.ForeignKey(orm[u'roadmaps.roadmapsettings'], null=False)),
            ('user', models.ForeignKey(orm[u'auth.user'], null=False))
        ))
        db.create_unique(m2m_table_name, ['roadmapsettings_id', 'user_id'])

        # Adding unique constraint on 'RoadmapSettings', fields ['creator', 'url_tag']
        db.create_unique(u'roadmaps_roadmapsettings', ['creator_id', 'url_tag'])

        # Deleting field 'Roadmap.visibility'
        db.delete_column(u'roadmaps_roadmap', 'visibility')

        # Deleting field 'Roadmap.user'
        db.delete_column(u'roadmaps_roadmap', 'user_id')

        # Deleting field 'Roadmap.url_tag'
        db.delete_column(u'roadmaps_roadmap', 'url_tag')


    def backwards(self, orm):
        # Removing unique constraint on 'RoadmapSettings', fields ['creator', 'url_tag']
        db.delete_unique(u'roadmaps_roadmapsettings', ['creator_id', 'url_tag'])

        # Deleting model 'RoadmapSettings'
        db.delete_table(u'roadmaps_roadmapsettings')

        # Removing M2M table for field owners on 'RoadmapSettings'
        db.delete_table(db.shorten_name(u'roadmaps_roadmapsettings_owners'))

        # Removing M2M table for field editors on 'RoadmapSettings'
        db.delete_table(db.shorten_name(u'roadmaps_roadmapsettings_editors'))

        # Adding field 'Roadmap.visibility'
        db.add_column(u'roadmaps_roadmap', 'visibility',
                      self.gf('django.db.models.fields.CharField')(default='PRIVATE', max_length=20),
                      keep_default=False)


        # User chose to not deal with backwards NULL issues for 'Roadmap.user'
        raise RuntimeError("Cannot reverse this migration. 'Roadmap.user' and its values cannot be restored.")
        
        # The following code is provided here to aid in writing a correct migration        # Adding field 'Roadmap.user'
        db.add_column(u'roadmaps_roadmap', 'user',
                      self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User']),
                      keep_default=False)


        # User chose to not deal with backwards NULL issues for 'Roadmap.url_tag'
        raise RuntimeError("Cannot reverse this migration. 'Roadmap.url_tag' and its values cannot be restored.")
        
        # The following code is provided here to aid in writing a correct migration        # Adding field 'Roadmap.url_tag'
        db.add_column(u'roadmaps_roadmap', 'url_tag',
                      self.gf('django.db.models.fields.SlugField')(max_length=30),
                      keep_default=False)

        # Adding unique constraint on 'Roadmap', fields ['user', 'url_tag']
        db.create_unique(u'roadmaps_roadmap', ['user_id', 'url_tag'])


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
        u'roadmaps.roadmap': {
            'Meta': {'object_name': 'Roadmap'},
            'audience': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'author': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'blurb': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'body': ('django.db.models.fields.TextField', [], {}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'version_num': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        u'roadmaps.roadmapsettings': {
            'Meta': {'unique_together': "(('creator', 'url_tag'),)", 'object_name': 'RoadmapSettings'},
            'creator': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['auth.User']"}),
            'editors': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'roadmap_editors'", 'symmetrical': 'False', 'to': u"orm['auth.User']"}),
            'owners': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'roadmap_owners'", 'symmetrical': 'False', 'to': u"orm['auth.User']"}),
            'roadmap': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['roadmaps.Roadmap']", 'unique': 'True', 'primary_key': 'True'}),
            'url_tag': ('django.db.models.fields.SlugField', [], {'max_length': '30'})
        }
    }

    complete_apps = ['roadmaps']