#!/usr/bin/env python3
"""
Test script for wasteClassify.keras model.

Run from the backend/ directory:
    ../venv/bin/python3 test_model.py

What this verifies:
  1. TensorFlow + Keras versions
  2. Model loads successfully
  3. Input / output shapes
  4. Dummy (all-zeros) prediction runs without error
  5. Random noise prediction runs and produces valid probabilities
  6. PIL image round-trip (create → save → load → predict)
"""

from __future__ import annotations

import io
import os
import sys

# ── Suppress TF C++ noise ──────────────────────────────────────────────────
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

print("=" * 60)
print("  EcoVision — wasteClassify.keras Model Test")
print("=" * 60)

# ── 1. Version check ───────────────────────────────────────────────────────
import numpy as np
import tensorflow as tf
from PIL import Image

try:
    import keras
    keras_ver = keras.__version__
except Exception:
    keras_ver = "(bundled in TF)"

print(f"\n[1] Versions")
print(f"    Python     : {sys.version.split()[0]}")
print(f"    TensorFlow : {tf.__version__}")
print(f"    Keras      : {keras_ver}")
print(f"    NumPy      : {np.__version__}")

# ── 2. Apply Keras 3.12 → 3.13 compatibility patch ────────────────────────
print("\n[2] Applying Keras compatibility patch …", end=" ")
try:
    from keras.src.layers.core.dense import Dense as _Dense

    _orig = _Dense.from_config.__func__  # type: ignore[attr-defined]

    @classmethod  # type: ignore[misc]
    def _patched(cls, config: dict):
        safe = {k: v for k, v in config.items() if k != "quantization_config"}
        return _orig(cls, safe)

    _Dense.from_config = _patched  # type: ignore[method-assign]
    print("applied ✅")
except Exception as exc:
    print(f"skipped ({exc})")

# ── 3. Load model ──────────────────────────────────────────────────────────
MODEL_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "app", "models", "ml_model", "wasteClassify.keras",
)
print(f"\n[3] Loading model from:\n    {MODEL_PATH}")

if not os.path.isfile(MODEL_PATH):
    print("\n❌ ERROR: Model file not found!")
    sys.exit(1)

model = tf.keras.models.load_model(MODEL_PATH, compile=False)
print("    ✅ Model loaded successfully!")

# ── 4. Shape info ──────────────────────────────────────────────────────────
H = model.input_shape[1]
W = model.input_shape[2]
C = model.input_shape[3]
N = model.output_shape[-1]

CLASS_LABELS = ["cardboard", "glass", "metal", "paper", "plastic"]

print(f"\n[4] Architecture")
print(f"    Input shape  : {model.input_shape}  (H={H}, W={W}, C={C})")
print(f"    Output shape : {model.output_shape}  ({N} classes)")
print(f"    Class labels : {CLASS_LABELS}")
if N != len(CLASS_LABELS):
    print(f"    ⚠️  WARNING: {N} output neurons but {len(CLASS_LABELS)} labels defined.")

# ── 5. Dummy (zeros) prediction ────────────────────────────────────────────
print(f"\n[5] Dummy prediction (all-zeros input) …")
dummy = np.zeros((1, H, W, C), dtype=np.float32)
pred_dummy = model.predict(dummy, verbose=0)
idx_dummy = int(np.argmax(pred_dummy[0]))
print(f"    Probabilities : {np.round(pred_dummy[0], 4).tolist()}")
print(f"    Predicted     : {CLASS_LABELS[idx_dummy] if idx_dummy < len(CLASS_LABELS) else idx_dummy}")
print(f"    Confidence    : {float(pred_dummy[0][idx_dummy]):.4f}")
assert abs(pred_dummy[0].sum() - 1.0) < 1e-3, "Softmax probabilities must sum to 1!"
print("    ✅ Sum of probabilities ≈ 1.0 (softmax OK)")

# ── 6. Random noise prediction ─────────────────────────────────────────────
print(f"\n[6] Random noise prediction …")
np.random.seed(42)
noise = np.random.randint(0, 256, size=(1, H, W, C), dtype=np.uint8).astype(np.float32)
pred_noise = model.predict(noise, verbose=0)
idx_noise = int(np.argmax(pred_noise[0]))
print(f"    Probabilities : {np.round(pred_noise[0], 4).tolist()}")
print(f"    Predicted     : {CLASS_LABELS[idx_noise] if idx_noise < len(CLASS_LABELS) else idx_noise}")
print(f"    Confidence    : {float(pred_noise[0][idx_noise]):.4f}")
print(f"    ✅ Prediction successful")

# ── 7. PIL round-trip ──────────────────────────────────────────────────────
print(f"\n[7] PIL image round-trip …")
# Create a small synthetic RGB image and resize via PIL (same path as the API)
synthetic_rgb = np.random.randint(0, 256, (100, 100, 3), dtype=np.uint8)
pil_img = Image.fromarray(synthetic_rgb, mode="RGB")

buf = io.BytesIO()
pil_img.save(buf, format="JPEG")
buf.seek(0)

loaded = Image.open(buf).convert("RGB")
loaded = loaded.resize((W, H), Image.BILINEAR)
arr = np.array(loaded, dtype=np.float32)
arr = np.expand_dims(arr, axis=0)

pred_pil = model.predict(arr, verbose=0)
idx_pil = int(np.argmax(pred_pil[0]))
print(f"    Probabilities : {np.round(pred_pil[0], 4).tolist()}")
print(f"    Predicted     : {CLASS_LABELS[idx_pil] if idx_pil < len(CLASS_LABELS) else idx_pil}")
print(f"    Confidence    : {float(pred_pil[0][idx_pil]):.4f}")
print(f"    ✅ PIL round-trip prediction successful")

# ── Summary ────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("  ALL TESTS PASSED ✅")
print("  The model is ready for API integration.")
print("=" * 60 + "\n")