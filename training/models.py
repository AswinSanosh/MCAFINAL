from django.db import models
from datasets.models import Dataset


class TrainingJob(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('training', 'Training'),
        ('optimizing', 'Optimizing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, related_name='jobs', null=True, blank=True)
    session = models.ForeignKey('results.UserSession', on_delete=models.CASCADE, null=True, blank=True, related_name='training_jobs')
    # Populated for image-clustering jobs that have no tabular Dataset
    image_zip_path = models.CharField(max_length=500, null=True, blank=True)
    pipeline_type = models.CharField(max_length=10, default='custom')  # 'ai' or 'custom'
    ai_pipeline_id = models.IntegerField(null=True, blank=True)
    preprocessing = models.CharField(max_length=100, null=True, blank=True)
    feature_engineering = models.CharField(max_length=100, null=True, blank=True)
    algorithm = models.CharField(max_length=100)
    postprocessing = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    feature_columns = models.JSONField(null=True, blank=True)
    # Training parameters saved at job creation so the Celery task doesn't
    # need to re-derive them from the request (which is no longer available)
    target_column = models.CharField(max_length=255, null=True, blank=True)
    n_clusters = models.IntegerField(default=3)
    hyperparams = models.JSONField(null=True, blank=True)
    test_size = models.FloatField(default=0.2)
    metrics = models.JSONField(null=True, blank=True)
    best_params = models.JSONField(null=True, blank=True)
    optimization_metrics = models.JSONField(null=True, blank=True)
    model_path = models.CharField(max_length=500, null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Job {self.id}: {self.algorithm} [{self.status}]"
