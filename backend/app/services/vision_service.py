"""Vision service for Azure OpenAI VLM-based scene understanding"""
import asyncio
import base64
import time
from typing import Optional, Dict, List, Callable
from datetime import datetime
import os

try:
    from openai import AzureOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


class VisionService:
    """Manages Azure OpenAI VLM integration for scene understanding and object recognition"""

    def __init__(self):
        self.api_key = os.getenv("AZURE_OPENAI_API_KEY", "")
        self.endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "")
        self.deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o")
        self.api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")

        self.client = None
        self.enabled = False

        # State
        self.last_analysis = None
        self.last_analysis_time = 0
        self.analysis_interval = 10.0  # Analyze every 10 seconds
        self.last_frame = None
        self.last_frame_time = 0

        # Rate limiting
        self.max_requests_per_minute = 6
        self.request_times: List[float] = []

        # Callbacks
        self.analysis_callbacks: List[Callable] = []

        # Cache
        self.analysis_cache = {}
        self.cache_ttl = 30.0  # Cache for 30 seconds

    def initialize(self):
        """Initialize the vision service"""
        if not OPENAI_AVAILABLE:
            print("⚠ openai package not installed - VLM features disabled")
            print("  Install with: pip install openai")
            return False

        if not self.api_key:
            print("⚠ AZURE_OPENAI_API_KEY not set - VLM features disabled")
            print("  Set API key: export AZURE_OPENAI_API_KEY='your-key-here'")
            return False

        if not self.endpoint:
            print("⚠ AZURE_OPENAI_ENDPOINT not set - VLM features disabled")
            print("  Set endpoint: export AZURE_OPENAI_ENDPOINT='https://your-resource.openai.azure.com/'")
            return False

        try:
            self.client = AzureOpenAI(
                api_key=self.api_key,
                api_version=self.api_version,
                azure_endpoint=self.endpoint
            )
            self.enabled = True
            print(f"✓ Vision Service initialized with Azure OpenAI ({self.deployment_name})")
            return True
        except Exception as e:
            print(f"✗ Failed to initialize Vision Service: {e}")
            return False

    def is_enabled(self) -> bool:
        """Check if vision service is enabled"""
        return self.enabled and self.client is not None

    def _check_rate_limit(self) -> bool:
        """Check if we're within rate limits"""
        now = time.time()
        # Remove requests older than 1 minute
        self.request_times = [t for t in self.request_times if now - t < 60]

        if len(self.request_times) >= self.max_requests_per_minute:
            return False

        return True

    def _record_request(self):
        """Record a new API request"""
        self.request_times.append(time.time())

    async def analyze_scene(
        self,
        frame_base64: str,
        prompt: Optional[str] = None,
        force: bool = False
    ) -> Optional[Dict]:
        """
        Analyze a camera frame using Azure OpenAI GPT-4 Vision

        Args:
            frame_base64: Base64-encoded JPEG image
            prompt: Custom analysis prompt (default: scene understanding)
            force: Force analysis even if cached/rate-limited

        Returns:
            Analysis result dict or None if unavailable
        """
        if not self.is_enabled():
            return {
                "error": "Vision service not enabled",
                "timestamp": datetime.now().isoformat()
            }

        # Check rate limiting
        if not force and not self._check_rate_limit():
            print("⚠ VLM rate limit reached, using cached response")
            return self.last_analysis

        # Default prompt for scene understanding
        if prompt is None:
            prompt = """Analyze this scene from a robot's perspective. Provide:

1. **Objects**: List all visible objects (furniture, items, people, etc.)
2. **Environment**: Describe the setting (indoor/outdoor, room type)
3. **Spatial Layout**: Note positions (left, right, center, near, far)
4. **Safety**: Identify any obstacles or hazards
5. **Actionable Info**: What can the robot interact with?

Be concise but thorough. Format as JSON with keys: objects, environment, layout, safety, actions."""

        try:
            self._record_request()

            # Call Azure OpenAI API with vision (Python 3.8 compatible)
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.client.chat.completions.create(
                    model=self.deployment_name,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": prompt
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{frame_base64}"
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens=1024,
                    temperature=0.7
                )
            )

            # Extract response
            analysis_text = response.choices[0].message.content if response.choices else ""

            result = {
                "success": True,
                "analysis": analysis_text,
                "timestamp": datetime.now().isoformat(),
                "model": self.deployment_name,
                "prompt": prompt
            }

            # Cache result
            self.last_analysis = result
            self.last_analysis_time = time.time()

            # Notify callbacks
            await self._notify_callbacks(result)

            return result

        except Exception as e:
            print(f"✗ Vision analysis failed: {e}")
            return {
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def query_scene(self, frame_base64: str, question: str) -> Optional[Dict]:
        """
        Answer a specific question about the scene

        Args:
            frame_base64: Base64-encoded JPEG image
            question: User's question about the scene

        Returns:
            Answer dict
        """
        if not self.is_enabled():
            return {
                "error": "Vision service not enabled",
                "timestamp": datetime.now().isoformat()
            }

        prompt = f"""You are a robot with vision capabilities. A human operator is asking you a question about what you see.

Question: {question}

Look at the image and answer the question directly and concisely. Be helpful and specific."""

        return await self.analyze_scene(frame_base64, prompt=prompt, force=True)

    async def continuous_analysis(self, get_latest_frame: Callable) -> None:
        """
        Run continuous scene analysis in the background

        Args:
            get_latest_frame: Async function that returns latest frame (base64)
        """
        if not self.is_enabled():
            print("⚠ Vision service not enabled, continuous analysis disabled")
            return

        print("✓ Starting continuous vision analysis (every 10s)")

        while True:
            try:
                # Wait for interval
                await asyncio.sleep(self.analysis_interval)

                # Get latest frame
                frame = await get_latest_frame()
                if not frame:
                    continue

                # Analyze
                result = await self.analyze_scene(frame)
                if result and result.get("success"):
                    print(f"✓ Vision analysis: {result['analysis'][:100]}...")

            except asyncio.CancelledError:
                print("✓ Continuous vision analysis stopped")
                break
            except Exception as e:
                print(f"⚠ Error in continuous analysis: {e}")
                await asyncio.sleep(5)  # Wait before retry

    def register_callback(self, callback: Callable):
        """Register a callback for analysis updates"""
        self.analysis_callbacks.append(callback)

    async def _notify_callbacks(self, result: Dict):
        """Notify all registered callbacks of new analysis"""
        for callback in self.analysis_callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(result)
                else:
                    callback(result)
            except Exception as e:
                print(f"⚠ Error in vision callback: {e}")

    async def get_latest_analysis(self) -> Optional[Dict]:
        """Get the most recent analysis result"""
        if not self.last_analysis:
            return None

        # Check if cached result is still valid
        age = time.time() - self.last_analysis_time
        if age > self.cache_ttl:
            return {
                **self.last_analysis,
                "cached": True,
                "age_seconds": age
            }

        return self.last_analysis


# Global vision service instance
vision_service = VisionService()
