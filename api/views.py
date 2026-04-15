import os
import json
import urllib.request
import urllib.error
import pandas as pd
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datasets.models import Dataset
from training.models import TrainingJob
from training.ml_engine import train as run_training, optimize as run_optimize, AI_PIPELINES
from training.tasks import run_training_task, run_optimize_task
from results.models import UserSession, PipelineConfig

# ---------------------------------------------------------------------------
# User Session History API
# ---------------------------------------------------------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_sessions(request):
    """Return all previous sessions for the authenticated user, with jobs and pipelines."""
    sessions = UserSession.objects.filter(user=request.user).order_by('-started_at')
    data = []
    for session in sessions:
        jobs = session.training_jobs.all().order_by('-created_at')
        pipelines = session.pipelines.all().order_by('-created_at')
        data.append({
            "id": session.id,
            "session_name": session.session_name,
            "started_at": session.started_at,
            "completed_at": session.completed_at,
            "model_type": session.model_type,
            "dataset_id": session.dataset.id if session.dataset else None,
            "description": session.description,
            "status": session.status,
            "last_step": session.last_step,
            "jobs": [
                {
                    "id": job.id,
                    "algorithm": job.algorithm,
                    "pipeline_type": job.pipeline_type,
                    "status": job.status,
                    "metrics": job.metrics,
                    "created_at": job.created_at,
                    "completed_at": job.completed_at,
                } for job in jobs
            ],
            "pipelines": [
                {
                    "id": pipe.id,
                    "pipeline_type": pipe.pipeline_type,
                    "algorithm": pipe.algorithm,
                    "preprocessing": pipe.preprocessing,
                    "feature_engineering": pipe.feature_engineering,
                    "postprocessing": pipe.postprocessing,
                    "hyperparams": pipe.hyperparams,
                    "metrics": pipe.metrics,
                    "created_at": pipe.created_at,
                } for pipe in pipelines
            ]
        })
    return Response({"sessions": data})
import urllib.error
import pandas as pd
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datasets.models import Dataset
from training.models import TrainingJob
from training.ml_engine import train as run_training, optimize as run_optimize, AI_PIPELINES
from training.tasks import run_training_task, run_optimize_task
from results.models import UserSession, PipelineConfig

# ---------------------------------------------------------------------------
# OpenRouter configuration
# ---------------------------------------------------------------------------
OPENROUTER_API_KEY = "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"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "google/gemini-2.0-flash-001"


@api_view(["GET"])
def ping(request):
    return Response({"message": "pong"})


# ---------------------------------------------------------------------------
# Dataset Description
# ---------------------------------------------------------------------------

@api_view(["POST"])
@parser_classes([JSONParser])
@csrf_exempt
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
@csrf_exempt
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
# Dataset Upload via Google Drive CSV link
# ---------------------------------------------------------------------------

