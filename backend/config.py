import os
from pathlib import Path
from dotenv import load_dotenv

# Base backend directory
BASE_DIR = Path(__file__).resolve().parent

# Load .env file
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)

# Configuration settings
FLASK_ENV = os.getenv("FLASK_ENV", "development")
DEBUG = FLASK_ENV == "development"
PORT = int(os.getenv("PORT", "5000"))

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

# Database path (defaults to backend/careconnect.db)
DB_PATH = os.getenv("DATABASE_PATH", str(BASE_DIR / "careconnect.db"))
if not os.path.isabs(DB_PATH):
    DB_PATH = str(BASE_DIR / DB_PATH)

# Admin Authentication
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "careconnect_demo_admin")
ADMIN_SESSION_TOKEN = os.getenv("ADMIN_SESSION_TOKEN", "demo-admin-token-careconnect-2026")

# Hospital Information
HOSPITAL_NAME = os.getenv("HOSPITAL_NAME", "CareConnect Demo Multispecialty Hospital")
EMERGENCY_HELPLINE = os.getenv("EMERGENCY_HELPLINE", "112")
RECEPTION_PHONE = os.getenv("RECEPTION_PHONE", "+91 11 2345 6789")
HOSPITAL_EMAIL = os.getenv("HOSPITAL_EMAIL", "reception.demo@careconnect-hospital.local")
HOSPITAL_ADDRESS = os.getenv("HOSPITAL_ADDRESS", "Plot 42, Health City, Sector 5, New Delhi - 110001 (DEMO LOCATION)")
OPD_HOURS = "Monday to Saturday, 08:00 AM – 04:00 PM (IST)"
