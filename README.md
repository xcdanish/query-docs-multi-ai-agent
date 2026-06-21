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

### Pull Coder model (1.5B) - *For Engineering Agent*
```bash
docker exec -it query-docs-ollama ollama pull qwen2.5-coder:1.5b
```

### Pull Chat model (1.5B) - *For Supervisor, Research, and Knowledge Agents*
```bash
docker exec -it query-docs-ollama ollama pull qwen2.5:1.5b
```

### Pull Embeddings model - *For RAG & Document Embeddings*
```bash
docker exec -it query-docs-ollama ollama pull nomic-embed-text
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
