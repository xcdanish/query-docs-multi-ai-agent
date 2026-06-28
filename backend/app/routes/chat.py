from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.models.chat import Chat
from app.models.user import User
from app.models.message import Message
from app.schemas.chat import ChatCreate, ChatOut, ChatStreamRequest
from app.auth.dependencies import get_current_user
from app.utils.exceptions import NotFoundException
from fastapi.responses import StreamingResponse
from app.ai.graph.workflow import graph_app
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
import asyncio
import base64
import os
import io
from PIL import Image
import pillow_avif

from app.models.document import Asset
from app.ai.agents.supervisor import supervisor_node
from app.ai.graph.nodes import engineering_node, knowledge_node, research_node, vision_node
from app.ai.llms.provider_factory import get_llm, AGENT_MODEL_MAPPING

router = APIRouter(prefix="/chat", tags=["Chats"])


@router.post("/create", response_model=ChatOut, status_code=status.HTTP_201_CREATED)
async def create_chat(
    chat_in: ChatCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_chat = Chat(
        user_id=current_user.id,
        title=chat_in.title
    )
    db.add(new_chat)
    await db.commit()
    await db.refresh(new_chat)
    return new_chat


@router.get("/get", response_model=List[ChatOut])
async def get_chats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    get_chats_query = (
        select(Chat, func.count(Message.id).label("msg_count"))
        .outerjoin(Message, Chat.id == Message.chat_id)
        .where(Chat.user_id == current_user.id)
        .group_by(Chat.id)
        .order_by(Chat.created_at.desc())
    )
    result = await db.execute(get_chats_query)
    
    chats = []
    for chat, msg_count in result.all():
        chat_dict = chat.__dict__.copy()
        chat_dict["is_empty"] = msg_count == 0
        chats.append(chat_dict)
        
    return chats


@router.get("/get/{chat_id}", response_model=ChatOut)
async def get_chat(
    chat_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    get_chat_query = select(Chat).where(
        (Chat.id == chat_id) & (Chat.user_id == current_user.id))
    result = await db.execute(get_chat_query)
    chat = result.scalars().first()

    if not chat:
        raise NotFoundException("Chat not found")

    return chat


@router.delete("/delete/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(
    chat_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    get_chat_query = select(Chat).where(
        (Chat.id == chat_id) & (Chat.user_id == current_user.id))
    result = await db.execute(get_chat_query)
    chat = result.scalars().first()

    if not chat:
        raise NotFoundException("Chat not found")

    await db.delete(chat)
    await db.commit()
    return None


@router.patch("/update/{chat_id}", response_model=ChatOut)
async def update_chat(
    chat_id: UUID,
    chat_in: ChatCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    get_chat_query = select(Chat).where(
        (Chat.id == chat_id) & (Chat.user_id == current_user.id))
    result = await db.execute(get_chat_query)
    chat = result.scalars().first()

    if not chat:
        raise NotFoundException("Chat not found")

    chat.title = chat_in.title
    await db.commit()
    await db.refresh(chat)
    return chat


@router.post("/ask")
async def chat_stream(
    request: ChatStreamRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    True streaming: supervisor decides agent first, then agent streams
    tokens directly from Ollama as they are generated.
    """
    # 1. Verify chat belongs to user
    get_chat_query = select(Chat).where(
        (Chat.id == request.chat_id) & (Chat.user_id == current_user.id)
    )
    result = await db.execute(get_chat_query)
    chat = result.scalars().first()
    if not chat:
        raise NotFoundException("Chat not found or unauthorized")

    # 2. Get last N messages from DB (keep context short for speed)
    query = (
        select(Message)
        .where(Message.chat_id == request.chat_id)
        .order_by(Message.created_at.asc())
    )
    msg_result = await db.execute(query)
    db_messages = msg_result.scalars().all()

    # 3. Convert to LangChain messages
    history_messages = []
    for msg in db_messages:
        if msg.role == "user":
            content_list = []
            if msg.content:
                content_list.append({"type": "text", "text": msg.content})
            
            if msg.metadata_json and "assets" in msg.metadata_json:
                for asset_info in msg.metadata_json["assets"]:
                    asset_id = asset_info.get("id")
                    if asset_id:
                        asset_query = select(Asset).where(Asset.id == asset_id)
                        asset_res = await db.execute(asset_query)
                        asset_obj = asset_res.scalar_one_or_none()
                        if asset_obj and asset_obj.file_path and os.path.exists(asset_obj.file_path):
                            file_ext = asset_obj.file_path.split('.')[-1].lower()
                            if file_ext in ['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif']:
                                try:
                                    with Image.open(asset_obj.file_path) as img:
                                        # Convert to RGB to ensure compatibility (drops alpha channel)
                                        if img.mode != "RGB":
                                            img = img.convert("RGB")
                                        
                                        # Save to bytes as JPEG
                                        img_byte_arr = io.BytesIO()
                                        img.save(img_byte_arr, format='JPEG')
                                        img_bytes = img_byte_arr.getvalue()

                                    encoded_string = base64.b64encode(img_bytes).decode("utf-8")
                                    mime_type = "image/jpeg"
                                    
                                    content_list.append({
                                        "type": "image_url",
                                        "image_url": {"url": f"data:{mime_type};base64,{encoded_string}"}
                                    })
                                except Exception as e:
                                    print(f"Error loading image: {e}")
            
            if len(content_list) == 1 and content_list[0]["type"] == "text":
                history_messages.append(HumanMessage(content=msg.content))
            elif content_list:
                history_messages.append(HumanMessage(content=content_list))
            else:
                history_messages.append(HumanMessage(content=msg.content or ""))
        elif msg.role == "assistant":
            history_messages.append(AIMessage(content=msg.content, name=msg.agent_name))
        elif msg.role == "system":
            history_messages.append(SystemMessage(content=msg.content))

    # 4. Run ONLY supervisor to get routing decision (fast — small model)
    supervisor_state = {"messages": history_messages, "chat_id": request.chat_id, "user_id": current_user.id}
    # Run sync supervisor in thread pool — won't block async event loop
    routing = await asyncio.to_thread(supervisor_node, supervisor_state)
    agent_name = routing.get("next_agent", "research")
    if agent_name not in ("engineering", "knowledge", "research", "vision"):
        agent_name = "research"

    # 5. Get the right model and stream tokens directly
    model_name = AGENT_MODEL_MAPPING.get(agent_name, AGENT_MODEL_MAPPING["research"])
    llm = get_llm(agent_name)

    agent_prompts = {
        "engineering": "You are the Engineering Agent. Answer code, debugging, and programming questions concisely.",
        "knowledge":   "You are the Knowledge Agent. Answer questions about documents and knowledge bases concisely.",
        "research":    "You are the Research Agent. Answer general, research, or comparison questions concisely.",
        "vision":      "You are the Vision Agent. Analyze visual requests, images, and user interfaces carefully.",
    }
    system_prompt = SystemMessage(content=agent_prompts.get(agent_name, agent_prompts["research"]))
    if agent_name != "vision":
        clean_history = []
        for msg in history_messages:
            if isinstance(msg.content, list):
                text_only = " ".join([c["text"] for c in msg.content if c["type"] == "text"])
                clean_history.append(msg.__class__(content=text_only))
            else:
                clean_history.append(msg)
        input_messages = [system_prompt] + clean_history
    else:
        input_messages = [system_prompt] + history_messages

    # 6. Collect full response while streaming to client
    collected_tokens: list[str] = []

    async def token_stream():
        try:
            async for chunk in llm.astream(input_messages):
                token = chunk.content
                if token:
                    collected_tokens.append(token)
                    yield token.encode("utf-8")
        except Exception as e:
            err = f"\n\n[Error: {e}]"
            collected_tokens.append(err)
            yield err.encode("utf-8")

        # Save complete response to DB after streaming finishes
        full_response = "".join(collected_tokens)
        if full_response:
            new_message = Message(
                chat_id=request.chat_id,
                role="assistant",
                content=full_response,
                agent_name=agent_name
            )
            db.add(new_message)
            await db.commit()

    return StreamingResponse(
        token_stream(),
        media_type="text/plain",
        headers={"X-Agent": agent_name}
    )

