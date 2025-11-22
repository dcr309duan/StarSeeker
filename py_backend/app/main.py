import asyncio
import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.routing import APIRouter
from prometheus_client import Counter, Gauge
from starlette.responses import JSONResponse
from .routers.api import router as api_router

log = structlog.get_logger()
requests_total = Counter("requests_total", "Total HTTP requests", ["path", "method", "code"])
health_gauge = Gauge("health_status", "Health status 1=up 0=down")

app = FastAPI(title="StarSeeker API", version="0.1.0")
app.add_middleware(GZipMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"]
)

api = APIRouter()
api.include_router(api_router, prefix="")
app.include_router(api, prefix="/api")

@app.middleware("http")
async def metrics_middleware(request, call_next):
    try:
        resp = await call_next(request)
        requests_total.labels(request.url.path, request.method, str(resp.status_code)).inc()
        return resp
    except Exception as e:
        requests_total.labels(request.url.path, request.method, "500").inc()
        log.error("request_failed", error=str(e))
        return JSONResponse(status_code=500, content={"error": "服务器错误", "detail": str(e)})

@app.get("/health")
async def health():
    health_gauge.set(1)
    return {"status": "ok"}

@app.on_event("startup")
async def on_startup():
    log.info("startup")
    await asyncio.sleep(0)

