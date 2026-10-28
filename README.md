# VisionAI — Real-Time Object Detection and Tracking

VisionAI is a real-time computer vision web application that detects and tracks objects through a live camera feed. Built using React, FastAPI, YOLO, and OpenCV, the application displays bounding boxes, object labels, confidence scores, tracking IDs, and object counts.

## Live Demo

- **Frontend:** https://mokshith07271.github.io/vision-ai/
- **Backend API:** https://vision-ai-ifyr.onrender.com
- **API Documentation:** https://vision-ai-ifyr.onrender.com/docs
- **Source Code:** https://github.com/mokshith07271/vision-ai

> Note: The backend runs on Render's free plan and may take some time to wake up after inactivity. Live detection requires the backend to be available.

## Features

- **Real-Time Object Detection:** Detect objects from a live camera feed.
- **YOLO-Powered Detection:** Uses the Ultralytics YOLO model for object recognition.
- **Object Tracking:** Assigns tracking IDs to detected objects using ByteTrack.
- **Bounding Boxes:** Displays object locations visually on the camera feed.
- **Confidence Scores:** Shows the model's confidence for each detection.
- **Object Counting:** Displays current detections and unique tracked objects.
- **Camera Controls:** Start and stop the camera.
- **Reset Tracking:** Reset tracking information and counters.
- **Web-Based Interface:** Access the application through a browser without installing a desktop application.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite, JavaScript |
| Backend | Python, FastAPI |
| Object Detection | Ultralytics YOLO |
| Object Tracking | ByteTrack |
| Image Processing | OpenCV |
| API Communication | REST API |
| Frontend Hosting | GitHub Pages |
| Backend Hosting | Render |
| Version Control | Git and GitHub |

## Architecture

```text
User's Browser
      |
      v
React + Vite Frontend
(GitHub Pages)
      |
      | HTTP Requests
      v
FastAPI Backend
(Render)
      |
      v
YOLO Object Detection
      |
      v
ByteTrack Object Tracking
      |
      v
Detection Results
      |
      v
Bounding Boxes, IDs and Counts
```

The browser captures camera frames and sends them to the backend. The backend processes each frame, detects objects, updates tracking information, and returns the results for display in the frontend.

## Getting Started Locally

### Prerequisites

Install the following:

- Python 3.10 or a compatible Python version supported by the project's dependencies
- Node.js and npm
- Git
- A modern web browser with camera access

### 1. Clone the repository

```bash
git clone https://github.com/mokshith07271/vision-ai.git
cd vision-ai
```

### 2. Set up the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Start the backend:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at:

http://127.0.0.1:8000

API documentation:

http://127.0.0.1:8000/docs

### 3. Set up the frontend

Open a second terminal from the project root:

```bash
cd frontend
npm install
```

Create a `.env.local` file inside the `frontend` directory with:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed by Vite, usually:

http://localhost:5173

### 4. Enable camera access

Open the application in your browser and grant permission to use your camera. The browser may require a secure HTTPS connection for camera access outside localhost.

## API Overview

The backend exposes endpoints for object detection and tracking.

| Endpoint | Purpose |
|---|---|
| `GET /` | Check the backend's root endpoint, if configured |
| `GET /docs` | Explore the interactive API documentation |
| `POST /detect` | Process an image frame and return detection results |
| `POST /reset` | Reset tracking state and counters, if configured |

Refer to the live API documentation for the exact request formats and available endpoints.

## Deployment

### Frontend — GitHub Pages

The frontend is built with Vite and deployed using GitHub Actions.

Production site:

https://mokshith07271.github.io/vision-ai/

The Vite configuration uses the project base path:

```javascript
base: '/vision-ai/'
```

The production frontend uses this backend URL:

```text
https://vision-ai-ifyr.onrender.com
```

### Backend — Render

The FastAPI backend is hosted on Render.

Typical service configuration:

**Build command**

```bash
pip install -r requirements.txt
```

**Start command**

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Configure CORS to allow the deployed frontend origin:

```text
https://mokshith07271.github.io
```

## Troubleshooting

### Failed to fetch

- Check whether the backend is running.
- Open the API documentation to confirm that the backend responds.
- Verify that the frontend uses the correct `VITE_API_URL`.
- Ensure FastAPI CORS settings allow the GitHub Pages origin.
- Inspect the browser console for network or CORS errors.

### Camera not working

- Grant camera permission in your browser.
- Close other applications that may be using the camera.
- Use HTTPS or localhost.
- Check your browser's camera settings.

### Backend starts slowly

The free hosting service may sleep after periods of inactivity. Wait for the service to wake up and retry the request.

### Memory or model-loading errors

YOLO and PyTorch can require substantial memory. Check the Render logs if the backend fails during startup or model initialization.

## Future Improvements

- Virtual counting lines and directional counting
- Object entry and exit analytics
- Detection history and event logging
- Performance optimization for low-resource hosting
- Improved mobile and responsive interface
- Support for additional detection models

## Project Purpose

VisionAI demonstrates how real-time computer vision can be integrated into a full-stack web application. It combines object detection, multi-object tracking, API development, and cloud deployment in a single project.

## Author

**Mokshith Atluri**

B.Tech — Computer Science and Engineering (Artificial Intelligence and Machine Learning)

GitHub: https://github.com/mokshith07271

---

If you find this project useful, consider starring the repository on GitHub.
