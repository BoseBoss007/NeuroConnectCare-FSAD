"""
NeuroCare Connect – Federated Learning Client
Usage: python3 fl_client.py <server_url> <csv_path> <job_dir>

After each epoch this script writes:
  <job_dir>/progress.json  →  { epoch, total_epochs, accuracy, status }

On completion it writes:
  <job_dir>/results.json   →  { accuracy_history, predictions: [...] }

It communicates weight updates to the FL Server after every epoch.
"""

import requests
import json
import numpy as np
import pandas as pd
import tensorflow as tf
import sys
import os

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.utils import to_categorical

# ── Args ──────────────────────────────────────────────────────
if len(sys.argv) != 4:
    print("Usage: python3 fl_client.py <server_url> <csv_path> <job_dir>")
    sys.exit(1)

server_url = sys.argv[1]   # e.g. http://localhost:5050
file_path  = sys.argv[2]   # uploaded CSV path
job_dir    = sys.argv[3]   # directory to write progress / results JSON

os.makedirs(job_dir, exist_ok=True)

TOTAL_EPOCHS = 10
DISORDER_MAP = {
    "ASD": "Autism Spectrum Disorder",
    "SZ":  "Schizophrenia",
    "BD":  "Bipolar Disorder",
    "SAD": "Seasonal Affective Disorder",
    "DA":  "Drug Addiction",
    "Healthy": "Healthy",
}

# ── Helpers ───────────────────────────────────────────────────
def write_progress(epoch, accuracy, history=[], status="training"):
    payload = {
        "epoch": epoch,
        "total_epochs": TOTAL_EPOCHS,
        "accuracy": round(float(accuracy) * 100, 2),
        "history": history,
        "status": status,
    }
    with open(os.path.join(job_dir, "progress.json"), "w") as f:
        json.dump(payload, f)


def assign_disorder(data):
    """Rule-based label assignment matching the original client logic."""
    data = data.copy()
    data["mental_disorder"] = "Healthy"

    conditions = [
        ((data["b_amp"] < 50) & (data["OP_s_Amp"] < 45),  "SAD"),
        ((data["a_amp"] < -40) & (data["b_amp"] > 60),     "SZ"),
        ((data["b_amp"] > 70) & (data["OP_s_Time"] > 150), "BD"),
        ((data["b_amp"] > 75) & (data["OP_s_Amp"] < 65),   "ASD"),
        ((data["OP_s_Amp"] < 40),                          "DA"),
    ]
    for mask, label in conditions:
        data.loc[mask, "mental_disorder"] = label

    return data


def preprocess(file_path):
    data = pd.read_csv(file_path)
    data = assign_disorder(data)

    feature_cols = ["a_time", "a_amp", "b_time", "b_amp", "OP_s_Amp", "OP_s_Time", "age", "sex"]
    X = data[feature_cols].values.astype(np.float32)
    y_raw = data["mental_disorder"].values

    le = LabelEncoder()
    le.fit(list(DISORDER_MAP.keys()))
    y_enc = le.transform(y_raw)
    num_classes = len(le.classes_)
    y_cat = to_categorical(y_enc, num_classes=num_classes)

    return X, y_cat, le, data, num_classes


def build_model(input_size, num_classes):
    model = Sequential([
        Dense(64, activation="relu", input_shape=(input_size,)),
        Dense(32, activation="relu"),
        Dense(num_classes, activation="softmax"),
    ])
    model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])
    return model


# ── Main ──────────────────────────────────────────────────────
write_progress(0, 0.0, [], status="starting")

X, y, le, original_data, num_classes = preprocess(file_path)
model = build_model(input_size=X.shape[1], num_classes=num_classes)

accuracy_history = []

for epoch in range(1, TOTAL_EPOCHS + 1):
    print(f"[FL Client] Epoch {epoch}/{TOTAL_EPOCHS}")
    history = model.fit(X, y, epochs=1, batch_size=16, verbose=0)
    acc = history.history["accuracy"][0]
    accuracy_history.append(round(float(acc) * 100, 2))

    # Write live progress
    write_progress(epoch, acc, accuracy_history, status="training")

    # Send weights to FL Server
    try:
        weights = model.get_weights()
        response = requests.post(
            f"{server_url}/update",
            json={"weights": json.dumps([w.tolist() for w in weights])},
            timeout=30,
        )
        if response.status_code == 200:
            global_weights = json.loads(response.json()["global_weights"])
            model.set_weights([np.array(w) for w in global_weights])
        else:
            print(f"[FL Client] Server returned {response.status_code} at epoch {epoch}")
    except Exception as e:
        print(f"[FL Client] Could not reach FL Server: {e} — continuing locally")

# ── Predict ───────────────────────────────────────────────────
write_progress(TOTAL_EPOCHS, accuracy_history[-1], accuracy_history, status="predicting")

raw_preds = model.predict(X)
pred_labels = le.inverse_transform(np.argmax(raw_preds, axis=1))
confidence  = np.max(raw_preds, axis=1)

original_data = original_data.copy()
original_data["Predicted_Disorder"] = pred_labels
original_data["Confidence"] = (confidence * 100).round(1)

# ── Build results JSON ────────────────────────────────────────
predictions = []
for _, row in original_data.iterrows():
    predictions.append({
        "patient_id":          int(row["patient_id"]) if "patient_id" in row else _,
        "age":                 float(row["age"]),
        "sex":                 int(row["sex"]),
        "mental_disorder":     str(row.get("mental_disorder", "")),
        "predicted_disorder":  str(row["Predicted_Disorder"]),
        "confidence":          float(row["Confidence"]),
        "disorder_full":       DISORDER_MAP.get(str(row["Predicted_Disorder"]), str(row["Predicted_Disorder"])),
    })

results_payload = {
    "accuracy_history": accuracy_history,
    "final_accuracy":   accuracy_history[-1],
    "predictions":      predictions,
    "total_patients":   len(predictions),
    "disorder_counts":  {
        label: int((original_data["Predicted_Disorder"] == label).sum())
        for label in le.classes_
    },
}

with open(os.path.join(job_dir, "results.json"), "w") as f:
    json.dump(results_payload, f, indent=2)

# Save keras model for single-patient predictions later
model_path = "/tmp/fl_model.keras"
model.save(model_path)
print(f"[FL Client] Saved global model to {model_path}")

# Mark complete
write_progress(TOTAL_EPOCHS, accuracy_history[-1], accuracy_history, status="complete")
print("[FL Client] Training complete. Results written to", job_dir)
