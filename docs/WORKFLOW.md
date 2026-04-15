# ML Pipeline Workflow - AutoML Studio

## Complete User Journey

```mermaid
graph TB
    Start([User Login]) --> Upload[Upload Dataset]
    Upload --> Analyze[Analyze Dataset]
    Analyze --> Describe[Add Description]
    Describe --> SelectCols[Select Columns]
    SelectCols --> Recommend[Get AI Recommendations]
    Recommend --> SelectPipe[Select Pipeline]
    SelectPipe --> Train[Start Training]
    Train --> Monitor{Check Status}
    Monitor -->|Pending/Training| Monitor
    Monitor -->|Completed| Results[View Results]
    Monitor -->|Failed| Error[Show Error]
    Results --> Optimize{Optimize?}
    Optimize -->|Yes| RunOpt[Run Hyperparameter Tuning]
    RunOpt --> Results
    Optimize -->|No| Export[Export Model]
    Export --> End([End])
    Error --> End
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database

    U->>FE: Enter Credentials
    FE->>BE: POST /auth/login/
    BE->>DB: Validate User
    DB-->>BE: User Data
    BE->>DB: Create Session
    DB-->>BE: Session ID
    BE-->>FE: Session Cookie + User Data
    FE->>FE: Set loggedIn=true<br/>(localStorage + sessionStorage)
    FE-->>U: Redirect to Dashboard
```

---

## Dataset Upload & Analysis Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as API
    participant DB as Database
    participant FS as File System

    U->>FE: Select CSV File
    FE->>API: POST /api/upload/ (multipart)
    API->>FS: Save to media/datasets/
    API->>API: Parse with pandas
    API->>DB: INSERT dataset record
    DB-->>API: dataset_id
    API->>API: Extract columns, dtypes,<br/>n_samples, n_features
    API-->>FE: Dataset metadata
    FE->>FE: Store dataset state
    FE-->>U: Show dataset preview
```

---

## AI Pipeline Recommendation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as API
    participant OR as OpenRouter AI
    participant DB as Database

    U->>FE: Click "Get Recommendations"
    FE->>API: GET /api/recommend/{dataset_id}/
    API->>DB: Load dataset metadata
    API->>API: Build prompt with<br/>dataset stats + samples
    API->>OR: POST /chat/completions<br/>(Gemini 2.0 Flash)
    OR-->>API: Ranked pipeline JSON
    API->>API: Merge AI reasons<br/>with pipeline details
    API-->>FE: Enriched pipeline list
    FE-->>U: Display recommendations<br/>with AI explanations
```

---

## Training Job Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as API
    participant DB as Database
    participant CEL as Celery
    participant ML as ML Engine

    U->>FE: Select Pipeline +<br/>Configure Params
    FE->>API: POST /api/train/
    API->>DB: CREATE TrainingJob<br/>(status=pending)
    API->>CEL: run_training_task.delay(job_id)
    API-->>FE: {job_id, status: pending}
    
    loop Polling (every 2s)
        FE->>API: GET /api/result/{job_id}/
        API->>DB: SELECT job status
        DB-->>API: Job record
        API-->>FE: {status, metrics}
    end

    CEL->>CEL: Dequeue task
    CEL->>DB: UPDATE status=training
    CEL->>ML: Execute pipeline
    ML->>ML: Preprocess → Train →<br/>Evaluate
    ML->>FS: Save model.pkl
    ML->>DB: UPDATE metrics,<br/>model_path
    CEL->>DB: UPDATE status=completed,<br/>completed_at
```

---

## Hyperparameter Optimization Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as API
    participant DB as Database
    participant CEL as Celery
    participant OPT as Optuna

    U->>FE: Click "Optimize"<br/>Set n_trials
    FE->>API: POST /api/optimize/
    API->>DB: Validate job completed
    API->>DB: UPDATE status=optimizing
    API->>CEL: run_optimize_task.delay<br/>(job_id, n_trials)
    API-->>FE: {status: optimizing}

    loop Polling
        FE->>API: GET /api/result/{job_id}/
        API-->>FE: Optimization progress
    end

    CEL->>OPT: Create study
    loop n_trials
        CEL->>OPT: suggest_params()
        CEL->>CEL: Train with params
        CEL->>OPT: report(score)
    end
    CEL->>DB: UPDATE best_params,<br/>optimization_metrics
    CEL->>DB: UPDATE status=completed
```

