"""
Celery tasks for AutoML Studio.

Each heavy ML operation (training, optimisation) runs in a background worker
so the Django request thread is freed immediately and multiple users can
submit jobs concurrently without blocking each other.
"""

import os
from celery import shared_task
from django.conf import settings
from django.utils import timezone


@shared_task(bind=True, name="training.tasks.run_training_task")
def run_training_task(self, job_id: int) -> dict:
    """
    Execute a training job asynchronously.

    Updates TrainingJob.status as it progresses so the frontend can poll
    /api/result/<job_id>/ to see live state.
    """
    # Import inside the task to avoid circular imports at module load time
    from training.models import TrainingJob
    from training.ml_engine import train as ml_train

    try:
        job = TrainingJob.objects.get(id=job_id)
    except TrainingJob.DoesNotExist:
        return {"error": f"Job {job_id} not found"}

    job.status = "training"
    job.save(update_fields=["status"])

    try:
        model_dir = os.path.join(settings.MEDIA_ROOT, "models")
        os.makedirs(model_dir, exist_ok=True)
        model_save_path = os.path.join(model_dir, f"job_{job.id}.pkl")

        metrics = ml_train(
            dataset_path=job.dataset.file.path,
            task_type=job.dataset.task_type,
            algorithm=job.algorithm,
            preprocessing=job.preprocessing or "StandardScaler",
            feature_engineering=job.feature_engineering or "None",
            postprocessing=job.postprocessing or "None",
            target_column=job.target_column or job.dataset.target_column,
            n_clusters=job.n_clusters or 3,
            model_save_path=model_save_path,
            feature_columns=job.feature_columns or None,
            hyperparams=job.hyperparams or {},
            test_size=job.test_size or 0.2,
        )

        job.metrics = metrics
        job.status = "completed"
        job.model_path = model_save_path
        job.completed_at = timezone.now()
        job.save()
        return {"job_id": job_id, "status": "completed"}

    except Exception as exc:
        job.status = "failed"
        job.error_message = str(exc)
        job.save(update_fields=["status", "error_message"])
        raise


@shared_task(bind=True, name="training.tasks.run_optimize_task")
def run_optimize_task(self, job_id: int, n_trials: int = 20) -> dict:
    """
    Execute Optuna hyperparameter optimisation asynchronously.
    Handles both tabular datasets and image clustering jobs.
    """
    from training.models import TrainingJob
    from training.ml_engine import optimize as ml_optimize, optimize_image_clusters

    try:
        job = TrainingJob.objects.get(id=job_id)
    except TrainingJob.DoesNotExist:
        return {"error": f"Job {job_id} not found"}

    # Reuse 'training' status to signal in-progress to the frontend
    job.status = "optimizing"
    job.save(update_fields=["status"])

    try:
        # Image clustering jobs have no dataset attached — use the ZIP path
        if job.dataset_id is None and job.image_zip_path:
            result = optimize_image_clusters(
                zip_path=job.image_zip_path,
                algorithm=job.algorithm or 'KMeans',
                n_clusters=job.n_clusters or 3,
                n_trials=n_trials,
            )
        else:
            result = ml_optimize(
                dataset_path=job.dataset.file.path,
                task_type=job.dataset.task_type,
                algorithm=job.algorithm,
                preprocessing=job.preprocessing or "StandardScaler",
                feature_engineering=job.feature_engineering or "None",
                postprocessing=job.postprocessing or "None",
                target_column=job.target_column or job.dataset.target_column,
                n_clusters=job.n_clusters or 3,
                n_trials=n_trials,
                feature_columns=job.feature_columns or None,
            )

        job.best_params = result.get("best_params", {})
        job.optimization_metrics = result
        job.status = "completed"
        job.save()
        return {"job_id": job_id, "status": "completed", **result}

    except Exception as exc:
        job.status = "failed"
        job.error_message = str(exc)
        job.save(update_fields=["status", "error_message"])
        raise


@shared_task(bind=True, name="training.tasks.run_image_clustering_task")
def run_image_clustering_task(self, job_id: int) -> dict:
    """
    Extract pixel features from images in a ZIP archive and cluster them.
    Stores results in TrainingJob.metrics so the existing poll endpoint works.
    """
    import os
    from django.conf import settings
    from training.models import TrainingJob
    from training.ml_engine import cluster_images

    try:
        job = TrainingJob.objects.get(id=job_id)
    except TrainingJob.DoesNotExist:
        return {"error": f"Job {job_id} not found"}

    job.status = "training"
    job.save(update_fields=["status"])

    try:
        results_dir = os.path.join(settings.MEDIA_ROOT, "image_results", str(job_id))

        metrics = cluster_images(
            zip_path=job.image_zip_path,
            algorithm=job.algorithm,
            n_clusters=job.n_clusters,
            results_dir=results_dir,
            algo_params=job.hyperparams or {},
        )

        job.metrics = metrics
        job.status = "completed"
        job.completed_at = timezone.now()
        job.save()
        return {"job_id": job_id, "status": "completed"}

    except Exception as exc:
        job.status = "failed"
        job.error_message = str(exc)
        job.save(update_fields=["status", "error_message"])
        raise
