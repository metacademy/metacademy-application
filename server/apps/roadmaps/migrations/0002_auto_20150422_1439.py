# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('user_management', '0001_initial'),
        ('roadmaps', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='roadmapsettings',
            name='creator',
            field=models.ForeignKey(related_name='roadmap_creator', to='user_management.Profile'),
        ),
        migrations.AddField(
            model_name='roadmapsettings',
            name='editors',
            field=models.ManyToManyField(related_name='roadmap_editors', to='user_management.Profile'),
        ),
        migrations.AddField(
            model_name='roadmapsettings',
            name='owners',
            field=models.ManyToManyField(related_name='roadmap_owners', to='user_management.Profile'),
        ),
        migrations.AlterUniqueTogether(
            name='roadmapsettings',
            unique_together=set([('creator', 'url_tag')]),
        ),
    ]
