from django.db import models


class Dataset(models.Model):
    TASK_CHOICES = [
        ('classification', 'Classification'),
        ('regression', 'Regression'),
        ('clustering', 'Clustering'),
    ]

    file = models.FileField(upload_to='datasets/')
    original_filename = models.CharField(max_length=255)
    task_type = models.CharField(max_length=20, choices=TASK_CHOICES, default='classification')
    description = models.TextField(null=True, blank=True)
    n_samples = models.IntegerField(null=True, blank=True)
    n_features = models.IntegerField(null=True, blank=True)
    columns = models.JSONField(null=True, blank=True)
    dtypes = models.JSONField(null=True, blank=True)
    target_column = models.CharField(max_length=255, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Dataset {self.id}: {self.original_filename} ({self.task_type})"
