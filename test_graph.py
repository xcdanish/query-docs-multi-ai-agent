import sys
import os
import asyncio
from uuid import uuid4

# Add the backend path so app module can be found
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/backend")

from app.ai.graph.workflow import graph_app
from langchain_core.messages import HumanMessage

async def test_routing(user_query: str):
    print("\n" + "="*50)
    print(f"User Query: '{user_query}'")
    print("="*50)
    
    inputs = {
        "messages": [HumanMessage(content=user_query)],
        "chat_id": uuid4(),
        "user_id": uuid4()
    }
    
    print("Running LangGraph workflow...")
    config = {"configurable": {"thread_id": str(inputs["chat_id"])}}
    state = await graph_app.ainvoke(inputs, config=config)
    
    next_agent = state.get("next_agent")
    print(f"Supervisor Decision: routed next to -> \033[94m{next_agent}\033[0m")
    
    final_messages = state.get("messages", [])
    if final_messages:
        last_msg = final_messages[-1]
        print(f"Final Agent (Role: {last_msg.name}):")
        print(f"\033[92m{last_msg.content}\033[0m")
    else:
        print("No final message received.")

async def main():
    # Test case 1: Engineering query
    await test_routing("Write a quick Python function to reverse a string.")
    
    # Test case 2: Research query
    await test_routing("Compare Next.js and Vite.")
    
    # Test case 3: General query (directly answered by supervisor/end)
    await test_routing("Hi! Just wanted to say hello.")

if __name__ == "__main__":
    asyncio.run(main())
