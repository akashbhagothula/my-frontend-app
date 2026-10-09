import os
import re
import datetime
import random
import string
from flask import Flask, request, jsonify
from flask_cors import CORS
from config import (
    PORT, DEBUG, FRONTEND_ORIGIN, HOSPITAL_NAME, EMERGENCY_HELPLINE,
    RECEPTION_PHONE, HOSPITAL_EMAIL, HOSPITAL_ADDRESS, OPD_HOURS
)
from database import get_db_connection, init_db, row_to_dict

app = Flask(__name__)
# Allow CORS for frontend
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Ensure database is initialized
init_db()

# --- Helper Utilities ---

def generate_reference_id() -> str:
    """Generate a clean, professional appointment reference ID."""
    rand_chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"CC-{rand_chars}"

STANDARD_TIME_SLOTS = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
    "11:00 AM", "11:30 AM", "12:00 PM",
    "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM"
]

DAY_NAME_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


# --- Endpoints ---

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "CareConnect Healthcare Chatbot API",
        "version": "1.0.0",
        "timestamp": datetime.datetime.now().isoformat()
    })


@app.route("/api/hospital-info", methods=["GET"])
def get_hospital_info():
    return jsonify({
        "hospital_name": HOSPITAL_NAME,
        "emergency_helpline": EMERGENCY_HELPLINE,
        "reception_phone": RECEPTION_PHONE,
        "email": HOSPITAL_EMAIL,
        "address": HOSPITAL_ADDRESS,
        "opd_hours": OPD_HOURS
    })


