from app.ai.llms.ollama import get_ollama_model
from langchain_core.language_models.chat_models import BaseChatModel

# Model mapping — sabse fast local model for quick responses
# qwen3:8b = slow (2-5 min), qwen2.5-coder:1.5b = fast (5-15 sec)
AGENT_MODEL_MAPPING = {
    "supervisor":  "qwen2.5:3b",
    "knowledge":   "qwen2.5:3b",
    "research":    "qwen2.5:3b",
    "engineering": "qwen2.5-coder:1.5b",
    "vision":      "minicpm-v:8b",
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
    # For supervisor, we want absolute determinism (temperature = 0.0)
    temperature = 0.0 if agent_name == "supervisor" else 0.7
    return get_ollama_model(model_name, temperature=temperature)
