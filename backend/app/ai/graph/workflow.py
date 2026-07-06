from langgraph.graph import StateGraph, END
from app.ai.graph.state import AgentState
from app.ai.agents.supervisor import supervisor_node
from app.ai.graph.nodes import engineering_node, knowledge_node, research_node, vision_node

def route_next(state: AgentState) -> str:
    """
    Determines the next node to execute based on next_agent.
    Agent nodes respond ONCE and then supervisor ends the loop.
    """
    next_agent = state.get("next_agent")
    if next_agent in ["engineering", "knowledge", "research", "vision"]:
        return next_agent
    # "__end__" or anything else → terminate
    return END

def route_after_agent(state: AgentState) -> str:
    """
    After an agent runs, always end — don't loop back to supervisor.
    This prevents infinite loops.
    """
    return END

# Define workflow graph
workflow = StateGraph(AgentState)

# Add all agent nodes
workflow.add_node("supervisor", supervisor_node)
workflow.add_node("engineering", engineering_node)
workflow.add_node("knowledge", knowledge_node)
workflow.add_node("research", research_node)
workflow.add_node("vision", vision_node)

# Set the entry point
workflow.set_entry_point("supervisor")

# Supervisor routes to one of the agents OR directly to END
workflow.add_conditional_edges(
    "supervisor",
    route_next,
    {
        "engineering": "engineering",
        "knowledge": "knowledge",
        "research": "research",
        "vision": "vision",
        END: END,
    }
)

# After each agent runs ONCE → always END (no loop back)
workflow.add_edge("engineering", END)
workflow.add_edge("knowledge", END)
workflow.add_edge("research", END)
workflow.add_edge("vision", END)

# Compile workflow
graph_app = workflow.compile()
