import sqlite3
from typing import Optional, List, Dict, Any
from config import DB_PATH

def get_db_connection() -> sqlite3.Connection:
    """Creates and returns a connection to the SQLite database with row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db() -> None:
    """Initializes the database schema if tables do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Departments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        code TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        opd_timings TEXT NOT NULL,
        location TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1
    );
    """)

    # 2. Doctors table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        department_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        qualification TEXT NOT NULL,
        specialization TEXT NOT NULL,
        experience_years INTEGER NOT NULL,
        room_no TEXT NOT NULL,
        available_days TEXT NOT NULL,
        consultation_fee INTEGER NOT NULL DEFAULT 500,
        is_active INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
    );
    """)

    # 3. Appointments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reference_id TEXT NOT NULL UNIQUE,
        patient_name TEXT NOT NULL,
        contact_number TEXT NOT NULL,
        email TEXT,
        department_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        appointment_date TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'CONFIRMED',
        cancellation_reason TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (department_id) REFERENCES departments(id),
        FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    );
    """)

    # Partial unique index: Prevent duplicate active appointments for same doctor, date, and slot
    cursor.execute("""
    CREATE UNIQUE INDEX IF NOT EXISTS idx_active_doctor_slot 
    ON appointments (doctor_id, appointment_date, time_slot) 
    WHERE status != 'CANCELLED';
    """)

    # Index for fast lookup by reference ID and contact
    cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_appt_ref_contact 
    ON appointments (reference_id, contact_number);
    """)

    # 4. FAQs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS faqs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        keywords TEXT NOT NULL
    );
    """)

    conn.commit()
    conn.close()

def row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    """Helper to convert a sqlite3.Row object to a dictionary."""
    return {k: row[k] for k in row.keys()} if row else {}
