from typing import TypedDict, Optional, Annotated
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from uuid import UUID

class AgentState(TypedDict):
    """
    State definition for the LangGraph workflow.
    """
    messages: Annotated[list[BaseMessage], add_messages]
    next_agent: Optional[str]
    chat_id: UUID
    user_id: UUID
