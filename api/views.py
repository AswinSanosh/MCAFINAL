import os
import pandas as pd
from django.conf import settings
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from django.utils import timezone

from datasets.models import Dataset
from training.models import TrainingJob
from training.ml_engine import train as run_training, optimize as run_optimize, AI_PIPELINES


@api_view(["GET"])
def ping(request):
    return Response({"message": "pong"})


# ---------------------------------------------------------------------------
# Dataset Description
# ---------------------------------------------------------------------------

@api_view(["POST"])
@parser_classes([JSONParser])
def save_description(request, dataset_id):
    """Save a free-text description of the dataset goal."""
    try:
        dataset = Dataset.objects.get(id=dataset_id)
    except Dataset.DoesNotExist:
        return Response({"error": "Dataset not found."}, status=404)

    dataset.description = request.data.get('description', '')
    dataset.save()
    return Response({"success": True, "dataset_id": dataset_id})


# ---------------------------------------------------------------------------
# Dataset Upload
# ---------------------------------------------------------------------------

@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def upload_dataset(request):
    """Accept a CSV or Excel file, save it and return profiling info."""
    file = request.FILES.get('file')
    task_type = request.data.get('task_type', 'classification')

    if not file:
        return Response({"error": "No file provided."}, status=400)

    name = file.name
    if not (name.endswith('.csv') or name.endswith('.xlsx') or name.endswith('.xls')):
        return Response({"error": "Only CSV and Excel files are supported."}, status=400)

    if task_type not in ('classification', 'regression', 'clustering'):
        task_type = 'classification'

    dataset = Dataset(file=file, original_filename=name, task_type=task_type)
    dataset.save()

    try:
        file_path = dataset.file.path
        df = pd.read_excel(file_path) if name.endswith(('.xlsx', '.xls')) else pd.read_csv(file_path)

        columns = list(df.columns)
        dtypes = {col: str(df[col].dtype) for col in columns}
        target_column = columns[-1] if task_type in ('classification', 'regression') else None

        dataset.n_samples = len(df)
        dataset.n_features = len(columns)
        dataset.columns = columns
        dataset.dtypes = dtypes
        dataset.target_column = target_column
        dataset.save()

        return Response({
            "dataset_id": dataset.id,
            "task_type": task_type,
            "filename": name,
            "n_samples": dataset.n_samples,
            "n_features": dataset.n_features,
            "columns": columns,
            "dtypes": dtypes,
            "target_column": target_column,
        })
    except Exception as exc:
        dataset.delete()
        return Response({"error": f"Failed to read file: {exc}"}, status=400)


# ---------------------------------------------------------------------------
# Dataset Columns (lightweight — reads from DB, no file I/O)
# ---------------------------------------------------------------------------

@api_view(["GET", "PATCH"])
@parser_classes([JSONParser])
def dataset_columns(request, dataset_id):
    """GET: return columns/dtypes from DB.  PATCH: update target_column."""
    try:
        dataset = Dataset.objects.get(id=dataset_id)
    except Dataset.DoesNotExist:
        return Response({"error": "Dataset not found."}, status=404)

    if request.method == "GET":
        return Response({
            "columns": dataset.columns or [],
            "dtypes": dataset.dtypes or {},
            "task_type": dataset.task_type,
            "target_column": dataset.target_column,
            "n_samples": dataset.n_samples,
        })

    # PATCH — update target_column
    target_column = request.data.get("target_column")
    if target_column is not None:
        if target_column not in (dataset.columns or []):
            return Response({"error": "Column not found in dataset."}, status=400)
        dataset.target_column = target_column
        dataset.save(update_fields=["target_column"])
    return Response({"target_column": dataset.target_column})


# ---------------------------------------------------------------------------
# Dataset Analysis
# ---------------------------------------------------------------------------

@api_view(["GET"])
def analyze_dataset(request, dataset_id):
    """Return a statistical profile for the uploaded dataset."""
    try:
        dataset = Dataset.objects.get(id=dataset_id)
    except Dataset.DoesNotExist:
        return Response({"error": "Dataset not found."}, status=404)

    try:
        file_path = dataset.file.path
        name = dataset.original_filename
        df = pd.read_excel(file_path) if name.endswith(('.xlsx', '.xls')) else pd.read_csv(file_path)

        columns = list(df.columns)
        dtypes = {col: str(df[col].dtype) for col in columns}
        missing_values = int(df.isnull().sum().sum())

        numeric_cols = df.select_dtypes(include='number').columns.tolist()
        feature_stats = {}
        for col in numeric_cols[:15]:
            s = df[col].dropna()
            if len(s):
                feature_stats[col] = {
                    'mean': round(float(s.mean()), 4),
                    'std': round(float(s.std()), 4),
                    'min': round(float(s.min()), 4),
                    'max': round(float(s.max()), 4),
                }

        class_balance = None
        if dataset.task_type == 'classification' and dataset.target_column:
            try:
                vc = df[dataset.target_column].value_counts(normalize=True)
                class_balance = {str(k): round(float(v), 3) for k, v in vc.head(10).items()}
            except Exception:
                pass

        return Response({
            "columns": columns,
            "dtypes": dtypes,
            "n_samples": len(df),
            "n_features": len(columns),
            "missing_values": missing_values,
            "target_column": dataset.target_column,
            "task_type": dataset.task_type,
            "class_balance": class_balance,
            "feature_stats": feature_stats,
        })
    except Exception as exc:
        return Response({"error": str(exc)}, status=500)


