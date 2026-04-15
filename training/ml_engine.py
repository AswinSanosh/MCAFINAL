"""
AutoML Studio — ML Engine
Handles training for all supported algorithms across Classification, Regression, and Clustering.
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler, LabelEncoder
from sklearn.impute import SimpleImputer
from sklearn.decomposition import PCA
from sklearn.preprocessing import PolynomialFeatures
from sklearn.feature_selection import SelectKBest, f_classif, f_regression, RFE

# --- Classifiers ---
from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    AdaBoostClassifier,
    ExtraTreesClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.naive_bayes import GaussianNB

# --- Regressors ---
from sklearn.ensemble import (
    RandomForestRegressor,
    GradientBoostingRegressor,
    ExtraTreesRegressor,
)
from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet
from sklearn.svm import SVR
from sklearn.neighbors import KNeighborsRegressor

# --- Clustering ---
from sklearn.cluster import (
    KMeans,
    DBSCAN,
    AgglomerativeClustering,
    MeanShift,
    OPTICS,
    SpectralClustering,
    Birch,
)
from sklearn.mixture import GaussianMixture

# --- Metrics ---
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, confusion_matrix,
    mean_squared_error, mean_absolute_error, r2_score,
    silhouette_score as sk_silhouette_score,
)

# --- Neural network estimators ---
from sklearn.neural_network import MLPClassifier, MLPRegressor

# --- Optional dependencies ---
try:
    from imblearn.over_sampling import SMOTE
    SMOTE_AVAILABLE = True
except ImportError:
    SMOTE_AVAILABLE = False

try:
    from xgboost import XGBClassifier, XGBRegressor
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

try:
    import umap as umap_module
    UMAP_AVAILABLE = True
except ImportError:
    UMAP_AVAILABLE = False

try:
    import optuna
    optuna.logging.set_verbosity(optuna.logging.WARNING)
    OPTUNA_AVAILABLE = True
except ImportError:
    OPTUNA_AVAILABLE = False

import joblib, os


# ---------------------------------------------------------------------------
# AI Pipeline presets (used when pipeline_type == 'ai')
# ---------------------------------------------------------------------------
AI_PIPELINES = {
    'classification': [
        {
            'id': 1,
            'name': 'Random Forest + SMOTE + StandardScaler',
            'preprocessing': 'StandardScaler',
            'feature_engineering': 'SMOTE',
            'algorithm': 'RandomForestClassifier',
            'postprocessing': 'None',
            'score': 0.87,
            'complexity': 'Medium',
            'trainingTime': '5-10 min',
            'memoryUsage': 'Medium',
            'description': 'Balances classes and scales features for robust classification.',
            'components': ['StandardScaler', 'SMOTE', 'RandomForestClassifier'],
        },
        {
            'id': 2,
            'name': 'XGBoost + MinMaxScaler',
            'preprocessing': 'MinMaxScaler',
            'feature_engineering': 'None',
            'algorithm': 'XGBClassifier',
            'postprocessing': 'None',
            'score': 0.85,
            'complexity': 'High',
            'trainingTime': '10-15 min',
            'memoryUsage': 'High',
            'description': 'High-performance gradient boosting with feature scaling.',
            'components': ['MinMaxScaler', 'XGBClassifier'],
        },
        {
            'id': 3,
            'name': 'Logistic Regression + PCA',
            'preprocessing': 'StandardScaler',
            'feature_engineering': 'PCA',
            'algorithm': 'LogisticRegression',
            'postprocessing': 'None',
            'score': 0.82,
            'complexity': 'Low',
            'trainingTime': '2-5 min',
            'memoryUsage': 'Low',
            'description': 'Simple linear model with dimensionality reduction.',
            'components': ['StandardScaler', 'PCA', 'LogisticRegression'],
        },
        {
            'id': 4,
            'name': 'SVC + StandardScaler',
            'preprocessing': 'StandardScaler',
            'feature_engineering': 'None',
            'algorithm': 'SVC',
            'postprocessing': 'None',
            'score': 0.83,
            'complexity': 'High',
            'trainingTime': '5-15 min',
            'memoryUsage': 'High',
            'description': 'Support Vector Machine with RBF kernel for non-linear classification.',
            'components': ['StandardScaler', 'SVC'],
        },
        {
            'id': 5,
            'name': 'Extra Trees + SelectKBest',
            'preprocessing': 'StandardScaler',
            'feature_engineering': 'SelectKBest',
            'algorithm': 'ExtraTreesClassifier',
            'postprocessing': 'None',
            'score': 0.84,
            'complexity': 'Medium',
            'trainingTime': '5-8 min',
            'memoryUsage': 'Medium',
            'description': 'Highly randomized forest with automatic feature selection.',
            'components': ['StandardScaler', 'SelectKBest', 'ExtraTreesClassifier'],
        },
        {
            'id': 6,
            'name': 'AdaBoost + SMOTE + MinMaxScaler',
            'preprocessing': 'MinMaxScaler',
            'feature_engineering': 'SMOTE',
            'algorithm': 'AdaBoostClassifier',
            'postprocessing': 'None',
            'score': 0.81,
            'complexity': 'Medium',
            'trainingTime': '4-8 min',
            'memoryUsage': 'Low',
            'description': 'Adaptive boosting with class balancing for imbalanced datasets.',
            'components': ['MinMaxScaler', 'SMOTE', 'AdaBoostClassifier'],
        },
    ],
    'regression': [
        {
            'id': 1,
            'name': 'Random Forest Regressor + StandardScaler',
            'preprocessing': 'StandardScaler',
            'feature_engineering': 'None',
            'algorithm': 'RandomForestRegressor',
            'postprocessing': 'None',
            'score': 0.88,
            'complexity': 'Medium',
            'trainingTime': '5-10 min',
            'memoryUsage': 'Medium',
            'description': 'Ensemble regression with standard feature scaling.',
            'components': ['StandardScaler', 'RandomForestRegressor'],
        },
        {
            'id': 2,
            'name': 'XGBoost Regressor + MinMaxScaler',
            'preprocessing': 'MinMaxScaler',
            'feature_engineering': 'None',
            'algorithm': 'XGBRegressor',
            'postprocessing': 'None',
            'score': 0.86,
            'complexity': 'High',
            'trainingTime': '10-15 min',
            'memoryUsage': 'High',
            'description': 'Gradient boosting for regression with min-max scaling.',
            'components': ['MinMaxScaler', 'XGBRegressor'],
        },
        {
            'id': 3,
            'name': 'Ridge Regression + PCA',
            'preprocessing': 'StandardScaler',
            'feature_engineering': 'PCA',
            'algorithm': 'Ridge',
            'postprocessing': 'None',
            'score': 0.80,
            'complexity': 'Low',
            'trainingTime': '1-3 min',
            'memoryUsage': 'Low',
            'description': 'Regularized linear regression with dimensionality reduction.',
            'components': ['StandardScaler', 'PCA', 'Ridge'],
        },
        {
            'id': 4,
            'name': 'SVR + StandardScaler + PCA',
            'preprocessing': 'StandardScaler',
            'feature_engineering': 'PCA',
            'algorithm': 'SVR',
            'postprocessing': 'None',
            'score': 0.79,
            'complexity': 'High',
            'trainingTime': '5-15 min',
            'memoryUsage': 'High',
            'description': 'Support Vector Regression after PCA dimensionality reduction.',
            'components': ['StandardScaler', 'PCA', 'SVR'],
        },
        {
            'id': 5,
            'name': 'Extra Trees + SelectKBest',
            'preprocessing': 'StandardScaler',
            'feature_engineering': 'SelectKBest',
            'algorithm': 'ExtraTreesRegressor',
            'postprocessing': 'None',
            'score': 0.85,
            'complexity': 'Medium',
            'trainingTime': '5-8 min',
            'memoryUsage': 'Medium',
            'description': 'Highly randomized trees with automatic feature selection.',
            'components': ['StandardScaler', 'SelectKBest', 'ExtraTreesRegressor'],
        },
        {
            'id': 6,
            'name': 'Lasso + PolynomialFeatures',
            'preprocessing': 'StandardScaler',
            'feature_engineering': 'PolynomialFeatures',
            'algorithm': 'Lasso',
            'postprocessing': 'None',
            'score': 0.77,
            'complexity': 'Low',
            'trainingTime': '1-3 min',
            'memoryUsage': 'Low',
            'description': 'L1-regularized regression with polynomial feature expansion.',
            'components': ['StandardScaler', 'PolynomialFeatures', 'Lasso'],
        },
    ],
    'clustering': [
        {
            'id': 1,
            'name': 'K-Means + StandardScaler',
            'preprocessing': 'StandardScaler',
            'feature_engineering': 'None',
            'algorithm': 'KMeans',
            'postprocessing': 'None',
            'score': 0.85,
            'complexity': 'Low',
            'trainingTime': '1-3 min',
            'memoryUsage': 'Low',
            'description': 'Fast centroid-based clustering with standard scaling.',
            'components': ['StandardScaler', 'KMeans'],
        },
        {
            'id': 2,
            'name': 'DBSCAN + StandardScaler',
            'preprocessing': 'StandardScaler',
            'feature_engineering': 'None',
            'algorithm': 'DBSCAN',
            'postprocessing': 'None',
            'score': 0.78,
            'complexity': 'Medium',
            'trainingTime': '2-5 min',
            'memoryUsage': 'Medium',
            'description': 'Density-based clustering — handles arbitrary shapes and noise.',
            'components': ['StandardScaler', 'DBSCAN'],
        },
        {
            'id': 3,
            'name': 'Agglomerative + PCA + StandardScaler',
            'preprocessing': 'StandardScaler',
            'feature_engineering': 'PCA',
            'algorithm': 'AgglomerativeClustering',
            'postprocessing': 'None',
            'score': 0.80,
            'complexity': 'Medium',
            'trainingTime': '3-7 min',
            'memoryUsage': 'Medium',
            'description': 'Hierarchical clustering on PCA-reduced features.',
            'components': ['StandardScaler', 'PCA', 'AgglomerativeClustering'],
        },
        {
            'id': 4,
            'name': 'UMAP + DBSCAN (Manifold + Density)',
            'preprocessing': 'StandardScaler',
            'feature_engineering': 'UMAP',
            'algorithm': 'DBSCAN',
            'postprocessing': 'None',
            'score': 0.82,
            'complexity': 'High',
            'trainingTime': '5-12 min',
            'memoryUsage': 'Medium',
            'description': 'Non-linear UMAP embedding followed by density-based clustering — excellent for complex manifold shapes.',
            'components': ['StandardScaler', 'UMAP', 'DBSCAN'],
        },
        {
            'id': 5,
            'name': 'UMAP + KMeans',
            'preprocessing': 'StandardScaler',
            'feature_engineering': 'UMAP',
            'algorithm': 'KMeans',
            'postprocessing': 'None',
            'score': 0.83,
            'complexity': 'Medium',
            'trainingTime': '4-8 min',
            'memoryUsage': 'Medium',
            'description': 'Manifold learning for low-dimensional embedding then centroid clustering on the manifold.',
            'components': ['StandardScaler', 'UMAP', 'KMeans'],
        },
        {
            'id': 6,
            'name': 'PCA + OPTICS (Hierarchical Density)',
            'preprocessing': 'StandardScaler',
            'feature_engineering': 'PCA',
            'algorithm': 'OPTICS',
            'postprocessing': 'None',
            'score': 0.75,
            'complexity': 'High',
            'trainingTime': '5-15 min',
            'memoryUsage': 'High',
            'description': 'PCA reduction then OPTICS for robust hierarchical density clustering — robust to noise and varying densities.',
            'components': ['StandardScaler', 'PCA', 'OPTICS'],
        },
    ],
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_dataset(file_path: str) -> pd.DataFrame:
    """Load a CSV or Excel file into a pandas DataFrame."""
    if file_path.endswith(('.xlsx', '.xls')):
        return pd.read_excel(file_path)
    return pd.read_csv(file_path)


def encode_categorical_features(X: pd.DataFrame):
    """Label-encode all non-numeric columns in X.

    Uses pd.api.types.is_numeric_dtype so that pandas StringDtype (pandas 2+),
    CategoricalDtype, and legacy object dtype are all handled correctly.
    """
    X = X.copy()
    encoders = {}
    for col in X.columns:
        if not pd.api.types.is_numeric_dtype(X[col]):
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))
            encoders[col] = le
    return X, encoders


def get_scaler(name: str):
    """Return a scaler instance from its string name, or None."""
    mapping = {
        'StandardScaler': StandardScaler(),
        'MinMaxScaler': MinMaxScaler(),
        'RobustScaler': RobustScaler(),
    }
    return mapping.get(name, None)


def get_classifier(name: str):
    """Return a classifier instance from its string name."""
    classifiers = {
        'RandomForestClassifier': RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
        'LogisticRegression': LogisticRegression(max_iter=1000, random_state=42),
        'SVC': SVC(probability=True, random_state=42),
        'KNeighborsClassifier': KNeighborsClassifier(n_neighbors=5),
        'DecisionTreeClassifier': DecisionTreeClassifier(random_state=42),
        'GradientBoostingClassifier': GradientBoostingClassifier(n_estimators=100, random_state=42),
        'AdaBoostClassifier': AdaBoostClassifier(n_estimators=100, random_state=42, algorithm='SAMME'),
        'ExtraTreesClassifier': ExtraTreesClassifier(n_estimators=100, random_state=42, n_jobs=-1),
        'GaussianNB': GaussianNB(),
        'MLPClassifier': MLPClassifier(hidden_layer_sizes=(128, 64), max_iter=300, random_state=42),
    }
    if XGBOOST_AVAILABLE:
        classifiers['XGBClassifier'] = XGBClassifier(
            n_estimators=100, random_state=42, eval_metric='logloss', verbosity=0
        )
    else:
        # Fall back to GradientBoosting when XGBoost is not installed
        classifiers['XGBClassifier'] = GradientBoostingClassifier(n_estimators=100, random_state=42)

    return classifiers.get(name, RandomForestClassifier(n_estimators=100, random_state=42))


def get_regressor(name: str):
    """Return a regressor instance from its string name."""
    regressors = {
        'RandomForestRegressor': RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1),
        'LinearRegression': LinearRegression(),
        'SVR': SVR(),
        'KNeighborsRegressor': KNeighborsRegressor(n_neighbors=5),
        'Ridge': Ridge(),
        'Lasso': Lasso(),
        'ElasticNet': ElasticNet(),
        'GradientBoostingRegressor': GradientBoostingRegressor(n_estimators=100, random_state=42),
        'ExtraTreesRegressor': ExtraTreesRegressor(n_estimators=100, random_state=42, n_jobs=-1),
        'MLPRegressor': MLPRegressor(hidden_layer_sizes=(128, 64), max_iter=300, random_state=42),
    }
    if XGBOOST_AVAILABLE:
        regressors['XGBRegressor'] = XGBRegressor(n_estimators=100, random_state=42, verbosity=0)
    else:
        regressors['XGBRegressor'] = GradientBoostingRegressor(n_estimators=100, random_state=42)

    return regressors.get(name, RandomForestRegressor(n_estimators=100, random_state=42))


def get_clustering_model(name: str, n_clusters: int = 3):
    """Return a clustering model instance from its string name."""
    models = {
        'KMeans': KMeans(n_clusters=n_clusters, random_state=42, n_init=10),
        'DBSCAN': DBSCAN(eps=0.5, min_samples=5),
        'AgglomerativeClustering': AgglomerativeClustering(n_clusters=n_clusters),
        'GaussianMixture': GaussianMixture(n_components=n_clusters, random_state=42),
        'MeanShift': MeanShift(),
        'OPTICS': OPTICS(min_samples=5),
        'SpectralClustering': SpectralClustering(n_clusters=n_clusters, random_state=42),
        'Birch': Birch(n_clusters=n_clusters),
    }
    return models.get(name, KMeans(n_clusters=n_clusters, random_state=42, n_init=10))


def extract_feature_importance(model, feature_names: list) -> list:
    """Extract and normalise feature importances from any fitted model."""
    try:
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
        elif hasattr(model, 'coef_'):
            coef = np.atleast_2d(model.coef_)
            importances = np.abs(coef).mean(axis=0)
        else:
            return []

        if len(importances) != len(feature_names):
            feature_names = [f'feature_{i}' for i in range(len(importances))]

        total = importances.sum()
        if total > 0:
            importances = importances / total

        pairs = sorted(zip(feature_names, importances.tolist()), key=lambda x: -x[1])
        return [{'feature': f, 'importance': round(float(v), 4)} for f, v in pairs[:10]]
    except Exception:
        return []


def _apply_feature_engineering_supervised(X_train, X_test, y_train, fe_name: str, task_type: str):
    """
    Apply a feature engineering step for supervised tasks.
    Returns (X_train, X_test, y_train) — y_train may be resampled by SMOTE.
    """
    if not fe_name or fe_name in ('None', ''):
        return X_train, X_test, y_train

    if fe_name == 'PCA':
        n_components = min(X_train.shape[1], 10, X_train.shape[0] - 1)
        pca = PCA(n_components=n_components, random_state=42)
        X_train = pca.fit_transform(X_train)
        X_test = pca.transform(X_test)

    elif fe_name == 'PolynomialFeatures':
        n_cols = min(X_train.shape[1], 5)
        poly = PolynomialFeatures(degree=2, include_bias=False)
        X_train = poly.fit_transform(X_train[:, :n_cols])
        X_test = poly.transform(X_test[:, :n_cols])

    elif fe_name == 'SelectKBest':
        k = min(X_train.shape[1], 10)
        score_func = f_classif if task_type == 'classification' else f_regression
        selector = SelectKBest(score_func=score_func, k=k)
        X_train = selector.fit_transform(X_train, y_train)
        X_test = selector.transform(X_test)

    elif fe_name == 'RFE':
        k = min(X_train.shape[1], 10)
        base = (
            LogisticRegression(max_iter=200, random_state=42)
            if task_type == 'classification'
            else LinearRegression()
        )
        rfe = RFE(estimator=base, n_features_to_select=k)
        X_train = rfe.fit_transform(X_train, y_train)
        X_test = rfe.transform(X_test)

    elif fe_name == 'SMOTE':
        if SMOTE_AVAILABLE and task_type == 'classification':
            try:
                smote = SMOTE(random_state=42)
                X_train, y_train = smote.fit_resample(X_train, y_train)
            except Exception:
                pass  # Skip silently if SMOTE fails (e.g. not enough samples per class)

    elif fe_name == 'UMAP':
        if UMAP_AVAILABLE:
            try:
                n_comp = min(X_train.shape[1], 10)
                reducer = umap_module.UMAP(n_components=n_comp, random_state=42)
                X_train = reducer.fit_transform(X_train)
                X_test = reducer.transform(X_test)
            except Exception:
                pass
        else:
            # Fall back to PCA when umap-learn is not installed
            n_components = min(X_train.shape[1], 10, X_train.shape[0] - 1)
            pca = PCA(n_components=n_components, random_state=42)
            X_train = pca.fit_transform(X_train)
            X_test = pca.transform(X_test)

    return X_train, X_test, y_train


def _apply_feature_engineering_clustering(X: np.ndarray, fe_name: str) -> np.ndarray:
    """Apply a feature engineering step for unsupervised (clustering) tasks."""
    if not fe_name or fe_name in ('None', ''):
        return X

    if fe_name == 'PCA':
        n_components = min(X.shape[1], 2)
        pca = PCA(n_components=n_components, random_state=42)
        return pca.fit_transform(X)

    if fe_name == 'PolynomialFeatures':
        n_cols = min(X.shape[1], 4)
        poly = PolynomialFeatures(degree=2, include_bias=False)
        return poly.fit_transform(X[:, :n_cols])

    if fe_name == 'UMAP':
        if UMAP_AVAILABLE:
            try:
                n_comp = min(X.shape[1], 2)
                reducer = umap_module.UMAP(n_components=n_comp, random_state=42)
                return reducer.fit_transform(X)
            except Exception:
                pass
        # Fall back to PCA
        n_comp = min(X.shape[1], 2)
        pca = PCA(n_components=n_comp, random_state=42)
        return pca.fit_transform(X)

    return X




def _parse_hidden_layer_sizes(s):
    """Parse '(128, 64)' or '(64,)' string into a tuple of ints."""
    import ast
    try:
        result = ast.literal_eval(str(s))
        if isinstance(result, int):
            return (result,)
        return tuple(int(x) for x in result)
    except Exception:
        return (128, 64)


def build_model(algorithm: str, task_type: str, hyperparams: dict = None):
    """
    Build a model instance with the given hyperparameters.
    Falls back to defaults when hyperparams is None or a key is missing.
    """
    hp = hyperparams or {}

    # ── Classification ────────────────────────────────────────────────────
    if task_type == 'classification':
        if algorithm == 'RandomForestClassifier':
            return RandomForestClassifier(
                n_estimators=int(hp.get('n_estimators', 100)),
                max_depth=int(hp.get('max_depth', 10)),
                min_samples_split=int(hp.get('min_samples_split', 2)),
                min_samples_leaf=int(hp.get('min_samples_leaf', 1)),
                random_state=42, n_jobs=-1,
            )
        if algorithm == 'ExtraTreesClassifier':
            return ExtraTreesClassifier(
                n_estimators=int(hp.get('n_estimators', 100)),
                max_depth=int(hp.get('max_depth', 10)),
                min_samples_split=int(hp.get('min_samples_split', 2)),
                random_state=42, n_jobs=-1,
            )
        if algorithm == 'LogisticRegression':
            return LogisticRegression(
                C=float(hp.get('C', 1.0)),
                max_iter=int(hp.get('max_iter', 1000)),
                solver=str(hp.get('solver', 'lbfgs')),
                random_state=42,
            )
        if algorithm == 'SVC':
            return SVC(
                C=float(hp.get('C', 1.0)),
                kernel=str(hp.get('kernel', 'rbf')),
                gamma=str(hp.get('gamma', 'scale')),
                probability=True, random_state=42,
            )
        if algorithm == 'KNeighborsClassifier':
            return KNeighborsClassifier(
                n_neighbors=int(hp.get('n_neighbors', 5)),
                weights=str(hp.get('weights', 'uniform')),
                metric=str(hp.get('metric', 'euclidean')),
            )
        if algorithm == 'DecisionTreeClassifier':
            return DecisionTreeClassifier(
                max_depth=int(hp.get('max_depth', 10)),
                min_samples_split=int(hp.get('min_samples_split', 2)),
                criterion=str(hp.get('criterion', 'gini')),
                random_state=42,
            )
        if algorithm == 'GradientBoostingClassifier':
            return GradientBoostingClassifier(
                n_estimators=int(hp.get('n_estimators', 100)),
                learning_rate=float(hp.get('learning_rate', 0.1)),
                max_depth=int(hp.get('max_depth', 3)),
                subsample=float(hp.get('subsample', 1.0)),
                random_state=42,
            )
        if algorithm == 'AdaBoostClassifier':
            return AdaBoostClassifier(
                n_estimators=int(hp.get('n_estimators', 100)),
                learning_rate=float(hp.get('learning_rate', 1.0)),
                random_state=42, algorithm='SAMME',
            )
        if algorithm == 'XGBClassifier':
            if XGBOOST_AVAILABLE:
                return XGBClassifier(
                    n_estimators=int(hp.get('n_estimators', 100)),
                    learning_rate=float(hp.get('learning_rate', 0.1)),
                    max_depth=int(hp.get('max_depth', 6)),
                    subsample=float(hp.get('subsample', 1.0)),
                    colsample_bytree=float(hp.get('colsample_bytree', 1.0)),
                    gamma=float(hp.get('gamma', 0)),
                    random_state=42, eval_metric='logloss', verbosity=0,
                )
            return GradientBoostingClassifier(
                n_estimators=int(hp.get('n_estimators', 100)),
                learning_rate=float(hp.get('learning_rate', 0.1)),
                max_depth=int(hp.get('max_depth', 6)),
                random_state=42,
            )
        if algorithm == 'MLPClassifier':
            return MLPClassifier(
                hidden_layer_sizes=_parse_hidden_layer_sizes(hp.get('hidden_layer_sizes', '(128, 64)')),
                max_iter=int(hp.get('max_iter', 300)),
                learning_rate_init=float(hp.get('learning_rate_init', 0.001)),
                alpha=float(hp.get('alpha', 0.0001)),
                random_state=42,
            )
        if algorithm == 'GaussianNB':
            return GaussianNB(var_smoothing=float(hp.get('var_smoothing', 1)) * 1e-9)
        # If a *Regressor* name was passed after an auto-switch to classification,
        # map it to the equivalent classifier so training still succeeds.
        _regressor_to_classifier = {
            'RandomForestRegressor':      'RandomForestClassifier',
            'ExtraTreesRegressor':        'ExtraTreesClassifier',
            'GradientBoostingRegressor':  'GradientBoostingClassifier',
            'XGBRegressor':               'XGBClassifier',
            'SVR':                        'SVC',
            'KNeighborsRegressor':        'KNeighborsClassifier',
            'MLPRegressor':               'MLPClassifier',
            'LinearRegression':           'LogisticRegression',
            'Ridge':                      'LogisticRegression',
            'Lasso':                      'LogisticRegression',
            'ElasticNet':                 'LogisticRegression',
        }
        mapped = _regressor_to_classifier.get(algorithm, algorithm)
        return build_model(mapped, 'classification', hp) if mapped != algorithm else get_classifier(algorithm)

    # ── Regression ────────────────────────────────────────────────────────
    if task_type == 'regression':
        if algorithm == 'RandomForestRegressor':
            return RandomForestRegressor(
                n_estimators=int(hp.get('n_estimators', 100)),
                max_depth=int(hp.get('max_depth', 10)),
                min_samples_split=int(hp.get('min_samples_split', 2)),
                random_state=42, n_jobs=-1,
            )
        if algorithm == 'ExtraTreesRegressor':
            return ExtraTreesRegressor(
                n_estimators=int(hp.get('n_estimators', 100)),
                max_depth=int(hp.get('max_depth', 10)),
                min_samples_split=int(hp.get('min_samples_split', 2)),
                random_state=42, n_jobs=-1,
            )
        if algorithm == 'LinearRegression':
            return LinearRegression(fit_intercept=bool(hp.get('fit_intercept', True)))
        if algorithm == 'Ridge':
            return Ridge(
                alpha=float(hp.get('alpha', 1.0)),
                solver=str(hp.get('solver', 'auto')),
            )
        if algorithm == 'Lasso':
            return Lasso(
                alpha=float(hp.get('alpha', 1.0)),
                max_iter=int(hp.get('max_iter', 1000)),
            )
        if algorithm == 'ElasticNet':
            return ElasticNet(
                alpha=float(hp.get('alpha', 1.0)),
                l1_ratio=float(hp.get('l1_ratio', 0.5)),
                max_iter=int(hp.get('max_iter', 1000)),
            )
        if algorithm == 'SVR':
            return SVR(
                C=float(hp.get('C', 1.0)),
                kernel=str(hp.get('kernel', 'rbf')),
                epsilon=float(hp.get('epsilon', 0.1)),
            )
        if algorithm == 'KNeighborsRegressor':
            return KNeighborsRegressor(
                n_neighbors=int(hp.get('n_neighbors', 5)),
                weights=str(hp.get('weights', 'uniform')),
                metric=str(hp.get('metric', 'euclidean')),
            )
        if algorithm == 'GradientBoostingRegressor':
            return GradientBoostingRegressor(
                n_estimators=int(hp.get('n_estimators', 100)),
                learning_rate=float(hp.get('learning_rate', 0.1)),
                max_depth=int(hp.get('max_depth', 3)),
                subsample=float(hp.get('subsample', 1.0)),
                random_state=42,
            )
        if algorithm == 'XGBRegressor':
            if XGBOOST_AVAILABLE:
                return XGBRegressor(
                    n_estimators=int(hp.get('n_estimators', 100)),
                    learning_rate=float(hp.get('learning_rate', 0.1)),
                    max_depth=int(hp.get('max_depth', 6)),
                    subsample=float(hp.get('subsample', 1.0)),
                    colsample_bytree=float(hp.get('colsample_bytree', 1.0)),
                    random_state=42, verbosity=0,
                )
            return GradientBoostingRegressor(
                n_estimators=int(hp.get('n_estimators', 100)),
                learning_rate=float(hp.get('learning_rate', 0.1)),
                max_depth=int(hp.get('max_depth', 6)),
                random_state=42,
            )
        if algorithm == 'MLPRegressor':
            return MLPRegressor(
                hidden_layer_sizes=_parse_hidden_layer_sizes(hp.get('hidden_layer_sizes', '(128, 64)')),
                max_iter=int(hp.get('max_iter', 300)),
                learning_rate_init=float(hp.get('learning_rate_init', 0.001)),
                alpha=float(hp.get('alpha', 0.0001)),
                random_state=42,
            )
        return get_regressor(algorithm)

    # ── Clustering ────────────────────────────────────────────────────────
    n_clusters = int(hp.get('n_clusters', hp.get('n_components', 3)))
    if algorithm == 'KMeans':
        return KMeans(
            n_clusters=n_clusters,
            n_init=int(hp.get('n_init', 10)),
            max_iter=int(hp.get('max_iter', 300)),
            random_state=42,
        )
    if algorithm == 'DBSCAN':
        return DBSCAN(eps=float(hp.get('eps', 0.5)), min_samples=int(hp.get('min_samples', 5)))
    if algorithm == 'AgglomerativeClustering':
        return AgglomerativeClustering(n_clusters=n_clusters, linkage=str(hp.get('linkage', 'ward')))
    if algorithm == 'GaussianMixture':
        return GaussianMixture(
            n_components=int(hp.get('n_components', n_clusters)),
            covariance_type=str(hp.get('covariance_type', 'full')),
            max_iter=int(hp.get('max_iter', 100)),
            random_state=42,
        )
    if algorithm == 'OPTICS':
        return OPTICS(min_samples=int(hp.get('min_samples', 5)), xi=float(hp.get('xi', 0.05)))
    if algorithm == 'MeanShift':
        bw = float(hp.get('bandwidth', 1.0))
        return MeanShift(bandwidth=bw if bw > 0 else None)
    if algorithm == 'SpectralClustering':
        return SpectralClustering(
            n_clusters=n_clusters, n_neighbors=int(hp.get('n_neighbors', 10)), random_state=42
        )
    if algorithm == 'Birch':
        return Birch(n_clusters=n_clusters, threshold=float(hp.get('threshold', 0.5)))
    return get_clustering_model(algorithm, n_clusters)
# ---------------------------------------------------------------------------
# Main training entry-point
# ---------------------------------------------------------------------------

def train(
    dataset_path: str,
    task_type: str,
    algorithm: str,
    preprocessing: str,
    feature_engineering: str,
    postprocessing: str,
    target_column: str = None,
    n_clusters: int = 3,
    model_save_path: str = None,
    feature_columns: list = None,
    hyperparams: dict = None,
    test_size: float = 0.2,
) -> dict:
    """
    Train a model and return a dictionary of metrics appropriate to task_type.

    Supported task_type values: 'classification', 'regression', 'clustering'

    Supported algorithms
    --------------------
    Classification : RandomForestClassifier, XGBClassifier, LogisticRegression,
                     SVC, KNeighborsClassifier, DecisionTreeClassifier,
                     GradientBoostingClassifier, AdaBoostClassifier,
                     ExtraTreesClassifier, GaussianNB
    Regression     : RandomForestRegressor, XGBRegressor, LinearRegression,
                     Ridge, Lasso, ElasticNet, SVR, KNeighborsRegressor,
                     GradientBoostingRegressor, ExtraTreesRegressor
    Clustering     : KMeans, DBSCAN, AgglomerativeClustering, GaussianMixture,
                     MeanShift, OPTICS, SpectralClustering, Birch
    """

    # 1. Load data
    df = load_dataset(dataset_path)
    df = df.dropna(how='all', axis=1).dropna(how='all', axis=0)

    if len(df) < 5:
        raise ValueError("Dataset must have at least 5 rows.")

    # -----------------------------------------------------------------------
    # Supervised tasks
    # -----------------------------------------------------------------------
    if task_type in ('classification', 'regression'):

        # Identify target
        if not target_column or target_column not in df.columns:
            target_column = df.columns[-1]

        y_raw = df[target_column].copy()
        if feature_columns:
            valid_fc = [c for c in feature_columns if c in df.columns and c != target_column]
            X_df = df[valid_fc].copy() if valid_fc else df.drop(columns=[target_column]).copy()
        else:
            X_df = df.drop(columns=[target_column]).copy()
        feature_names = list(X_df.columns)

        # Encode categorical features
        X_encoded, _ = encode_categorical_features(X_df)

        # Impute missing values
        imputer = SimpleImputer(strategy='mean')
        X_arr = imputer.fit_transform(X_encoded)

        # Encode target.
        # pd.api.types.is_numeric_dtype handles object, StringDtype (pandas 2+),
        # and CategoricalDtype robustly — unlike a bare `dtype == object` check.
        _target_numeric = pd.api.types.is_numeric_dtype(y_raw)

        # Auto-switch: regression with a text target → treat as classification.
        if task_type == 'regression' and not _target_numeric:
            task_type = 'classification'

        if task_type == 'classification':
            if not _target_numeric:
                le_target = LabelEncoder()
                y = le_target.fit_transform(y_raw.astype(str))
                classes = le_target.classes_.tolist()
            else:
                _num_y = pd.to_numeric(y_raw, errors='coerce')
                y = _num_y.fillna(_num_y.mode()[0]).values.astype(int)
                classes = sorted(pd.Series(y).unique().tolist())
        else:
            # True numeric regression target
            _num_y = pd.to_numeric(y_raw, errors='coerce')
            y = _num_y.fillna(_num_y.median()).values.astype(float)
            classes = None

        # Scale features
        scaler = get_scaler(preprocessing)
        X_scaled = scaler.fit_transform(X_arr) if scaler else X_arr

        # Train / test split
        stratify = y if task_type == 'classification' else None
        try:
            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, y, test_size=test_size, random_state=42, stratify=stratify
            )
        except ValueError:
            # Fallback without stratify when a class has too few samples
            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, y, test_size=test_size, random_state=42
            )

        # Feature engineering
        X_train, X_test, y_train = _apply_feature_engineering_supervised(
            X_train, X_test, y_train, feature_engineering, task_type
        )

        # Build feature name list that matches current dimensionality
        n_dim = X_train.shape[1]
        feat_names = feature_names if len(feature_names) == n_dim else [f'feature_{i}' for i in range(n_dim)]

        # Train
        model = build_model(algorithm, task_type, hyperparams)
        model.fit(X_train, y_train)

        # Postprocessing
        if postprocessing == 'CalibratedClassifierCV' and task_type == 'classification':
            from sklearn.calibration import CalibratedClassifierCV
            try:
                calibrated = CalibratedClassifierCV(model, cv='prefit', method='isotonic')
                calibrated.fit(X_train, y_train)
                model = calibrated
            except Exception:
                pass  # Keep original model if calibration fails

        y_pred = model.predict(X_test)

        importance = extract_feature_importance(model, feat_names)

        # Compute metrics
        if task_type == 'classification':
            avg = 'binary' if len(np.unique(y)) == 2 else 'weighted'
            cm = confusion_matrix(y_test, y_pred).tolist()
            result = {
                'accuracy': round(float(accuracy_score(y_test, y_pred)), 4),
                'precision': round(float(precision_score(y_test, y_pred, average=avg, zero_division=0)), 4),
                'recall': round(float(recall_score(y_test, y_pred, average=avg, zero_division=0)), 4),
                'f1': round(float(f1_score(y_test, y_pred, average=avg, zero_division=0)), 4),
                'confusion_matrix': cm,
                'feature_importance': importance,
                'classes': [str(c) for c in classes] if classes else [],
                'n_samples': int(len(df)),
                'n_features': int(len(feature_names)),
                'target_column': target_column,
                'algorithm': algorithm,
            }
        else:
            mse = float(mean_squared_error(y_test, y_pred))
            result = {
                'mse': round(mse, 4),
                'rmse': round(float(np.sqrt(mse)), 4),
                'mae': round(float(mean_absolute_error(y_test, y_pred)), 4),
                'r2': round(float(r2_score(y_test, y_pred)), 4),
                'feature_importance': importance,
                'n_samples': int(len(df)),
                'n_features': int(len(feature_names)),
                'target_column': target_column,
                'algorithm': algorithm,
            }

        if model_save_path:
            os.makedirs(os.path.dirname(model_save_path), exist_ok=True)
            joblib.dump({'model': model, 'scaler': scaler, 'feature_names': feat_names,
                         'algorithm': algorithm, 'task_type': task_type}, model_save_path)

        return result

    # -----------------------------------------------------------------------
    # Clustering
    # -----------------------------------------------------------------------
    else:
        cluster_df = df[feature_columns].copy() if feature_columns and all(c in df.columns for c in feature_columns) else df.copy()
        X_df, _ = encode_categorical_features(cluster_df)

        imputer = SimpleImputer(strategy='mean')
        X_arr = imputer.fit_transform(X_df)

        scaler = get_scaler(preprocessing) or StandardScaler()
        X_scaled = scaler.fit_transform(X_arr)

        X_scaled = _apply_feature_engineering_clustering(X_scaled, feature_engineering)

        model = build_model(algorithm, 'clustering', {**(hyperparams or {}), 'n_clusters': n_clusters})

        # Fit and predict labels
        if algorithm == 'GaussianMixture':
            model.fit(X_scaled)
            labels = model.predict(X_scaled)
        else:
            labels = model.fit_predict(X_scaled)

        unique_labels = set(labels)
        actual_clusters = [lb for lb in unique_labels if lb >= 0]  # -1 = noise in DBSCAN/OPTICS
        n_found = len(actual_clusters)

        # Silhouette score (requires at least 2 clusters and >n_clusters samples)
        silhouette = None
        if n_found >= 2:
            try:
                mask = labels >= 0
                if mask.sum() > n_found:
                    silhouette = round(float(sk_silhouette_score(X_scaled[mask], labels[mask])), 4)
            except Exception:
                pass

        unique, counts = np.unique(labels, return_counts=True)
        cluster_dist = {int(k): int(v) for k, v in zip(unique, counts)}

        result = {
            'n_clusters': n_found,
            'algorithm': algorithm,
            'n_samples': int(len(df)),
            'n_features': int(X_df.shape[1]),
            'cluster_distribution': cluster_dist,
        }

        if silhouette is not None:
            result['silhouette_score'] = silhouette
        if algorithm == 'KMeans' and hasattr(model, 'inertia_'):
            result['inertia'] = round(float(model.inertia_), 4)
        if algorithm == 'GaussianMixture':
            result['bic'] = round(float(model.bic(X_scaled)), 4)
            result['aic'] = round(float(model.aic(X_scaled)), 4)

        if model_save_path:
            os.makedirs(os.path.dirname(model_save_path), exist_ok=True)
            joblib.dump({'model': model, 'scaler': scaler, 'algorithm': algorithm,
                         'task_type': task_type}, model_save_path)

        return result


# ---------------------------------------------------------------------------
# Hyperparameter optimisation (Optuna)
# ---------------------------------------------------------------------------

def _get_trial_params(trial, algorithm: str) -> dict:
    """Return Optuna-suggested hyperparameters for the given algorithm."""
    if algorithm in ('RandomForestClassifier', 'RandomForestRegressor',
                     'ExtraTreesClassifier', 'ExtraTreesRegressor'):
        return {
            'n_estimators': trial.suggest_int('n_estimators', 50, 300, step=50),
            'max_depth': trial.suggest_int('max_depth', 2, 20),
            'min_samples_split': trial.suggest_int('min_samples_split', 2, 10),
            'min_samples_leaf': trial.suggest_int('min_samples_leaf', 1, 5),
        }
    if algorithm in ('XGBClassifier', 'XGBRegressor'):
        return {
            'n_estimators': trial.suggest_int('n_estimators', 50, 300, step=50),
            'max_depth': trial.suggest_int('max_depth', 2, 10),
            'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
            'subsample': trial.suggest_float('subsample', 0.5, 1.0),
        }
    if algorithm in ('GradientBoostingClassifier', 'GradientBoostingRegressor'):
        return {
            'n_estimators': trial.suggest_int('n_estimators', 50, 300, step=50),
            'max_depth': trial.suggest_int('max_depth', 2, 8),
            'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
            'subsample': trial.suggest_float('subsample', 0.5, 1.0),
        }
    if algorithm == 'LogisticRegression':
        return {'C': trial.suggest_float('C', 0.001, 100, log=True)}
    if algorithm == 'Ridge':
        return {'alpha': trial.suggest_float('alpha', 0.001, 100, log=True)}
    if algorithm == 'Lasso':
        return {'alpha': trial.suggest_float('alpha', 0.001, 10, log=True)}
    if algorithm == 'ElasticNet':
        return {
            'alpha': trial.suggest_float('alpha', 0.001, 10, log=True),
            'l1_ratio': trial.suggest_float('l1_ratio', 0.0, 1.0),
        }
    if algorithm in ('SVC', 'SVR'):
        return {
            'C': trial.suggest_float('C', 0.1, 100, log=True),
            'gamma': trial.suggest_categorical('gamma', ['scale', 'auto']),
        }
    if algorithm in ('KNeighborsClassifier', 'KNeighborsRegressor'):
        return {
            'n_neighbors': trial.suggest_int('n_neighbors', 1, 20),
            'weights': trial.suggest_categorical('weights', ['uniform', 'distance']),
        }
    if algorithm == 'DecisionTreeClassifier':
        return {
            'max_depth': trial.suggest_int('max_depth', 2, 20),
            'min_samples_split': trial.suggest_int('min_samples_split', 2, 10),
            'criterion': trial.suggest_categorical('criterion', ['gini', 'entropy']),
        }
    if algorithm == 'AdaBoostClassifier':
        return {
            'n_estimators': trial.suggest_int('n_estimators', 50, 300, step=50),
            'learning_rate': trial.suggest_float('learning_rate', 0.01, 1.0, log=True),
        }
    if algorithm == 'MLPClassifier':
        return {'alpha': trial.suggest_float('alpha', 1e-5, 0.1, log=True)}
    if algorithm == 'MLPRegressor':
        return {'alpha': trial.suggest_float('alpha', 1e-5, 0.1, log=True)}
    if algorithm == 'KMeans':
        return {
            'n_clusters': trial.suggest_int('n_clusters', 2, 15),
            'init': trial.suggest_categorical('init', ['k-means++', 'random']),
            'n_init': trial.suggest_int('n_init', 5, 20),
        }
    if algorithm == 'DBSCAN':
        return {
            'eps': trial.suggest_float('eps', 0.1, 3.0),
            'min_samples': trial.suggest_int('min_samples', 2, 20),
        }
    if algorithm in ('AgglomerativeClustering', 'Birch', 'SpectralClustering'):
        return {
            'n_clusters': trial.suggest_int('n_clusters', 2, 15),
            'linkage': trial.suggest_categorical('linkage', ['ward', 'complete', 'average', 'single']),
        } if algorithm == 'AgglomerativeClustering' else {'n_clusters': trial.suggest_int('n_clusters', 2, 15)}
    if algorithm == 'GaussianMixture':
        return {
            'n_components': trial.suggest_int('n_components', 2, 15),
            'covariance_type': trial.suggest_categorical('covariance_type', ['full', 'tied', 'diag', 'spherical']),
        }
    return {}


def optimize(
    dataset_path: str,
    task_type: str,
    algorithm: str,
    preprocessing: str,
    feature_engineering: str,
    postprocessing: str,
    target_column: str = None,
    n_clusters: int = 3,
    n_trials: int = 20,
    feature_columns: list = None,
    hyperparams: dict = None,
    test_size: float = 0.2,
) -> dict:
    """
    Run Optuna hyperparameter optimisation and return best params + trial history.
    Falls back to a deterministic grid if Optuna is not installed.
    """
    if not OPTUNA_AVAILABLE:
        return {
            'best_score': 0.0,
            'best_params': {},
            'n_trials': 0,
            'trials': [],
            'error': 'Optuna is not installed. Run: pip install optuna',
        }

    df = load_dataset(dataset_path)
    df = df.dropna(how='all', axis=1).dropna(how='all', axis=0)

    # Populated per trial for classification; left empty for regression/clustering.
    trial_precisions: dict[int, float] = {}
    trial_recalls: dict[int, float] = {}
    trial_f1s: dict[int, float] = {}

    if task_type in ('classification', 'regression'):
        if not target_column or target_column not in df.columns:
            target_column = df.columns[-1]

        y_raw = df[target_column].copy()
        if feature_columns:
            valid_fc = [c for c in feature_columns if c in df.columns and c != target_column]
            X_df = df[valid_fc].copy() if valid_fc else df.drop(columns=[target_column]).copy()
        else:
            X_df = df.drop(columns=[target_column]).copy()
        X_encoded, _ = encode_categorical_features(X_df)
        imputer = SimpleImputer(strategy='mean')
        X_arr = imputer.fit_transform(X_encoded)

        _target_numeric = pd.api.types.is_numeric_dtype(y_raw)
        if task_type == 'regression' and not _target_numeric:
            task_type = 'classification'

        if task_type == 'classification':
            if not _target_numeric:
                le = LabelEncoder()
                y = le.fit_transform(y_raw.astype(str))
            else:
                _num_y = pd.to_numeric(y_raw, errors='coerce')
                y = _num_y.fillna(_num_y.mode()[0]).values.astype(int)
        else:  # true numeric regression
            _num_y = pd.to_numeric(y_raw, errors='coerce')
            y = _num_y.fillna(_num_y.median()).values.astype(float)

        scaler = get_scaler(preprocessing)
        X_scaled = scaler.fit_transform(X_arr) if scaler else X_arr

        try:
            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, y, test_size=test_size, random_state=42
            )
        except Exception:
            X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2)

        X_train, X_test, y_train = _apply_feature_engineering_supervised(
            X_train, X_test, y_train, feature_engineering, task_type
        )
        n_test_samples = int(len(y_test))

        def objective(trial):
            params = _get_trial_params(trial, algorithm)
            try:
                # Use build_model so type coercions exactly match train()
                model = build_model(algorithm, task_type, params)
                model.fit(X_train, y_train)
                # Apply same postprocessing as train() so scores are comparable
                if postprocessing == 'CalibratedClassifierCV' and task_type == 'classification':
                    from sklearn.calibration import CalibratedClassifierCV
                    try:
                        calibrated = CalibratedClassifierCV(model, cv='prefit', method='isotonic')
                        calibrated.fit(X_train, y_train)
                        model = calibrated
                    except Exception:
                        pass
                y_pred = model.predict(X_test)
                if task_type == 'classification':
                    acc = float(accuracy_score(y_test, y_pred))
                    try:
                        prec = float(precision_score(y_test, y_pred, average='weighted', zero_division=0))
                        rec  = float(recall_score(y_test, y_pred, average='weighted', zero_division=0))
                        f1   = float(f1_score(y_test, y_pred, average='weighted', zero_division=0))
                    except Exception:
                        prec = rec = f1 = acc
                    trial_precisions[trial.number] = prec
                    trial_recalls[trial.number]    = rec
                    trial_f1s[trial.number]        = f1
                    return acc
                else:
                    return float(r2_score(y_test, y_pred))
            except Exception:
                return 0.0

    else:
        cluster_df = df[feature_columns].copy() if feature_columns and all(c in df.columns for c in feature_columns) else df.copy()
        X_df, _ = encode_categorical_features(cluster_df)
        imputer = SimpleImputer(strategy='mean')
        X_arr = imputer.fit_transform(X_df)
        scaler = get_scaler(preprocessing) or StandardScaler()
        X_scaled = scaler.fit_transform(X_arr)
        X_scaled = _apply_feature_engineering_clustering(X_scaled, feature_engineering)
        n_test_samples = int(len(X_scaled))

        def objective(trial):
            params = _get_trial_params(trial, algorithm)
            n_clust = params.pop('n_clusters', n_clusters)
            n_comp = params.pop('n_components', n_clusters)
            try:
                model = get_clustering_model(algorithm, n_clust if 'n_components' not in
                                             get_clustering_model(algorithm, n_clust).get_params()
                                             else n_comp)
                remaining = {k: v for k, v in params.items()
                             if k in model.get_params()}
                model.set_params(**remaining)
                if algorithm == 'GaussianMixture':
                    model.fit(X_scaled)
                    labels = model.predict(X_scaled)
                else:
                    labels = model.fit_predict(X_scaled)
                unique = set(labels)
                n_found = len([lb for lb in unique if lb >= 0])
                if n_found < 2:
                    return 0.0
                mask = labels >= 0
                if mask.sum() > n_found:
                    return float(sk_silhouette_score(X_scaled[mask], labels[mask]))
            except Exception:
                pass
            return 0.0

    study = optuna.create_study(direction='maximize')
    study.optimize(objective, n_trials=n_trials, show_progress_bar=False)

    return {
        'best_score': float(study.best_value),
        'best_params': study.best_params,
        'n_trials': len(study.trials),
        'n_test_samples': n_test_samples,
        'trials': [
            {
                'id': t.number + 1,
                'score': float(t.value) if t.value is not None else 0.0,
                'precision': trial_precisions.get(t.number),
                'recall':    trial_recalls.get(t.number),
                'f1':        trial_f1s.get(t.number),
                'params': t.params,
                'n_test_samples': n_test_samples,
            }
            for t in study.trials if t.value is not None
        ],
    }


# ---------------------------------------------------------------------------
# Image Clustering
# ---------------------------------------------------------------------------

def cluster_images(
    zip_path: str,
    algorithm: str = 'KMeans',
    n_clusters: int = 3,
    img_size: int = 64,
    use_pca: bool = True,
    pca_components: int = 50,
    results_dir: str | None = None,
    algo_params: dict | None = None,
) -> dict:
    """
    Extract pixel features from all images in a ZIP archive and cluster them.

    Parameters
    ----------
    zip_path       : path to the ZIP file containing images
    algorithm      : clustering algorithm name (KMeans, DBSCAN, etc.)
    n_clusters     : number of clusters (ignored by DBSCAN / OPTICS)
    img_size       : images are resized to (img_size x img_size) RGB
    use_pca        : reduce dimensionality with PCA before clustering
    pca_components : number of PCA components (capped to min(n_images, img_size²*3))
    results_dir    : directory to store sample images per cluster (None = skip)

    Returns
    -------
    dict with clustering metrics and per-cluster sample image paths
    """
    import zipfile
    import io
    import os
    from PIL import Image as PILImage

    IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.bmp', '.webp', '.gif', '.tiff'}

    # ── 1. Read images from ZIP ───────────────────────────────────────────
    feature_vectors = []   # list of np.ndarray shape (img_size*img_size*3,)
    filenames = []         # original filename for each row
    pil_images = []        # PIL Image (RGB) for sample saving

    with zipfile.ZipFile(zip_path, 'r') as zf:
        entries = [
            n for n in zf.namelist()
            if os.path.splitext(n.lower())[1] in IMAGE_EXTS
            and not os.path.basename(n).startswith('.')    # skip Mac __MACOSX
            and '__macosx' not in n.lower()
        ]
        if not entries:
            raise ValueError(
                "No supported image files found in the ZIP archive. "
                "Supported formats: JPG, JPEG, PNG, BMP, WEBP, GIF, TIFF."
            )

        for name in entries:
            try:
                data = zf.read(name)
                img = PILImage.open(io.BytesIO(data)).convert('RGB')
                img_resized = img.resize((img_size, img_size), PILImage.LANCZOS)
                arr = np.array(img_resized, dtype=np.float32).flatten() / 255.0
                feature_vectors.append(arr)
                filenames.append(name)
                pil_images.append(img_resized)
            except Exception:
                # skip corrupt/unreadable files silently
                continue

    n_images = len(feature_vectors)
    if n_images < 2:
        raise ValueError(
            f"At least 2 readable images are required for clustering; "
            f"found {n_images}."
        )

    X = np.stack(feature_vectors)   # (n_images, img_size*img_size*3)

    # ── 2. Scale ──────────────────────────────────────────────────────────
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # ── 3. PCA (optional) ────────────────────────────────────────────────
    pca_model = None
    if use_pca:
        n_comp = min(pca_components, n_images - 1, X_scaled.shape[1])
        if n_comp >= 2:
            pca_model = PCA(n_components=n_comp, random_state=42)
            X_scaled = pca_model.fit_transform(X_scaled)

    # ── 4. Cluster ────────────────────────────────────────────────────────
    model = build_model(algorithm, 'clustering', {'n_clusters': n_clusters, **(algo_params or {})})
    if algorithm == 'GaussianMixture':
        model.fit(X_scaled)
        labels = model.predict(X_scaled)
    else:
        labels = model.fit_predict(X_scaled)

    unique_labels = set(labels)
    actual_clusters = sorted([lb for lb in unique_labels if lb >= 0])
    n_found = len(actual_clusters)

    # ── 5. Silhouette score ───────────────────────────────────────────────
    silhouette = None
    if n_found >= 2:
        try:
            mask = labels >= 0
            if mask.sum() > n_found:
                silhouette = round(float(sk_silhouette_score(X_scaled[mask], labels[mask])), 4)
        except Exception:
            pass

    # ── 6. Cluster distribution ───────────────────────────────────────────
    unique_vals, counts = np.unique(labels, return_counts=True)
    cluster_dist = {int(k): int(v) for k, v in zip(unique_vals, counts)}

    # ── 7. Save sample images per cluster ────────────────────────────────
    sample_images: dict[str, list[str]] = {}   # cluster_id → [rel_url, ...]
    SAMPLES_PER_CLUSTER = 6

    if results_dir:
        os.makedirs(results_dir, exist_ok=True)
        for cid in actual_clusters:
            cdir = os.path.join(results_dir, f'cluster_{cid}')
            os.makedirs(cdir, exist_ok=True)
            indices = [i for i, lb in enumerate(labels) if lb == cid]
            sample_idx = indices[:SAMPLES_PER_CLUSTER]
            paths = []
            for rank, idx in enumerate(sample_idx):
                out_path = os.path.join(cdir, f'sample_{rank}.jpg')
                pil_images[idx].save(out_path, format='JPEG', quality=85)
                # Return path relative to MEDIA_ROOT so the frontend can build
                # the correct URL as: MEDIA_BASE + "/" + rel
                media_root = os.path.dirname(os.path.dirname(results_dir))
                rel = os.path.relpath(out_path, start=media_root)
                # Normalise to forward slashes for URL building
                paths.append(rel.replace('\\', '/'))
            sample_images[str(cid)] = paths

    # Store full filename→cluster assignment so the download endpoint can
    # re-read the original ZIP and re-package images by cluster.
    file_cluster_map = {filenames[i]: int(labels[i]) for i in range(n_images)}

    result: dict = {
        'task_type': 'image_clustering',
        'algorithm': algorithm,
        'n_images': n_images,
        'n_clusters': n_found,
        'cluster_distribution': cluster_dist,
        'sample_images': sample_images,
        'file_cluster_map': file_cluster_map,
    }
    if silhouette is not None:
        result['silhouette_score'] = silhouette
    if pca_model is not None:
        result['pca_components'] = int(pca_model.n_components_)
        result['explained_variance'] = round(float(pca_model.explained_variance_ratio_.sum()), 4)

    return result


def optimize_image_clusters(
    zip_path: str,
    algorithm: str = 'KMeans',
    n_clusters: int = 3,
    n_trials: int = 20,
    img_size: int = 64,
    pca_components: int = 50,
) -> dict:
    """
    Run Optuna hyperparameter optimisation for image clustering.
    Extracts image features once, then searches over n_clusters and algo params.
    Returns the same dict shape as optimize() so the frontend/poll endpoint works unchanged.
    """
    import zipfile, io, os

    if not OPTUNA_AVAILABLE:
        return {
            'best_score': 0.0,
            'best_params': {},
            'n_trials': 0,
            'trials': [],
            'error': 'Optuna is not installed. Run: pip install optuna',
        }

    from PIL import Image as PILImage
    IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.bmp', '.webp', '.gif', '.tiff'}

    # ── 1. Extract features once ─────────────────────────────────────────
    feature_vectors = []
    with zipfile.ZipFile(zip_path, 'r') as zf:
        entries = [
            n for n in zf.namelist()
            if os.path.splitext(n.lower())[1] in IMAGE_EXTS
            and not os.path.basename(n).startswith('.')
            and '__macosx' not in n.lower()
        ]
        for name in entries:
            try:
                data = zf.read(name)
                img = PILImage.open(io.BytesIO(data)).convert('RGB')
                arr = np.array(img.resize((img_size, img_size), PILImage.LANCZOS), dtype=np.float32).flatten() / 255.0
                feature_vectors.append(arr)
            except Exception:
                continue

    if len(feature_vectors) < 2:
        raise ValueError("At least 2 readable images are required for optimization.")

    X = np.stack(feature_vectors)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    n_comp = min(pca_components, len(feature_vectors) - 1, X_scaled.shape[1])
    if n_comp >= 2:
        pca_model = PCA(n_components=n_comp, random_state=42)
        X_scaled = pca_model.fit_transform(X_scaled)

    n_images = len(feature_vectors)

    # ── 2. Define Optuna objective ────────────────────────────────────────
    def objective(trial):
        params = _get_trial_params(trial, algorithm)
        # Always keep n_clusters fixed at the user's chosen value.
        # Optuna optimises other hyperparameters (init, linkage, covariance_type, etc.)
        params.pop('n_clusters', None)
        params.pop('n_components', None)

        try:
            model = get_clustering_model(algorithm, n_clusters)
            remaining = {k: v for k, v in params.items() if k in model.get_params()}
            model.set_params(**remaining)
            if algorithm == 'GaussianMixture':
                model.fit(X_scaled)
                labels = model.predict(X_scaled)
            else:
                labels = model.fit_predict(X_scaled)
            unique = set(labels)
            n_found = len([lb for lb in unique if lb >= 0])
            if n_found < 2:
                return 0.0
            mask = labels >= 0
            if mask.sum() > n_found:
                return float(sk_silhouette_score(X_scaled[mask], labels[mask]))
        except Exception:
            pass
        return 0.0

    study = optuna.create_study(direction='maximize')
    study.optimize(objective, n_trials=n_trials, show_progress_bar=False)

    return {
        'best_score': float(study.best_value),
        'best_params': study.best_params,
        'n_trials': len(study.trials),
        'n_test_samples': n_images,
        'trials': [
            {
                'id': t.number + 1,
                'score': float(t.value) if t.value is not None else 0.0,
                'params': t.params,
                'n_test_samples': n_images,
            }
            for t in study.trials if t.value is not None
        ],
    }