@api_view(["POST"])
@parser_classes([JSONParser])
@csrf_exempt
def upload_drive_csv(request):
    """
    Accept a public Google Drive *file* share link for a CSV/Excel file,
    download it, and return profiling info identical to upload_dataset.

    Expected body: { "drive_url": "https://drive.google.com/file/d/.../view", "task_type": "classification" }
    """
    import re
    import tempfile
    import shutil
    from django.core.files import File as DjangoFile

    drive_url = (request.data.get('drive_url') or '').strip()
    task_type = request.data.get('task_type', 'classification')

    if not drive_url:
        return Response({"error": "drive_url is required."}, status=400)

    if task_type not in ('classification', 'regression', 'clustering'):
        task_type = 'classification'

    # Extract file ID — supports:
    #   /file/d/<ID>/view  (standard share link)
    #   /open?id=<ID>      (older format)
    #   id=<ID>            (direct download URL)
    file_id_match = re.search(
        r'(?:/file/d/|/open\?id=|[?&]id=)([\w-]+)',
        drive_url,
    )
    if not file_id_match:
        return Response(
            {"error": "Could not extract a file ID from the URL. "
                      "Please share a Google Drive *file* link (e.g. /file/d/…/view)."},
            status=400,
        )

    file_id = file_id_match.group(1)
    download_url = f"https://drive.google.com/uc?id={file_id}&export=download"

    try:
        import gdown
    except ImportError:
        return Response(
            {"error": "gdown is not installed on the server. Run: pip install gdown"},
            status=500,
        )

    tmp_dir = tempfile.mkdtemp(prefix="drive_csv_")
    try:
        # gdown will follow the confirmation redirect for large files automatically
        tmp_path = os.path.join(tmp_dir, f"{file_id}.csv")
        result = gdown.download(url=download_url, output=tmp_path, quiet=True, fuzzy=True)
        if result is None or not os.path.exists(tmp_path):
            return Response(
                {"error": "Failed to download the file. Make sure the link is publicly "
                          "accessible ('Anyone with the link can view')."},
                status=400,
            )

        # Detect type from content (try CSV first, then Excel)
        try:
            df = pd.read_csv(tmp_path)
            filename = f"drive_{file_id}.csv"
        except Exception:
            try:
                df = pd.read_excel(tmp_path)
                filename = f"drive_{file_id}.xlsx"
            except Exception as exc:
                return Response({"error": f"Could not parse the file as CSV or Excel: {exc}"}, status=400)

        columns = list(df.columns)
        dtypes = {col: str(df[col].dtype) for col in columns}
        target_column = columns[-1] if task_type in ('classification', 'regression') else None

        # Save to Dataset model using a real file
        with open(tmp_path, 'rb') as f:
            django_file = DjangoFile(f, name=filename)
            dataset = Dataset(original_filename=filename, task_type=task_type)
            dataset.file.save(filename, django_file, save=False)
            dataset.n_samples = len(df)
            dataset.n_features = len(columns)
            dataset.columns = columns
            dataset.dtypes = dtypes
            dataset.target_column = target_column
            dataset.save()

        return Response({
            "dataset_id": dataset.id,
            "task_type": task_type,
            "filename": filename,
            "n_samples": dataset.n_samples,
            "n_features": dataset.n_features,
            "columns": columns,
            "dtypes": dtypes,
            "target_column": target_column,
        })
    except Exception as exc:
        return Response({"error": f"Drive import failed: {exc}"}, status=500)
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


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
# Pipeline Recommendations  (OpenRouter AI)
# ---------------------------------------------------------------------------

def _build_recommendation_prompt(dataset: "Dataset", df: "pd.DataFrame", task_type: str) -> str:
    """Build the prompt sent to the LLM."""
    pipelines = AI_PIPELINES.get(task_type, AI_PIPELINES["classification"])

    # 10 sample values per column (as strings, truncated for safety)
    samples_block = ""
    for col in df.columns[:20]:          # cap at 20 columns
        vals = df[col].dropna().head(10).astype(str).tolist()
        samples_block += f"  - {col} ({df[col].dtype}): {', '.join(vals)}\n"

    pipeline_list = ""
    for p in pipelines:
        pipeline_list += (
            f"  ID {p['id']}: {p['name']}\n"
            f"    Components: {' → '.join(p['components'])}\n"
            f"    Description: {p['description']}\n"
            f"    Complexity: {p.get('complexity','?')}  EstTime: {p.get('trainingTime','?')}\n\n"
        )

    description = getattr(dataset, "description", "") or "No description provided."

    return f"""You are an expert machine learning engineer.
A user has uploaded a dataset for a {task_type} task.

Dataset description:
  {description}

Dataset overview:
  - Rows: {dataset.n_samples}
  - Columns: {dataset.n_features}
  - Target column: {dataset.target_column or 'None (unsupervised)'}

Sample values (up to 10 per column):
{samples_block}

Available ML pipelines for {task_type}:
{pipeline_list}

Your task:
1. Analyse the dataset samples and description.
2. Rank ALL available pipeline IDs from MOST to LEAST suitable for this dataset.
3. For each pipeline, write a SHORT (1-2 sentence) reason why it fits or doesn't fit.
4. Identify one "top pick" — the single best pipeline ID.

Respond ONLY with a valid JSON object in exactly this structure (no markdown, no extra text):
{{
  "top_pick": <pipeline_id_integer>,
  "ranked": [
    {{"id": <id>, "reason": "<short reason>"}},
    ...
  ]
}}"""


