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

### 1. Active Agents & Models

- **Supervisor Agent** - _Model: qwen2.5:3b_ | **Input:** Text
  ```bash
  docker exec -it query-docs-ollama ollama pull qwen2.5:3b
  ```
- **Knowledge Agent** - _Model: qwen2.5:3b_ | **Input:** Text
  ```bash
  docker exec -it query-docs-ollama ollama pull qwen2.5:3b
  ```
- **Research Agent** - _Model: qwen2.5:3b_ | **Input:** Text
  ```bash
  docker exec -it query-docs-ollama ollama pull qwen2.5:3b
  ```
- **Engineering Agent** - _Model: qwen2.5-coder:1.5b_ | **Input:** Text
  ```bash
  docker exec -it query-docs-ollama ollama pull qwen2.5-coder:1.5b
  ```
- **Embeddings** - _Model: nomic-embed-text_ | **Input:** Text (Outputs Embeddings)
  ```bash
  docker exec -it query-docs-ollama ollama pull nomic-embed-text
  ```

### 2. Future Agents & Models

- **Vision Agent (Future)** - _Model: minicpm-v_ | **Input:** Image & Text
  ```bash
  docker exec -it query-docs-ollama ollama pull minicpm-v:8b
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
