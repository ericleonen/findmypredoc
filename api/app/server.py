from contextlib import asynccontextmanager

from fastapi import FastAPI

from . import db
from .routers import predocs, sources


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.pool.open()
    try:
        yield
    finally:
        db.pool.close()


app = FastAPI(title="findmypredoc API", lifespan=lifespan)
app.include_router(predocs.router)
app.include_router(sources.router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