@api_view(["GET"])
def recommend_pipelines(request, dataset_id):
    """
    Return AI pipeline recommendations powered by OpenRouter.
    Falls back to static recommendations if the LLM call fails.
    """
    try:
        dataset = Dataset.objects.get(id=dataset_id)
    except Dataset.DoesNotExist:
        return Response({"error": "Dataset not found."}, status=404)

    task_type = dataset.task_type or "classification"
    pipelines = AI_PIPELINES.get(task_type, AI_PIPELINES["classification"])

    # Try to load the CSV for sample data
    try:
        file_path = dataset.file.path
        name = dataset.original_filename or ""
        df = pd.read_excel(file_path) if name.endswith((".xlsx", ".xls")) else pd.read_csv(file_path)
    except Exception:
        df = None

    # If we have data and an API key, ask OpenRouter
    ai_ranking: list[dict] = []
    top_pick: int | None = None
    ai_error: str | None = None

    if df is not None:
        try:
            prompt = _build_recommendation_prompt(dataset, df, task_type)
            payload = json.dumps({
                "model": OPENROUTER_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2,
            }).encode("utf-8")

            req = urllib.request.Request(
                OPENROUTER_URL,
                data=payload,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "AutoML Studio",
                },
                method="POST",
            )

            with urllib.request.urlopen(req, timeout=30) as resp:
                result = json.loads(resp.read().decode("utf-8"))

            raw_text = result["choices"][0]["message"]["content"].strip()
            # Strip any accidental markdown fences
            if raw_text.startswith("```"):
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:]
            ai_data = json.loads(raw_text.strip())
            ai_ranking = ai_data.get("ranked", [])
            top_pick = ai_data.get("top_pick")

        except Exception as exc:
            ai_error = str(exc)

    # Merge AI ranking reasons into pipeline list
    reason_map: dict[int, str] = {item["id"]: item["reason"] for item in ai_ranking}
    order_map: dict[int, int] = {item["id"]: idx for idx, item in enumerate(ai_ranking)}

    enriched = []
    for p in pipelines:
        enriched.append({
            **p,
            "ai_reason": reason_map.get(p["id"]),
            "ai_rank": order_map.get(p["id"], len(pipelines)),
            "top_pick": (p["id"] == top_pick),
        })

    # Sort by AI rank if we got a ranking, otherwise keep original order
    if ai_ranking:
        enriched.sort(key=lambda x: x["ai_rank"])

    return Response({
        "task_type": task_type,
        "pipelines": enriched,
        "top_pick": top_pick,
        "ai_powered": bool(ai_ranking),
        "ai_error": ai_error,
    })


# ---------------------------------------------------------------------------
# Model Training
# ---------------------------------------------------------------------------

@api_view(["POST"])
@parser_classes([JSONParser])
@csrf_exempt
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
        status='pending',
        feature_columns=feature_columns or [],
        target_column=target_column,
        n_clusters=n_clusters,
        hyperparams=hyperparams,
        test_size=test_size,
    )

    if not os.path.exists(dataset.file.path):
        job.status = 'failed'
        job.error_message = 'Dataset file not found on disk. Please re-upload your dataset.'
        job.save()
        return Response(
            {"error": "Dataset file not found on disk. Please re-upload your dataset.", "job_id": job.id},
            status=404,
        )

    # Dispatch to Celery worker — returns immediately so other users aren't blocked
    run_training_task.delay(job.id)

    return Response({
        "job_id": job.id,
        "status": "pending",
        "task_type": dataset.task_type,
        "algorithm": algorithm,
        "pipeline_type": pipeline_type,
        "message": "Training started in background. Poll /api/result/<job_id>/ for updates.",
    })


# ---------------------------------------------------------------------------
# Cancel Training Job
# ---------------------------------------------------------------------------

