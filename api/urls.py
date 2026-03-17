from django.urls import path
from .views import (
    ping,
    save_description,
    dataset_columns,
    upload_dataset,
    analyze_dataset,
    recommend_pipelines,
    train_model,
    get_training_result,
    optimize_model,
    export_model,
)

urlpatterns = [
    path("ping/", ping, name="ping"),
    path("describe/<int:dataset_id>/", save_description, name="describe"),
    path("columns/<int:dataset_id>/", dataset_columns, name="columns"),
    path("upload/", upload_dataset, name="upload"),
    path("analyze/<int:dataset_id>/", analyze_dataset, name="analyze"),
    path("recommend/<int:dataset_id>/", recommend_pipelines, name="recommend"),
    path("train/", train_model, name="train"),
    path("result/<int:job_id>/", get_training_result, name="result"),
    path("optimize/", optimize_model, name="optimize"),
    path("export/<int:job_id>/<str:fmt>/", export_model, name="export"),
]

