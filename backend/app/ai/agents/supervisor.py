from app.ai.llms.provider_factory import get_llm
from app.ai.graph.state import AgentState
from langchain_core.messages import SystemMessage

SYSTEM_PROMPT = """You are a routing supervisor. Read the user's last message and output EXACTLY one word.

Rules:
- Output "engineering" for code, programming, debugging, algorithms
- Output "knowledge" for questions about uploaded documents or files
- Output "vision" for questions about images, pictures, UI, or visual analysis
- Output "research" for general questions, comparisons, explanations, greetings, casual chat
- Output "__end__" ONLY if you have no idea what to do

Respond with ONLY the one word. No explanation. No quotes. No punctuation.
"""

def supervisor_node(state: AgentState) -> dict:
    """
    Supervisor Agent node that determines routing for the conversation.
    """
    llm = get_llm("supervisor")
    
    # Only pass the last user message for routing decision (faster)
    messages = state.get("messages", [])
    last_messages = messages[-3:] if len(messages) >= 3 else messages
    
    # Check if the latest message has an image attached
    has_image = False
    if last_messages and isinstance(last_messages[-1].content, list):
        for c in last_messages[-1].content:
            if c.get("type") == "image_url":
                has_image = True
                break
                
    if has_image:
        return {"next_agent": "vision"}
    
    # Strip image payloads so text-only supervisor model doesn't crash
    clean_messages = []
    for msg in last_messages:
        if isinstance(msg.content, list):
            text_only = " ".join([c["text"] for c in msg.content if c["type"] == "text"])
            # Create a new message of the same class with just text
            clean_messages.append(msg.__class__(content=text_only))
        else:
            clean_messages.append(msg)

    input_messages = [SystemMessage(content=SYSTEM_PROMPT)] + clean_messages
    
    # Invoke model
    response = llm.invoke(input_messages)
    content = response.content.strip().lower()
    # Strip punctuation/quotes that model might add
    content = content.strip('"\' .,!?\n')
    
    # Parse routing decision — check startswith for robustness
    if content.startswith("engineering") or "engineering" in content[:30]:
        next_agent = "engineering"
    elif content.startswith("knowledge") or "knowledge" in content[:30]:
        next_agent = "knowledge"
    elif content.startswith("vision") or "vision" in content[:30] or "image" in content[:30]:
        next_agent = "vision"
    elif content.startswith("research") or "research" in content[:30]:
        next_agent = "research"
    else:
        # Default: treat everything else as research (general chat)
        next_agent = "research"
        
    return {
        "next_agent": next_agent
    }