@api_view(["POST"])
@csrf_exempt
def cancel_job(request, job_id):
    """Mark a pending/running job as cancelled so it stops being picked up."""
    try:
        job = TrainingJob.objects.get(id=job_id)
    except TrainingJob.DoesNotExist:
        return Response({"error": "Job not found."}, status=404)

    if job.status in ("pending", "training", "optimizing"):
        job.status = "cancelled"
        job.error_message = "Cancelled by user."
        job.save(update_fields=["status", "error_message"])

    return Response({"job_id": job.id, "status": job.status})


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
        "task_type": job.dataset.task_type if job.dataset_id else "image_clustering",
        "pipeline_type": job.pipeline_type,
        "metrics": job.metrics,
        "best_params": job.best_params,
        "optimization_metrics": job.optimization_metrics,
        "error_message": job.error_message,
        "created_at": job.created_at.isoformat(),
        "completed_at": job.completed_at.isoformat() if job.completed_at else None,
    })


# ---------------------------------------------------------------------------
# Hyperparameter Optimisation
# ---------------------------------------------------------------------------

@api_view(["POST"])
@parser_classes([JSONParser])
@csrf_exempt
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

    # Allow re-optimization if training succeeded (has metrics) even if a previous
    # optimize run failed — the underlying trained model is still valid.
    if job.status not in ('completed', 'optimizing', 'failed') or (job.status == 'failed' and not job.metrics):
        return Response({"error": "Job must be completed before optimisation."}, status=400)

    # Dispatch optimisation to a background worker
    job.status = 'optimizing'
    job.save(update_fields=['status'])
    run_optimize_task.delay(job.id, n_trials)

    return Response({
        "job_id": job.id,
        "status": "optimizing",
        "message": "Optimisation started in background. Poll /api/result/<job_id>/ for updates.",
    })


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


# ---------------------------------------------------------------------------
# Cache Cleanup — delete all datasets and model files from disk + DB
# ---------------------------------------------------------------------------

@api_view(["POST"])
@csrf_exempt
def clear_cache(request):
    """
    Delete all Dataset records, TrainingJob records, and their files from disk.
    This frees storage used by uploaded CSVs and saved model .pkl files.
    """
    datasets_dir = os.path.join(settings.MEDIA_ROOT, 'datasets')
    models_dir = os.path.join(settings.MEDIA_ROOT, 'models')

    deleted_datasets = Dataset.objects.count()
    deleted_jobs = TrainingJob.objects.count()

    # Delete all DB records — cascades to TrainingJob via FK
    Dataset.objects.all().delete()
    TrainingJob.objects.all().delete()

    # Wipe and recreate the media subdirectories to free disk space
    freed_bytes = 0
    for directory in (datasets_dir, models_dir):
        if os.path.isdir(directory):
            for entry in os.scandir(directory):
                if entry.is_file():
                    try:
                        freed_bytes += entry.stat().st_size
                        os.remove(entry.path)
                    except OSError:
                        pass

    return Response({
        "success": True,
        "deleted_datasets": deleted_datasets,
        "deleted_jobs": deleted_jobs,
        "freed_mb": round(freed_bytes / (1024 * 1024), 2),
    })


# ---------------------------------------------------------------------------
# Image Clustering — Upload ZIP
# ---------------------------------------------------------------------------

@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
@csrf_exempt
def upload_image_zip(request):
    """
    Accept a ZIP archive containing images.
    Saves the file to media/image_zips/ and returns a temporary job id
    that the frontend can use to start clustering.
    """
    file = request.FILES.get('file')
    if not file:
        return Response({"error": "No file provided."}, status=400)

    name = file.name
    if not name.lower().endswith('.zip'):
        return Response({"error": "Only ZIP archives are supported."}, status=400)

    # Max 200 MB
    MAX_BYTES = 200 * 1024 * 1024
    if file.size > MAX_BYTES:
        return Response({"error": "File exceeds the 200 MB limit."}, status=400)

    zip_dir = os.path.join(settings.MEDIA_ROOT, 'image_zips')
    os.makedirs(zip_dir, exist_ok=True)

    # Use a unique name to avoid collisions
    import uuid
    unique_name = f"{uuid.uuid4().hex}_{name}"
    zip_path = os.path.join(zip_dir, unique_name)

    with open(zip_path, 'wb') as dest:
        for chunk in file.chunks():
            dest.write(chunk)

    return Response({
        "zip_path": zip_path,
        "filename": name,
        "size_mb": round(file.size / (1024 * 1024), 2),
    })


