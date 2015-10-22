# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Concept',
            fields=[
                ('id', models.CharField(max_length=30, serialize=False, primary_key=True)),
                ('tag', models.CharField(unique=True, max_length=30)),
                ('title', models.CharField(max_length=100)),
                ('summary', models.CharField(max_length=1000, null=True, blank=True)),
                ('exercises', models.CharField(max_length=2000, null=True, blank=True)),
                ('software', models.CharField(max_length=2000, null=True, blank=True)),
                ('pointers', models.CharField(max_length=2000, null=True, blank=True)),
                ('version_num', models.IntegerField(default=0, null=True, blank=True)),
                ('is_shortcut', models.BooleanField(default=False)),
                ('learn_time', models.FloatField(null=True, blank=True)),
                ('last_mod', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='ConceptResource',
            fields=[
                ('id', models.CharField(max_length=30, serialize=False, primary_key=True)),
                ('core', models.BooleanField(default=False)),
                ('additional_dependencies', models.CharField(max_length=300, null=True, blank=True)),
                ('edition', models.CharField(max_length=100, null=True, blank=True)),
                ('version_num', models.IntegerField(default=0, null=True, blank=True)),
                ('ordering', models.IntegerField(default=-1)),
                ('last_mod', models.DateTimeField(auto_now=True)),
                ('notes', models.CharField(max_length=500, null=True, blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='Dependency',
            fields=[
                ('id', models.CharField(max_length=30, serialize=False, primary_key=True)),
                ('reason', models.CharField(max_length=500)),
                ('ordering', models.IntegerField(default=-1)),
                ('last_mod', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='GlobalResource',
            fields=[
                ('id', models.CharField(max_length=30, serialize=False, primary_key=True)),
                ('title', models.CharField(max_length=100)),
                ('authors', models.CharField(default=b'', max_length=200)),
                ('resource_type', models.CharField(max_length=100)),
                ('year', models.IntegerField(null=True, blank=True)),
                ('edition_years', models.CharField(max_length=100, null=True, blank=True)),
                ('description', models.CharField(max_length=100)),
                ('notes', models.CharField(max_length=200)),
                ('version_num', models.IntegerField(default=0, null=True, blank=True)),
                ('last_mod', models.DateTimeField(auto_now=True)),
                ('access', models.CharField(max_length=4, choices=[(b'free', b'free'), (b'reg', b'free but requires registration'), (b'paid', b'costs money')])),
                ('url', models.CharField(max_length=200)),
            ],
        ),
        migrations.CreateModel(
            name='Goal',
            fields=[
                ('id', models.CharField(max_length=30, serialize=False, primary_key=True)),
                ('text', models.CharField(max_length=500)),
                ('ordering', models.IntegerField(default=-1)),
                ('last_mod', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='Graph',
            fields=[
                ('id', models.CharField(max_length=30, serialize=False, primary_key=True)),
                ('title', models.CharField(max_length=100)),
                ('last_mod', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='GraphSettings',
            fields=[
                ('id', models.CharField(max_length=30, serialize=False, primary_key=True)),
            ],
        ),
        migrations.CreateModel(
            name='ResourceLocation',
            fields=[
                ('id', models.CharField(max_length=30, serialize=False, primary_key=True)),
                ('url', models.CharField(max_length=100, null=True, blank=True)),
                ('location_type', models.CharField(max_length=30)),
                ('location_text', models.CharField(max_length=100, null=True, blank=True)),
                ('version_num', models.IntegerField(default=0, null=True, blank=True)),
                ('ordering', models.IntegerField(default=-1)),
                ('last_mod', models.DateTimeField(auto_now=True)),
                ('cresource', models.ForeignKey(related_name='locations', to='graph.ConceptResource')),
            ],
        ),
        migrations.CreateModel(
            name='Tag',
            fields=[
                ('id', models.CharField(max_length=30, serialize=False, primary_key=True)),
                ('title', models.CharField(max_length=100)),
            ],
        ),
        migrations.CreateModel(
            name='ConceptSettings',
            fields=[
                ('concept', models.OneToOneField(primary_key=True, serialize=False, to='graph.Concept')),
                ('status', models.CharField(max_length=100)),
            ],
        ),
        migrations.CreateModel(
            name='TargetGraph',
            fields=[
                ('leaf', models.OneToOneField(related_name='tgraph_leaf', primary_key=True, serialize=False, to='graph.Concept')),
                ('depth', models.IntegerField(default=0)),
            ],
        ),
    ]
