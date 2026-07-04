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


# Mounted under /api: Vercel Services routes the public "/api/*" prefix to this
# service with the prefix intact (see repo-root vercel.json), so every path this
# app serves -- including the docs/openapi routes -- must live under /api too.
app = FastAPI(
    title="findmypredoc API",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)
app.include_router(predocs.router, prefix="/api")
app.include_router(sources.router, prefix="/api")


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}
