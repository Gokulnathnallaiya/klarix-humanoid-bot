"""Vision API endpoints for VLM scene understanding"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..services.vision_service import vision_service
from ..services.camera_streamer import camera_streamer

router = APIRouter()


class VisionQuery(BaseModel):
    """Request model for vision queries"""
    question: str
    use_latest_frame: bool = True


class VisionAnalysisRequest(BaseModel):
    """Request model for manual vision analysis"""
    frame_base64: Optional[str] = None
    prompt: Optional[str] = None


@router.get("/api/vision/status")
async def get_vision_status():
    """Get vision service status"""
    return {
        "enabled": vision_service.is_enabled(),
        "last_analysis": vision_service.last_analysis,
        "last_analysis_time": vision_service.last_analysis_time
    }


@router.get("/api/vision/latest")
async def get_latest_analysis():
    """Get the most recent vision analysis"""
    analysis = await vision_service.get_latest_analysis()
    if not analysis:
        raise HTTPException(status_code=404, detail="No analysis available yet")
    return analysis


@router.post("/api/vision/analyze")
async def analyze_scene(request: VisionAnalysisRequest):
    """
    Perform vision analysis on a frame

    If frame_base64 is not provided, uses the latest camera frame
    """
    if not vision_service.is_enabled():
        raise HTTPException(
            status_code=503,
            detail="Vision service not available. Please configure Azure OpenAI credentials in backend/.env (AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT_NAME)."
        )

    # Get frame to analyze
    frame_base64 = request.frame_base64
    if not frame_base64:
        # Use latest frame from camera streamer
        frame_base64 = camera_streamer.get_latest_frame()
        if not frame_base64:
            raise HTTPException(
                status_code=404,
                detail="No camera frame available. Ensure robot is connected."
            )

    # Perform analysis
    result = await vision_service.analyze_scene(
        frame_base64=frame_base64,
        prompt=request.prompt,
        force=True
    )

    if not result or result.get("error"):
        raise HTTPException(
            status_code=500,
            detail=result.get("error", "Analysis failed") if result else "Analysis failed"
        )

    return result


@router.post("/api/vision/query")
async def query_scene(request: VisionQuery):
    """
    Ask a question about what the robot sees

    Example questions:
    - "What objects do you see?"
    - "Is there a person in front of you?"
    - "What color is the wall?"
    - "How many chairs are visible?"
    """
    if not vision_service.is_enabled():
        raise HTTPException(
            status_code=503,
            detail="Vision service not available. Please configure Azure OpenAI credentials in backend/.env (AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT_NAME)."
        )

    # Get latest frame
    frame_base64 = camera_streamer.get_latest_frame()
    if not frame_base64:
        raise HTTPException(
            status_code=404,
            detail="No camera frame available. Ensure robot is connected."
        )

    # Query the scene
    result = await vision_service.query_scene(
        frame_base64=frame_base64,
        question=request.question
    )

    if not result or result.get("error"):
        raise HTTPException(
            status_code=500,
            detail=result.get("error", "Query failed") if result else "Query failed"
        )

    return result


@router.post("/api/vision/continuous/start")
async def start_continuous_analysis():
    """Start continuous vision analysis (every 10 seconds)"""
    if not vision_service.is_enabled():
        raise HTTPException(
            status_code=503,
            detail="Vision service not available. Please configure Azure OpenAI credentials in backend/.env (AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT_NAME)."
        )

    # TODO: Implement background task management
    return {
        "message": "Continuous analysis feature coming soon",
        "status": "not_implemented"
    }


@router.post("/api/vision/continuous/stop")
async def stop_continuous_analysis():
    """Stop continuous vision analysis"""
    # TODO: Implement background task management
    return {
        "message": "Continuous analysis feature coming soon",
        "status": "not_implemented"
    }
