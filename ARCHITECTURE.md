# 📐 KittuBot Architecture Specification (HLD & LLD)

This document provides both the **High-Level Design (HLD)** and **Low-Level Design (LLD)** for the **KittuBot** chat application, illustrating how the React frontend, FastAPI backend, and local vLLM inference engine interact.

---

## 1. High-Level Architecture (HLD)

The High-Level Architecture outlines the system boundaries, major components, network ports, and data stores.

```mermaid
flowchart TD
    subgraph Client["🖥️ Client Tier (Browser)"]
        UI["React Single Page Application<br/>(Vite / React 18)"]
        LocalStorage[("Browser localStorage<br/>(User Config & Preferences)")]
        UI <--> LocalStorage
    end

    subgraph Backend["⚡ Application Tier (FastAPI - Port 8001)"]
        Gateway["FastAPI Gateway & Static Server<br/>(CORS, /api, /docs, /)"]
        ChatRouter["Chat & LLM Router<br/>(/api/chat, /api/health, /api/models)"]
        SessionRouter["Session Router<br/>(/api/sessions)"]
        LLMService["LLM Service<br/>(OpenAI Client, SSE Stream, Latency Tracker)"]
        SessionService["Session Service<br/>(History Management & Persistence)"]
        
        Gateway --> ChatRouter
        Gateway --> SessionRouter
        ChatRouter --> LLMService
        SessionRouter --> SessionService
    end

    subgraph Storage["💾 Persistence Layer"]
        SessionFile[("sessions.json<br/>(Chat History & Metrics)")]
        SessionService <--> SessionFile
    end

    subgraph Inference["🤖 Model Inference Tier (vLLM - Port 8000)"]
        vLLMServer["vLLM Engine Server<br/>(OpenAI-Compatible HTTP API)"]
        Engine["Continuous Batching & PagedAttention"]
        ModelWeights["Model: Qwen/Qwen3-0.6B<br/>(KV Cache in GPU/RAM)"]

        vLLMServer --> Engine
        Engine --> ModelWeights
    end

    UI -- "HTTP POST (SSE Stream)<br/>/api/chat" --> ChatRouter
    UI -- "REST CRUD<br/>/api/sessions" --> SessionRouter
    UI -- "Health Poll<br/>/api/health" --> ChatRouter
    LLMService -- "HTTP POST (Stream=True)<br/>http://localhost:8000/v1/chat/completions" --> vLLMServer
```

---

## 2. Low-Level Architecture (LLD)

### 2.1 React Component Hierarchy

```mermaid
graph TD
    App["App.jsx<br/>(Central State & Stream Controller)"]
    
    App --> Sidebar["Sidebar.jsx<br/>(Chat Sessions & New Chat)"]
    App --> ChatHeader["ChatHeader.jsx<br/>(Model Badge & Health Indicator)"]
    App --> MessageList["MessageList.jsx<br/>(Message Container)"]
    App --> ChatInput["ChatInput.jsx<br/>(Auto-expanding Input & Stop Button)"]
    App --> SettingsModal["SettingsModal.jsx<br/>(URL, Model & Hyperparameters)"]

    MessageList --> StarterPrompts["Starter Prompts Grid<br/>(Empty State)"]
    MessageList --> MessageItem["MessageItem.jsx<br/>(Bubble, Markdown & Metrics)"]
    MessageItem --> CodeBlock["CodeBlock<br/>(Syntax & Copy Button)"]
    MessageItem --> MetricsPill["Metrics Pill<br/>(TTFT & Latency Badges)"]
```

---

### 2.2 End-to-End Real-Time Token Streaming Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as React (App / api.js)
    participant FastAPI as FastAPI (/api/chat)
    participant LLMService as LLMService (Async Executor)
    participant vLLM as vLLM Server (:8000/v1)

    User->>Frontend: Types prompt and presses Enter
    Frontend->>Frontend: Append user message to UI state
    Frontend->>Frontend: Instantiate AbortController & placeholder message
    Frontend->>FastAPI: POST /api/chat (stream: true, messages, model)
    FastAPI->>LLMService: stream_chat(ChatRequest)
    LLMService->>LLMService: Start clock: start_time = perf_counter()
    LLMService->>vLLM: POST /v1/chat/completions (stream=True)
    
    vLLM-->>LLMService: First token chunk (delta)
    LLMService->>LLMService: Record first_token_time & calculate TTFT
    LLMService-->>FastAPI: yield data: {"type": "content", "text": "token_1"}
    FastAPI-->>Frontend: SSE packet 1
    Frontend->>Frontend: Append token to UI in real time

    loop Subsequent Tokens
        vLLM-->>LLMService: Token chunk (delta)
        LLMService-->>FastAPI: yield data: {"type": "content", "text": "token_N"}
        FastAPI-->>Frontend: SSE packet N
        Frontend->>Frontend: Update rendered Markdown
    end

    vLLM-->>LLMService: Stream Finished [DONE]
    LLMService->>LLMService: Calculate total_latency = end_time - start_time
    LLMService-->>FastAPI: yield data: {"type": "done", "ttft": 0.14, "latency": 1.25}
    FastAPI-->>Frontend: SSE Final Metrics Packet
    Frontend->>Frontend: Attach TTFT & latency badges to message bubble
    Frontend->>FastAPI: POST /api/sessions/{id}/messages (Persist final response)
```

---

### 2.3 Backend Class & Module Architecture

```mermaid
classDiagram
    class Settings {
        +str app_name
        +str host
        +int port
        +str vllm_base_url
        +str vllm_api_key
        +str default_model
        +float default_temperature
        +int default_max_tokens
        +str default_system_prompt
    }

    class ChatMessage {
        +str id
        +str role
        +str content
        +float timestamp
        +float ttft
        +float latency
        +str model
    }

    class ChatRequest {
        +List~ChatMessage~ messages
        +str model
        +bool stream
        +float temperature
        +int max_tokens
        +str base_url
        +str api_key
        +str system_prompt
        +str session_id
    }

    class Session {
        +str id
        +str title
        +float created_at
        +float updated_at
        +List~ChatMessage~ messages
    }

    class LLMService {
        +get_client(base_url, api_key) OpenAI
        +prepare_messages(req) List
        +stream_chat(req) AsyncGenerator
        +generate_chat(req) ChatResponse
        +check_health(base_url) Dict
    }

    class SessionService {
        -Dict~str, Session~ sessions
        +load_sessions()
        +save_sessions()
        +list_sessions() List~Session~
        +get_session(id) Session
        +create_session(title) Session
        +update_session(id, title) Session
        +add_message(session_id, message) Session
        +delete_session(id) bool
    }

    LLMService ..> Settings : reads config
    LLMService ..> ChatRequest : consumes
    SessionService "1" *-- "*" Session : stores
    Session "1" *-- "*" ChatMessage : contains
```

