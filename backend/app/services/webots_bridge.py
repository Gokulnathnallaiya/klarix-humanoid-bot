"""WebSocket bridge for communicating with Webots controller"""
import asyncio
import json
import base64
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)


class WebotsBridge:
    """Handles TCP socket communication with Webots controller"""

    def __init__(self, host: str = "localhost", port: int = 10020):
        self.host = host
        self.port = port
        self.server: Optional[asyncio.Server] = None
        self.client_writer: Optional[asyncio.StreamWriter] = None
        self.client_reader: Optional[asyncio.StreamReader] = None
        self.connected = False
        self.command_queue: Optional[asyncio.Queue] = None
        self.status_callbacks = []
        self._sender_task: Optional[asyncio.Task] = None

    async def start_server(self):
        """Start TCP server to accept Webots controller connection"""
        try:
            # Create the command queue in the running event loop
            self.command_queue = asyncio.Queue()

            # Use 0.0.0.0 to bind to IPv4 only (avoids IPv6 issues on macOS)
            self.server = await asyncio.start_server(
                self._handle_client,
                "0.0.0.0",  # IPv4 only
                self.port,
                reuse_address=True,
                reuse_port=True  # Allow port reuse on macOS
            )
            addr = self.server.sockets[0].getsockname()
            logger.info(f"Webots bridge server started on {addr}")
            print(f"✓ Webots bridge listening on {self.host}:{self.port}")
        except Exception as e:
            logger.error(f"Failed to start Webots bridge server: {e}")
            print(f"✗ Failed to start Webots bridge: {e}")

    async def _handle_client(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        """Handle incoming connection from Webots controller"""
        addr = writer.get_extra_info('peername')
        logger.info(f"Webots controller connected from {addr}")
        print(f"✓ Webots controller connected from {addr}")

        # Close existing connection if any
        if self.client_writer:
            try:
                self.client_writer.close()
                await self.client_writer.wait_closed()
            except:
                pass

        self.client_reader = reader
        self.client_writer = writer
        self.connected = True

        # Send welcome message to keep connection alive
        try:
            welcome = json.dumps({"type": "connected", "message": "Backend ready"}) + "\n"
            writer.write(welcome.encode())
            await writer.drain()
        except Exception as e:
            logger.error(f"Failed to send welcome message: {e}")

        # Start command sender task
        if self._sender_task:
            self._sender_task.cancel()
        self._sender_task = asyncio.create_task(self._send_commands())

        # Start keepalive task
        keepalive_task = asyncio.create_task(self._keepalive_loop())

        try:
            # Receive status updates from Webots
            while True:
                try:
                    data = await asyncio.wait_for(reader.readline(), timeout=30.0)
                    if not data:
                        logger.info("Webots controller closed connection")
                        break

                    try:
                        message = data.decode().strip()
                        if message:
                            status = json.loads(message)
                            await self._handle_status_update(status)
                    except json.JSONDecodeError as e:
                        logger.warning(f"Invalid JSON from Webots: {e}")
                    except Exception as e:
                        logger.error(f"Error processing Webots message: {e}")
                        
                except asyncio.TimeoutError:
                    # Check if connection is still alive
                    if writer.is_closing():
                        break
                    continue

        except asyncio.CancelledError:
            logger.info("Client handler cancelled")
        except Exception as e:
            logger.error(f"Error in Webots connection: {e}")
        finally:
            self.connected = False
            keepalive_task.cancel()
            if self._sender_task:
                self._sender_task.cancel()
            try:
                writer.close()
                await writer.wait_closed()
            except:
                pass
            self.client_writer = None
            self.client_reader = None
            logger.info("Webots controller disconnected")
            print("✗ Webots controller disconnected")

    async def _keepalive_loop(self):
        """Send periodic keepalive messages to Webots"""
        while self.connected:
            try:
                await asyncio.sleep(5)  # Send keepalive every 5 seconds
                if self.client_writer and not self.client_writer.is_closing():
                    keepalive = json.dumps({"type": "keepalive"}) + "\n"
                    self.client_writer.write(keepalive.encode())
                    await self.client_writer.drain()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.warning(f"Keepalive failed: {e}")
                break

    async def _send_commands(self):
        """Send commands from queue to Webots controller"""
        while self.connected:
            try:
                if not self.command_queue:
                    await asyncio.sleep(0.1)
                    continue

                # Wait for command with timeout
                try:
                    command = await asyncio.wait_for(self.command_queue.get(), timeout=1.0)
                except asyncio.TimeoutError:
                    continue
                    
                if self.client_writer and not self.client_writer.is_closing():
                    message = json.dumps(command) + "\n"
                    self.client_writer.write(message.encode())
                    await self.client_writer.drain()
                    logger.debug(f"Sent command to Webots: {command}")
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error sending command to Webots: {e}")
                await asyncio.sleep(0.1)

    async def _handle_status_update(self, status: Dict):
        """Handle status update from Webots"""
        # Check if this is a camera frame
        if status.get("type") == "camera_frame":
            try:
                # Import here to avoid circular dependency
                from app.services.camera_streamer import camera_streamer

                # Decode base64 frame data
                frame_b64 = status.get("frame", "")
                if frame_b64:
                    frame_data = base64.b64decode(frame_b64)
                    if frame_data and len(frame_data) > 0:
                        await camera_streamer.update_frame(frame_data)
                        # Only log occasionally to reduce spam
                        if camera_streamer.frame_count % 50 == 1:
                            logger.info(f"Camera streaming: {camera_streamer.frame_count} frames, {len(frame_data)} bytes each")
            except Exception as e:
                logger.error(f"Error processing camera frame: {e}")
        else:
            # Regular status update
            logger.debug(f"Received status from Webots")
            for callback in self.status_callbacks:
                try:
                    await callback(status)
                except Exception as e:
                    logger.error(f"Error in status callback: {e}")

    def register_status_callback(self, callback):
        """Register a callback for status updates"""
        self.status_callbacks.append(callback)

    async def send_command(self, command: Dict) -> bool:
        """Queue a command to be sent to Webots"""
        if not self.connected:
            logger.warning("Cannot send command: Webots not connected")
            return False

        if not self.command_queue:
            logger.warning("Cannot send command: Command queue not initialized")
            return False

        await self.command_queue.put(command)
        return True

    async def stop(self):
        """Stop the bridge server"""
        if self.client_writer:
            self.client_writer.close()
            await self.client_writer.wait_closed()

        if self.server:
            self.server.close()
            await self.server.wait_closed()

        logger.info("Webots bridge stopped")


# Global bridge instance
webots_bridge = WebotsBridge()
