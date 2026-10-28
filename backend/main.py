
from threading import Lock

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

app = FastAPI(title="VisionAI")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mokshith07271.github.io",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


MODEL_NAME = "yolo26n.pt"
model = YOLO(MODEL_NAME)

# Protect the shared model and tracker state.
model_lock = Lock()

# IDs encountered during this tracking session.
seen_track_ids = set()


@app.get("/")
def home():
    return {"message": "VisionAI tracking API is running!"}


@app.post("/detect")
def detect(file: UploadFile = File(...)):
    if file.content_type not in (
        "image/jpeg", "image/png", "image/webp"
    ):
        raise HTTPException(
            status_code=400,
            detail="Upload a JPEG, PNG, or WebP image.",
        )

    raw = file.file.read()

    if not raw or len(raw) > 5_000_000:
        raise HTTPException(
            status_code=400,
            detail="Image is empty or larger than 5 MB.",
        )

    image = cv2.imdecode(
        np.frombuffer(raw, dtype=np.uint8),
        cv2.IMREAD_COLOR,
    )

    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image.")

    try:
        with model_lock:
            result = model.track(
                image,
                persist=True,
                tracker="bytetrack.yaml",
                conf=0.35,
                verbose=False,
            )[0]

            objects = []
            boxes = result.boxes
            height, width = image.shape[:2]

            if boxes is not None:
                coordinates = boxes.xyxy.cpu().numpy()
                classes = boxes.cls.int().cpu().tolist()
                confidences = boxes.conf.cpu().tolist()

                if boxes.id is not None:
                    track_ids = boxes.id.int().cpu().tolist()
                else:
                    track_ids = [None] * len(classes)

                for box, class_id, confidence, track_id in zip(
                    coordinates, classes, confidences, track_ids
                ):
                    x1, y1, x2, y2 = map(int, box)

                    if track_id is not None:
                        seen_track_ids.add(int(track_id))

                    objects.append({
                        "id": (
                            int(track_id)
                            if track_id is not None
                            else None
                        ),
                        "label": model.names[class_id],
                        "confidence": round(float(confidence), 3),
                        "box": [
                            max(0, x1),
                            max(0, y1),
                            min(width, x2),
                            min(height, y2),
                        ],
                    })

            return {
                "objects": objects,
                "current_count": len(objects),
                "unique_tracks": len(seen_track_ids),
            }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Detection failed: {exc}",
        )


@app.post("/reset")
def reset_tracking():
    global model

    with model_lock:
        # Reloading creates a fresh tracker for this single camera.
        model = YOLO(MODEL_NAME)
        seen_track_ids.clear()

    return {"message": "Tracking session reset"}
