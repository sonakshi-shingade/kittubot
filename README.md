# 🤖 KittuBot - AI Chat Application

**KittuBot** is a modern, high-performance chat application built with a **React** frontend and a **FastAPI** backend, designed to interface seamlessly with a local **vLLM** server (or OpenAI-compatible APIs).

The architecture directly builds upon the patterns demonstrated in [`vllm_learning/streamlit.py`](../GENAI_BATCH/vllm_learning/streamlit.py) and [`vllm_learning/latency.py`](../GENAI_BATCH/vllm_learning/latency.py).

---

## 🌟 Key Features

- **vLLM / OpenAI Integration (from `streamlit.py`)**:
  - Connects to `http://localhost:8000/v1` with model `Qwen/Qwen3-0.6B` and `api_key="dummy"`.
  - Configurable endpoints and API keys via UI settings or `.env`.
- **Real-time Token Streaming (SSE)**:
  - Streams tokens as Server-Sent Events (`stream=True`) directly to the chat window with smooth typing animations.
- **Performance Metrics (from `latency.py`)**:
  - **TTFT (Time To First Token)**: Accurately measured and displayed as a badge on each assistant response.
  - **E2E Latency**: Tracks total inference turnaround time.
- **Rich Markdown & Code Highlighting**:
  - Code syntax blocks with automatic language detection and a one-click **"Copy Code"** button.
  - Formatted tables, lists, blockquotes, and links via `react-markdown` and `remark-gfm`.
- **Multi-Session Chat History**:
  - Create new chats, switch between historical conversations, and delete chats.
  - Auto-generated session titles based on the initial message prompt.
  - File-persisted chat history in `backend/sessions.json`.
- **Customizable Settings Modal**:
  - Dynamic Base URL, Model name, API Key, Temperature, Max Tokens, and System Prompt.
  - Live model switcher pulling models from `GET /api/models`.
- **Live Health & Connectivity Status**:
  - Visual status pill in the header showing whether local vLLM is connected (🟢) or offline (🟡).
  - Friendly connection guidance if vLLM hasn't been started yet.
- **Dual Run Modes**:
  - **Unified Mode**: FastAPI directly serves the pre-built React frontend at `http://localhost:8001`.
  - **Dev Mode**: Vite dev server on `http://localhost:5173` with hot-reload and proxy to FastAPI.

---

## 🏗️ Architecture

```
Project/
├── kittubot/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── config.py         # Config (vLLM URL, default model, ports)
│   │   │   ├── models.py         # Pydantic schemas (ChatRequest, Session, etc.)
│   │   │   ├── main.py           # FastAPI entrypoint & static mount
│   │   │   ├── routes/
│   │   │   │   ├── chat.py       # /api/chat (SSE streaming), /api/health, /api/models
│   │   │   │   └── sessions.py   # /api/sessions (CRUD for chat histories)
│   │   │   └── services/
│   │   │       ├── llm_service.py     # OpenAI client, TTFT/latency measurement
│   │   │       └── session_service.py # In-memory + JSON session persistence
│   │   ├── .env                  # Environment config
│   │   ├── requirements.txt      # Backend Python dependencies
│   │   └── run.sh                # Backend launcher script
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Sidebar.jsx       # Chat sessions list & new chat
│   │   │   │   ├── ChatHeader.jsx    # Model badge & vLLM status
│   │   │   │   ├── MessageList.jsx   # Message view & prompt cards
│   │   │   │   ├── MessageItem.jsx   # Markdown, code copy, TTFT badges
│   │   │   │   ├── ChatInput.jsx     # Textarea, send/stop buttons
│   │   │   │   └── SettingsModal.jsx # Base URL & model configuration
│   │   │   ├── services/api.js       # SSE stream reader and API client
│   │   │   ├── App.jsx               # Application controller
│   │   │   └── index.css             # Dark-mode theme & animations
│   │   ├── package.json
│   │   ├── vite.config.js
│   │   └── run.sh                # Frontend dev server script
│   └── run.sh                    # Unified 1-click startup script
```

---

## 🚀 Quickstart

### 1. Launch Local vLLM Server (Reference from `streamlit.py`)
In a separate terminal, launch your vLLM server:
```bash
vllm serve Qwen/Qwen3-0.6B --port 8000
```

### 2. Start KittuBot (Unified Mode)
Run the root launcher script:
```bash
cd /home/Project/kittubot
./run.sh
```
Open **`http://localhost:8001`** in your browser!

---

### Alternative: Start in Development Mode (with Hot-Reload)

**Terminal 1 (Backend):**
```bash
cd /home/Project/kittubot/backend
./run.sh
# Running on http://localhost:8001
```

**Terminal 2 (Frontend):**
```bash
cd /home/Project/kittubot/frontend
./run.sh
# Running on http://localhost:5173
```

---

## 📡 API Reference

- `POST /api/chat`: Supports Server-Sent Events (SSE) streaming (`stream: true`) or non-streaming responses.
- `GET /api/health`: Returns health status and checks connectivity to `vllm_base_url`.
- `GET /api/models`: Queries available models on the vLLM server.
- `GET /api/sessions`: Lists existing chat sessions.
- `POST /api/sessions`: Creates a new chat session.
- `GET /api/sessions/{id}`: Retrieves messages for a specific session.
- `DELETE /api/sessions/{id}`: Deletes a session.
- `POST /api/sessions/{id}/messages`: Appends a user/assistant message to a session.
- `GET /docs`: Interactive Swagger API documentation.

