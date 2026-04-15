# AutoML Studio - Documentation Index

## 📚 Documentation Overview

This folder contains system design documentation for the AutoML Studio project.

---

## 📄 Available Documents

### 1. [System Architecture](./ARCHITECTURE.md)
- High-level system architecture
- Component architecture
- Data flow architecture
- Technology stack
- API architecture
- Security architecture
- Deployment architecture

### 2. [Entity Relationship Diagram](./ER_DIAGRAM.md)
- Database schema (ER Diagram)
- Detailed entity model
- Physical data model
- Table specifications
- Relationships
- Indexes
- Data flow examples

---

## 🏗️ Quick Reference

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│  Next.js 14 | React | Tailwind CSS | Framer Motion      │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTP/REST
┌─────────────────────────────────────────────────────────┐
│                     Backend Layer                        │
│  Django 4.2 | Django REST Framework | Authentication    │
└─────────────────────────────────────────────────────────┘
                          ↓ Task Queue
┌─────────────────────────────────────────────────────────┐
│                   Processing Layer                       │
│  Celery Worker | Redis Broker | ML Training Tasks       │
└─────────────────────────────────────────────────────────┘
                          ↓ Read/Write
┌─────────────────────────────────────────────────────────┐
│                     Storage Layer                        │
│  SQLite Database | Media Files | Model Artifacts        │
└─────────────────────────────────────────────────────────┘
```

### Database Entities

| Entity | Table Name | Description |
|--------|-----------|-------------|
| User | `auth_user` | Django built-in user model |
| UserProfile | `users_userprofile` | Extended user profile |
| Dataset | `datasets_dataset` | Uploaded datasets |
| TrainingJob | `training_trainingjob` | ML training jobs |

---

## 🔗 Related Files

- **Frontend**: `frontend/src/app/`
- **Backend API**: `api/views.py`
- **Models**: `*/models.py`
- **Authentication**: `users/views.py`, `mlplatform/authentication.py`
- **Settings**: `mlplatform/settings.py`

---

## 📝 Diagram Syntax

All diagrams use [Mermaid](https://mermaid.js.org/) syntax and can be viewed:
- In GitHub/GitLab (native support)
- VS Code with "Markdown Preview Mermaid Support" extension
- Online at [mermaid.live](https://mermaid.live/)

---

## 📊 Generating Diagrams from Code

To regenerate diagrams from the actual codebase:

```bash
# Install Django Extensions
pip install django-extensions

# Generate ER diagram from models
python manage.py graph_models -a -o docs/models.dot

# Convert to PNG (requires Graphviz)
dot -Tpng docs/models.dot -o docs/models.png
```

---

## 📖 Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Celery Documentation](https://docs.celeryq.dev/)
- [Django REST Framework](https://www.django-rest-framework.org/)
