from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('crm', '0003_auto_20251113_1158'),
    ]

    operations = [
        migrations.AddField(
            model_name='calllog',
            name='name',
            field=models.ForeignKey(
                to='crm.Employee',
                null=True,
                blank=True,
                on_delete=models.SET_NULL,
            ),
        ),
        migrations.AddField(
            model_name='calllog',
            name='phone',
            field=models.CharField(max_length=15, null=True, blank=True),
        ),
    ]
