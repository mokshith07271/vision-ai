
import { useEffect, useRef, useState } from "react";
import "./App.css";

const API =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const busyRef = useRef(false);

  const [running, setRunning] = useState(false);
  const [aiOn, setAiOn] = useState(true);
  const [fps, setFps] = useState(3);
  const [objects, setObjects] = useState([]);
  const [currentCount, setCurrentCount] = useState(0);
  const [uniqueTracks, setUniqueTracks] = useState(0);
  const [status, setStatus] = useState("Camera stopped");
  const [error, setError] = useState("");

  // Start the webcam.
  async function startCamera() {
    try {
      setError("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();

      setRunning(true);
      setStatus("Camera running");
    } catch (err) {
      setError(
        "Cannot access camera. Check browser permissions and try again."
      );
      setStatus("Camera unavailable");
    }
  }

  // Clear the detection overlay.
  function clearCanvas() {
    const canvas = canvasRef.current;

    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  // Stop the webcam.
  function stopCamera() {
    const video = videoRef.current;

    if (video?.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }

    setRunning(false);
    setObjects([]);
    setCurrentCount(0);
    setUniqueTracks(0);
    setStatus("Camera stopped");
    clearCanvas();
  }

  // Send one camera frame to the YOLO backend.
  async function detectFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (
      !video ||
      !canvas ||
      video.readyState < 2 ||
      busyRef.current
    ) {
      return;
    }

    busyRef.current = true;

    try {
      // Capture the current video frame.
      const frameCanvas = document.createElement("canvas");
      frameCanvas.width = video.videoWidth;
      frameCanvas.height = video.videoHeight;

      const frameContext = frameCanvas.getContext("2d");
      frameContext.drawImage(video, 0, 0);

      const blob = await new Promise((resolve) => {
        frameCanvas.toBlob(resolve, "image/jpeg", 0.75);
      });

      if (!blob) {
        throw new Error("Could not capture a camera frame.");
      }

      const formData = new FormData();
      formData.append("file", blob, "frame.jpg");

      const response = await fetch(`${API}/detect`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(`Backend error ${response.status}: ${message}`);
      }

      const data = await response.json();

      setObjects(data.objects ?? []);
      setCurrentCount(data.current_count ?? 0);
      setUniqueTracks(data.unique_tracks ?? 0);
      setStatus("AI detection active");
      setError("");

      // Draw the boxes using the original frame dimensions.
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // CSS controls the displayed size; these dimensions control
      // the drawing coordinate system.
      canvas.style.width = "100%";
      canvas.style.height = "100%";

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const obj of data.objects ?? []) {
        const [x1, y1, x2, y2] = obj.box;

        const trackText =
          obj.id == null ? "" : ` ID:${obj.id}`;

        const label =
          `${obj.label}${trackText} ${Math.round(obj.confidence * 100)}%`;

        ctx.font = "16px Arial";

        const labelWidth = ctx.measureText(label).width + 12;
        const labelHeight = 25;
        const labelY = Math.max(0, y1 - labelHeight);

        // Bounding box.
        ctx.strokeStyle = "#39ef83";
        ctx.lineWidth = 3;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

        // Label background.
        ctx.fillStyle = "#39ef83";
        ctx.fillRect(x1, labelY, labelWidth, labelHeight);

        // Label text.
        ctx.fillStyle = "#06150c";
        ctx.fillText(label, x1 + 6, labelY + 17);
      }
    } catch (err) {
      setError(err.message || "Detection failed.");
      setStatus("Detection error");
    } finally {
      busyRef.current = false;
    }
  }

  // Run the detection loop at the selected processing rate.
  useEffect(() => {
    if (!running || !aiOn) {
      clearCanvas();

      if (running) {
        setStatus("Camera running · AI paused");
      }

      return;
    }

    let cancelled = false;
    let timer;

    async function loop() {
      const startTime = Date.now();

      await detectFrame();

      if (!cancelled) {
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, 1000 / fps - elapsed);

        timer = setTimeout(loop, delay);
      }
    }

    loop();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [running, aiOn, fps]);

  // Stop the webcam if this component is removed.
  useEffect(() => {
    return () => {
      const stream = videoRef.current?.srcObject;

      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // Reset the backend tracker and the displayed counters.
  async function resetTracking() {
    try {
      const response = await fetch(`${API}/reset`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Could not reset the tracking session.");
      }

      setObjects([]);
      setCurrentCount(0);
      setUniqueTracks(0);
      setError("");
      setStatus("Tracking reset");
      clearCanvas();
    } catch (err) {
      setError(err.message || "Could not reset tracking.");
    }
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">COMPUTER VISION PROJECT</p>
          <h1>VisionAI</h1>
          <p className="subtitle">
            Live object detection and tracking
          </p>
        </div>

        <span className={running ? "status live" : "status"}>
          <span className="dot" />
          {status}
        </span>
      </header>

      <section className="layout">
        {/* Camera and detection overlay */}
        <div className="camera-card">
          <div className="card-heading">
            <h2>Live Camera</h2>
            <span>YOLO + ByteTrack</span>
          </div>

          <div className="camera-view">
            <video
              ref={videoRef}
              className="camera-video"
              autoPlay
              muted
              playsInline
            />

            <canvas
              ref={canvasRef}
              className="overlay"
            />

            {!running && (
              <div className="placeholder">
                <span className="camera-icon">◉</span>
                <h3>Camera is not running</h3>
                <p>Start your camera to detect objects.</p>
              </div>
            )}
          </div>

          {error && <p className="error">{error}</p>}

          <div className="camera-actions">
            {!running ? (
              <button
                className="primary"
                onClick={startCamera}
              >
                Start Camera
              </button>
            ) : (
              <button
                className="danger"
                onClick={stopCamera}
              >
                Stop Camera
              </button>
            )}

            <button
              className="secondary"
              disabled={!running}
              onClick={() => setAiOn((value) => !value)}
            >
              AI: {aiOn ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Settings and analytics */}
        <aside className="sidebar">
          <div className="card settings">
            <h2>Detection Settings</h2>

            <label className="setting-label">
              <span>Processing rate</span>
              <strong>{fps} FPS</strong>
            </label>

            <input
              type="range"
              min="1"
              max="10"
              value={fps}
              onChange={(event) =>
                setFps(Number(event.target.value))
              }
            />

            <p className="hint">
              This sets the target request rate. Actual speed depends
              on model inference time and your hardware.
            </p>
          </div>

          <div className="card tracking-stats">
            <h2>Tracking Analytics</h2>

            <div className="stat-row">
              <span>Visible objects</span>
              <strong>{currentCount}</strong>
            </div>

            <div className="stat-row">
              <span>Unique tracked IDs</span>
              <strong>{uniqueTracks}</strong>
            </div>

            <button
              className="secondary full-width"
              onClick={resetTracking}
            >
              Reset Tracking
            </button>
          </div>

          <div className="card object-list">
            <h2>Detected Objects</h2>

            {objects.length === 0 ? (
              <p className="hint">
                No objects detected yet.
              </p>
            ) : (
              objects.map((obj, index) => (
                <div
                  className="object-row"
                  key={`${obj.id ?? obj.label}-${index}`}
                >
                  <div>
                    <strong>{obj.label}</strong>

                    <span className="object-id">
                      {obj.id == null
                        ? "Tracking ID unavailable"
                        : `Track #${obj.id}`}
                    </span>
                  </div>

                  <span className="confidence">
                    {Math.round(obj.confidence * 100)}%
                  </span>
                </div>
              ))
            )}
          </div>
        </aside>
      </section>

      <footer>
        VisionAI · React · FastAPI · Ultralytics YOLO
      </footer>
    </main>
  );
}
