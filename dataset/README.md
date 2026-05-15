# ISL Dataset Images

This folder contains ISL (Indian Sign Language) gesture images for letters A–Z.

## Current State
Auto-generated placeholder images ship with the project. Each image shows the letter
on a dark background so the UI works out of the box.

## How to Replace with Real ISL Images

### Option 1 — Kaggle Dataset (Recommended)
1. Go to https://www.kaggle.com/datasets/iamsouravbanerjee/indian-sign-language-dataset
2. Download and extract
3. Pick one clear image per letter, rename to A.png, B.png ... Z.png
4. Replace files in this folder

### Option 2 — Photograph your own
1. Take photos of ISL hand signs A–Z
2. Crop to square (e.g. 200x200 px)
3. Name them A.png through Z.png
4. Place here

### Option 3 — ISL Gesture Image Dataset
Search Kaggle for: "ISL gesture image dataset"
Multiple datasets are available with labeled sign images.

## File Format
- Format: PNG (or JPEG — update backend/main.py if using .jpg)
- Recommended size: 200×200 to 400×400 px
- Naming: UPPERCASE single letter, e.g. A.png

## After Replacing
Just restart the backend — no code changes needed.
The /images/ static route serves whatever is in this folder.
