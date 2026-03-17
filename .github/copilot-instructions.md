# AutoML Studio — Copilot Workspace Instructions

## Project Overview
**AutoML Studio** is an AI-powered, no-code machine learning platform that lets users build, train, and deploy ML models through a guided web UI without writing any code. The workflow is: Model Type → Upload Dataset → Describe → Analyze → Select Pipeline → Train → Optimize → Results → Export.

---

## Tech Stack

### Backend (`/` — Django root)
- **Framework**: Django 5.2 + Django REST Framework
- **Database**: SQLite (dev) → PostgreSQL (prod)
- **Async**: Celery + Redis (planned)
- **ML Engine**: scikit-learn, XGBoost, Optuna
- **Auth**: Django session auth + DRF BasicAuthentication
- **CORS**: django-corsheaders (allows `http://localhost:3000`)
- **Key packages**: see `requirements.txt`

### Frontend (`/frontend`)
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Animation**: Framer Motion
- **State**: React Context via `useDataset` hook (`src/app/lib/hooks/useDataset.tsx`)
- **Dev server**: `npm run dev` → `http://localhost:3000`

---

## Django App Structure

| App | Purpose |
|---|---|
| `users/` | User accounts and authentication |
| `datasets/` | Dataset upload, storage, profiling |
| `pipelines/` | ML pipeline definitions and recommendations |
| `training/` | Training runs, Celery tasks |
| `results/` | Model metrics, visualizations |
| `api/` | REST API endpoints (consumed by Next.js frontend) |

### URL Layout
- `GET /api/ping/` — health check (`api/views.py`)
- All API routes are prefixed with `/api/` (`mlplatform/urls.py`)

---

## Frontend Route Structure (`frontend/src/app/(root)/`)

| Route | Page |
|---|---|
| `/` | Landing / Hero page |
| `/about` | Project information |
| `/model-type` | Step 1 — choose ML task type |
| `/upload` | Step 2 — upload dataset |
| `/describe` | Step 3 — describe the dataset / goal |
| `/analyze` | Step 4 — data analysis & profiling |
| `/select-pipeline` | Step 5 — AI pipeline recommendations |
| `/train` | Step 6 — train selected pipeline |
| `/optimize` | Step 7 — hyperparameter optimization |
| `/results` | Step 8 — view metrics and visualizations |
| `/export` | Step 9 — download model |
| `/image-clustering` | Image-specific clustering flow |

### Shared Layout Components (`frontend/src/app/components/layout/`)
- `Navbar/page.tsx` — top navigation bar
- `Sidebar/Page.tsx` — step-based workflow sidebar
- `Footer/Page.tsx` — page footer

---

## Development Commands

### Backend
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start Django dev server (port 8000)
python manage.py runserver

# Create superuser
python manage.py createsuperuser
```

### Frontend
```bash
cd frontend

# Install Node dependencies
npm install

# Start Next.js dev server (port 3000)
npm run dev

# Build for production
npm run build
```

---

## Conventions & Rules

1. **API responses**: Always return JSON via DRF `Response`. Use `@api_view` decorators for function-based views.
2. **CORS**: The Django backend allows requests from `localhost:3000`. Do not remove CORS middleware ordering (it must be first).
3. **Frontend data fetching**: Use `fetch` calls to `http://localhost:8000/api/` endpoints. All API calls go through the `useDataset` context where applicable.
4. **File uploads**: Dataset files are uploaded via the `/upload` page and sent to the Django backend.
5. **No hardcoded secrets**: `SECRET_KEY` must come from environment variables in production.
6. **TypeScript**: All new frontend files must use `.tsx` / `.ts` extensions with proper types.
7. **Tailwind**: Use Tailwind utility classes; custom CSS only in `globals.css`.
8. **Framer Motion**: Use `motion.*` components for animated UI elements, matching the dark-themed design.
9. **Python**: Follow PEP 8. Keep ML logic in the relevant Django app (`training/`, `pipelines/`).
10. **No Django templates**: The frontend is fully Next.js; Django serves only REST API endpoints.

---

## Key Files

| File | Purpose |
|---|---|
| `mlplatform/settings.py` | Django settings (INSTALLED_APPS, CORS, DRF config) |
| `mlplatform/urls.py` | Root URL configuration |
| `api/views.py` | API view functions |
| `api/urls.py` | API URL patterns |
| `frontend/src/app/lib/hooks/useDataset.tsx` | Global dataset state context |
| `frontend/src/app/(root)/layout.tsx` | Root layout (Navbar + Sidebar + Footer) |
| `requirements.txt` | Python dependencies |
| `frontend/package.json` | Node dependencies |

---

## Environment Setup Checklist
- [x] Django project scaffolded (`mlplatform/`)
- [x] Django apps created: `users`, `datasets`, `pipelines`, `training`, `results`, `api`
- [x] DRF + CORS configured in `settings.py`
- [x] Next.js frontend scaffolded (`frontend/`)
- [x] Tailwind CSS + Framer Motion installed
- [x] All route pages created
- [ ] Models defined in each Django app
- [ ] Serializers created for each model
- [ ] API endpoints wired up for full workflow
- [ ] Dataset upload + profiling logic implemented
- [ ] Pipeline recommendation logic implemented
- [ ] Training + Optuna optimization implemented
- [ ] Results visualization implemented
- [ ] Model export (pkl / ONNX) implemented
