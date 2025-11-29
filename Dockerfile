FROM cyberbotics/webots.cloud:R2023b-ubuntu22.04

ARG PROJECT_PATH
RUN mkdir -p $PROJECT_PATH
COPY . $PROJECT_PATH

# Install Python dependencies for the controller
RUN pip3 install pillow numpy opencv-python-headless
