"""Backend client for Webots controller - handles TCP socket communication"""
import socket
import json
import threading
import time


class BackendClient:
    """Handles communication with FastAPI backend"""

    def __init__(self, host="localhost", port=10020):
        self.host = host
        self.port = port
        self.socket = None
        self.connected = False
        self.running = False
        self.command_callback = None

    def connect(self, max_retries=5, retry_delay=2):
        """Connect to backend server"""
        for attempt in range(max_retries):
            try:
                self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                self.socket.connect((self.host, self.port))
                self.connected = True
                print(f"✓ Connected to backend at {self.host}:{self.port}")
                return True
            except (ConnectionRefusedError, OSError) as e:
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
        receiver_thread = threading.Thread(target=self._receive_commands, daemon=True)
        receiver_thread.start()

    def _receive_commands(self):
        """Receive commands from backend (runs in separate thread)"""
        buffer = ""
        while self.running and self.connected:
            try:
                data = self.socket.recv(1024).decode('utf-8')
                if not data:
                    print("✗ Connection to backend lost")
                    self.connected = False
                    break

                buffer += data
                while '\n' in buffer:
                    line, buffer = buffer.split('\n', 1)
                    if line.strip():
                        try:
                            command = json.loads(line)
                            if self.command_callback:
                                self.command_callback(command)
                        except json.JSONDecodeError as e:
                            print(f"✗ Invalid JSON from backend: {e}")

            except Exception as e:
                if self.running:
                    print(f"✗ Error receiving from backend: {e}")
                    self.connected = False
                break

    def send_status(self, status):
        """Send robot status to backend"""
        if not self.connected or not self.socket:
            return False

        try:
            message = json.dumps(status) + "\n"
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
        print("✓ Disconnected from backend")
