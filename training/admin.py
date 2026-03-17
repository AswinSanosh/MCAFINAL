from django.contrib import admin
from .models import TrainingJob

@admin.register(TrainingJob)
class TrainingJobAdmin(admin.ModelAdmin):
    list_display = ('id', 'algorithm', 'pipeline_type', 'status', 'created_at', 'completed_at')
    list_filter = ('status', 'pipeline_type', 'algorithm')
    readonly_fields = ('created_at', 'completed_at')
