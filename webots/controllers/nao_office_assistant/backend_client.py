"""Backend client for Webots controller - handles TCP socket communication"""
import socket
import json
import threading
import time
import queue


class BackendClient:
    """Handles communication with FastAPI backend"""

    def __init__(self, host="localhost", port=10020):
        self.host = host
        self.port = port
        self.socket = None
        self.connected = False
        self.running = False
        self.command_callback = None
        self.send_queue = queue.Queue(maxsize=10)  # Buffer for outgoing messages
        self.send_lock = threading.Lock()
        self._sender_thread = None
        self._receiver_thread = None

    def connect(self, max_retries=5, retry_delay=2):
        """Connect to backend server"""
        for attempt in range(max_retries):
            try:
                self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)
                self.socket.settimeout(10)  # 10 second timeout for operations
                self.socket.connect((self.host, self.port))
                self.socket.settimeout(None)  # Remove timeout after connection
                self.connected = True
                print(f"✓ Connected to backend at {self.host}:{self.port}")
                return True
            except (ConnectionRefusedError, OSError, socket.timeout) as e:
                if self.socket:
                    try:
                        self.socket.close()
                    except:
                        pass
                    self.socket = None
                if attempt < max_retries - 1:
                    print(f"⚠ Backend not ready, retrying in {retry_delay}s... ({attempt + 1}/{max_retries})")
                    time.sleep(retry_delay)
                else:
                    print(f"✗ Failed to connect to backend after {max_retries} attempts")
                    print(f"  Make sure backend is running: cd backend && python -m app.main")
                    return False
        return False

    def start_listening(self, command_callback):
        """Start listening for commands from backend"""
        self.command_callback = command_callback
        self.running = True

        # Start receiver thread
        self._receiver_thread = threading.Thread(target=self._receive_commands, daemon=True)
        self._receiver_thread.start()
        
        # Start sender thread
        self._sender_thread = threading.Thread(target=self._send_loop, daemon=True)
        self._sender_thread.start()

    def _receive_commands(self):
        """Receive commands from backend (runs in separate thread)"""
        buffer = ""
        last_data_time = time.time()
        CONNECTION_TIMEOUT = 60  # Disconnect only after 60 seconds of no data at all
        
        while self.running and self.connected:
            try:
                self.socket.settimeout(15.0)  # 15 second timeout for recv (longer than keepalive interval)
                data = self.socket.recv(4096).decode('utf-8')
                
                if not data:
                    # Empty read means connection closed by peer
                    print("✗ Connection to backend closed")
                    self.connected = False
                    break
                
                # Got data - reset timeout tracker
                last_data_time = time.time()
                buffer += data
                
                while '\n' in buffer:
                    line, buffer = buffer.split('\n', 1)
                    if line.strip():
                        try:
                            command = json.loads(line)
                            # Handle keepalive silently
                            if command.get("type") == "keepalive":
                                continue
                            # Handle connected message
                            if command.get("type") == "connected":
                                print(f"✓ Backend acknowledged: {command.get('message', 'Ready')}")
                                continue
                            # Process actual commands
                            if self.command_callback:
                                self.command_callback(command)
                        except json.JSONDecodeError as e:
                            print(f"✗ Invalid JSON from backend: {e}")

            except socket.timeout:
                # Timeout is normal - check if we've had no data for too long
                if time.time() - last_data_time > CONNECTION_TIMEOUT:
                    print(f"✗ No data from backend for {CONNECTION_TIMEOUT}s, reconnecting...")
                    self.connected = False
                    break
                # Otherwise just continue waiting
                continue
            except Exception as e:
                if self.running and self.connected:
                    print(f"✗ Error receiving from backend: {e}")
                    self.connected = False
                break

    def _send_loop(self):
        """Send queued messages to backend (runs in separate thread)"""
        while self.running:
            try:
                # Get message from queue with timeout
                message = self.send_queue.get(timeout=0.5)
                if not self.connected or not self.socket:
                    continue
                    
                with self.send_lock:
                    try:
                        self.socket.sendall(message.encode('utf-8'))
                    except Exception as e:
                        print(f"✗ Error sending to backend: {e}")
                        self.connected = False
                        
            except queue.Empty:
                continue
            except Exception as e:
                print(f"✗ Error in send loop: {e}")

    def send_status(self, status):
        """Queue robot status to be sent to backend (non-blocking)"""
        if not self.connected:
            return False

        try:
            message = json.dumps(status) + "\n"
            # Use put_nowait to avoid blocking, drop if queue is full
            try:
                self.send_queue.put_nowait(message)
                return True
            except queue.Full:
                # Queue is full, drop this message (camera frames can be dropped)
                return False
        except Exception as e:
            print(f"✗ Error queuing status: {e}")
            return False

    def send_status_sync(self, status):
        """Send robot status synchronously (blocking)"""
        if not self.connected or not self.socket:
            return False

        try:
            message = json.dumps(status) + "\n"
            with self.send_lock:
                self.socket.sendall(message.encode('utf-8'))
            return True
        except Exception as e:
            print(f"✗ Error sending status to backend: {e}")
            self.connected = False
            return False

    def disconnect(self):
        """Disconnect from backend"""
        self.running = False
        self.connected = False
        if self.socket:
            try:
                self.socket.close()
            except:
                pass
            self.socket = None
        print("✓ Disconnected from backend")

    def is_connected(self):
        """Check if still connected"""
        return self.connected and self.socket is not None
