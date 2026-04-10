"""
NeuroCare Connect – Federated Learning Server
Runs on port 5050. Receives weight updates from fl_client.py,
performs FedAvg aggregation after each client update, and returns
the global model weights.

Single-client mode: aggregation fires as soon as 1 client posts weights.
"""

from flask import Flask, request, jsonify
import json
import numpy as np
import tensorflow as tf
import threading

app = Flask(__name__)

# ── Global state ──────────────────────────────────────────────
global_model = None
client_weights = []
client_count = 0
lock = threading.Lock()

# ── FedAvg route ─────────────────────────────────────────────
@app.route("/update", methods=["POST"])
def update_model():
    global global_model, client_weights, client_count

    try:
        data = request.get_json()
        if not data or "weights" not in data:
            return jsonify({"error": "Invalid request — missing weights."}), 400

        received_weights = [np.array(w) for w in json.loads(data["weights"])]

        with lock:
            client_weights.append(received_weights)
            client_count += 1

        # Single-client mode: aggregate after EVERY update
        if client_count >= 1:
            try:
                avg_weights = [np.zeros_like(w) for w in client_weights[0]]
                for w_set in client_weights:
                    for i in range(len(avg_weights)):
                        avg_weights[i] += w_set[i] / client_count

                global_model.set_weights(avg_weights)
            finally:
                with lock:
                    client_weights.clear()
                    client_count = 0

        response_data = json.dumps([w.tolist() for w in global_model.get_weights()])
        return jsonify({"global_weights": response_data})

    except Exception as e:
        print(f"[FL Server] Error: {e}")
        # Clear out weights in case of error so it doesn't stay deadlocked.
        with lock:
            client_weights.clear()
            client_count = 0
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


# ── Model builder ─────────────────────────────────────────────
def build_model(input_size=8, num_classes=6):
    model = tf.keras.Sequential([
        tf.keras.layers.Dense(64, activation="relu", input_shape=(input_size,)),
        tf.keras.layers.Dense(32, activation="relu"),
        tf.keras.layers.Dense(num_classes, activation="softmax"),
    ])
    model.compile(
        optimizer="adam",
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


# ── Entry point ───────────────────────────────────────────────
if __name__ == "__main__":
    global_model = build_model(input_size=8, num_classes=6)
    print("[FL Server] Global model initialised. Listening on :5050 …")
    app.run(host="0.0.0.0", port=5050, debug=False)
