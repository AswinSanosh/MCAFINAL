from django.contrib import admin
from .models import Dataset

@admin.register(Dataset)
class DatasetAdmin(admin.ModelAdmin):
    list_display = ('id', 'original_filename', 'task_type', 'n_samples', 'n_features', 'uploaded_at')
    list_filter = ('task_type',)
    readonly_fields = ('uploaded_at',)
