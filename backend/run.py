import uvicorn
import asyncio
from app.config.settings import settings
from app.db.database import engine
from sqlalchemy import text


async def print_startup_banner():
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        db_status = "\033[92mConnected successfully ✅\033[0m"
    except Exception as e:
        db_status = f"\033[91mFailed to connect ❌ ({e})\033[0m"
    finally:
        # Prevent event loop conflict between asyncio.run and uvicorn
        await engine.dispose()

    print("\n" + "~"*60)
    print(
        f"🚀 \033[94mServer URL:\033[0m       \033[92mhttp://{settings.HOST}:{settings.PORT}\033[0m")
    print(
        f"📚 \033[94mAPI Docs (Swagger):\033[0m \033[92mhttp://{settings.HOST}:{settings.PORT}/docs\033[0m")
    print(
        f"🗄️  \033[94mDatabase URI:\033[0m     \033[93m{settings.DATABASE_URL}\033[0m")
    print(f"🔌 \033[94mDatabase Status:\033[0m  {db_status}")
    print("~"*60 + "\n")

if __name__ == "__main__":
    asyncio.run(print_startup_banner())
    uvicorn.run("app.main:app", host=settings.HOST,
                port=settings.PORT, reload=True)
