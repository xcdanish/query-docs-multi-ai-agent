from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.main_routes import main_router
from app.ai.vectorstore.qdrant import init_qdrant_collection

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Qdrant Collection
    init_qdrant_collection()
    yield

app = FastAPI(title="QDAI v2", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(main_router)

