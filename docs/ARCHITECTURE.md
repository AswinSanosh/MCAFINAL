# System Architecture - AutoML Studio

## Overview

AutoML Studio is a no-code machine learning platform that automates the entire ML workflow from dataset upload to model export.

---

## High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Next.js 14 Frontend]
        A1[React Components]
        A2[Auth Context]
        A3[API Proxy]
    end

    subgraph "Backend Layer"
        B[Django REST API]
        B1[User Authentication]
        B2[Dataset Management]
        B3[Training Engine]
        B4[ML Pipelines]
    end

    subgraph "Async Processing"
        C[Celery Worker]
        C1[Redis Broker]
        C2[Task Queue]
    end

    subgraph "Storage Layer"
        D[(SQLite Database)]
        D1[Media Files]
        D2[Model Artifacts]
    end

    A -->|HTTP/REST| B
    B -->|Task Dispatch| C
    C -->|Results| B
    B -->|CRUD| D
    B -->|File I/O| D1
    C -->|Save Models| D2
```

---

## Component Architecture

```mermaid
graph TB
    subgraph "Frontend Components"
        F1[Upload Page]
        F2[Analyze Page]
        F3[Pipeline Selection]
        F4[Training Page]
        F5[Results Dashboard]
        F6[Export Page]
    end

    subgraph "API Endpoints"
        A1[/api/upload/]
        A2[/api/analyze/]
        A3[/api/recommend/]
        A4[/api/train/]
        A5[/api/result/]
        A6[/api/optimize/]
        A7[/api/export/]
    end

    subgraph "ML Engine"
        M1[Data Preprocessing]
        M2[Pipeline Builder]
        M3[Model Trainer]
        M4[Hyperparameter Opt]
        M5[Model Serializer]
    end

    F1 --> A1
    F2 --> A2
    F3 --> A3
    F4 --> A4
    F5 --> A5
    F6 --> A6

    A1 --> M1
    A3 --> M2
    A4 --> M3
    A6 --> M4
    A7 --> M5
```

---

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Django API
    participant DB as Database
    participant CEL as Celery Worker
    participant ML as ML Engine

    U->>FE: Upload Dataset
    FE->>API: POST /api/upload/
    API->>DB: Save Dataset Record
    API-->>FE: Dataset ID

    U->>FE: Select Pipeline
    FE->>API: GET /api/recommend/{id}/
    API->>ML: Analyze Dataset
    ML-->>API: Pipeline Recommendations
    API-->>FE: Return Pipelines

    U->>FE: Start Training
    FE->>API: POST /api/train/
    API->>DB: Create TrainingJob
    API->>CEL: Queue Training Task
    CEL-->>FE: Job ID (Pending)

    loop Training Progress
        FE->>API: GET /api/result/{job_id}/
        API->>DB: Check Job Status
        DB-->>API: Job Status
        API-->>FE: Status Update
    end

    CEL->>ML: Run Training
    ML->>DB: Save Model & Metrics
    CEL->>DB: Update Job Status
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 | React framework with App Router |
| **Styling** | Tailwind CSS + Framer Motion | UI components and animations |
| **State** | React Context API | Authentication and global state |
| **Backend** | Django 4.2 + DRF | REST API and business logic |
| **Database** | SQLite (dev) | Data persistence |
| **Task Queue** | Celery + Redis | Async ML training |
| **ML Libraries** | scikit-learn, XGBoost, Optuna | Model training and optimization |
| **AI** | OpenRouter (Gemini) | Pipeline recommendations |

---

## API Architecture

```mermaid
graph LR
    subgraph "Auth Endpoints"
        A1[/auth/register/]
        A2[/auth/login/]
        A3[/auth/logout/]
        A4[/auth/profile/]
        A5[/auth/check/]
    end

    subgraph "ML Endpoints"
        M1[/api/upload/]
        M2[/api/analyze/]
        M3[/api/recommend/]
        M4[/api/train/]
        M5[/api/result/]
        M6[/api/optimize/]
        M7[/api/export/]
    end

    subgraph "Image Endpoints"
        I1[/api/image-upload/]
        I2[/api/image-drive/]
        I3[/api/image-cluster/]
        I4[/api/image-download/]
    end
```

---

## Security Architecture

```mermaid
graph TB
    subgraph "Authentication Flow"
        U[User]
        FE[Frontend]
        BE[Backend]
        DB[(Database)]
        
        U -->|Credentials| FE
        FE -->|POST /auth/login/| BE
        BE -->|Validate| DB
        DB -->|User Data| BE
        BE -->|Session Cookie| FE
        FE -->|Store loggedIn flag| LS[LocalStorage]
    end

    subgraph "Session Management"
        LS -->|loggedIn: true| FE
        FE -->|sessionid cookie| BE
        BE -->|Validate Session| DB
        DB -->|Authenticated| BE
    end
```

---

## Deployment Architecture (Local Development)

```mermaid
graph TB
    subgraph "Browser"
        B1[Next.js Dev Server<br/>localhost:3000]
    end

    subgraph "Backend Services"
        D1[Django Server<br/>localhost:8000]
        C1[Celery Worker]
        R1[Redis Broker<br/>localhost:6379]
    end

    subgraph "Storage"
        DB[(SQLite<br/>db.sqlite3)]
        MF[Media Files<br/>/media/]
    end

    B1 -->|API Proxy| D1
    D1 -->|Task Queue| R1
    C1 -->|Consume Tasks| R1
    D1 -->|Read/Write| DB
    C1 -->|Save Results| MF
```

---

## Key Design Decisions

1. **API Proxy Pattern**: Next.js proxies all `/api/*` requests to Django, simplifying CORS
2. **Session-Based Auth**: Uses Django sessions with localStorage flags for persistence
3. **Async Processing**: Celery handles long-running ML tasks without blocking requests
4. **CSRF Exemption**: Custom authentication class bypasses CSRF for API endpoints
5. **JSON Fields**: Flexible schema for ML metrics, hyperparameters, and pipeline configs
