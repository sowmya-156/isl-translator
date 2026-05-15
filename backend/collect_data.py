"""
Step 1: Data Collection Script
Run this to collect hand landmark data for each ISL letter.
- Press the letter key (A-Z) to start collecting for that letter
- Hold your ISL sign steady
- Press SPACE to capture 50 samples
- Press Q to quit and save

Requirements: pip install mediapipe opencv-python numpy
"""

import cv2
import mediapipe as mp
import numpy as np
import json
import os
import time

# Output file
DATA_FILE = 'isl_dataset.json'

# Load existing data if any
if os.path.exists(DATA_FILE):
    with open(DATA_FILE) as f:
        dataset = json.load(f)
    print(f"Loaded existing dataset: {sum(len(v) for v in dataset.values())} samples")
else:
    dataset = {letter: [] for letter in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'}

mp_hands = mp.solutions.hands
mp_draw = mp.solutions.drawing_utils

hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.5
)

cap = cv2.VideoCapture(0)
current_letter = None
collecting = False
sample_count = 0
SAMPLES_PER_LETTER = 100  # collect 100 samples per letter

print("\n=== ISL Data Collector ===")
print("Press A-Z to select a letter")
print("Press SPACE to collect 100 samples for that letter")
print("Press S to show current dataset counts")
print("Press Q to save and quit\n")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb)

    # Draw landmarks
    if results.multi_hand_landmarks:
        for lm in results.multi_hand_landmarks:
            mp_draw.draw_landmarks(frame, lm, mp_hands.HAND_CONNECTIONS)

    # Collect sample if active
    if collecting and results.multi_hand_landmarks:
        lm = results.multi_hand_landmarks[0].landmark
        # Flatten: [x0,y0,z0, x1,y1,z1, ... x20,y20,z20]
        flat = []
        for point in lm:
            flat.extend([point.x, point.y, point.z])
        dataset[current_letter].append(flat)
        sample_count += 1

        if sample_count >= SAMPLES_PER_LETTER:
            collecting = False
            print(f"✓ Collected {SAMPLES_PER_LETTER} samples for '{current_letter}'. Total: {len(dataset[current_letter])}")
            # Auto-save
            with open(DATA_FILE, 'w') as f:
                json.dump(dataset, f)
            print(f"  Saved to {DATA_FILE}")

    # Display info on frame
    h, w = frame.shape[:2]
    status = f"Letter: {current_letter or 'NONE'}"
    if collecting:
        status += f" | Collecting: {sample_count}/{SAMPLES_PER_LETTER}"
    else:
        status += f" | Samples: {len(dataset.get(current_letter, [])) if current_letter else 0}"

    cv2.putText(frame, status, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    cv2.putText(frame, "Press letter key to select | SPACE to collect | Q to quit",
                (10, h-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

    # Show counts for all letters
    y = 60
    for i, letter in enumerate('ABCDEFGHIJKLMNOPQRSTUVWXYZ'):
        count = len(dataset[letter])
        color = (0, 255, 0) if count >= SAMPLES_PER_LETTER else (0, 100, 255)
        col = (i % 9) * 75 + 10
        row = (i // 9) * 20 + y
        cv2.putText(frame, f"{letter}:{count}", (col, row),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)

    cv2.imshow('ISL Data Collector', frame)

    key = cv2.waitKey(1) & 0xFF

    if key == ord('q') or key == ord('Q'):
        break
    elif key == ord(' '):
        if current_letter and not collecting:
            collecting = True
            sample_count = 0
            print(f"► Collecting for '{current_letter}'... hold your sign steady!")
    elif key == ord('s') or key == ord('S'):
        print("\nDataset counts:")
        for l, samples in dataset.items():
            print(f"  {l}: {len(samples)} samples")
    elif 65 <= key <= 90 or 97 <= key <= 122:  # A-Z or a-z
        current_letter = chr(key).upper()
        collecting = False
        sample_count = 0
        print(f"Selected letter: '{current_letter}' ({len(dataset[current_letter])} samples so far)")

cap.release()
cv2.destroyAllWindows()

# Final save
with open(DATA_FILE, 'w') as f:
    json.dump(dataset, f)

total = sum(len(v) for v in dataset.values())
print(f"\n✓ Dataset saved: {total} total samples in {DATA_FILE}")
print("Now run: python train_model.py")
