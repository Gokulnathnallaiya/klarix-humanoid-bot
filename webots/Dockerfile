# Webots Simulation Dockerfile
# For Linux: Run with X11 forwarding or VNC

FROM cyberbotics/webots:R2023b-ubuntu22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    python3-pip \
    xvfb \
    x11vnc \
    novnc \
    websockify \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages for the NAO controller
RUN pip3 install --no-cache-dir \
    pillow \
    numpy \
    opencv-python-headless

# Set working directory
WORKDIR /webots-project

# Copy the webots project files
COPY worlds/ ./worlds/
COPY controllers/ ./controllers/

# Remove runtime.ini if exists (uses system Python in container)
RUN rm -f ./controllers/nao_office_assistant/runtime.ini

# Copy startup script
COPY start-webots.sh /start-webots.sh
RUN chmod +x /start-webots.sh

# Expose ports
EXPOSE 1234
EXPOSE 5900
EXPOSE 6080

# Environment variables
ENV WEBOTS_HOME=/usr/local/webots
ENV PATH="${WEBOTS_HOME}:${PATH}"
ENV DISPLAY=:99
ENV BACKEND_HOST=backend

# Start with the script
CMD ["/start-webots.sh"]
