from django.db import models
from django.conf import settings
from datasets.models import Dataset
from training.models import TrainingJob


class UserSession(models.Model):
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sessions')
	session_name = models.CharField(max_length=255, blank=True, help_text="Optional user-friendly session label")
	started_at = models.DateTimeField(auto_now_add=True)
	completed_at = models.DateTimeField(null=True, blank=True)
	model_type = models.CharField(max_length=32, choices=[
		('classification', 'Classification'),
		('regression', 'Regression'),
		('clustering', 'Clustering'),
		('image_clustering', 'Image Clustering'),
	])
	dataset = models.ForeignKey(Dataset, on_delete=models.SET_NULL, null=True, blank=True)
	description = models.TextField(blank=True, help_text="User-provided goal/description")
	status = models.CharField(max_length=32, default='in_progress')
	last_step = models.PositiveSmallIntegerField(default=1)

	def __str__(self):
		return f"Session {self.id} ({self.user.username})"


class PipelineConfig(models.Model):
	session = models.ForeignKey(UserSession, on_delete=models.CASCADE, related_name='pipelines')
	pipeline_type = models.CharField(max_length=32, choices=[('ai', 'AI Recommended'), ('custom', 'Custom'), ('image', 'Image')])
	ai_pipeline_id = models.CharField(max_length=64, blank=True, null=True)
	preprocessing = models.JSONField(default=dict)
	feature_engineering = models.JSONField(default=dict)
	algorithm = models.CharField(max_length=128)
	postprocessing = models.JSONField(default=dict)
	hyperparams = models.JSONField(default=dict)
	metrics = models.JSONField(default=dict)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"PipelineConfig {self.id} ({self.algorithm})"
