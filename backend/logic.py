# logic.py
# Realistic, dynamic prediction engine for PayPredict
# Replace your existing logic.py with this file.

import random
from datetime import datetime

# -------------------------
# Bank base success scores
# (higher = generally more reliable)
# -------------------------
BANK_BASE = {
    "HDFC": 92,
    "AXIS": 90,
    "ICICI": 88,
    "IDFC": 87,
    "SBI": 85,
    "BOB": 83,
    "PNB": 80,
    "KOTAK": 86,
    "CANARA": 82,
    "YESBANK": 79
}

# -------------------------
# Helpers
# -------------------------
def clamp(v, lo=5, hi=95):
    return max(lo, min(hi, v))

def normalize_bank_name(bank):
    if not bank:
        return None
    return bank.strip().upper()

# -------------------------
# Time of day modifier
# Input: time_of_day string (Morning/Afternoon/Evening/Night/Late Night)
# If not provided, we infer from current hour.
# -------------------------
def time_of_day_from_payload(payload_time_of_day=None):
    if payload_time_of_day:
        s = payload_time_of_day.strip().lower()
        if "morn" in s: return "Morning"
        if "after" in s: return "Afternoon"
        if "even" in s: return "Evening"
        if "late" in s: return "Late Night"
        if "night" in s: return "Night"
    # infer from current clock
    hour = datetime.now().hour
    if 6 <= hour < 11: return "Morning"
    if 11 <= hour < 16: return "Afternoon"
    if 16 <= hour < 21: return "Evening"
    if 21 <= hour <= 23: return "Night"
    return "Late Night"

# -------------------------
# Main scoring function
# -------------------------
def calculate_success_probability(method="UPI",
                                  bank=None,
                                  amount=0.0,
                                  network="Average",
                                  time_of_day=None,
                                  retries=0,
                                  past_failures=0):
    """
    Returns (final_score_float, status, reason)

    status: "low-risk" | "medium-risk" | "high-risk"
    reason: human-friendly string
    """
    # Normalize inputs
    bank_norm = normalize_bank_name(bank) or "SBI"
    base = BANK_BASE.get(bank_norm, 85)  # default baseline

    # Method adjustment
    method_norm = (method or "UPI").strip().lower()
    if method_norm == "card":
        base -= 5
    elif method_norm == "wallet":
        base -= 3
    elif method_norm == "upi":
        base += 0

    # Amount adjustment
    # Smaller amounts are easier, big transfers are riskier
    try:
        amt = float(amount or 0)
    except Exception:
        amt = 0.0

    if amt < 2000:
        base += 8
    elif 2000 <= amt <= 5000:
        base += 0
    elif 5000 < amt <= 15000:
        base -= 10
    else:  # > 15000
        base -= 20

    # Network adjustment
    net = (network or "Average").strip().lower()
    if "fast" in net:
        base += 10
    elif "average" in net:
        base += 0
    elif "slow" in net:
        base -= 15
    else:
        # unknown network, small penalty
        base -= 2

    # Time of day modifier
    tod = time_of_day_from_payload(time_of_day)
    if tod == "Morning":
        base += 5
    elif tod == "Afternoon":
        base += 0
    elif tod == "Evening":
        base -= 5
    elif tod == "Night":
        base -= 10
    elif tod == "Late Night":
        base -= 12

    # Retries and past failures
    try:
        r = int(retries or 0)
    except Exception:
        r = 0
    try:
        pf = int(past_failures or 0)
    except Exception:
        pf = 0

    if r == 1:
        base -= 5
    elif r >= 2:
        base -= 10

    if pf >= 2:
        base -= 10
    if pf >= 4:
        base -= 20

    # -------------------------
    # Live load factor (dynamic randomness):
    # Very dynamic option: random noise in -10..+10
    # -------------------------
    live_noise = random.randint(-10, 10)
    final = base + live_noise

    # Final clamp 5..95
    final = clamp(final, 5, 95)
    final = float(round(final, 1))

    # Generate status and reason
    if final < 30:
        status = "high-risk"
        reason = "Low chance; bank or network may fail"
    elif final < 60:
        status = "medium-risk"
        reason = "Moderate chance; could fail during high load"
    else:
        status = "low-risk"
        reason = "High chance of success"

    # Add some contextual detail for reasons (helpful for demo)
    # If amount big or retries/past failures high, append details
    extra_reasons = []
    if amt > 15000:
        extra_reasons.append("High transaction amount")
    if r >= 1:
        extra_reasons.append(f"{r} retry attempt(s)")
    if pf >= 1:
        extra_reasons.append(f"{pf} past failure(s)")
    if "slow" in net:
        extra_reasons.append("Weak network")
    if tod in ("Night", "Late Night"):
        extra_reasons.append("Low processing window")

    if extra_reasons:
        reason = reason + " — " + "; ".join(extra_reasons)

    return {
        "success_prob": final,
        "status": status,
        "reason": reason
    }

# -------------------------
# Helper — accepts a payload (dictionary) and returns predict response
# This is convenient for app.py -> call predict_from_payload(request.json)
# -------------------------
def predict_from_payload(payload):
    """
    Payload expected keys (some optional):
      - method
      - bank
      - amount
      - network
      - time_of_day
      - retries
      - past_failures
    Returns dict with keys: success_prob, status, reason
    """
    if not isinstance(payload, dict):
        payload = {}

    method = payload.get("method", "UPI")
    bank = payload.get("bank") or payload.get("bank_name") or payload.get("bankCode")
    amount = payload.get("amount", payload.get("amt", 0))
    network = payload.get("network", payload.get("network_speed", "Average"))
    time_of_day = payload.get("time_of_day", payload.get("timeofday"))
    retries = payload.get("retries", 0)
    past_failures = payload.get("past_failures", payload.get("pastFailures", 0))

    return calculate_success_probability(
        method=method,
        bank=bank,
        amount=amount,
        network=network,
        time_of_day=time_of_day,
        retries=retries,
        past_failures=past_failures
    )

# If this file is run standalone, demonstrate simple examples
if __name__ == "__main__":
    examples = [
        {"method": "UPI", "bank": "SBI", "amount": 500, "network": "Average"},
        {"method": "UPI", "bank": "HDFC", "amount": 12000, "network": "Slow", "retries": 1},
        {"method": "Card", "bank": "ICICI", "amount": 2500, "network": "Fast"}
    ]
    for p in examples:
        print("Payload:", p)
        print("Predict:", predict_from_payload(p))
        print("---")
