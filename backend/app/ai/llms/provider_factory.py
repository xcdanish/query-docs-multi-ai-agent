from app.ai.llms.ollama import get_ollama_model
from langchain_core.language_models.chat_models import BaseChatModel

# Model mapping based on the sprint requirements
AGENT_MODEL_MAPPING = {
    "supervisor": "qwen3:8b",
    "knowledge": "qwen3:8b",
    "research": "qwen3:8b",
    "engineering": "qwen2.5-coder:1.5b",
}

def get_llm(agent_name: str) -> BaseChatModel:
    """
    Returns the appropriate LLM instance for the specified agent.
    
    Args:
        agent_name (str): The name of the agent (e.g., 'engineering', 'supervisor')
        
    Returns:
        BaseChatModel: An initialized LangChain chat model.
        
    Raises:
        ValueError: If the agent_name is not configured.
    """
    if agent_name not in AGENT_MODEL_MAPPING:
        raise ValueError(f"Unknown agent: {agent_name}. Available agents: {list(AGENT_MODEL_MAPPING.keys())}")
        
    model_name = AGENT_MODEL_MAPPING[agent_name]
    return get_ollama_model(model_name)