# ---------------------------------------------------------------------------
# Pipeline Recommendations
# ---------------------------------------------------------------------------

@api_view(["GET"])
def recommend_pipelines(request, dataset_id):
    """Return task-appropriate AI pipeline recommendations."""
    try:
        dataset = Dataset.objects.get(id=dataset_id)
    except Dataset.DoesNotExist:
        return Response({"error": "Dataset not found."}, status=404)

    pipelines = AI_PIPELINES.get(dataset.task_type, AI_PIPELINES['classification'])
    return Response({"task_type": dataset.task_type, "pipelines": pipelines})


# ---------------------------------------------------------------------------
# Model Training
# ---------------------------------------------------------------------------

@api_view(["POST"])
@parser_classes([JSONParser])
def train_model(request):
    """
    Train a model with the selected pipeline.

    Expected body:
    {
      "dataset_id": 1,
      "pipeline": {
        "type": "ai" | "custom",
        "ai_pipeline_id": 1,          // when type == "ai"
        "preprocessing": "StandardScaler",
        "feature_engineering": "None",
        "algorithm": "RandomForestClassifier",
        "postprocessing": "None",
        "target_column": "label",     // optional override
        "n_clusters": 3               // clustering only
      }
    }
    """
    dataset_id = request.data.get('dataset_id')
    pipeline_cfg = request.data.get('pipeline', {})

    if not dataset_id:
        return Response({"error": "dataset_id is required."}, status=400)

    try:
        dataset = Dataset.objects.get(id=dataset_id)
    except Dataset.DoesNotExist:
        return Response({"error": "Dataset not found."}, status=404)

    pipeline_type = pipeline_cfg.get('type', 'custom')

    # Resolve AI pipeline presets
    if pipeline_type == 'ai':
        ai_id = int(pipeline_cfg.get('ai_pipeline_id', 1))
        presets = AI_PIPELINES.get(dataset.task_type, AI_PIPELINES['classification'])
        config = next((p for p in presets if p['id'] == ai_id), presets[0])
        algorithm = config['algorithm']
        preprocessing = config['preprocessing']
        feature_engineering = config['feature_engineering']
        postprocessing = config['postprocessing']
    else:
        algorithm = pipeline_cfg.get('algorithm', 'RandomForestClassifier')
        preprocessing = pipeline_cfg.get('preprocessing', 'StandardScaler')
        feature_engineering = pipeline_cfg.get('feature_engineering', 'None')
        postprocessing = pipeline_cfg.get('postprocessing', 'None')

    target_column = pipeline_cfg.get('target_column') or dataset.target_column
    n_clusters = int(pipeline_cfg.get('n_clusters', 3))
    feature_columns = request.data.get('feature_columns') or None
    hyperparams = request.data.get('hyperparams') or {}
    test_size = float(request.data.get('test_size', 0.2))
    # Clamp test_size to a sensible range
    test_size = max(0.1, min(0.4, test_size))

    job = TrainingJob.objects.create(
        dataset=dataset,
        pipeline_type=pipeline_type,
        ai_pipeline_id=pipeline_cfg.get('ai_pipeline_id') if pipeline_type == 'ai' else None,
        preprocessing=preprocessing,
        feature_engineering=feature_engineering,
        algorithm=algorithm,
        postprocessing=postprocessing,
        status='training',
        feature_columns=feature_columns or [],
    )

    try:
        model_dir = os.path.join(settings.MEDIA_ROOT, 'models')
        os.makedirs(model_dir, exist_ok=True)
        model_save_path = os.path.join(model_dir, f'job_{job.id}.pkl')

        metrics = run_training(
            dataset_path=dataset.file.path,
            task_type=dataset.task_type,
            algorithm=algorithm,
            preprocessing=preprocessing,
            feature_engineering=feature_engineering,
            postprocessing=postprocessing,
            target_column=target_column,
            n_clusters=n_clusters,
            model_save_path=model_save_path,
            feature_columns=feature_columns,
            hyperparams=hyperparams,
            test_size=test_size,
        )
        job.metrics = metrics
        job.status = 'completed'
        job.model_path = model_save_path
        job.completed_at = timezone.now()
        job.save()

        return Response({
            "job_id": job.id,
            "status": "completed",
            "task_type": dataset.task_type,
            "algorithm": algorithm,
            "pipeline_type": pipeline_type,
            "metrics": metrics,
        })

    except Exception as exc:
        job.status = 'failed'
        job.error_message = str(exc)
        job.save()
        return Response({"error": f"Training failed: {exc}", "job_id": job.id}, status=500)


