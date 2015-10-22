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
            model_name='goal',
            name='concept',
            field=models.ForeignKey(related_name='goals', to='graph.Concept'),
        ),
        migrations.AddField(
            model_name='dependency',
            name='source',
            field=models.ForeignKey(related_name='dep_source', to='graph.Concept'),
        ),
        migrations.AddField(
            model_name='dependency',
            name='source_goals',
            field=models.ManyToManyField(related_name='source_goals', to='graph.Goal'),
        ),
        migrations.AddField(
            model_name='dependency',
            name='target',
            field=models.ForeignKey(related_name='dep_target', to='graph.Concept'),
        ),
        migrations.AddField(
            model_name='dependency',
            name='target_goals',
            field=models.ManyToManyField(related_name='target_goals', to='graph.Goal'),
        ),
        migrations.AddField(
            model_name='conceptresource',
            name='concept',
            field=models.ForeignKey(related_name='concept_resource', to='graph.Concept'),
        ),
        migrations.AddField(
            model_name='conceptresource',
            name='global_resource',
            field=models.ForeignKey(related_name='cresources', to='graph.GlobalResource'),
        ),
        migrations.AddField(
            model_name='conceptresource',
            name='goals_covered',
            field=models.ManyToManyField(related_name='goals_covered', null=True, to='graph.Goal', blank=True),
        ),
        migrations.AddField(
            model_name='concept',
            name='tags',
            field=models.ManyToManyField(related_name='concepts', to='graph.Tag'),
        ),
        migrations.AddField(
            model_name='targetgraph',
            name='concepts',
            field=models.ManyToManyField(related_name='target_graphs', to='graph.Concept'),
        ),
        migrations.AddField(
            model_name='targetgraph',
            name='dependencies',
            field=models.ManyToManyField(related_name='targetgraph_dependencies', to='graph.Dependency'),
        ),
        migrations.AddField(
            model_name='conceptsettings',
            name='edited_by',
            field=models.ManyToManyField(related_name='edited_concept', to='user_management.Profile'),
        ),
    ]