# ---------------------------------------------------------------------------
# Image Clustering — Start Job
# ---------------------------------------------------------------------------

@api_view(["POST"])
@parser_classes([JSONParser])
@csrf_exempt
def start_image_clustering(request):
    """
    Start an image clustering job.

    Expected body:
    {
      "zip_path": "/abs/path/to/archive.zip",
      "algorithm": "KMeans",
      "n_clusters": 4
    }
    """
    from training.tasks import run_image_clustering_task

    zip_path = request.data.get('zip_path')
    algorithm = request.data.get('algorithm', 'KMeans')
    n_clusters = int(request.data.get('n_clusters', 3))
    algo_params = request.data.get('algo_params', {})
    if not isinstance(algo_params, dict):
        algo_params = {}

    if not zip_path:
        return Response({"error": "zip_path is required."}, status=400)
    if not os.path.exists(zip_path):
        return Response({"error": "ZIP file not found. Please re-upload."}, status=404)

    VALID_ALGORITHMS = {
        'KMeans', 'DBSCAN', 'AgglomerativeClustering',
        'GaussianMixture', 'MeanShift', 'OPTICS', 'SpectralClustering', 'Birch',
    }
    if algorithm not in VALID_ALGORITHMS:
        algorithm = 'KMeans'

    n_clusters = max(2, min(20, n_clusters))

    job = TrainingJob.objects.create(
        dataset=None,
        image_zip_path=zip_path,
        pipeline_type='image',
        algorithm=algorithm,
        n_clusters=n_clusters,
        hyperparams=algo_params,
        status='pending',
    )

    run_image_clustering_task.delay(job.id)

    return Response({
        "job_id": job.id,
        "status": "pending",
        "algorithm": algorithm,
        "n_clusters": n_clusters,
        "message": "Image clustering started. Poll /api/result/<job_id>/ for updates.",
    })


# ---------------------------------------------------------------------------
# Image Clustering — Download clusters as ZIP
# ---------------------------------------------------------------------------

@api_view(["GET"])
def download_image_clusters(request, job_id: int):
    """
    Returns a ZIP where images are organised into cluster_1/, cluster_2/, ...
    subfolders.  Uses file_cluster_map (stored in metrics since the latest
    update) when available; otherwise falls back to the already-saved sample
    thumbnails in media/image_results/<job_id>/.
    """
    import zipfile
    import io as _io
    from django.http import HttpResponse

    try:
        job = TrainingJob.objects.get(id=job_id)
    except TrainingJob.DoesNotExist:
        return Response({"error": "Job not found."}, status=404)

    if job.status != "completed" or not job.metrics:
        return Response({"error": "Job not completed yet."}, status=400)

    buf = _io.BytesIO()
    file_cluster_map: dict = job.metrics.get("file_cluster_map", {})

    if file_cluster_map and job.image_zip_path and os.path.exists(job.image_zip_path):
        # ── Best path: re-package originals from the source ZIP ──────────
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as out_zip:
            with zipfile.ZipFile(job.image_zip_path, "r") as src_zip:
                for name, cid in file_cluster_map.items():
                    subfolder = "noise" if int(cid) < 0 else f"cluster_{int(cid) + 1}"
                    basename = os.path.basename(name)
                    try:
                        data = src_zip.read(name)
                        out_zip.writestr(f"{subfolder}/{basename}", data)
                    except KeyError:
                        continue
    else:
        # ── Fallback: bundle the saved sample thumbnails ─────────────────
        results_dir = os.path.join(settings.MEDIA_ROOT, "image_results", str(job_id))
        if not os.path.isdir(results_dir):
            return Response(
                {"error": "No downloadable data found. Please re-run clustering."},
                status=404,
            )
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as out_zip:
            for cluster_dir in sorted(os.listdir(results_dir)):
                full_cluster = os.path.join(results_dir, cluster_dir)
                if not os.path.isdir(full_cluster):
                    continue
                # cluster_0 → cluster_1, cluster_-1 → noise
                try:
                    idx = int(cluster_dir.split("_")[1])
                    subfolder = "noise" if idx < 0 else f"cluster_{idx + 1}"
                except (IndexError, ValueError):
                    subfolder = cluster_dir
                for fname in sorted(os.listdir(full_cluster)):
                    fpath = os.path.join(full_cluster, fname)
                    if os.path.isfile(fpath):
                        out_zip.write(fpath, f"{subfolder}/{fname}")

    buf.seek(0)
    response = HttpResponse(buf.read(), content_type="application/zip")
    response["Content-Disposition"] = f'attachment; filename="clusters_job_{job_id}.zip"'
    return response


