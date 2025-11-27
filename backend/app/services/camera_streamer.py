"""Camera streaming service - MJPEG stream for robot camera"""
import asyncio
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class CameraStreamer:
    """Handles MJPEG camera streaming from Webots"""

    def __init__(self):
        self.current_frame: Optional[bytes] = None
        self.frame_lock = asyncio.Lock()
        self.subscribers = []

    async def update_frame(self, frame_data: bytes):
        """Update the current frame"""
        async with self.frame_lock:
            self.current_frame = frame_data
            # Notify all subscribers
            for queue in self.subscribers:
                try:
                    await queue.put(frame_data)
                except Exception as e:
                    logger.error(f"Error notifying frame subscriber: {e}")

    async def get_frame(self) -> Optional[bytes]:
        """Get the current frame"""
        async with self.frame_lock:
            return self.current_frame

    async def subscribe(self) -> asyncio.Queue:
        """Subscribe to frame updates"""
        queue = asyncio.Queue(maxsize=2)  # Small buffer to prevent memory issues
        self.subscribers.append(queue)
        return queue

    async def unsubscribe(self, queue: asyncio.Queue):
        """Unsubscribe from frame updates"""
        if queue in self.subscribers:
            self.subscribers.remove(queue)

    async def generate_mjpeg_stream(self):
        """Generate MJPEG stream for HTTP response"""
        queue = await self.subscribe()

        try:
            # Send initial frame if available
            if self.current_frame:
                yield (
                    b'--frame\r\n'
                    b'Content-Type: image/jpeg\r\n\r\n' + self.current_frame + b'\r\n'
                )
                logger.info("Sent initial frame to new subscriber")

            while True:
                try:
                    # Wait for new frame with timeout
                    frame_data = await asyncio.wait_for(queue.get(), timeout=5.0)

                    if frame_data:
                        # MJPEG format: each frame is a JPEG with multipart boundary
                        yield (
                            b'--frame\r\n'
                            b'Content-Type: image/jpeg\r\n\r\n' + frame_data + b'\r\n'
                        )
                except asyncio.TimeoutError:
                    # No new frame, send heartbeat or current frame
                    if self.current_frame:
                        yield (
                            b'--frame\r\n'
                            b'Content-Type: image/jpeg\r\n\r\n' + self.current_frame + b'\r\n'
                        )
                    logger.debug("No new frame received, sent current frame")

        except asyncio.CancelledError:
            logger.info("Camera stream subscriber cancelled")
        except Exception as e:
            logger.error(f"Error in MJPEG stream: {e}")
        finally:
            await self.unsubscribe(queue)


# Global camera streamer instance
camera_streamer = CameraStreamer()
