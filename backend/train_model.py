"""
Step 2: Train ISL Gesture Model
Run this AFTER collect_data.py to train a neural network on your data.

Requirements: pip install tensorflow scikit-learn numpy
"""

import json
import numpy as np
import os

DATA_FILE = 'isl_dataset.json'

if not os.path.exists(DATA_FILE):
    print("ERROR: isl_dataset.json not found!")
    print("Run collect_data.py first to collect training data.")
    exit(1)

with open(DATA_FILE) as f:
    dataset = json.load(f)

# ── Prepare data ──
X, y = [], []
letters = list('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
label_map = {l: i for i, l in enumerate(letters)}

print("Dataset summary:")
for letter, samples in dataset.items():
    print(f"  {letter}: {len(samples)} samples")
    for sample in samples:
        X.append(sample)
        y.append(label_map[letter])

X = np.array(X, dtype=np.float32)
y = np.array(y, dtype=np.int32)

print(f"\nTotal samples: {len(X)}")
print(f"Feature shape: {X.shape}")

if len(X) < 100:
    print("\nWARNING: Very few samples. Collect at least 100 per letter for good accuracy.")

# ── Normalize landmarks relative to wrist ──
def normalize(X):
    out = []
    for sample in X:
        pts = sample.reshape(21, 3)
        # Subtract wrist position
        wrist = pts[0].copy()
        pts = pts - wrist
        # Scale by hand size
        scale = np.max(np.abs(pts)) + 1e-9
        pts = pts / scale
        out.append(pts.flatten())
    return np.array(out, dtype=np.float32)

X = normalize(X)
print("Landmarks normalized.")

# ── Train/test split ──
from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y if len(X) > 52 else None
)
print(f"Train: {len(X_train)} | Test: {len(X_test)}")

# ── Build model ──
import tensorflow as tf
from tensorflow import keras

model = keras.Sequential([
    keras.layers.Input(shape=(63,)),
    keras.layers.Dense(256, activation='relu'),
    keras.layers.BatchNormalization(),
    keras.layers.Dropout(0.3),
    keras.layers.Dense(128, activation='relu'),
    keras.layers.BatchNormalization(),
    keras.layers.Dropout(0.3),
    keras.layers.Dense(64, activation='relu'),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(26, activation='softmax'),
])

model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()

# ── Train ──
print("\nTraining...")
callbacks = [
    keras.callbacks.EarlyStopping(patience=15, restore_best_weights=True),
    keras.callbacks.ReduceLROnPlateau(patience=7, factor=0.5, verbose=1),
]

history = model.fit(
    X_train, y_train,
    epochs=100,
    batch_size=32,
    validation_data=(X_test, y_test),
    callbacks=callbacks,
    verbose=1,
)

# ── Evaluate ──
loss, acc = model.evaluate(X_test, y_test, verbose=0)
print(f"\n✓ Test Accuracy: {acc*100:.1f}%")

# ── Save model ──
os.makedirs('model', exist_ok=True)
model.save('model/isl_model.h5')
print("✓ Model saved to model/isl_model.h5")

# ── Save label map ──
with open('model/labels.json', 'w') as f:
    json.dump(letters, f)
print("✓ Labels saved to model/labels.json")

print("\nNext step: copy model/isl_model.h5 to your backend/model/ folder")
print("Then update backend/main.py to use the ML model (see instructions below)")
print("""
── How to use this model in backend/main.py ──

Add at top:
  import tensorflow as tf
  import json

  model = tf.keras.models.load_model('../model/isl_model.h5')
  LABELS = list('ABCDEFGHIJKLMNOPQRSTUVWXYZ')

Replace classify_gesture() with:
  def classify_gesture(landmarks):
      pts = np.array([[l.x, l.y, l.z] for l in landmarks], dtype=np.float32)
      wrist = pts[0].copy()
      pts = pts - wrist
      scale = np.max(np.abs(pts)) + 1e-9
      pts = pts / scale
      flat = pts.flatten().reshape(1, -1)
      probs = model.predict(flat, verbose=0)[0]
      idx = int(np.argmax(probs))
      return LABELS[idx], float(probs[idx])
""")
