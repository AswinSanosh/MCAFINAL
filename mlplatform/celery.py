import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mlplatform.settings")

app = Celery("mlplatform")

# Read config from Django settings, using the CELERY_ namespace
app.config_from_object("django.conf:settings", namespace="CELERY")

# Directly import every task module so the worker registers all tasks
# immediately at startup — autodiscover_tasks() is lazy and misses tasks
# that are added after the first worker boot, especially on Windows.
import training.tasks  # noqa: E402, F401

# Keep autodiscover for any future apps
app.autodiscover_tasks()