# ---------------------------------------------------------------------------
# Training Result Retrieval
# ---------------------------------------------------------------------------

@api_view(["GET"])
def get_training_result(request, job_id):
    """Fetch the stored result of a training job."""
    try:
        job = TrainingJob.objects.get(id=job_id)
    except TrainingJob.DoesNotExist:
        return Response({"error": "Training job not found."}, status=404)

    return Response({
        "job_id": job.id,
        "status": job.status,
        "algorithm": job.algorithm,
        "task_type": job.dataset.task_type,
        "pipeline_type": job.pipeline_type,
        "metrics": job.metrics,
        "error_message": job.error_message,
        "created_at": job.created_at.isoformat(),
        "completed_at": job.completed_at.isoformat() if job.completed_at else None,
    })


# ---------------------------------------------------------------------------
# Hyperparameter Optimisation
# ---------------------------------------------------------------------------

@api_view(["POST"])
@parser_classes([JSONParser])
def optimize_model(request):
    """
    Run Optuna hyperparameter optimisation on an existing completed TrainingJob.

    Expected body: { "job_id": 1, "n_trials": 20 }
    """
    job_id = request.data.get('job_id')
    n_trials = int(request.data.get('n_trials', 20))

    if not job_id:
        return Response({"error": "job_id is required."}, status=400)

    try:
        job = TrainingJob.objects.get(id=job_id)
    except TrainingJob.DoesNotExist:
        return Response({"error": "Training job not found."}, status=404)

    if job.status != 'completed':
        return Response({"error": "Job must be completed before optimisation."}, status=400)

    try:
        result = run_optimize(
            dataset_path=job.dataset.file.path,
            task_type=job.dataset.task_type,
            algorithm=job.algorithm,
            preprocessing=job.preprocessing or 'StandardScaler',
            feature_engineering=job.feature_engineering or 'None',
            postprocessing=job.postprocessing or 'None',
            target_column=job.dataset.target_column,
            n_clusters=3,
            n_trials=n_trials,
            feature_columns=job.feature_columns or None,
        )
        job.best_params = result.get('best_params', {})
        job.optimization_metrics = result
        job.save()

        return Response({"job_id": job.id, "task_type": job.dataset.task_type,
                         "algorithm": job.algorithm, **result})
    except Exception as exc:
        return Response({"error": f"Optimisation failed: {exc}"}, status=500)


# ---------------------------------------------------------------------------
# Model Export / Download
# ---------------------------------------------------------------------------

@api_view(["GET"])
def export_model(request, job_id, fmt):
    """
    Download the trained model.

    Supported formats: pkl (Python pickle), py (inference script)
    """
    from django.http import FileResponse, HttpResponse

    try:
        job = TrainingJob.objects.get(id=job_id)
    except TrainingJob.DoesNotExist:
        return Response({"error": "Training job not found."}, status=404)

    if fmt == 'pkl':
        if not job.model_path or not os.path.exists(job.model_path):
            return Response({"error": "Model file not found. Please retrain."}, status=404)
        f = open(job.model_path, 'rb')
        resp = FileResponse(f, content_type='application/octet-stream')
        resp['Content-Disposition'] = f'attachment; filename="model_job{job.id}.pkl"'
        return resp

    if fmt == 'py':
        script = _generate_inference_script(job)
        resp = HttpResponse(script, content_type='text/x-python; charset=utf-8')
        resp['Content-Disposition'] = f'attachment; filename="inference_job{job.id}.py"'
        return resp

    return Response({"error": f"Unsupported format '{fmt}'. Use: pkl, py"}, status=400)


def _generate_inference_script(job: TrainingJob) -> str:
    features = (job.metrics or {}).get('feature_importance', [])
    feat_names = [f['feature'] for f in features] if features else []
    return f'''"""
AutoML Studio — Inference Script
Model     : {job.algorithm}
Task      : {job.dataset.task_type}
Pipeline  : {job.pipeline_type}
Job ID    : {job.id}
Dataset   : {job.dataset.original_filename}
Generated : by AutoML Studio
"""

import joblib
import pandas as pd
import numpy as np

# Load the saved pipeline
pipeline = joblib.load("model_job{job.id}.pkl")
model   = pipeline["model"]
scaler  = pipeline.get("scaler")
features = pipeline.get("feature_names", {feat_names!r})


def predict(data):
    """
    Predict using the trained {job.algorithm} model.

    Parameters
    ----------
    data : pd.DataFrame or list of dicts

    Returns
    -------
    np.ndarray of predictions
    """
    if isinstance(data, list):
        data = pd.DataFrame(data)

    X = data[features].values if features and all(f in data.columns for f in features) else data.values
    X = X.astype(float)

    if scaler is not None:
        X = scaler.transform(X)

    return model.predict(X)


if __name__ == "__main__":
    sample = pd.DataFrame([{{f: 0.0 for f in (features or ["feature_0"])}}])
    preds = predict(sample)
    print("Predictions:", preds)
'''

