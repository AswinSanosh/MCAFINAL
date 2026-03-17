from django.db import models
from datasets.models import Dataset


class TrainingJob(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('training', 'Training'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, related_name='jobs')
    pipeline_type = models.CharField(max_length=10, default='custom')  # 'ai' or 'custom'
    ai_pipeline_id = models.IntegerField(null=True, blank=True)
    preprocessing = models.CharField(max_length=100, null=True, blank=True)
    feature_engineering = models.CharField(max_length=100, null=True, blank=True)
    algorithm = models.CharField(max_length=100)
    postprocessing = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    feature_columns = models.JSONField(null=True, blank=True)  # selected feature columns
    metrics = models.JSONField(null=True, blank=True)
    best_params = models.JSONField(null=True, blank=True)
    optimization_metrics = models.JSONField(null=True, blank=True)
    model_path = models.CharField(max_length=500, null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Job {self.id}: {self.algorithm} [{self.status}]"