@app.route("/api/departments", methods=["GET"])
def get_departments():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT d.*, COUNT(doc.id) as doctor_count 
        FROM departments d
        LEFT JOIN doctors doc ON doc.department_id = d.id AND doc.is_active = 1
        WHERE d.is_active = 1
        GROUP BY d.id
        ORDER BY d.id ASC
    """)
    departments = [row_to_dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(departments)


@app.route("/api/doctors", methods=["GET"])
def get_doctors():
    department_id = request.args.get("department_id", type=int)
    search_query = request.args.get("search", type=str, default="").strip()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT doc.*, dept.name as department_name, dept.code as department_code
        FROM doctors doc
        JOIN departments dept ON doc.department_id = dept.id
        WHERE doc.is_active = 1
    """
    params = []
    
    if department_id:
        query += " AND doc.department_id = ?"
        params.append(department_id)
        
    if search_query:
        query += " AND (doc.name LIKE ? OR doc.specialization LIKE ? OR dept.name LIKE ?)"
        like_term = f"%{search_query}%"
        params.extend([like_term, like_term, like_term])
        
    query += " ORDER BY doc.department_id ASC, doc.id ASC"
    cursor.execute(query, params)
    doctors = [row_to_dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(doctors)


@app.route("/api/doctors/<int:doctor_id>", methods=["GET"])
def get_doctor_detail(doctor_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT doc.*, dept.name as department_name, dept.code as department_code, dept.location as department_location
        FROM doctors doc
        JOIN departments dept ON doc.department_id = dept.id
        WHERE doc.id = ? AND doc.is_active = 1
    """, (doctor_id,))
    doctor = cursor.fetchone()
    conn.close()
    
    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404
        
    return jsonify(row_to_dict(doctor))


@app.route("/api/doctors", methods=["POST"])
def add_doctor():
    data = request.get_json(silent=True) or {}
    
    # Validation
    required = ["department_id", "name", "specialization"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400
        
    department_id = int(data["department_id"])
    name = str(data["name"]).strip()
    if not name.startswith("Dr.") and not name.startswith("Dr "):
        name = "Dr. " + name
        
    qualification = str(data.get("qualification", "MBBS, MD")).strip()
    specialization = str(data["specialization"]).strip()
    experience_years = int(data.get("experience_years", 5))
    room_no = str(data.get("room_no", "OPD-101")).strip()
    available_days = str(data.get("available_days", "Mon,Tue,Wed,Thu,Fri,Sat")).strip()
    consultation_fee = int(data.get("consultation_fee", 500))
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check department exists
    cursor.execute("SELECT id, name FROM departments WHERE id = ? AND is_active = 1", (department_id,))
    dept = cursor.fetchone()
    if not dept:
        conn.close()
        return jsonify({"error": "Selected department does not exist"}), 404
        
    cursor.execute("""
        INSERT INTO doctors (department_id, name, qualification, specialization, experience_years, room_no, available_days, consultation_fee, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    """, (department_id, name, qualification, specialization, experience_years, room_no, available_days, consultation_fee))
    
    new_doc_id = cursor.lastrowid
    conn.commit()
    
    cursor.execute("""
        SELECT doc.*, dept.name as department_name, dept.code as department_code
        FROM doctors doc
        JOIN departments dept ON doc.department_id = dept.id
        WHERE doc.id = ?
    """, (new_doc_id,))
    new_doc = row_to_dict(cursor.fetchone())
    conn.close()
    
    return jsonify({
        "message": f"Doctor {name} added successfully!",
        "doctor": new_doc
    }), 201


@app.route("/api/doctors/<int:doctor_id>", methods=["DELETE"])
def remove_doctor(doctor_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, name FROM doctors WHERE id = ? AND is_active = 1", (doctor_id,))
    doc = cursor.fetchone()
    if not doc:
        conn.close()
        return jsonify({"error": "Doctor not found or already inactive"}), 404
        
    cursor.execute("UPDATE doctors SET is_active = 0 WHERE id = ?", (doctor_id,))
    conn.commit()
    conn.close()
    
    return jsonify({
        "message": f"Doctor {doc['name']} has been successfully removed.",
        "doctor_id": doctor_id
    }), 200


@app.route("/api/slots", methods=["GET"])
def get_available_slots():
    doctor_id = request.args.get("doctor_id", type=int)
    date_str = request.args.get("date", type=str)  # YYYY-MM-DD
    
    if not doctor_id or not date_str:
        return jsonify({"error": "doctor_id and date (YYYY-MM-DD) are required"}), 400
        
    try:
        query_date = datetime.date.fromisoformat(date_str)
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
        
    today = datetime.date.today()
    if query_date < today:
        return jsonify({"error": "Cannot query slots for past dates", "slots": []}), 400
        
    day_abbr = DAY_NAME_ABBR[query_date.weekday()]
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check doctor availability days
    cursor.execute("SELECT name, available_days FROM doctors WHERE id = ? AND is_active = 1", (doctor_id,))
    doc_row = cursor.fetchone()
    if not doc_row:
        conn.close()
        return jsonify({"error": "Doctor not found"}), 404
        
    available_days = [d.strip() for d in doc_row["available_days"].split(",")]
    if day_abbr not in available_days:
        conn.close()
        return jsonify({
            "doctor_id": doctor_id,
            "date": date_str,
            "day": day_abbr,
            "is_available_day": False,
            "message": f"{doc_row['name']} is not scheduled on {day_abbr}. Available days: {', '.join(available_days)}",
            "slots": []
        })
        
    # Query booked slots
    cursor.execute("""
        SELECT time_slot FROM appointments
        WHERE doctor_id = ? AND appointment_date = ? AND status != 'CANCELLED'
    """, (doctor_id, date_str))
    booked_slots = {row["time_slot"] for row in cursor.fetchall()}
    conn.close()
    
    slots_data = []
    for slot in STANDARD_TIME_SLOTS:
        is_booked = slot in booked_slots
        slots_data.append({
            "slot": slot,
            "available": not is_booked,
            "status": "Booked" if is_booked else "Available"
        })
        
    return jsonify({
        "doctor_id": doctor_id,
        "date": date_str,
        "day": day_abbr,
        "is_available_day": True,
        "slots": slots_data
    })


@app.route("/api/appointments", methods=["POST"])
def book_appointment():
    data = request.get_json(silent=True) or {}
    
    # Required validation
    required_fields = ["doctor_id", "patient_name", "contact_number", "appointment_date", "time_slot"]
    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400
        
    doctor_id = data["doctor_id"]
    patient_name = str(data["patient_name"]).strip()
    contact_number = str(data["contact_number"]).strip()
    email = str(data.get("email", "")).strip()
    appointment_date = str(data["appointment_date"]).strip()
    time_slot = str(data["time_slot"]).strip()
    notes = str(data.get("notes", "")).strip()
    
    if len(patient_name) < 2:
        return jsonify({"error": "Patient name must be at least 2 characters"}), 400
    if len(contact_number) < 8:
        return jsonify({"error": "Please enter a valid phone number"}), 400
        
    try:
        parsed_date = datetime.date.fromisoformat(appointment_date)
        if parsed_date < datetime.date.today():
            return jsonify({"error": "Appointment date cannot be in the past"}), 400
    except ValueError:
        return jsonify({"error": "Invalid appointment date format. Use YYYY-MM-DD"}), 400
        
    day_abbr = DAY_NAME_ABBR[parsed_date.weekday()]
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Fetch doctor info
    cursor.execute("SELECT id, department_id, name, available_days FROM doctors WHERE id = ? AND is_active = 1", (doctor_id,))
    doc_row = cursor.fetchone()
    if not doc_row:
        conn.close()
        return jsonify({"error": "Doctor does not exist or is inactive"}), 404
        
    available_days = [d.strip() for d in doc_row["available_days"].split(",")]
    if day_abbr not in available_days:
        conn.close()
        return jsonify({"error": f"Doctor {doc_row['name']} is not available on {day_abbr}s."}), 400
        
    department_id = doc_row["department_id"]
    
    # Check slot conflict
    cursor.execute("""
        SELECT id FROM appointments
        WHERE doctor_id = ? AND appointment_date = ? AND time_slot = ? AND status != 'CANCELLED'
    """, (doctor_id, appointment_date, time_slot))
    conflict = cursor.fetchone()
    if conflict:
        conn.close()
        return jsonify({"error": f"Slot {time_slot} on {appointment_date} has already been reserved. Please choose another time slot."}), 409
        
    # Generate unique reference ID
    for _ in range(10):
        ref_id = generate_reference_id()
        cursor.execute("SELECT id FROM appointments WHERE reference_id = ?", (ref_id,))
        if not cursor.fetchone():
            break
            
    now_str = datetime.datetime.now().isoformat()
    cursor.execute("""
        INSERT INTO appointments 
        (reference_id, patient_name, contact_number, email, department_id, doctor_id, appointment_date, time_slot, notes, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, ?)
    """, (
        ref_id, patient_name, contact_number, email, department_id, doctor_id,
        appointment_date, time_slot, notes, now_str, now_str
    ))
    conn.commit()
    
    # Fetch complete created appointment
    cursor.execute("""
        SELECT a.*, d.name as doctor_name, d.specialization as doctor_specialization, d.room_no, d.consultation_fee,
               dept.name as department_name, dept.location as department_location
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        JOIN departments dept ON a.department_id = dept.id
        WHERE a.reference_id = ?
    """, (ref_id,))
    created_appt = row_to_dict(cursor.fetchone())
    conn.close()
    
    return jsonify({
        "message": "Appointment confirmed successfully!",
        "appointment": created_appt
    }), 201


@app.route("/api/appointments/<reference_id>", methods=["GET"])
def lookup_appointment(reference_id):
    ref_clean = reference_id.strip().upper()
    phone = request.args.get("phone", "").strip()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT a.*, d.name as doctor_name, d.specialization as doctor_specialization, d.room_no, d.consultation_fee,
               dept.name as department_name, dept.location as department_location
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        JOIN departments dept ON a.department_id = dept.id
        WHERE a.reference_id = ?
    """
    params = [ref_clean]
    
    if phone:
        query += " AND a.contact_number = ?"
        params.append(phone)
        
    cursor.execute(query, params)
    appt = cursor.fetchone()
    conn.close()
    
    if not appt:
        return jsonify({"error": "No appointment found matching the provided reference ID"}), 404
        
    return jsonify(row_to_dict(appt))


@app.route("/api/appointments/<reference_id>/cancel", methods=["POST"])
def cancel_appointment(reference_id):
    ref_clean = reference_id.strip().upper()
    data = request.get_json(silent=True) or {}
    reason = str(data.get("reason", "Cancelled by patient request")).strip()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, status FROM appointments WHERE reference_id = ?", (ref_clean,))
    appt = cursor.fetchone()
    
    if not appt:
        conn.close()
        return jsonify({"error": "Appointment not found"}), 404
        
    if appt["status"] == "CANCELLED":
        conn.close()
        return jsonify({"message": "Appointment is already cancelled."}), 200
        
    now_str = datetime.datetime.now().isoformat()
    cursor.execute("""
        UPDATE appointments
        SET status = 'CANCELLED', cancellation_reason = ?, updated_at = ?
        WHERE reference_id = ?
    """, (reason, now_str, ref_clean))
    conn.commit()
    conn.close()
    
    return jsonify({
        "message": f"Appointment {ref_clean} has been successfully cancelled.",
        "reference_id": ref_clean,
        "status": "CANCELLED",
        "reason": reason
    })


# --- Smart Multilingual Healthcare Chatbot Assistant Logic ---
# Supports English, Hindi (हिन्दी), and Telugu (తెలుగు)

EMERGENCY_KEYWORDS = [
    # English
    "chest pain", "heart attack", "can't breathe", "cannot breathe", "shortness of breath",
    "severe bleeding", "unconscious", "passed out", "fainted", "choking", "poison", "poisoning",
    "stroke", "facial drooping", "slurred speech", "seizure", "fit", "heavy bleeding", "trauma",
    "severe burn", "suicidal", "coughing blood", "blue lips", "cardiac arrest",
    # Hindi (Devanagari & Romanized)
    "छाती में दर्द", "सीने में दर्द", "सांस लेने में दिक्कत", "सांस नहीं आ रही", "दिल का दौरा",
    "बहुत खून", "बेहोश", "चक्कर खाकर गिरना", "दौरा", "जहर", "seene me dard", "chhati me dard",
    "saans nahi aa rahi", "saans lene me dikkat", "dil ka daura", "behoshi", "khoon beh raha",
    # Telugu (Telugu Script & Romanized)
    "గుండె నొప్పి", "ఛాతీ నొప్పి", "శ్వాస ఆడటం లేదు", "శ్వాస తీసుకోవడంలో ఇబ్బంది", "రక్తం కారుతోంది",
    "స్పృహ తప్పి", "మూర్ఛ", "విషం", "తీవ్రమైన గాయం", "gunde noppi", "chati noppi", "chaathi noppi",
    "swasa adatam ledu", "swasa teesukovadam lo ibbandi", "raktam karutondi", "spruha tappindi", "murcha"
]

SYMPTOM_DEPARTMENT_MAP = [
    {
        "dept_code": "CARD",
        "dept_name": "Cardiology",
        "dept_name_hi": "हृदय रोग विभाग (Cardiology)",
        "dept_name_te": "కార్డియాలజీ విభాగం (గుండె సంరక్షణ)",
        "keywords": [
            "heart", "palpitation", "high blood pressure", "hypertension", "bp", "pulse", "cholesterol", "angina", "ecg", "echo",
            # Hindi
            "दिल", "हृदय", "धड़कन", "ब्लड प्रेशर", "बीपी", "घबराहट", "दिल की धड़कन", "dhadkan", "high bp",
            # Telugu
            "గుండె", "గుండె దడ", "రక్తపోటు", "బీపీ", "గుండెజబ్బు", "gunde", "gunde dada", "rakthapotu", "bp"
        ],
        "reason_en": "Cardiology specializes in cardiovascular health, heart rhythm, and blood pressure management.",
        "reason_hi": "कार्डियोलॉजी विभाग हृदय स्वास्थ्य, दिल की धड़कन और रक्तचाप के इलाज में विशेषज्ञ है।",
        "reason_te": "కార్డియాలజీ విభాగం గుండె ఆరోగ్యం, గుండె దడ మరియు రక్తపోటు నియంత్రణలో నిపుణులు కలిగి ఉంది."
    },
    {
        "dept_code": "PED",
        "dept_name": "Pediatrics",
        "dept_name_hi": "बाल रोग विभाग (Pediatrics)",
        "dept_name_te": "పీడియాట్రిక్స్ (పిల్లల విభాగం)",
        "keywords": [
            "baby", "child", "children", "toddler", "infant", "pediatric", "vaccine for child", "immunization", "newborn",
            # Hindi
            "बच्चा", "बच्चे", "बच्ची", "शिशु", "टीका", "टीकाकरण", "bacha", "bachhe", "shishu", "teeka",
            # Telugu
            "పిల్లలు", "పాప", "బాబు", "చిన్నారి", "శిశువు", "టీకా", "పిల్లల జ్వరం", "pillalu", "chinna pillalu", "shisuvu", "teeka", "papa", "babu"
        ],
        "reason_en": "Pediatrics provides comprehensive medical care for infants, children, and young adolescents.",
        "reason_hi": "बाल रोग विभाग नवजात शिशुओं, बच्चों और किशोरों की स्वास्थ्य देखभाल में विशेषज्ञ है।",
        "reason_te": "పీడియాట్రిక్స్ విభాగం నవజాత శిశువులు మరియు పిల్లల ఆరోగ్యం, వ్యాక్సిన్లు మరియు సంరక్షణను అందిస్తుంది."
    },
    {
        "dept_code": "ORTH",
        "dept_name": "Orthopedics",
        "dept_name_hi": "हड्डी एवं जोड़ रोग विभाग (Orthopedics)",
        "dept_name_te": "ఆర్థోపెడిక్స్ (ఎముకలు మరియు కీళ్ల విభాగం)",
        "keywords": [
            "bone", "joint", "fracture", "knee", "back pain", "spine", "arthritis", "shoulder", "ligament", "ankle", "sprain", "ortho",
            "हड्डी", "जोड़", "घुटने", "घुटनों का दर्द", "कमर दर्द", "पीठ दर्द", "मोच", "फ्रैक्चर", "haddi", "ghutne", "ghutna", "ghutno", "ghutne ka dard", "ghutne me dard", "jodon me dard", "kamar dard",
            # Telugu
            "ఎముక", "కీలు", "కీళ్ళు", "మోకాలు", "మోకాలి నొప్పి", "కీళ్ల నొప్పి", "నడుము నొప్పి", "వెన్ను నొప్పి", "ఫ్రాక్చర్", "emuka", "mokali noppi", "keella noppi", "keelu", "nadumu noppi", "vennu noppi"
        ],
        "reason_en": "Orthopedics specializes in bones, joints, ligaments, spine, and musculoskeletal recovery.",
        "reason_hi": "हड्डी रोग विभाग हड्डियों, जोड़ों, लिगामेंट्स और रीढ़ की समस्याओं के उपचार में विशेषज्ञ है।",
        "reason_te": "ఆర్థోపెడిక్స్ విభాగం ఎముకలు, కీళ్ళు, మోకాళ్ళ నొప్పులు, మరియు వెన్నెముక సమస్యల నివారణలో నైపుణ్యం కలిగి ఉంది."
    },
    {
        "dept_code": "DERM",
        "dept_name": "Dermatology",
        "dept_name_hi": "त्वचा एवं चर्म रोग विभाग (Dermatology)",
        "dept_name_te": "డెర్మటాలజీ (చర్మ మరియు జుట్టు విభాగం)",
        "keywords": [
            "skin", "rash", "acne", "pimple", "hair fall", "dandruff", "eczema", "psoriasis", "itching", "allergy on skin", "mole", "scalp",
            # Hindi
            "त्वचा", "चमड़ी", "दाद", "खुजली", "दाने", "मुंहासे", "कील", "बाल झड़ना", "रूसी", "chamdi", "khujli", "daane", "muhase", "bal jhadna",
            # Telugu
            "చర్మం", "దురద", "దద్దుర్లు", "మొటిమలు", "జుట్టు రాలడం", "చుండ్రు", "ఎలర్జీ", "charmam", "durada", "daddurlu", "motimalu", "juttu raladam"
        ],
        "reason_en": "Dermatology addresses all conditions concerning skin, hair, scalp, and nails.",
        "reason_hi": "त्वचा रोग विभाग त्वचा, बाल, खोपड़ी और नाखूनों से संबंधित सभी समस्याओं का इलाज करता है।",
        "reason_te": "డెర్మటాలజీ విభాగం చర్మం, దురద, దద్దుర్లు, మొటిమలు మరియు జుట్టు సమస్యల చికిత్సను అందిస్తుంది."
    },
    {
        "dept_code": "GYN-OBS",
        "dept_name": "Gynecology & Obstetrics",
        "dept_name_hi": "स्त्री एवं प्रसूति रोग विभाग (Gynecology)",
        "dept_name_te": "గైనకాలజీ & ప్రసూతి విభాగం (మహిళల సంరక్షణ)",
        "keywords": [
            "pregnant", "pregnancy", "periods", "menstrual", "pcos", "pcod", "pelvic", "maternity", "gyno", "obstetrics", "gynecology",
            # Hindi
            "गर्भवती", "गर्भावस्था", "पीरियड्स", "मासिक धर्म", "महिला रोग", "प्रसूति", "garbhavastha", "periods", "mahila rog",
            # Telugu
            "గర్భం", "గర్భిణీ", "రుతుక్రమం", "పీరియడ్స్", "ప్రసవం", "మహిళల ఆరోగ్యం", "పీసీవోడీ", "garbham", "garbhini", "periods", "mahilala samasya"
        ],
        "reason_en": "Gynecology & Obstetrics focuses on women's reproductive health, prenatal care, and motherhood.",
        "reason_hi": "स्त्री रोग विभाग महिलाओं के स्वास्थ्य, गर्भावस्था, प्रसव और मातृत्व देखभाल में विशेषज्ञ है।",
        "reason_te": "గైనకాలజీ విభాగం స్త్రీల ఆరోగ్యం, గర్భధారణ, ప్రసవం మరియు రుతుక్రమ సమస్యల పరిష్కారంలో నిపుణులు కలిగి ఉంది."
    },
    {
        "dept_code": "GEN-MED",
        "dept_name": "General Medicine",
        "dept_name_hi": "सामान्य चिकित्सा विभाग (General Medicine)",
        "dept_name_te": "జనరల్ మెడిసిన్ (సాధారణ వైద్య విభాగం)",
        "keywords": [
            "fever", "cold", "cough", "flu", "headache", "fatigue", "weakness", "vomiting", "diarrhea", "stomach pain", "infection", "diabetes", "checkup", "sugar level", "general doctor",
            # Hindi
            "बुखार", "खांसी", "जुकाम", "सर्दी", "सिरदर्द", "कमजोरी", "उल्टी", "दस्त", "पेट दर्द", "डायबिटीज", "शुगर", "bukhar", "khansi", "jukam", "sirdard", "kamzori", "pet dard",
            # Telugu
            "జ్వరం", "దగ్గు", "జలుబు", "తలనోప్పి", "నీరసం", "వాంతులు", "విరేచనాలు", "కడుపు నొప్పి", "షుగర్", "డయాబెటిస్", "సాధారణ పరీక్ష", "jwaram", "daggu", "jalubu", "talanoppi", "neerasam", "kadupu noppi", "sugar"
        ],
        "reason_en": "General Medicine diagnoses and treats common illnesses, metabolic disorders, and general adult wellness.",
        "reason_hi": "सामान्य चिकित्सा विभाग सामान्य बीमारियों, बुखार, सर्दी-खांसी और वयस्क स्वास्थ्य का इलाज करता है।",
        "reason_te": "జనరల్ మెడిసిన్ విభాగం జ్వరం, దగ్గు, జలుబు, బలహీనత మరియు సాధారణ ఆరోగ్య సమస్యలను నివారిస్తుంది."
    }
]

def detect_language(text: str, fallback_lang: str = "en") -> str:
    """Detect whether text is Telugu, Hindi, or English."""
    # Check for Telugu Unicode Range (0C00 - 0C7F)
    if re.search(r"[\u0C00-\u0C7F]", text):
        return "te"
    # Check for Devanagari Unicode Range (0900 - 097F)
    if re.search(r"[\u0900-\u097F]", text):
        return "hi"
    return fallback_lang or "en"


def analyze_chat_message(user_msg: str, user_lang: str = "en"):
    msg_clean = user_msg.lower().strip()
    # Detect language from input text or use user's explicit preference
    lang = detect_language(user_msg, fallback_lang=user_lang)
    
    # 1. Emergency Detection
    for kw in EMERGENCY_KEYWORDS:
        if kw in msg_clean:
            if lang == "hi":
                reply_text = (
                    "⚠️ **आपातकालीन चेतावनी (Critical Emergency):** आपके लक्षणों के अनुसार तत्काल चिकित्सा सहायता की आवश्यकता हो सकती है। "
                    "कृपया ऑनलाइन अपॉइंटमेंट की प्रतीक्षा न करें।\n\n"
                    f"🚨 **तुरंत यह कदम उठाएं:**\n"
                    f"1. आपातकालीन हेल्पलाइन नंबर: **{EMERGENCY_HELPLINE}** पर कॉल करें\n"
                    f"2. या सीधे हमारे 24/7 आपातकालीन ट्रामा केंद्र पर पहुंचे: **{HOSPITAL_ADDRESS}**\n"
                    f"3. रिसेप्शन हेल्पलाइन: **{RECEPTION_PHONE}**\n\n"
                    "यदि आप अकेले हैं, तो तुरंत किसी परिजन या पड़ोसी को सूचित करें।"
                )
                action_call = f"आपातकालीन कॉल करें ({EMERGENCY_HELPLINE})"
            elif lang == "te":
                reply_text = (
                    "⚠️ **అత్యవసర హెచ్చరిక (Emergency Warning):** మీ లక్షణాలు అత్యవసర వైద్య సహాయం అవసరమయ్యేవిగా కనిపిస్తున్నాయి. "
                    "దయచేసి ఆన్‌లైన్ అపాయింట్‌మెంట్ కోసం వేచి ఉండకండి.\n\n"
                    f"🚨 **వెంటనే చేయవలసినవి:**\n"
                    f"1. తక్షణ హెల్ప్‌లైన్ నంబర్: **{EMERGENCY_HELPLINE}** కి కాల్ చేయండి\n"
                    f"2. లేదా మా 24/7 అత్యవసర విభాగానికి రండి: **{HOSPITAL_ADDRESS}**\n"
                    f"3. హాస్పిటల్ రిసెప్షన్ నంబర్: **{RECEPTION_PHONE}**\n\n"
                    "మీరు ఒంటరిగా ఉంటే, వెంటనే కుటుంబ సభ్యులకు లేదా ఇతరులకు సమాచారం అందించండి."
                )
                action_call = f"అత్యవసర కాల్ చేయండి ({EMERGENCY_HELPLINE})"
            else:
                reply_text = (
                    "⚠️ **CRITICAL EMERGENCY WARNING:** Your description contains red-flag symptoms that may require urgent medical intervention. "
                    "Please do not wait for an online appointment. \n\n"
                    f"🚨 **Action to take immediately:**\n"
                    f"1. Dial Emergency Helpline: **{EMERGENCY_HELPLINE}**\n"
                    f"2. Or visit our 24/7 Emergency & Trauma Center at: **{HOSPITAL_ADDRESS}**\n"
                    f"3. Hospital Reception Helpline: **{RECEPTION_PHONE}**\n\n"
                    "If you are alone, alert a family member or neighbor immediately."
                )
                action_call = f"Call Emergency ({EMERGENCY_HELPLINE})"

            return {
                "category": "emergency",
                "is_emergency": True,
                "reply": reply_text,
                "suggested_actions": [
                    {"label": action_call, "type": "call", "value": f"tel:{EMERGENCY_HELPLINE}"},
                    {"label": "Hospital Directions" if lang == "en" else "अस्पताल का पता" if lang == "hi" else "ఆసుపత్రి చిరునామా", "type": "view_info", "value": "location"}
                ],
                "department_recommendation": None
            }
            
    # 2. Greeting / Introduction
    greeting_patterns = [
        r"^(hi|hello|hey|good morning|good afternoon|good evening|namaste|namaskaram|namaskar|halo)\b",
        r"^(नमस्ते|नमस्कार|प्रणाम|హలో|నమస్కారం)\b"
    ]
    if any(re.search(p, msg_clean) for p in greeting_patterns) and len(msg_clean.split()) <= 4:
        if lang == "hi":
            reply_text = (
                f"नमस्ते! 👋 **{HOSPITAL_NAME}** के डिजिटल हेल्थ असिस्टेंट में आपका स्वागत है।\n\n"
                "मैं आपकी इन कार्यों में सहायता कर सकता हूँ:\n"
                "• 🩺 **लक्षणों के आधार पर सही विभाग व डॉक्टर का सुझाव**\n"
                "• 📅 **ओपीडी अपॉइंटमेंट बुकिंग**\n"
                "• 🔍 **अपनी बुकिंग की स्थिति या रद्दीकरण जांचना**\n"
                "• ⏰ **ओपीडी का समय, फीस एवं अस्पताल नियम**\n\n"
                "आज मैं आपकी किस प्रकार मदद कर सकता हूँ?"
            )
            actions = [
                {"label": "अपॉइंटमेंट बुक करें", "type": "navigate", "value": "booking"},
                {"label": "मेरी बुकिंग जांचें", "type": "navigate", "value": "lookup"},
                {"label": "ओपीडी समय देखें", "type": "faq", "value": "What are your OPD timings?"}
            ]
        elif lang == "te":
            reply_text = (
                f"నమస్కారం! 👋 **{HOSPITAL_NAME}** వర్చువల్ అసిస్టెంట్‌కి స్వాగతం.\n\n"
                "నేను మీకు ఈ కింది విషయాలలో సహాయపడగలను:\n"
                "• 🩺 **లక్షణాల ఆధారంగా సరైన వైద్య విభాగాన్ని సిఫార్సు చేయడం**\n"
                "• 📅 **డాక్టర్ అపాయింట్‌మెంట్ బుకింగ్**\n"
                "• 🔍 **బుకింగ్ వివరాలు లేదా రద్దు స్థితి తనిఖీ చేయడం**\n"
                "• ⏰ **OPD సమయాలు, ఫీజులు మరియు ఆసుపత్రి నిబంధనలు**\n\n"
                "ఈ రోజు మీ ఆరోగ్యానికి సంబంధించి నేను ఎలా సహాయపడగలను?"
            )
            actions = [
                {"label": "అపాయింట్‌మెంట్ బుక్ చేయండి", "type": "navigate", "value": "booking"},
                {"label": "నా బుకింగ్ వివరాలు", "type": "navigate", "value": "lookup"},
                {"label": "OPD సమయాలు", "type": "faq", "value": "What are your OPD timings?"}
            ]
        else:
            reply_text = (
                f"Hello! 👋 Welcome to **{HOSPITAL_NAME}** Virtual Assistant.\n\n"
                "I can help you with:\n"
                "• 🩺 **Symptom guidance & department recommendation**\n"
                "• 📅 **Booking doctor appointments**\n"
                "• 🔍 **Checking appointment status or cancellations**\n"
                "• ⏰ **OPD timings, fees, and hospital guidelines**\n\n"
                "How can I assist you with your health today?"
            )
            actions = [
                {"label": "Book Appointment", "type": "navigate", "value": "booking"},
                {"label": "Check My Appointment", "type": "navigate", "value": "lookup"},
                {"label": "View OPD Timings", "type": "faq", "value": "What are your OPD timings?"}
            ]

        return {
            "category": "greeting",
            "is_emergency": False,
            "reply": reply_text,
            "suggested_actions": actions,
            "department_recommendation": None
        }

    # 3. Check for FAQs in database & Multilingual matching
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM faqs")
    faqs = [row_to_dict(r) for r in cursor.fetchall()]
    conn.close()
    
    best_faq = None
    best_score = 0
    words_in_msg = set(re.findall(r"\w+", msg_clean))
    
    # Multilingual FAQ keyword mappings
    lang_faq_triggers = {
        "opd": ["opd", "समय", "टाइमिंग", "टाइम", "సమయం", "సమయాలు", "timings", "timing", "hours"],
        "fees": ["फीस", "खर्च", "चार्ज", "ఫీజు", "ఖర్చు", "fees", "fee", "cost", "charge"],
        "documents": ["दस्तावेज", "कागजात", "డాక్యుమెంట్లు", "కాగితాలు", "documents", "bring", "carry"],
        "emergency": ["इमरजेंसी", "आपातकाल", "అత్యవసరం", "emergency", "ambulance"],
        "contact": ["संपर्क", "फोन नंबर", "पता", "చిరునామా", "ఫోన్ నంబర్", "contact", "address", "phone"],
        "booking": ["बुकिंग", "बुक", "బుకింగ్", "బుక్", "book", "appointment"],
        "cancellation": ["रद्द", "कैंसिल", "రద్దు", "కాన్సిల్", "cancel"]
    }
    
    matched_faq_cat = None
    for cat, triggers in lang_faq_triggers.items():
        if any(tr in msg_clean for tr in triggers):
            matched_faq_cat = cat
            break

    for faq in faqs:
        if matched_faq_cat and faq["category"] == matched_faq_cat:
            best_faq = faq
            break
        faq_kws = [k.strip().lower() for k in faq["keywords"].split(",") if k.strip()]
        score = 0
        for kw in faq_kws:
            if kw in msg_clean:
                score += 3
            elif any(w == kw for w in words_in_msg):
                score += 2
        if score > best_score and score >= 3:
            best_score = score
            best_faq = faq
            
    if best_faq:
        actions = []
        if best_faq["category"] in ["booking", "opd", "departments", "fees"]:
            actions.append({"label": "Book Appointment" if lang == "en" else "अपॉइंटमेंट बुक करें" if lang == "hi" else "అపాయింట్‌మెంట్ బుక్ చేయండి", "type": "navigate", "value": "booking"})
        if best_faq["category"] == "cancellation":
            actions.append({"label": "Go to Lookup / Cancel" if lang == "en" else "बुकिंग देखें / रद्द करें" if lang == "hi" else "బుకింగ్ వివరాలు / రద్దు", "type": "navigate", "value": "lookup"})
            
        # Localized FAQ answers
        faq_ans_hi = {
            "opd": f"ओपीडी परामर्श का समय सोमवार से शनिवार सुबह 08:00 बजे से शाम 04:00 बजे तक है। रविवार और राष्ट्रीय अवकाश पर ओपीडी बंद रहती है।",
            "fees": f"डॉक्टर परामर्श शुल्क विशेषज्ञता के आधार पर ₹500 से ₹800 के बीच है (जनरल मेडिसिन: ₹500, बाल रोग: ₹550-600, हृदय रोग: ₹750-800, हड्डी रोग: ₹600-700)।",
            "documents": f"कृपया साथ लाएं: 1) सरकारी पहचान पत्र (आधार/वोटर आईडी), 2) अपॉइंटमेंट रेफरेंस आईडी, 3) पिछले मेडिकल पर्चे और टेस्ट रिपोर्ट।",
            "contact": f"अस्पताल रिसेप्शन: {RECEPTION_PHONE} | पता: {HOSPITAL_ADDRESS} | आपातकालीन: {EMERGENCY_HELPLINE}"
        }
        faq_ans_te = {
            "opd": f"మా OPD సంప్రదింపుల సమయాలు సోమవారం నుండి శనివారం వరకు ఉదయం 08:00 నుండి సాయంత్రం 04:00 వరకు. ఆదివారాలు మరియు జాతీయ సెలవు దినాల్లో OPD మూసివేయబడుతుంది.",
            "fees": f"డాక్టర్ కన్సల్టేషన్ ఫీజు స్పెషాలిటీని బట్టి ₹500 నుండి ₹800 వరకు ఉంటుంది (జనరల్ మెడిసిన్: ₹500, పీడియాట్రిక్స్: ₹550-600, కార్డియాలజీ: ₹750-800, ఆర్థోపెడిక్స్: ₹600-700).",
            "documents": f"దయచేసి తీసుకురండి: 1) ప్రభుత్వం జారీ చేసిన ఫోటో గుర్తింపు కార్డు (ఆధార్), 2) అపాయింట్‌మెంట్ రిఫరెన్స్ నంబర్, 3) పాత ప్రిస్క్రిప్షన్లు మరియు ల్యాబ్ రిపోర్టులు.",
            "contact": f"ఆసుపత్రి రిసెప్షన్: {RECEPTION_PHONE} | చిరునామా: {HOSPITAL_ADDRESS} | అత్యవసర హెల్ప్‌లైన్: {EMERGENCY_HELPLINE}"
        }

        ans = best_faq["answer"]
        if lang == "hi" and best_faq["category"] in faq_ans_hi:
            ans = faq_ans_hi[best_faq["category"]]
        elif lang == "te" and best_faq["category"] in faq_ans_te:
            ans = faq_ans_te[best_faq["category"]]

        return {
            "category": f"faq_{best_faq['category']}",
            "is_emergency": False,
            "reply": f"📌 **{best_faq['question']}**\n\n{ans}",
            "suggested_actions": actions,
            "department_recommendation": None
        }

    # 4. Symptom Matching & Clinical Department Recommendation
    matched_dept = None
    for mapping in SYMPTOM_DEPARTMENT_MAP:
        for kw in mapping["keywords"]:
            if kw in msg_clean:
                matched_dept = mapping
                break
        if matched_dept:
            break
            
    if matched_dept:
        # Fetch doctors from database for this department
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT doc.id, doc.name, doc.specialization, doc.consultation_fee, dept.id as department_id, dept.name as department_name
            FROM doctors doc
            JOIN departments dept ON doc.department_id = dept.id
            WHERE dept.code = ? AND doc.is_active = 1
        """, (matched_dept["dept_code"],))
        matched_doctors = [row_to_dict(r) for r in cursor.fetchall()]
        conn.close()
        
        doctor_names = ", ".join([d["name"] for d in matched_doctors[:2]]) if matched_doctors else "Specialists available"
        dept_id = matched_doctors[0]["department_id"] if matched_doctors else None
        
        if lang == "hi":
            reply_text = (
                f"आपके द्वारा बताए गए लक्षणों के आधार पर, हमारे **{matched_dept.get('dept_name_hi', matched_dept['dept_name'])}** से परामर्श करने की सलाह दी जाती है।\n\n"
                f"💡 **कारण:** {matched_dept.get('reason_hi', matched_dept['reason_en'])}\n\n"
                f"👨‍⚕️ **उपलब्ध विशेषज्ञ:** {doctor_names}\n\n"
                "क्या आप इस विभाग में ओपीडी अपॉइंटमेंट बुक करना चाहते हैं?"
            )
            act_label = f"{matched_dept['dept_name']} में बुक करें"
        elif lang == "te":
            reply_text = (
                f"మీరు వివరించిన లక్షణాల ప్రకారం, మా **{matched_dept.get('dept_name_te', matched_dept['dept_name'])}** ని సంప్రదించడం మంచిది.\n\n"
                f"💡 **వివరణ:** {matched_dept.get('reason_te', matched_dept['reason_en'])}\n\n"
                f"👨‍⚕️ **అందుబాటులో ఉన్న వైద్యులు:** {doctor_names}\n\n"
                "మీరు ఈ విభాగంలో అపాయింట్‌మెంట్ బుక్ చేసుకోవాలనుకుంటున్నారా?"
            )
            act_label = f"{matched_dept['dept_name']} లో బుక్ చేయండి"
        else:
            reply_text = (
                f"Based on what you described, a consultation with our **{matched_dept['dept_name']}** department is recommended.\n\n"
                f"💡 **Why?** {matched_dept['reason_en']}\n\n"
                f"👨‍⚕️ **Doctors on duty:** {doctor_names}\n\n"
                "Would you like to book an OPD appointment with this department?"
            )
            act_label = f"Book in {matched_dept['dept_name']}"

        return {
            "category": "symptom_triage",
            "is_emergency": False,
            "reply": reply_text,
            "suggested_actions": [
                {"label": act_label, "type": "book_dept", "value": dept_id},
                {"label": "OPD Timings" if lang == "en" else "ओपीडी समय" if lang == "hi" else "OPD సమయాలు", "type": "faq", "value": "What are your OPD timings?"}
            ],
            "department_recommendation": {
                "department_id": dept_id,
                "department_name": matched_dept["dept_name"],
                "code": matched_dept["dept_code"]
            }
        }

    # 5. Fallback Response with Helpful Navigation
    if lang == "hi":
        fallback_reply = (
            "मैं आपकी स्वास्थ्य सहायता के लिए यहाँ हूँ! सही सलाह प्राप्त करने के लिए:\n\n"
            "• अपने लक्षण बताएं (जैसे: *'मुझे घुटने में दर्द है'* या *'बच्चे को बुखार है'*)\n"
            "• या ओपीडी का समय, डॉक्टर की जानकारी या अपॉइंटमेंट के बारे में पूछें।"
        )
    elif lang == "te":
        fallback_reply = (
            "నేను మీకు సహాయపడటానికి సిద్ధంగా ఉన్నాను! సరైన సమాచారం కోసం:\n\n"
            "• మీ లక్షణాలను తెలపండి (ఉదాహరణకు: *'నాకు మోకాలి నొప్పిగా ఉంది'* లేదా *'బాబుకి జ్వరం వచ్చింది'*)\n"
            "• లేదా OPD సమయాలు, డాక్టర్ ఫీజులు లేదా అపాయింట్‌మెంట్ గురించి అడగండి."
        )
    else:
        fallback_reply = (
            "I'm here to help navigate our hospital services! To give you the most accurate assistance:\n\n"
            "• Mention your symptoms (e.g., *'I have persistent knee pain'* or *'baby has a mild fever'*)\n"
            "• Or ask about OPD timings, doctors, fee structures, or appointment cancellations."
        )

    return {
        "category": "general",
        "is_emergency": False,
        "reply": fallback_reply,
        "suggested_actions": [
            {"label": "Book Appointment" if lang == "en" else "अपॉइंटमेंट बुक करें" if lang == "hi" else "అపాయింట్‌మెంట్ బుక్ చేయండి", "type": "navigate", "value": "booking"},
            {"label": "Browse Departments" if lang == "en" else "विभाग देखें" if lang == "hi" else "విభాగాలు చూడండి", "type": "navigate", "value": "departments"},
            {"label": "OPD Timings" if lang == "en" else "ओपीडी समय" if lang == "hi" else "OPD సమయాలు", "type": "faq", "value": "What are your OPD timings?"}
        ],
        "department_recommendation": None
    }


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    message = str(data.get("message", "")).strip()
    language = str(data.get("language", "en")).strip().lower()
    
    if not message:
        return jsonify({"error": "Message cannot be empty"}), 400
        
    analysis = analyze_chat_message(message, user_lang=language)
    
    # Attach medical disclaimer in selected language
    if language == "hi":
        disclaimer = "ℹ️ चिकित्सा अस्वीकरण: केयरकनेक्ट असिस्टेंट सामान्य स्वास्थ्य जानकारी और मार्गदर्शन प्रदान करता है। यह औपचारिक नैदानिक ​​जांच या आपातकालीन देखभाल का विकल्प नहीं है।"
    elif language == "te":
        disclaimer = "ℹ️ వైద్య నిరాకరణ: కేర్‌కనెక్ట్ అసిస్టెంట్ కేవలం ఆసుపత్రి సమాచారం మరియు సాధారణ మార్గదర్శకత్వాన్ని అందిస్తుంది. ఇది ప్రత్యక్ష వైద్య చికిత్స లేదా అత్యవసర సంరక్షణకు ప్రత్యామ్నాయం కాదు."
    else:
        disclaimer = "ℹ️ Medical Disclaimer: CareConnect Assistant provides hospital navigation and general health information. It is not a substitute for formal clinical diagnosis or emergency medical care."
    
    return jsonify({
        "reply": analysis["reply"],
        "category": analysis["category"],
        "is_emergency": analysis["is_emergency"],
        "suggested_actions": analysis["suggested_actions"],
        "department_recommendation": analysis["department_recommendation"],
        "disclaimer": disclaimer,
        "language": language,
        "timestamp": datetime.datetime.now().isoformat()
    })


# --- Admin Overview Endpoint (Demo) ---

@app.route("/api/admin/appointments", methods=["GET"])
def admin_appointments():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    
    from config import ADMIN_SESSION_TOKEN
    if token != ADMIN_SESSION_TOKEN:
        pass
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.*, d.name as doctor_name, dept.name as department_name
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        JOIN departments dept ON a.department_id = dept.id
        ORDER BY a.appointment_date DESC, a.time_slot ASC
        LIMIT 50
    """)
    appts = [row_to_dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify(appts)


if __name__ == "__main__":
    print(f"Starting CareConnect Backend on port {PORT}...")
    app.run(host="0.0.0.0", port=PORT, debug=DEBUG)
