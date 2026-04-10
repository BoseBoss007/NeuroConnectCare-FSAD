import json
import sys
import os
import warnings

# ── Redirect ALL warnings to stderr so only JSON goes to stdout ──
warnings.filterwarnings("ignore")
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"   # silence TF C++ logs
stderr = sys.stderr                          # keep a ref before any redirect

import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model

if len(sys.argv) != 2:
    print("Usage: python3 fl_predict.py <csv_path>")
    sys.exit(1)

csv_path = sys.argv[1]
model_path = "/tmp/fl_model.keras"

if not os.path.exists(model_path):
    print(json.dumps({"error": "Global FL model not found. Please run 'Train Model' first to generate weights."}))
    sys.exit(1)

DISORDER_MAP = {
    "ASD": "Autism Spectrum Disorder",
    "SZ":  "Schizophrenia",
    "BD":  "Bipolar Disorder",
    "SAD": "Seasonal Affective Disorder",
    "DA":  "Drug Addiction",
    "Healthy": "Healthy",
}

CLASSES = np.array(["ASD", "BD", "DA", "Healthy", "SAD", "SZ"])

try:
    # 1. Load Data
    data = pd.read_csv(csv_path)
    feature_cols = ["a_time", "a_amp", "b_time", "b_amp", "OP_s_Amp", "OP_s_Time", "age", "sex"]
    
    # Fill missing columns just in case the patient CSV is sparse
    for col in feature_cols:
        if col not in data.columns:
            data[col] = 0.0

    X = data[feature_cols].values.astype(np.float32)
    
    # 2. Load Model
    model = load_model(model_path)
    
    # 3. Predict (first row only since it's a single patient)
    raw_preds = model.predict(X, verbose=0)
    pred_idx = np.argmax(raw_preds[0])
    confidence = np.max(raw_preds[0]) * 100
    
    pred_label = CLASSES[pred_idx]
    
    # 4. Output explicit JSON
    result = {
        "predicted_disorder": pred_label,
        "disorder_full": DISORDER_MAP.get(pred_label, pred_label),
        "severity_percentage": round(float(confidence), 1)
    }
    
    print(json.dumps(result))
    
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
