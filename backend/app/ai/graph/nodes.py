from app.ai.llms.provider_factory import get_llm
from app.ai.graph.state import AgentState
from langchain_core.messages import AIMessage, SystemMessage

def engineering_node(state: AgentState) -> dict:
    """
    Node that processes programming/coding queries using qwen2.5-coder:1.5b.
    """
    llm = get_llm("engineering")
    messages = state.get("messages", [])
    
    system_prompt = SystemMessage(content="You are the Engineering Agent. Answer code reviews, debugging, and code writing requests professionally.")
    input_messages = [system_prompt] + messages
    
    response = llm.invoke(input_messages)
    return {
        "messages": [AIMessage(content=response.content, name="engineering")]
    }

def knowledge_node(state: AgentState) -> dict:
    """
    Node that processes document queries using qwen3:8b.
    (RAG pipeline will be integrated in a later sprint).
    """
    llm = get_llm("knowledge")
    messages = state.get("messages", [])
    
    system_prompt = SystemMessage(content="You are the Knowledge Agent. Answer questions about documents. Note: document retrieval integration is currently in progress, so answer to the best of your ability.")
    input_messages = [system_prompt] + messages
    
    response = llm.invoke(input_messages)
    return {
        "messages": [AIMessage(content=response.content, name="knowledge")]
    }

def research_node(state: AgentState) -> dict:
    """
    Node that processes general comparisons/research queries using qwen3:8b.
    """
    llm = get_llm("research")
    messages = state.get("messages", [])
    
    system_prompt = SystemMessage(content="You are the Research Agent. Answer comparison, deep reasoning, or general analysis queries.")
    input_messages = [system_prompt] + messages
    
    response = llm.invoke(input_messages)
    return {
        "messages": [AIMessage(content=response.content, name="research")]
    }

def vision_node(state: AgentState) -> dict:
    """
    Node that processes visual tasks and images using minicpm-v.
    """
    llm = get_llm("vision")
    messages = state.get("messages", [])
    
    system_prompt = SystemMessage(content="You are the Vision Agent. Analyze images, user interfaces, and answer visually-related queries.")
    input_messages = [system_prompt] + messages
    
    response = llm.invoke(input_messages)
    return {
        "messages": [AIMessage(content=response.content, name="vision")]
    }
