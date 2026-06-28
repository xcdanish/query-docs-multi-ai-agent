from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.db.database import AsyncSessionLocal
from app.models.chat import Chat
from app.ai.llms.provider_factory import get_llm
from app.ai.graph.state import AgentState
from app.ai.rag.retrieval import retrieve_context
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

async def knowledge_node(state: AgentState) -> dict:
    """
    Node that processes document queries using qwen3:8b and custom RAG context.
    """
    llm = get_llm("knowledge")
    messages = state.get("messages", [])
    chat_id = state.get("chat_id")
    user_id = state.get("user_id")
    
    # Retrieve query text (last human message)
    query_text = ""
    for msg in reversed(messages):
        # LangChain BaseMessage classes have msg.type (like 'human')
        if getattr(msg, "type", "") == "human":
            query_text = msg.content
            break
            
    # Load chat assets and original names map
    asset_ids = []
    asset_name_map = {}
    if chat_id:
        async with AsyncSessionLocal() as session:
            chat_query = select(Chat).options(selectinload(Chat.assets)).where(Chat.id == chat_id)
            chat_res = await session.execute(chat_query)
            chat_obj = chat_res.scalar_one_or_none()
            if chat_obj:
                asset_ids = [asset.id for asset in chat_obj.assets]
                import os
                for asset in chat_obj.assets:
                    asset_name_map[str(asset.id)] = asset.file_name
                    if asset.file_path:
                        uuid_name = os.path.basename(asset.file_path)
                        asset_name_map[uuid_name] = asset.file_name
                
    # Perform retrieval
    context_chunks = []
    if query_text and user_id:
        context_chunks = retrieve_context(query_text, user_id, asset_ids=asset_ids)
        
    context_str = ""
    if context_chunks:
        context_str = "\n".join([f"- Page {c['page']} from {c['source']}: {c['text']}" for c in context_chunks])
        
    system_prompt_content = "You are the Knowledge Agent. Answer questions about documents and knowledge bases concisely.\n"
    if context_str:
        system_prompt_content += f"\nRelevant context info from documents:\n{context_str}\n\nBased ONLY on the context information above, answer the user's question. If the answer is not in the context, politely state that the information is not in the uploaded documents."
    else:
        system_prompt_content += "\nNote: No documents are linked or no matching information was found in the linked documents, so answer to the best of your ability and remind the user to upload/link documents."
        
    system_prompt = SystemMessage(content=system_prompt_content)
    input_messages = [system_prompt] + messages
    
    response = await llm.ainvoke(input_messages)
    content = response.content
    if context_chunks:
        sources_text = "\n\n**Sources:**\n"
        unique_sources = {}
        for c in context_chunks:
            source_display = asset_name_map.get(c["source"], c["source"])
            key = (source_display, c["page"])
            unique_sources[key] = True
        for source_file, page in unique_sources.keys():
            sources_text += f"- Page {page} of `{source_file}`\n"
        content += sources_text

    return {
        "messages": [AIMessage(content=content, name="knowledge")]
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

