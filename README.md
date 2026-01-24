# 🤖 AutoML Studio: AI-Based No-Code Machine Learning Platform

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)](https://python.org)
[![Django](https://img.shields.io/badge/Django-4.2%2B-green?logo=django)](https://djangoproject.com)
[![Next.js](https://img.shields.io/badge/Next.js-14%2B-black?logo=next.js)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-purple)](LICENSE)

An **AI-powered, no-code web platform** that automates the entire machine learning workflow — from dataset upload to optimized model export — without writing a single line of code.

> **"Democratizing machine learning for analysts, researchers, students, and domain experts."**

---

## 🌟 Features

✅ **No-Code Interface**  
&nbsp;&nbsp;&nbsp;&nbsp;– Intuitive UI for non-programmers  
&nbsp;&nbsp;&nbsp;&nbsp;– Step-by-step guided workflow  

✅ **Smart Pipeline Recommendation**  
&nbsp;&nbsp;&nbsp;&nbsp;– AI analyzes your dataset + description  
&nbsp;&nbsp;&nbsp;&nbsp;– Recommends top pipelines (preprocessing → algorithm)  

✅ **Automated Training & Optimization**  
&nbsp;&nbsp;&nbsp;&nbsp;– Train multiple candidate pipelines  
&nbsp;&nbsp;&nbsp;&nbsp;– Bayesian hyperparameter tuning (Optuna)  
&nbsp;&nbsp;&nbsp;&nbsp;– Task-specific evaluation (classification/clustering/regression)  

✅ **Transparent Results**  
&nbsp;&nbsp;&nbsp;&nbsp;– Performance metrics & visualizations  
&nbsp;&nbsp;&nbsp;&nbsp;– Confusion matrix, feature importance, convergence plots  

✅ **One-Click Export**  
&nbsp;&nbsp;&nbsp;&nbsp;– Download models as `.pkl`, `.onnx`, or Python script  

✅ **Full User Flow Support**  
&nbsp;&nbsp;&nbsp;&nbsp;– Model selection → Upload → Describe → Analyze → Recommend → Train → Optimize → Export  

---

## 🏗️ Architecture

### Frontend (`/frontend`)
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Framer Motion
- **State**: React Context
- **Hosting**: Vercel

### Backend (`/backend`)
- **Framework**: Django 4.2 + Django REST Framework
- **Async Tasks**: Celery + Redis
- **Database**: PostgreSQL
- **ML Engine**: Python (scikit-learn, XGBoost, Optuna)
- **Hosting**: Render / AWS

### Core Workflow
```mermaid
graph LR
A[User] --> B[Next.js Frontend]
B --> C[Django API]
C --> D[PostgreSQL]
C --> E[Celery Worker]
E --> F[Optuna + scikit-learn]
F --> G[Trained Model]
G --> H[Results Dashboard]
H --> I[Model Export]
