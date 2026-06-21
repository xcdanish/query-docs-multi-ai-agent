from langchain_ollama import ChatOllama
from langchain_core.language_models.chat_models import BaseChatModel
import os

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

def get_ollama_model(model_name: str) -> BaseChatModel:
    """
    Returns an instance of ChatOllama for the given model name.
    """
    return ChatOllama(
        model=model_name,
        base_url=OLLAMA_BASE_URL,
        temperature=0.7,
    )
