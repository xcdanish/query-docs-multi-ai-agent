from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.main_routes import main_router

app = FastAPI(title="QDAI v2")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(main_router)
