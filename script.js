/* =======================
   BASIC SETUP
======================= */
const video = document.getElementById("video");
const videoContainer = document.getElementById("videoContainer");
const threeCanvas = document.getElementById("three-canvas");
const handCanvas = document.getElementById("handCanvas");
const handCtx = handCanvas.getContext("2d");

handCanvas.width = innerWidth;
handCanvas.height = innerHeight;

/* =======================
   THREE.JS
======================= */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
camera.position.z = 120;

const renderer = new THREE.WebGLRenderer({ canvas: threeCanvas, antialias: true, alpha: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);

/* =======================
   PARTICLES
======================= */
const COUNT = 5000;
const positions = new Float32Array(COUNT * 3);
const base = [];

for (let i = 0; i < COUNT; i++) {
  const r = 40;
  const t = Math.random() * Math.PI * 2;
  const p = Math.acos(2 * Math.random() - 1);
  const x = r * Math.sin(p) * Math.cos(t);
  const y = r * Math.sin(p) * Math.sin(t);
  const z = r * Math.cos(p);
  positions.set([x, y, z], i * 3);
  base.push(new THREE.Vector3(x, y, z));
}

const geo = new THREE.BufferGeometry();
geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

const mat = new THREE.PointsMaterial({
  size: 1.3,
  transparent: true,
  depthWrite: false,
  color: 0xffffff
});

const points = new THREE.Points(geo, mat);
scene.add(points);

/* =======================
   SPRITES
======================= */
function makeSprite(shape) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "white";
  ctx.translate(32, 32);

  if (shape === "circle") {
    ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill();
  }
  if (shape === "square") {
    ctx.fillRect(-18, -18, 36, 36);
  }
  if (shape === "star") {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * 20,
                 -Math.sin((18 + i * 72) * Math.PI / 180) * 20);
      ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * 8,
                 -Math.sin((54 + i * 72) * Math.PI / 180) * 8);
    }
    ctx.closePath(); ctx.fill();
  }
  return new THREE.CanvasTexture(c);
}
mat.map = makeSprite("circle");

/* =======================
   HAND TRACKING
======================= */
const hands = new Hands({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });
hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });
hands.onResults(onHand);

new Camera(video, {
  onFrame: async () => await hands.send({ image: video }),
  width: 640, height: 480
}).start();

/* =======================
   CALIBRATION + FILTERING
======================= */
let minOpen = null, maxOpen = null;
let rawOpen = 0, smoothOpen = 0;
const SMOOTH = 0.15;
const DEADZONE = 0.02;

/* =======================
   MODES & TOGGLES
======================= */
let zoomPaused = false;
let showVideo = false;
let showSkeleton = false;
let pausedSpread = null; // Store spread when paused
let pausedSmoothOpen = null; // Store hand position when paused

/* =======================
   ROTATION + INERTIA
======================= */
let rotX = 0, rotY = 0;
let velX = 0, velY = 0;
let lastAngle = null;
let lastIndexX = null;

/* =======================
   HAND CALLBACK
======================= */
function onHand(res) {
  // Clear canvas
  handCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);

  if (!res.multiHandLandmarks.length) return;
  const lm = res.multiHandLandmarks[0];

  // Draw skeleton if enabled
  if (showSkeleton) {
    drawHandSkeleton(lm);
  }

  const palm = lm[0];
  const tips = [4, 8, 12, 16, 20];

  rawOpen = tips.reduce((s, i) => s + dist(palm, lm[i]), 0) / tips.length;
  smoothOpen += (rawOpen - smoothOpen) * SMOOTH;

  // --- KNOB ROTATION (only when NOT in flick mode) ---
  const indexUp = lm[8].y < lm[6].y;
  const middleUp = lm[12].y < lm[10].y;
  const isFlicking = zoomPaused && indexUp && middleUp;

  if (!isFlicking) {
    const dx = lm[8].x - palm.x;
    const dy = lm[8].y - palm.y;
    const angle = Math.atan2(dy, dx);

    if (lastAngle !== null) {
      const delta = angle - lastAngle;
      if (Math.abs(delta) > DEADZONE) {
        rotY += delta * 1.2;
        rotX += delta * 0.8;
      }
    }
    lastAngle = angle;
  } else {
    lastAngle = null;
  }

  // --- TWO-FINGER FLICK (INDEX + MIDDLE) ---
  if (isFlicking) {
    if (lastIndexX !== null) {
      const dx = lm[8].x - lastIndexX;
      velY += dx * 8;
    }
    lastIndexX = lm[8].x;
  } else {
    lastIndexX = null;
  }
}

