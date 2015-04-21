# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('user_management', '0001_initial'),
        ('graph', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='graphsettings',
            name='edited_by',
            field=models.ManyToManyField(related_name='edited_graph', to='user_management.Profile'),
        ),
        migrations.AddField(
            model_name='graphsettings',
            name='graph',
            field=models.OneToOneField(to='graph.Graph'),
        ),
        migrations.AddField(
            model_name='graph',
            name='concepts',
            field=models.ManyToManyField(related_name='graph_concepts', to='graph.Concept'),
        ),
        migrations.AddField(
            model_name='graph',
            name='dependencies',
            field=models.ManyToManyField(related_name='graph_dependencies', to='graph.Dependency'),
        ),
        migrations.AddField(
            model_name='conceptsettings',
            name='edited_by',
            field=models.ManyToManyField(related_name='edited_concept', to='user_management.Profile'),
        ),
    ]
