import datetime
from database import get_db_connection, init_db

DEMO_DEPARTMENTS = [
    {
        "name": "General Medicine",
        "code": "GEN-MED",
        "description": "Comprehensive primary healthcare, routine adult checkups, chronic disease management, and internal medicine diagnostics.",
        "icon": "Stethoscope",
        "opd_timings": "Mon–Sat: 08:00 AM – 04:00 PM",
        "location": "Block A, 1st Floor, OPD Wing"
    },
    {
        "name": "Pediatrics",
        "code": "PED",
        "description": "Compassionate healthcare for newborns, children, and adolescents, including immunization and developmental tracking.",
        "icon": "Baby",
        "opd_timings": "Mon–Sat: 09:00 AM – 03:00 PM",
        "location": "Block B, Ground Floor, Child Health Wing"
    },
    {
        "name": "Cardiology",
        "code": "CARD",
        "description": "Cardiovascular evaluations, ECG, 2D Echo, hypertension management, and heart health preventative screenings.",
        "icon": "HeartPulse",
        "opd_timings": "Mon–Fri: 09:30 AM – 03:30 PM, Sat: 09:30 AM – 01:00 PM",
        "location": "Block C, 2nd Floor, Heart Care Center"
    },
    {
        "name": "Orthopedics",
        "code": "ORTH",
        "description": "Treatment of musculoskeletal disorders, joint pain, sports injuries, fractures, and rehabilitation guidance.",
        "icon": "Bone",
        "opd_timings": "Mon–Sat: 08:30 AM – 03:30 PM",
        "location": "Block A, Ground Floor, Bone & Joint Clinic"
    },
    {
        "name": "Dermatology",
        "code": "DERM",
        "description": "Diagnosis and management of skin, hair, and nail conditions, allergies, and cosmetic dermatology.",
        "icon": "Sparkles",
        "opd_timings": "Mon–Sat: 10:00 AM – 04:00 PM",
        "location": "Block B, 2nd Floor, Derma Suite"
    },
    {
        "name": "Gynecology & Obstetrics",
        "code": "GYN-OBS",
        "description": "Maternal health, antenatal care, reproductive medicine, and routine women's wellness screenings.",
        "icon": "Flower2",
        "opd_timings": "Mon–Sat: 09:00 AM – 03:30 PM",
        "location": "Block C, 1st Floor, Women's Care"
    }
]

DEMO_DOCTORS = [
    # General Medicine
    {
        "dept_code": "GEN-MED",
        "name": "Dr. Rajesh Sharma (DEMO)",
        "qualification": "MBBS, MD (Internal Medicine)",
        "specialization": "Preventive Medicine & Adult Care",
        "experience_years": 14,
        "room_no": "OPD-101",
        "available_days": "Mon,Tue,Wed,Thu,Fri,Sat",
        "consultation_fee": 500
    },
    {
        "dept_code": "GEN-MED",
        "name": "Dr. Sunita Kulkarni (DEMO)",
        "qualification": "MBBS, DNB (General Medicine)",
        "specialization": "Geriatrics & Lifestyle Diseases",
        "experience_years": 10,
        "room_no": "OPD-102",
        "available_days": "Mon,Tue,Wed,Thu,Fri",
        "consultation_fee": 500
    },
    # Pediatrics
    {
        "dept_code": "PED",
        "name": "Dr. Ananya Iyer (DEMO)",
        "qualification": "MBBS, MD (Pediatrics), DCH",
        "specialization": "Child Nutrition & Neonatology",
        "experience_years": 12,
        "room_no": "OPD-201",
        "available_days": "Mon,Tue,Wed,Thu,Fri,Sat",
        "consultation_fee": 600
    },
    {
        "dept_code": "PED",
        "name": "Dr. Rohan Verma (DEMO)",
        "qualification": "MBBS, MD (Pediatrics)",
        "specialization": "Pediatric Allergy & Asthma",
        "experience_years": 8,
        "room_no": "OPD-202",
        "available_days": "Tue,Thu,Sat",
        "consultation_fee": 550
    },
    # Cardiology
    {
        "dept_code": "CARD",
        "name": "Dr. Arvind Menon (DEMO)",
        "qualification": "MBBS, MD, DM (Cardiology)",
        "specialization": "Interventional Cardiology & Preventive Heart Care",
        "experience_years": 18,
        "room_no": "OPD-301",
        "available_days": "Mon,Tue,Wed,Thu,Fri",
        "consultation_fee": 800
    },
    {
        "dept_code": "CARD",
        "name": "Dr. Meera Nambiar (DEMO)",
        "qualification": "MBBS, DNB (Cardiology)",
        "specialization": "Echocardiography & Cardiac Rhythm",
        "experience_years": 11,
        "room_no": "OPD-302",
        "available_days": "Mon,Wed,Fri,Sat",
        "consultation_fee": 750
    },
    # Orthopedics
    {
        "dept_code": "ORTH",
        "name": "Dr. Vikramaditya Sen (DEMO)",
        "qualification": "MBBS, MS (Orthopedics), M.Ch",
        "specialization": "Joint Replacement & Arthroscopy",
        "experience_years": 16,
        "room_no": "OPD-401",
        "available_days": "Mon,Tue,Thu,Fri,Sat",
        "consultation_fee": 700
    },
    {
        "dept_code": "ORTH",
        "name": "Dr. Pooja Agarwal (DEMO)",
        "qualification": "MBBS, DNB (Orthopedics)",
        "specialization": "Spine & Sports Rehabilitation",
        "experience_years": 9,
        "room_no": "OPD-402",
        "available_days": "Wed,Fri,Sat",
        "consultation_fee": 600
    },
    # Dermatology
    {
        "dept_code": "DERM",
        "name": "Dr. Kavita Nair (DEMO)",
        "qualification": "MBBS, MD (Dermatology, Venereology & Leprosy)",
        "specialization": "Clinical Dermatology & Trichology",
        "experience_years": 13,
        "room_no": "OPD-501",
        "available_days": "Mon,Tue,Wed,Thu,Fri,Sat",
        "consultation_fee": 650
    },
    # Gynecology
    {
        "dept_code": "GYN-OBS",
        "name": "Dr. Deepa Mukherjee (DEMO)",
        "qualification": "MBBS, MS (OB-GYN), FICOG",
        "specialization": "High-Risk Pregnancy & Laparoscopy",
        "experience_years": 15,
        "room_no": "OPD-601",
        "available_days": "Mon,Tue,Wed,Thu,Fri",
        "consultation_fee": 700
    }
]

