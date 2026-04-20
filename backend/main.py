"""
EventFlow FastAPI Main Application
"""
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Search for .env in current dir or backend dir
if os.path.exists(".env"):
    load_dotenv(".env")
elif os.path.exists("backend/.env"):
    load_dotenv("backend/.env")
else:
    load_dotenv()

from database import init_db
from seed import main as seed_db
from fastapi.staticfiles import StaticFiles


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize DB and seed on startup."""
    print("[EventFlow] Starting up...")
    init_db()
    seed_db()
    yield
    print("[EventFlow] Shutting down...")


from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import time

# Custom Middleware for Performance Tracking (Efficiency focus)
class PerformanceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        return response

# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app = FastAPI(
    title="EventFlow API",
    description="AI-native physical event companion platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Efficiency & Security Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(PerformanceMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["*"] # In production, restrict to your domain
)

# CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
from routers import auth, events, simulator, ai, analytics, orders, tickets, media

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(events.router, prefix="/api/events", tags=["Events"])
app.include_router(simulator.router, prefix="/api/simulator", tags=["Simulator"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(tickets.router, prefix="/api/tickets", tags=["Tickets"])
app.include_router(media.router, prefix="/api/media", tags=["Media"])

# Static files for uploads
os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Serve Frontend SPA (if built)
frontend_path = os.path.join("static", "frontend")
if os.path.exists(frontend_path):
    app.mount("/app", StaticFiles(directory=frontend_path, html=True), name="frontend")


@app.get("/")
async def root():
    # If frontend exists, redirect or serve it. Otherwise return API info.
    frontend_index = os.path.join("static", "frontend", "index.html")
    if os.path.exists(frontend_index):
        from fastapi.responses import FileResponse
        return FileResponse(frontend_index)
        
    return {
        "app": "EventFlow",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "message": "Frontend not found in static/frontend. Run 'npm run build' in the frontend folder."
    }


@app.get("/health")
async def health():
    from datetime import datetime, timezone
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}
