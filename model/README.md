# Model Folder

Place a trained Keras/TensorFlow model here as `isl_model.h5` to upgrade
from the rule-based classifier to ML-based prediction.

## Expected Input Format
- Flattened 21 landmarks × 3 (x,y,z) = 63 features
- Shape: (1, 63) float32 array

## Expected Output
- Softmax probabilities over 26 classes (A–Z)
- Shape: (1, 26)

## Training Your Own Model

```python
import numpy as np
from tensorflow import keras

# Collect landmark data from MediaPipe for each letter
# X shape: (n_samples, 63) — flattened [x,y,z] for 21 landmarks
# y shape: (n_samples,) — label indices 0=A, 1=B, ..., 25=Z

model = keras.Sequential([
    keras.layers.Dense(128, activation='relu', input_shape=(63,)),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(64, activation='relu'),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(26, activation='softmax'),
])
model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
model.fit(X_train, y_train, epochs=50, validation_split=0.2)
model.save('model/isl_model.h5')
```

## Using the Model
See the instructions in README.md under "Upgrading the Gesture Classifier".