DEMO_FAQS = [
    {
        "category": "opd",
        "question": "What are your OPD timings?",
        "keywords": "opd,timings,timing,hours,open,time,schedule,when open,working hours,consultation hours",
        "answer": "Our demo OPD general consultation hours are Monday to Saturday from 08:00 AM to 04:00 PM (IST). Specialist departments operate between 09:00 AM and 03:30 PM. The OPD remains closed on Sundays and national public holidays."
    },
    {
        "category": "departments",
        "question": "Which departments are available?",
        "keywords": "departments,available,specialties,speciality,services,divisions,wings,specializations",
        "answer": "The demo hospital features 6 clinical departments: General Medicine, Pediatrics, Cardiology, Orthopedics, Dermatology, and Gynecology & Obstetrics. You can view all doctors and schedule slots in our Departments Directory."
    },
    {
        "category": "booking",
        "question": "How can I book an appointment?",
        "keywords": "book,booking,appointment,schedule,reserve,take appointment,how to book,get slot",
        "answer": "You can book a demo appointment directly on this portal! Simply navigate to the 'Book Appointment' page, select your desired Department, choose an available Doctor, pick a date and time slot, enter your patient details, and submit. You will instantly receive a unique Appointment Reference ID."
    },
    {
        "category": "cancellation",
        "question": "How do I cancel an appointment?",
        "keywords": "cancel,cancellation,reschedule,drop,revoke,remove appointment,cancel booking",
        "answer": "To cancel an appointment, visit our 'Appointment Lookup' page. Enter your Appointment Reference ID and the registered contact number. Click 'Lookup Appointment', and if active, click 'Cancel Appointment' with an optional cancellation note."
    },
    {
        "category": "documents",
        "question": "What should I bring to my appointment?",
        "keywords": "bring,documents,id,carry,papers,reports,what to bring,requirements,prescriptions",
        "answer": "Please bring: 1) A valid government photo ID (Aadhaar / Voter ID / Passport), 2) Your CareConnect Appointment Reference ID, 3) Past medical records, discharge summaries, or previous prescriptions, and 4) Current medication list and recent lab diagnostic test reports."
    },
    {
        "category": "emergency",
        "question": "What should I do in an emergency?",
        "keywords": "emergency,urgent,chest pain,heart attack,ambulance,bleeding,accident,critical,112,trauma",
        "answer": "EMERGENCY NOTICE: If this is a medical emergency, do not wait for an online appointment. In India, immediately call 112 or visit your nearest 24/7 hospital emergency trauma center."
    },
    {
        "category": "contact",
        "question": "What are the hospital contact details?",
        "keywords": "contact,phone,call,number,reception,email,address,where located,location",
        "answer": "Demo Hospital Contact: Sample Reception Desk: +91 11 2345 6789 (Mon–Sat, 8 AM–6 PM). Email: reception.demo@careconnect-hospital.local. Location: Plot 42, Health City, Sector 5, New Delhi - 110001 (DEMO SAMPLE ADDRESS)."
    },
    {
        "category": "fees",
        "question": "What are the doctor consultation fees?",
        "keywords": "fee,fees,cost,charges,price,consultation fee,how much",
        "answer": "Demo consultation fees range between ₹500 and ₹800 depending on the specialist (General Medicine: ₹500, Pediatrics: ₹550–₹600, Cardiology: ₹750–₹800, Orthopedics: ₹600–₹700, Dermatology: ₹650). Fees are payable at the demo reception counter."
    },
    {
        "category": "visiting",
        "question": "What are the in-patient visitor visiting hours?",
        "keywords": "visitor,visiting,visiting hours,patient visit,ward timings,see patient",
        "answer": "General in-patient visiting hours are 04:30 PM to 06:30 PM daily. Only one visitor pass is permitted per patient at a time to maintain infection control and patient rest."
    }
]