function drawHandSkeleton(landmarks) {
  const w = handCanvas.width;
  const h = handCanvas.height;

  // Draw connections
  const connections = [
    [0,1],[1,2],[2,3],[3,4], // thumb
    [0,5],[5,6],[6,7],[7,8], // index
    [0,9],[9,10],[10,11],[11,12], // middle
    [0,13],[13,14],[14,15],[15,16], // ring
    [0,17],[17,18],[18,19],[19,20], // pinky
    [5,9],[9,13],[13,17] // palm
  ];

  handCtx.strokeStyle = "rgba(0, 255, 255, 0.6)";
  handCtx.lineWidth = 2;

  connections.forEach(([a, b]) => {
    const start = landmarks[a];
    const end = landmarks[b];
    handCtx.beginPath();
    handCtx.moveTo(start.x * w, start.y * h);
    handCtx.lineTo(end.x * w, end.y * h);
    handCtx.stroke();
  });

  // Draw landmarks
  handCtx.fillStyle = "rgba(255, 0, 255, 0.8)";
  landmarks.forEach(lm => {
    handCtx.beginPath();
    handCtx.arc(lm.x * w, lm.y * h, 4, 0, Math.PI * 2);
    handCtx.fill();
  });
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/* =======================
   ANIMATION
======================= */
function animate() {
  requestAnimationFrame(animate);

  // --- ZOOM LOGIC ---
  if (minOpen !== null && maxOpen !== null) {
    let currentSpread;

    if (zoomPaused) {
      // While paused, keep the spread frozen
      currentSpread = pausedSpread;
    } else {
      // Not paused - check if we just unpaused
      if (pausedSmoothOpen !== null) {
        // We just unpaused - check if hand has moved significantly
        const handMovement = Math.abs(smoothOpen - pausedSmoothOpen);
        
        if (handMovement < 0.05) {
          // Hand hasn't moved much, keep paused spread
          currentSpread = pausedSpread;
        } else {
          // Hand moved - resume normal zoom and clear pause memory
          pausedSmoothOpen = null;
          pausedSpread = null;
          
          let t = (smoothOpen - minOpen) / (maxOpen - minOpen);
          t = THREE.MathUtils.clamp(t, 0, 1);
          currentSpread = 0.15 + Math.pow(t, 2.8) * 5;
        }
      } else {
        // Normal zoom operation
        let t = (smoothOpen - minOpen) / (maxOpen - minOpen);
        t = THREE.MathUtils.clamp(t, 0, 1);
        currentSpread = 0.15 + Math.pow(t, 2.8) * 5;
      }
    }

    // Apply the spread
    const pos = geo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3]     = base[i].x * currentSpread;
      pos[i * 3 + 1] = base[i].y * currentSpread;
      pos[i * 3 + 2] = base[i].z * currentSpread;
    }
    geo.attributes.position.needsUpdate = true;
  }

  // --- INERTIA DECAY ---
  velX *= 0.92;
  velY *= 0.92;

  rotX += velX;
  rotY += velY;

  points.rotation.x = rotX;
  points.rotation.y = rotY;

  renderer.render(scene, camera);
}
animate();

/* =======================
   UI + CONTROLS
======================= */
const toggleVideoBtn = document.getElementById("toggleVideo");
const toggleSkeletonBtn = document.getElementById("toggleSkeleton");
const pauseZoomBtn = document.getElementById("pauseZoom");

document.getElementById("calibClosed").onclick = () => {
  minOpen = smoothOpen;
  console.log("Calibrated closed:", minOpen);
};

document.getElementById("calibOpen").onclick = () => {
  maxOpen = smoothOpen;
  console.log("Calibrated open:", maxOpen);
};

document.getElementById("colorPicker").oninput = e =>
  mat.color.set(e.target.value);

document.getElementById("shapePicker").onchange = e => {
  mat.map = makeSprite(e.target.value);
  mat.needsUpdate = true;
};

// Toggle video feed
toggleVideoBtn.onclick = () => {
  showVideo = !showVideo;
  videoContainer.classList.toggle("visible", showVideo);
  toggleVideoBtn.textContent = `Video Feed: ${showVideo ? 'ON' : 'OFF'}`;
  toggleVideoBtn.classList.toggle("active", showVideo);
};

// Toggle hand skeleton
toggleSkeletonBtn.onclick = () => {
  showSkeleton = !showSkeleton;
  toggleSkeletonBtn.textContent = `Hand Skeleton: ${showSkeleton ? 'ON' : 'OFF'}`;
  toggleSkeletonBtn.classList.toggle("active", showSkeleton);
  if (!showSkeleton) {
    handCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);
  }
};

// Pause/resume zoom
function toggleZoomPause() {
  zoomPaused = !zoomPaused;
  
  if (zoomPaused) {
    // Store current state when pausing
    if (minOpen !== null && maxOpen !== null) {
      let t = (smoothOpen - minOpen) / (maxOpen - minOpen);
      t = THREE.MathUtils.clamp(t, 0, 1);
      pausedSpread = 0.15 + Math.pow(t, 2.8) * 5;
      pausedSmoothOpen = smoothOpen;
    }
  }
  
  document.getElementById("pauseIndicator").classList.toggle("visible", zoomPaused);
  pauseZoomBtn.textContent = zoomPaused ? 'Resume Zoom (Space)' : 'Pause Zoom (Space)';
  pauseZoomBtn.classList.toggle("active", zoomPaused);
}

pauseZoomBtn.onclick = toggleZoomPause;

// SPACE → toggle zoom pause
window.addEventListener("keydown", e => {
  if (e.code === "Space") {
    e.preventDefault();
    toggleZoomPause();
  }
});

/* =======================
   RESIZE
======================= */
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  handCanvas.width = innerWidth;
  handCanvas.height = innerHeight;
});