# ---------------------------------------------------------------------------
# Image Clustering — Download from Google Drive folder
# ---------------------------------------------------------------------------

@api_view(["POST"])
@parser_classes([JSONParser])
@csrf_exempt
def image_from_drive(request):
    """
    Download images from a public Google Drive folder link, pack them into a
    ZIP archive stored in media/image_zips/, and return the zip_path so the
    caller can pass it directly to /api/image-cluster/.

    Expected body: { "drive_url": "https://drive.google.com/drive/folders/..." }
    """
    import re
    import uuid
    import zipfile
    import tempfile
    import shutil

    drive_url = (request.data.get('drive_url') or '').strip()
    if not drive_url:
        return Response({"error": "drive_url is required."}, status=400)

    # Accept both  /drive/folders/ID  and  /open?id=ID  patterns
    folder_id_match = re.search(
        r'drive\.google\.com/(?:drive/folders/|open\?id=)([\w-]+)',
        drive_url,
    )
    if not folder_id_match:
        return Response(
            {"error": "Could not extract a folder ID from the URL. "
                      "Please share a Google Drive *folder* link."},
            status=400,
        )

    folder_id = folder_id_match.group(1)
    canonical_url = f"https://drive.google.com/drive/folders/{folder_id}"

    IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.bmp', '.webp', '.gif', '.tiff'}

    try:
        import gdown
    except ImportError:
        return Response(
            {"error": "gdown is not installed on the server. Run: pip install gdown"},
            status=500,
        )

    # Download into a temp directory, then ZIP the images
    tmp_dir = tempfile.mkdtemp(prefix="drive_imgs_")
    try:
        # gdown.download_folder returns a list of downloaded paths
        result = gdown.download_folder(
            url=canonical_url,
            output=tmp_dir,
            quiet=True,
            use_cookies=False,
        )
        if result is None:
            return Response(
                {"error": "Could not download the folder. Make sure the Drive folder "
                          "is publicly shared ('Anyone with the link can view')."},
                status=400,
            )

        # Collect image files (gdown may create sub-folder with folder name)
        image_files = []
        for root, _, files in os.walk(tmp_dir):
            for fname in files:
                if os.path.splitext(fname.lower())[1] in IMAGE_EXTS:
                    image_files.append(os.path.join(root, fname))

        if not image_files:
            return Response(
                {"error": "No supported image files found in the Drive folder. "
                          "Supported: JPG, JPEG, PNG, BMP, WEBP, GIF, TIFF."},
                status=400,
            )

        # Pack into ZIP
        zip_dir = os.path.join(settings.MEDIA_ROOT, 'image_zips')
        os.makedirs(zip_dir, exist_ok=True)
        zip_name = f"drive_{uuid.uuid4().hex}.zip"
        zip_path = os.path.join(zip_dir, zip_name)

        with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
            for img_path in image_files:
                arcname = os.path.relpath(img_path, tmp_dir)
                zf.write(img_path, arcname)

        zip_size_mb = round(os.path.getsize(zip_path) / (1024 * 1024), 2)

        return Response({
            "zip_path": zip_path,
            "n_images": len(image_files),
            "size_mb": zip_size_mb,
            "filename": zip_name,
        })

    except Exception as exc:
        return Response({"error": f"Download failed: {exc}"}, status=500)
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)

