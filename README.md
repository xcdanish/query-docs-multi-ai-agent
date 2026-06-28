# Query Docs Multi-AI Agent

This project is a multi-agent system designed to answer queries based on uploaded documents.

---

## 🚀 Docker Setup Commands

Start or stop all required infrastructure (PostgreSQL, Ollama, Backend, etc.).

### Start all services

```bash
docker compose up -d
```

### Stop all services

```bash
docker compose down
```

### Check service status

```bash
docker compose ps
```

---

## 🦙 Ollama Model Commands

Since Ollama runs inside a Docker container, run these commands from your host terminal to pull and manage local models.

### List pulled models

```bash
docker exec -it query-docs-ollama ollama list
```

### 🤖 Active Agents & Models

This system utilizes a multi-agent workflow where a routing supervisor coordinates specialized agents. The following local AI models are fully integrated and active:

*   **Supervisor Agent** - _Model: `qwen2.5:3b`_ | **Input:** Text
    ```bash
    docker exec -it query-docs-ollama ollama pull qwen2.5:3b
    ```
*   **Knowledge Agent** - _Model: `qwen2.5:3b`_ | **Input:** Text (RAG Context)
    ```bash
    docker exec -it query-docs-ollama ollama pull qwen2.5:3b
    ```
*   **Research Agent** - _Model: `qwen2.5:3b`_ | **Input:** Text (General Knowledge & Chat)
    ```bash
    docker exec -it query-docs-ollama ollama pull qwen2.5:3b
    ```
*   **Engineering Agent** - _Model: `qwen2.5-coder:1.5b`_ | **Input:** Text (Coding & Debugging)
    ```bash
    docker exec -it query-docs-ollama ollama pull qwen2.5-coder:1.5b
    ```
*   **Vision Agent** - _Model: `minicpm-v:8b`_ | **Input:** Image & Text (Visual Analysis)
    ```bash
    docker exec -it query-docs-ollama ollama pull minicpm-v:8b
    ```
*   **Embeddings** - _Model: `nomic-embed-text`_ | **Input:** Text (Outputs Embeddings)
    ```bash
    docker exec -it query-docs-ollama ollama pull nomic-embed-text
    ```

---

## ⚙️ Environment Variables Configuration

Ensure you create `.env` files in both directories with the correct dummy values:

### 1. Backend (`backend/.env`)

```env
HOST=localhost
PORT=8080

DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=query_docs_db

# JWT Configuration
SECRET_KEY=supersecretkey1234567890123456
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

### 2. Frontend (`frontend/.env`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 🐍 Backend Commands

### Activate Virtual Environment

```bash
source venv/bin/activate
```

### Start Backend Server (Locally)

```bash
python backend/run.py
```

---

## 💻 Frontend Commands

### Start Frontend Server

```bash
cd frontend
npm run dev
```

---

## 🧪 Testing Commands

### Test LLM integration

Checks if the backend can successfully connect to Ollama and obtain responses from configured models:

```bash
python test_llm.py
```
