from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

# IMPORT NEW LOGIC FUNCTION
from logic import predict_from_payload

app = Flask(__name__)
CORS(app)

DB_NAME = "transactions.db"


def get_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn


@app.route("/")
def home():
    return {"message": "Payment Dashboard Backend is Running"}


# ------------------------------
# PREDICT API (UPDATED)
# ------------------------------
@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json() or {}
    result = predict_from_payload(data)
    return jsonify(result)


# ------------------------------
# LOG TRANSACTION API
# ------------------------------
@app.route("/log", methods=["POST"])
def log_transaction():
    data = request.get_json() or {}

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO transactions 
        (method, bank, amount, network, time_of_day, retries, past_failures, success_prob, success_status, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.get("method"),
        data.get("bank"),
        data.get("amount"),
        data.get("network"),
        data.get("time_of_day"),
        data.get("retries"),
        data.get("past_failures"),
        data.get("success_prob"),
        data.get("status"),
        data.get("reason")
    ))

    conn.commit()
    conn.close()

    return jsonify({"message": "Transaction logged successfully"})


# ------------------------------
# STATS API
# ------------------------------
@app.route("/stats", methods=["GET"])
def stats():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT bank,
               AVG(success_prob) AS avg_success
        FROM transactions
        GROUP BY bank
    """)
    bank_stats = [
        {"bank": row["bank"], "avg_success": round(row["avg_success"], 2)}
        for row in cur.fetchall()
    ]

    cur.execute("""
        SELECT method,
               AVG(success_prob) AS avg_success
        FROM transactions
        GROUP BY method
    """)
    method_stats = [
        {"method": row["method"], "avg_success": round(row["avg_success"], 2)}
        for row in cur.fetchall()
    ]

    cur.execute("""
        SELECT reason,
               COUNT(*) AS count
        FROM transactions
        GROUP BY reason
    """)
    reasons = [
        {"reason": row["reason"], "count": row["count"]}
        for row in cur.fetchall()
    ]

    conn.close()

    return jsonify({
        "bank_stats": bank_stats,
        "method_stats": method_stats,
        "failure_reasons": reasons
    })


# DO NOT WRITE ANYTHING BELOW THIS
if __name__ == "__main__":
    app.run(debug=True)
