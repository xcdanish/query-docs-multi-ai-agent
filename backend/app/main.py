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

# Configure CORS - use allow_origin_regex only (not allow_origins=["*"])
# because browsers reject allow_origins=["*"] when credentials are included
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(main_router)

