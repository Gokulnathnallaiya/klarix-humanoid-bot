"""FastAPI main application"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import robot
from app.services.robot_controller import robot_controller


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("Starting NAO Robot Control API...")
    await robot_controller.connect()
    yield
    # Shutdown
    print("Shutting down NAO Robot Control API...")
    await robot_controller.disconnect()


app = FastAPI(
    title="NAO Robot Control API",
    description="REST API and WebSocket interface for controlling NAO humanoid robot in Webots",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(robot.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "NAO Robot Control API",
        "version": "1.0.0",
        "docs": "/docs",
        "websocket": "/api/robot/ws"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    status = await robot_controller.get_status()
    return {
        "status": "healthy",
        "robot_connected": status["connected"]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
