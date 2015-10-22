# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('graph', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Roadmap',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('title', models.CharField(max_length=100, verbose_name=b'Title')),
                ('author', models.CharField(max_length=100, verbose_name=b'Author(s)')),
                ('audience', models.CharField(max_length=100, verbose_name=b'Target audience')),
                ('blurb', models.TextField(verbose_name=b'Blurb', blank=True)),
                ('body', models.TextField()),
                ('version_num', models.IntegerField(default=0)),
            ],
        ),
        migrations.CreateModel(
            name='RoadmapSettings',
            fields=[
                ('roadmap', models.OneToOneField(primary_key=True, serialize=False, to='roadmaps.Roadmap')),
                ('listed_in_main', models.BooleanField(default=False, verbose_name=b'show this roadmap in the search results')),
                ('anyone_can_edit', models.BooleanField(default=False, verbose_name=b'anyone can edit this roadmap')),
                ('sudo_listed_in_main', models.BooleanField(default=True, verbose_name=b'superuser only: allow this roadmap in the search results')),
                ('published', models.BooleanField(default=False)),
                ('url_tag', models.SlugField(help_text=b'only letters, numbers, underscores, hyphens', max_length=30, verbose_name=b'URL tag')),
                ('doc_type', models.CharField(default=b'Roadmap', max_length=20, verbose_name=b'Document Type', choices=[(b'Roadmap', b'Roadmap'), (b'Course Guide', b'Course Guide')])),
            ],
        ),
        migrations.AddField(
            model_name='roadmap',
            name='tags',
            field=models.ManyToManyField(related_name='roadmaps', to='graph.Tag'),
        ),
    ]
