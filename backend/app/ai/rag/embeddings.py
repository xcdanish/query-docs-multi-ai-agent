import os
from langchain_ollama import OllamaEmbeddings

# When running in Docker, OLLAMA_BASE_URL should point to http://ollama:11434
# When running on host machine, it should default to http://localhost:11434
ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

embeddings = OllamaEmbeddings(
    model="nomic-embed-text",
    base_url=ollama_base_url
)
