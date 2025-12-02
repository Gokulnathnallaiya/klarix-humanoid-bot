"""Camera streaming service - MJPEG stream for robot camera"""
import asyncio
from typing import Optional, List
import logging
import base64
import time

logger = logging.getLogger(__name__)


class CameraStreamer:
    """Handles MJPEG camera streaming from Webots"""

    def __init__(self):
        self.current_frame: Optional[bytes] = None
        self.frame_lock = asyncio.Lock()
        self.subscribers: List[asyncio.Queue] = []
        self.last_frame_time: float = 0
        self.frame_count: int = 0

    async def update_frame(self, frame_data: bytes):
        """Update the current frame"""
        async with self.frame_lock:
            self.current_frame = frame_data
            self.last_frame_time = time.time()
            self.frame_count += 1
            
            # Log every 30 frames (~1 per second at 30fps, or 6 seconds at 5fps)
            if self.frame_count % 30 == 0:
                logger.info(f"Camera: {self.frame_count} frames received, {len(self.subscribers)} subscribers")
            
            # Notify all subscribers
            for queue in self.subscribers:
                try:
                    # Use put_nowait and handle full queue
                    if queue.full():
                        try:
                            queue.get_nowait()  # Remove old frame
                        except asyncio.QueueEmpty:
                            pass
                    queue.put_nowait(frame_data)
                except Exception as e:
                    logger.error(f"Error notifying frame subscriber: {e}")

    async def get_frame(self) -> Optional[bytes]:
        """Get the current frame"""
        async with self.frame_lock:
            return self.current_frame

    async def get_frame_base64(self) -> Optional[str]:
        """Get the current frame as base64 string (async)"""
        frame = await self.get_frame()
        if frame:
            return base64.b64encode(frame).decode('utf-8')
        return None

    def get_latest_frame_base64(self) -> Optional[str]:
        """Get the current frame as base64 string (synchronous)"""
        if self.current_frame:
            return base64.b64encode(self.current_frame).decode('utf-8')
        return None

    def get_latest_frame(self) -> Optional[str]:
        """Alias for get_latest_frame_base64"""
        return self.get_latest_frame_base64()

    def has_recent_frame(self, max_age_seconds: float = 5.0) -> bool:
        """Check if we have a recent frame"""
        if self.current_frame is None:
            return False
        return (time.time() - self.last_frame_time) < max_age_seconds

    async def subscribe(self) -> asyncio.Queue:
        """Subscribe to frame updates"""
        queue = asyncio.Queue(maxsize=3)  # Small buffer to prevent memory issues
        self.subscribers.append(queue)
        logger.info(f"New camera subscriber, total: {len(self.subscribers)}")
        return queue

    async def unsubscribe(self, queue: asyncio.Queue):
        """Unsubscribe from frame updates"""
        if queue in self.subscribers:
            self.subscribers.remove(queue)
            logger.info(f"Camera subscriber removed, total: {len(self.subscribers)}")

    async def generate_mjpeg_stream(self):
        """Generate MJPEG stream for HTTP response"""
        queue = await self.subscribe()
        logger.info("Starting MJPEG stream for new client")

        try:
            # Send initial frame if available
            if self.current_frame:
                yield (
                    b'--frame\r\n'
                    b'Content-Type: image/jpeg\r\n'
                    b'Content-Length: ' + str(len(self.current_frame)).encode() + b'\r\n\r\n' 
                    + self.current_frame + b'\r\n'
                )
                logger.info(f"Sent initial frame ({len(self.current_frame)} bytes)")

            while True:
                try:
                    # Wait for new frame with timeout
                    frame_data = await asyncio.wait_for(queue.get(), timeout=2.0)

                    if frame_data:
                        # MJPEG format: each frame is a JPEG with multipart boundary
                        yield (
                            b'--frame\r\n'
                            b'Content-Type: image/jpeg\r\n'
                            b'Content-Length: ' + str(len(frame_data)).encode() + b'\r\n\r\n' 
                            + frame_data + b'\r\n'
                        )
                except asyncio.TimeoutError:
                    # No new frame, send current frame if available (keep-alive)
                    if self.current_frame:
                        yield (
                            b'--frame\r\n'
                            b'Content-Type: image/jpeg\r\n'
                            b'Content-Length: ' + str(len(self.current_frame)).encode() + b'\r\n\r\n' 
                            + self.current_frame + b'\r\n'
                        )
                        logger.debug("Sent cached frame (timeout)")

        except asyncio.CancelledError:
            logger.info("Camera stream cancelled")
        except GeneratorExit:
            logger.info("Camera stream closed by client")
        except Exception as e:
            logger.error(f"Error in MJPEG stream: {e}")
        finally:
            await self.unsubscribe(queue)


# Global camera streamer instance
camera_streamer = CameraStreamer()
