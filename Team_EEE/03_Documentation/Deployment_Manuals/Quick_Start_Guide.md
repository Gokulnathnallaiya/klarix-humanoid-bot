# Quick Start Guide

## NAO Humanoid Robot - Cloud Remote Management System

**Version:** 1.0.0
**Estimated Setup Time:** 15-20 minutes

---

## Prerequisites

Before starting, ensure you have the following installed:

- **Python 3.8 or higher** ([Download](https://www.python.org/downloads/))
- **Node.js 18 or higher** ([Download](https://nodejs.org/))
- **Webots R2023b** ([Download](https://cyberbotics.com/))
- **Azure OpenAI Access** (Optional, for vision features) ([Apply](https://aka.ms/oai/access))

### System Requirements
- **OS:** Windows 10/11, macOS 12+, or Linux (Ubuntu 20.04+)
- **RAM:** 8GB minimum, 16GB recommended
- **Disk Space:** 2GB free space
- **GPU:** Recommended for Webots rendering

---

## Step 1: Clone the Repository

```bash
git clone [repository-url]
cd klarix-humanoid-bot
```

---

## Step 2: Setup Backend

### 2.1 Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Expected output:
```
Successfully installed fastapi uvicorn websockets pillow openai...
```

### 2.2 Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cp .env.example .env
```

Edit `.env` with your Azure credentials (optional for vision features):
```env
# Azure OpenAI Configuration (Optional)
AZURE_OPENAI_API_KEY=your_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Backend Configuration
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
```

**Note:** Vision features work without Azure config in mock mode for testing.

### 2.3 Verify Installation

```bash
python -m app.main
```

Expected output:
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

Keep this terminal open. Press `Ctrl+C` to stop when needed.

---

## Step 3: Setup Frontend

### 3.1 Install Node Dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

Expected output:
```
added 234 packages in 30s
```

### 3.2 Configure Environment (Optional)

Create `.env.local` in `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### 3.3 Start Development Server

```bash
npm run dev
```

Expected output:
```
  ▲ Next.js 15.0.0
  - Local:        http://localhost:3000
  - Ready in 2.1s
```

Keep this terminal open. Press `Ctrl+C` to stop when needed.

---

## Step 4: Start Webots Simulation

### 4.1 Open Webots

1. Launch Webots application
2. Go to `File` → `Open World`
3. Navigate to: `webots/worlds/nao_office_demo.wbt`
4. Click `Open`

### 4.2 Start Simulation

1. Click the **Play** button (▶️) in Webots toolbar
2. Wait for simulation to initialize (~5 seconds)
3. NAO robot should appear in office environment

**Troubleshooting:**
- If robot falls, click **Reload** button (🔄)
- Check console for errors
- Ensure physics is enabled

---

## Step 5: Access the Dashboard

### 5.1 Open Web Browser

Navigate to: **http://localhost:3000**

### 5.2 Verify Connection

Check the status indicator in top-right corner:
- 🟢 **Green "Connected"** = System ready
- 🔴 **Red "Disconnected"** = Check backend/Webots

### 5.3 Test Basic Controls

1. **View Camera Feed**
   - Camera stream should show robot's view
   - If blank, check Webots is running

2. **Execute Gesture**
   - Click "Wave" button
   - Robot should wave in Webots
   - Status updates in real-time

3. **Try Vision Analysis** (if Azure configured)
   - Scroll to "Vision Analysis" panel
   - Click "Analyze Now"
   - View AI-generated scene description

---

## System Architecture

When all components are running:

```
Terminal 1:  Webots Simulator (Physics + Sensors)
Terminal 2:  Backend Server (http://localhost:8000)
Terminal 3:  Frontend Server (http://localhost:3000)

Browser:     Dashboard (http://localhost:3000)
```

---

## Quick Test Checklist

Run through these tests to verify everything works:

- [ ] Backend starts without errors
- [ ] Frontend loads at http://localhost:3000
- [ ] Webots simulation runs
- [ ] Dashboard shows "Connected" status
- [ ] Camera feed displays robot view
- [ ] "Wave" gesture executes successfully
- [ ] WebSocket telemetry updates in real-time
- [ ] Vision analysis triggers (if enabled)

---

## Common Issues & Solutions

### Issue 1: Backend Won't Start

**Symptom:** `ModuleNotFoundError` or import errors

**Solution:**
```bash
cd backend
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

### Issue 2: Frontend Port Already in Use

**Symptom:** `Error: port 3000 already in use`

**Solution:**
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### Issue 3: Webots Connection Failed

**Symptom:** Dashboard shows "Disconnected"

**Solution:**
1. Verify Webots is running
2. Check backend console for connection errors
3. Restart backend server
4. Check firewall settings (allow port 10020)

### Issue 4: Camera Feed Blank

**Symptom:** No video stream in dashboard

**Solution:**
1. Ensure Webots simulation is running (▶️)
2. Refresh browser page (F5)
3. Check backend console for camera errors
4. Verify robot camera is active in Webots

### Issue 5: Vision Service Not Working

**Symptom:** "Vision service not enabled" error

**Solution:**
1. Check `.env` file has all 4 Azure variables
2. Verify API key is correct (no spaces)
3. Restart backend server
4. Check Azure OpenAI service status

---

## Next Steps

### Basic Usage
1. **Explore Dashboard** - Navigate through different views
2. **Try All Gestures** - Wave, Point, Stand, Sit
3. **Test Walking** - Forward, Backward, Left, Right
4. **Head Movement** - Up, Down, Left, Right, Center

### Advanced Features
1. **Vision Analysis** - Ask questions about scene
2. **Kinematics Panel** - View all 24 joint positions
3. **Sensor Data** - Check IMU, LIDAR, odometry
4. **Analytics** - View system metrics (if available)

### Development
1. **Explore API** - Visit http://localhost:8000/docs
2. **Read Code** - Check backend/frontend source
3. **Customize** - Add new gestures or features
4. **Deploy** - Follow deployment guide for production

---

## API Documentation

Interactive API documentation available at:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## Project Structure

```
klarix-humanoid-bot/
├── backend/               # FastAPI server
│   ├── app/
│   │   ├── main.py       # Entry point
│   │   ├── api/          # REST endpoints
│   │   └── services/     # Business logic
│   └── requirements.txt
├── frontend/              # Next.js app
│   ├── app/              # Pages
│   ├── components/       # React components
│   └── package.json
└── webots/               # Simulation
    ├── controllers/      # Python controllers
    └── worlds/           # Environment files
```

---

## Useful Commands

### Backend
```bash
# Start server
python -m app.main

# Run tests
pytest tests/

# Check logs
tail -f logs/backend.log
```

### Frontend
```bash
# Development mode
npm run dev

# Production build
npm run build
npm run start

# Type checking
npm run type-check

# Linting
npm run lint
```

### Webots
```bash
# Command-line start (Linux/macOS)
webots webots/worlds/nao_office_demo.wbt

# Headless mode
webots --mode=fast webots/worlds/nao_office_demo.wbt
```

---

## Stopping the System

To cleanly shut down all components:

1. **Frontend:** Press `Ctrl+C` in frontend terminal
2. **Backend:** Press `Ctrl+C` in backend terminal
3. **Webots:** Click Stop (■) button, then close application

---

## Getting Help

### Documentation
- **Full Setup Guide:** `03_Documentation/Deployment_Manuals/`
- **API Spec:** `02_Interface_APIs/API_Specifications/`
- **Architecture:** `03_Documentation/Architecture_Design/`

### Troubleshooting
- Check console logs for errors
- Review backend logs: `backend/logs/`
- Visit API docs: http://localhost:8000/docs
- Check Webots console output

### Support
- Check GitHub Issues
- Review README.md
- Contact Team EEE

---

## Quick Reference

### Port Numbers
- **Frontend:** 3000
- **Backend API:** 8000
- **Webots TCP:** 10020

### Default Credentials
- **No authentication required** (development mode)

### Key Files
- **Backend Config:** `backend/.env`
- **Frontend Config:** `frontend/.env.local`
- **World File:** `webots/worlds/nao_office_demo.wbt`

---

**Success!** You should now have a fully functional NAO robot control system running locally.

For production deployment, see: `Complete_Deployment_Guide.md`

---

**Version:** 1.0.0
**Last Updated:** 2025-11-30
**Maintainer:** Team EEE
