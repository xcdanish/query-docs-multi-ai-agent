from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.db.database import AsyncSessionLocal
from app.models.chat import Chat
from app.ai.llms.provider_factory import get_llm
from app.ai.graph.state import AgentState
from app.ai.rag.retrieval import retrieve_context
from langchain_core.messages import AIMessage, SystemMessage

# Import centralized prompts
from app.ai.prompts.engineering import SYSTEM_PROMPT as ENGINEERING_SYSTEM_PROMPT
from app.ai.prompts.research import SYSTEM_PROMPT as RESEARCH_SYSTEM_PROMPT
from app.ai.prompts.vision import SYSTEM_PROMPT as VISION_SYSTEM_PROMPT
from app.ai.prompts.knowledge import get_knowledge_prompt

def sanitize_messages(messages, allow_images=False):
    """
    Removes unsupported block types (like 'file') from message content.
    If allow_images is False, flattens all content into a single string.
    """
    sanitized = []
    for msg in messages:
        if isinstance(msg.content, list):
            new_content = []
            text_parts = []
            for block in msg.content:
                if isinstance(block, dict):
                    if block.get("type") == "text":
                        if allow_images:
                            new_content.append(block)
                        else:
                            text_parts.append(block.get("text", ""))
                    elif block.get("type") == "image_url" and allow_images:
                        new_content.append(block)
                elif isinstance(block, str):
                    if allow_images:
                        new_content.append(block)
                    else:
                        text_parts.append(block)
            
            final_content = new_content if allow_images else "\n".join(text_parts)
            if not final_content and not allow_images:
                final_content = " "
                
            try:
                new_msg = msg.model_copy(update={"content": final_content})
            except AttributeError:
                new_msg = msg.copy(update={"content": final_content})
            sanitized.append(new_msg)
        else:
            sanitized.append(msg)
    return sanitized

def engineering_node(state: AgentState) -> dict:
    """
    Node that processes programming/coding queries using qwen2.5-coder:1.5b.
    """
    llm = get_llm("engineering")
    messages = state.get("messages", [])
    
    system_prompt = SystemMessage(content=ENGINEERING_SYSTEM_PROMPT)
    input_messages = [system_prompt] + sanitize_messages(messages, allow_images=False)
    
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
    sanitized_msgs = sanitize_messages(messages, allow_images=False)
    for msg in reversed(sanitized_msgs):
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
        
    system_prompt_content = get_knowledge_prompt(context_str)
        
    system_prompt = SystemMessage(content=system_prompt_content)
    input_messages = [system_prompt] + sanitized_msgs
    
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
    
    system_prompt = SystemMessage(content=RESEARCH_SYSTEM_PROMPT)
    input_messages = [system_prompt] + sanitize_messages(messages, allow_images=False)
    
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
    
    system_prompt = SystemMessage(content=VISION_SYSTEM_PROMPT)
    input_messages = [system_prompt] + sanitize_messages(messages, allow_images=True)
    
    response = llm.invoke(input_messages)
    return {
        "messages": [AIMessage(content=response.content, name="vision")]
    }


