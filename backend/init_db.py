import sqlite3

def init_db():
    conn = sqlite3.connect("transactions.db")
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            method TEXT,
            bank TEXT,
            amount REAL,
            network TEXT,
            time_of_day TEXT,
            retries INTEGER,
            past_failures INTEGER,
            success_prob REAL,
            success_status TEXT,
            reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    conn.commit()
    conn.close()
    print("Database 'transactions.db' initialized successfully.")

if __name__ == "__main__":
    init_db()
