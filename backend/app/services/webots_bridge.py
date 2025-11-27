"""WebSocket bridge for communicating with Webots controller"""
import asyncio
import json
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
        self.command_queue = asyncio.Queue()
        self.status_callbacks = []

    async def start_server(self):
        """Start TCP server to accept Webots controller connection"""
        try:
            self.server = await asyncio.start_server(
                self._handle_client,
                self.host,
                self.port
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

        self.client_reader = reader
        self.client_writer = writer
        self.connected = True

        try:
            # Start command sender task
            sender_task = asyncio.create_task(self._send_commands())

            # Receive status updates from Webots
            while True:
                data = await reader.readline()
                if not data:
                    break

                try:
                    message = data.decode().strip()
                    if message:
                        status = json.loads(message)
                        await self._handle_status_update(status)
                except json.JSONDecodeError as e:
                    logger.error(f"Invalid JSON from Webots: {e}")
                except Exception as e:
                    logger.error(f"Error processing Webots message: {e}")

        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Error in Webots connection: {e}")
        finally:
            self.connected = False
            sender_task.cancel()
            writer.close()
            await writer.wait_closed()
            logger.info("Webots controller disconnected")
            print("✗ Webots controller disconnected")

    async def _send_commands(self):
        """Send commands from queue to Webots controller"""
        while True:
            try:
                command = await self.command_queue.get()
                if self.client_writer and not self.client_writer.is_closing():
                    message = json.dumps(command) + "\n"
                    self.client_writer.write(message.encode())
                    await self.client_writer.drain()
                    logger.debug(f"Sent command to Webots: {command}")
            except Exception as e:
                logger.error(f"Error sending command to Webots: {e}")

    async def _handle_status_update(self, status: Dict):
        """Handle status update from Webots"""
        logger.debug(f"Received status from Webots: {status}")
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
