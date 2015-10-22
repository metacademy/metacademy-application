# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0006_require_contenttypes_0002'),
    ]

    operations = [
        migrations.CreateModel(
            name='Concepts',
            fields=[
                ('id', models.CharField(max_length=10, unique=True, serialize=False, primary_key=True)),
            ],
        ),
        migrations.CreateModel(
            name='Profile',
            fields=[
                ('user', models.OneToOneField(primary_key=True, serialize=False, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddField(
            model_name='concepts',
            name='learned_uprofs',
            field=models.ManyToManyField(related_name='learned', to='user_management.Profile'),
        ),
        migrations.AddField(
            model_name='concepts',
            name='starred_uprofs',
            field=models.ManyToManyField(related_name='starred', to='user_management.Profile'),
        ),
    ]
