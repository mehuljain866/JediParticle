# JediParticle
A real-time, hand-gesture-controlled 3D particle system built with Three.js and MediaPipe Hands. The project maps natural hand movements to calibrated zoom, knob-like rotation, and inertial flick gestures, with jitter filtering, pauseable control modes, and live visual feedback for a smooth, physical interaction experience.

# ✋ Hand-Controlled Particle Sphere

An interactive, gesture-driven particle system built with **Three.js** and **MediaPipe Hands**.
The project turns your hand into a **physical control interface** for a 3D particle sphere — supporting zoom, rotation, inertial flicks, calibration, and live visual feedback.

This is designed as an **experimental interaction system**, suitable for creative coding, installations, performance visuals, or UI/UX exploration.

---

## ✨ Features

### 🎛️ Core Interaction

* **Hand-controlled zoom**
  Open / close your hand to expand or compress a 3D particle sphere.
* **Dial / knob rotation**
  Rotate your hand like turning a doorknob to rotate the entire sphere.
* **Two-finger flick (inertial spin)**
  Raise index + middle finger and swipe left/right to spin the sphere like a globe.
* **Physics-style inertia**
  Flicks decay smoothly over time for a natural feel.

### ⏸️ Zoom Pause Mode

* Pause zoom with **Spacebar** or UI button.
* While paused:

  * Zoom remains frozen.
  * Rotation and flick gestures still work.
* Intelligent resume:

  * Unpausing does **not snap** the zoom.
  * Zoom resumes **relative to where you left off**, not absolute hand position.
* Visual indicator (⏸) appears when zoom is paused.

### 🎚️ Calibration System

* **Calibrate Closed** → record minimum hand openness.
* **Calibrate Open** → record maximum hand openness.
* All zoom behavior scales **relative to your hand**, camera distance, and posture.

### 🎥 Visual Feedback

* Toggle **live video feed**.
* Toggle **hand skeleton overlay** (MediaPipe landmarks + connections).
* Particle color picker.
* Particle shape selector:

  * Circle
  * Square
  * Star

---

## 🧠 Interaction Model (How It Feels)

This is **not** raw gesture mapping.

The system:

* Filters micro-jitter from natural hand tremor.
* Uses dead-zones to avoid accidental motion.
* Separates **modes** (zoom vs rotate vs flick).
* Preserves spatial continuity across pauses.

The result feels closer to:

> turning a physical object
> rather than
> waving at a camera

---

## 🚀 Getting Started

### 1️⃣ Clone or Download

### 2️⃣ Run a Local Server

Camera access **will not work** via `file://`.

#### Option A: VS Code (recommended)

* Install **Live Server** extension
* Right-click the HTML file → **Open with Live Server**

#### Option B: Python

```bash
python -m http.server 8000
```

Then open:

```
http://localhost:8000
```

---

## 🖐️ Controls & Gestures

### Keyboard / UI

| Action                | Control                             |
| --------------------- | ----------------------------------- |
| Pause / Resume zoom   | `Spacebar` or **Pause Zoom** button |
| Toggle video feed     | UI button                           |
| Toggle hand skeleton  | UI button                           |
| Calibrate closed hand | UI button                           |
| Calibrate open hand   | UI button                           |

### Hand Gestures

| Gesture                     | Effect                   |
| --------------------------- | ------------------------ |
| Open / close hand           | Zoom in / out            |
| Rotate hand (claw grip)     | Rotate sphere            |
| Index + middle finger flick | Inertial spin            |
| Hold position               | Stable (jitter-filtered) |

---

## 🧩 Tech Stack

* **Three.js** — GPU-accelerated 3D rendering
* **MediaPipe Hands** — real-time hand tracking
* **HTML5 Canvas** — overlays & UI
* **Vanilla JavaScript** — no frameworks

No build step. No dependencies to install.

---

## ⚙️ Performance Notes

* Default particle count: **5000**
* If FPS drops, reduce:

```js
const COUNT = 3000;
```

* Best performance on **Chrome / Edge**
* Bright, even lighting improves hand detection

---

## 🧪 Known Limitations

* Single-hand interaction only
* Designed for desktop/laptop webcams
* No mobile touch fallback (yet)

---

## 🛣️ Roadmap Ideas (Optional)

* Two-hand interaction (scale + rotate independently)
* Shader-based particles (glow, depth fog)
* Gesture-based mode switching
* Motion recording & playback
* Audio-reactive coupling

---

## 📄 License

MIT — free to use, modify, and remix.

---

## 🙌 Acknowledgements

* Google **MediaPipe**
* **Three.js** community
* Creative coding & interaction-design inspiration

---
