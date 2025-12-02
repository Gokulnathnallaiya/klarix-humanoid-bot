"""FastAPI main application"""
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import robot, vision
from app.services.robot_controller import robot_controller
from app.services.webots_bridge import webots_bridge
from app.services.vision_service import vision_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("=" * 60)
    print("Starting NAO Robot Control API...")
    print("=" * 60)

    # Start Webots bridge server
    await webots_bridge.start_server()

    # Connect robot controller to bridge
    robot_controller.set_bridge(webots_bridge)
    await robot_controller.connect()

    # Initialize vision service
    vision_service.initialize()

    print("✓ Backend ready - Waiting for Webots controller connection...")
    print(f"✓ Frontend: http://localhost:3000")
    print(f"✓ API Docs: http://localhost:8000/docs")
    print("=" * 60)

    yield

    # Shutdown
    print("\nShutting down NAO Robot Control API...")
    await robot_controller.disconnect()
    await webots_bridge.stop()
    print("✓ Shutdown complete")


app = FastAPI(
    title="NAO Robot Control API",
    description="REST API and WebSocket interface for controlling NAO humanoid robot in Webots",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(robot.router)
app.include_router(vision.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "NAO Robot Control API",
        "version": "1.0.0",
        "docs": "/docs",
        "websocket": "/api/robot/ws",
        "vision_enabled": vision_service.is_enabled()
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