---

## Model Export Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as API
    participant FS as File System

    U->>FE: Click "Export"<br/>Select format
    FE->>API: GET /api/export/{job_id}/{fmt}/
    API->>FS: Locate model file
    alt Format = pkl
        API->>FS: Read model.pkl
        API-->>U: Download .pkl file
    else Format = py
        API->>API: Generate inference<br/>script with embedded<br/>params
        API-->>U: Download .py file
    end
```

---

## Component Interaction Map

```mermaid
graph LR
    subgraph "User Actions"
        A1[Login]
        A2[Upload]
        A3[Configure]
        A4[Train]
        A5[Export]
    end

    subgraph "Frontend Pages"
        P1[/login/]
        P2[/upload/]
        P3[/select-pipeline/]
        P4[/train/]
        P5[/results/]
        P6[/export/]
    end

    subgraph "API Endpoints"
        E1[/auth/login/]
        E2[/api/upload/]
        E3[/api/recommend/]
        E4[/api/train/]
        E5[/api/result/]
        E6[/api/export/]
    end

    subgraph "Backend Services"
        S1[Auth Service]
        S2[Dataset Service]
        S3[ML Engine]
        S4[Celery Worker]
    end

    A1 --> P1
    A2 --> P2
    A3 --> P3
    A4 --> P4
    A5 --> P5

    P1 --> E1
    P2 --> E2
    P3 --> E3
    P4 --> E4
    P5 --> E5
    P6 --> E6

    E1 --> S1
    E2 --> S2
    E3 --> S3
    E4 --> S4
    E5 --> S3
    E6 --> S3
```

---

## State Management

```mermaid
stateDiagram-v2
    [*] --> Anonymous
    Anonymous --> Authenticated : Login
    Authenticated --> Anonymous : Logout
    
    state "Dataset Workflow" as DW {
        [*] --> NoDataset
        NoDataset --> DatasetUploaded : Upload
        DatasetUploaded --> ColumnsSelected : Select Columns
        ColumnsSelected --> PipelineSelected : Choose Pipeline
        PipelineSelected --> TrainingStarted : Train
    }

    state "Training States" as TW {
        TrainingStarted --> Pending
        Pending --> Training : Worker picks up
        Training --> Completed : Success
        Training --> Failed : Error
        Completed --> Optimizing : Optimize
        Optimizing --> Completed : Done
        Completed --> Exported : Export
    }

    Authenticated --> DW
    DW --> TW
```

---

## File Storage Structure

```
media/
├── datasets/           # Uploaded CSV/Excel files
│   └── dataset_1.csv
├── models/             # Trained model pickle files
│   └── model_job_1.pkl
├── image_zips/         # Uploaded image archives
│   └── images_abc123.zip
└── image_clusters/     # Clustering results
    └── job_456/
        ├── clustered_images/
        └── results.json
```

---

## API Rate Limits & Timeouts

| Endpoint | Method | Timeout | Rate Limit |
|----------|--------|---------|------------|
| /auth/login/ | POST | 10s | 10/min |
| /api/upload/ | POST | 60s | 20/min |
| /api/recommend/ | GET | 30s | 10/min |
| /api/train/ | POST | 5s | 10/min |
| /api/result/ | GET | 5s | 60/min (polling) |
| /api/optimize/ | POST | 5s | 5/min |
| /api/export/ | GET | 30s | 10/min |

---

## Error Handling Strategy

```mermaid
graph TD
    Error[Error Occurs] --> Type{Error Type}
    Type -->|Validation| ValErr[400 Bad Request]
    Type -->|Auth| AuthErr[401 Unauthorized]
    Type -->|Permission| PermErr[403 Forbidden]
    Type -->|Not Found| NotFound[404]
    Type -->|Server| ServErr[500 Internal]
    
    ValErr --> FE[Frontend]
    AuthErr --> FE
    PermErr --> FE
    NotFound --> FE
    ServErr --> FE
    
    FE --> Display[Show Error Message]
    Display --> Log[Log to Console]
    Log --> Retry{Retry?}
    Retry -->|Yes| RetryAction[Retry Action]
    Retry -->|No| Fallback[Fallback UI]
```