def seed_database():
    """Initializes tables and populates demo data."""
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Seed Departments
    for dept in DEMO_DEPARTMENTS:
        cursor.execute("""
            INSERT OR IGNORE INTO departments (name, code, description, icon, opd_timings, location)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (dept["name"], dept["code"], dept["description"], dept["icon"], dept["opd_timings"], dept["location"]))

    # Map department code to DB ID
    cursor.execute("SELECT id, code FROM departments")
    dept_map = {row["code"]: row["id"] for row in cursor.fetchall()}

    # Seed Doctors
    for doc in DEMO_DOCTORS:
        dept_id = dept_map.get(doc["dept_code"])
        if dept_id:
            # Check if doctor already exists
            cursor.execute("SELECT id FROM doctors WHERE name = ? AND department_id = ?", (doc["name"], dept_id))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO doctors (department_id, name, qualification, specialization, experience_years, room_no, available_days, consultation_fee)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    dept_id,
                    doc["name"],
                    doc["qualification"],
                    doc["specialization"],
                    doc["experience_years"],
                    doc["room_no"],
                    doc["available_days"],
                    doc["consultation_fee"]
                ))

    # Seed FAQs
    for faq in DEMO_FAQS:
        cursor.execute("SELECT id FROM faqs WHERE question = ?", (faq["question"],))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO faqs (category, question, answer, keywords)
                VALUES (?, ?, ?, ?)
            """, (faq["category"], faq["question"], faq["answer"], faq["keywords"]))

    # Seed sample initial appointments for realistic demo demonstration
    cursor.execute("SELECT COUNT(*) as count FROM appointments")
    if cursor.fetchone()["count"] == 0:
        cursor.execute("SELECT id, department_id FROM doctors LIMIT 2")
        sample_docs = cursor.fetchall()
        if sample_docs:
            today_str = datetime.date.today().strftime("%Y-%m-%d")
            tomorrow_str = (datetime.date.today() + datetime.timedelta(days=1)).strftime("%Y-%m-%d")
            
            sample_appts = [
                {
                    "ref": "CC-DEMO-1001",
                    "name": "Aarav Sharma",
                    "phone": "9876543210",
                    "email": "aarav.demo@example.com",
                    "dept_id": sample_docs[0]["department_id"],
                    "doc_id": sample_docs[0]["id"],
                    "date": tomorrow_str,
                    "slot": "09:30 AM",
                    "notes": "Routine general health checkup (Demo)",
                    "status": "CONFIRMED"
                },
                {
                    "ref": "CC-DEMO-1002",
                    "name": "Neha Patel",
                    "phone": "9123456780",
                    "email": "neha.demo@example.com",
                    "dept_id": sample_docs[1]["department_id"],
                    "doc_id": sample_docs[1]["id"],
                    "date": tomorrow_str,
                    "slot": "10:30 AM",
                    "notes": "Vaccination consultation for toddler (Demo)",
                    "status": "CONFIRMED"
                }
            ]
            now_str = datetime.datetime.now().isoformat()
            for sa in sample_appts:
                cursor.execute("""
                    INSERT INTO appointments 
                    (reference_id, patient_name, contact_number, email, department_id, doctor_id, appointment_date, time_slot, notes, status, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    sa["ref"], sa["name"], sa["phone"], sa["email"],
                    sa["dept_id"], sa["doc_id"], sa["date"], sa["slot"],
                    sa["notes"], sa["status"], now_str, now_str
                ))

    conn.commit()
    conn.close()
    print("Database schema and demo seed data successfully populated.")

if __name__ == "__main__":
    seed_database()
