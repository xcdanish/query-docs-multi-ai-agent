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

Since Ollama runs inside a Docker container, run these commands from your host terminal to manage models.

### List pulled models
```bash
docker exec -it query-docs-ollama ollama list
```

### 1. Active Models (Already Pulled & Used)

* **qwen2.5-coder:1.5b** - *For Engineering Agent*
  ```bash
  docker exec -it query-docs-ollama ollama pull qwen2.5-coder:1.5b
  ```
* **qwen3:8b** - *For Supervisor, Research, and Knowledge Agents*
  ```bash
  docker exec -it query-docs-ollama ollama pull qwen3:8b
  ```
* **nomic-embed-text:latest** - *For RAG & Document Embeddings*
  ```bash
  docker exec -it query-docs-ollama ollama pull nomic-embed-text
  ```

### 2. Future Models (To be used in the future)

* **qwen2.5:1.5b** - *Optional Chat/General Model*
  ```bash
  docker exec -it query-docs-ollama ollama pull qwen2.5:1.5b
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
Checks if the backend can successfully connect to Ollama and obtain a response from the engineering model:
```bash
python test_llm.py
```
