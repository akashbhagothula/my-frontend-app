import React, { useState, useEffect } from 'react';
import {
  Building2,
  Stethoscope,
  Clock,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  HeartPulse,
  Baby,
  Bone,
  Sparkles,
  Flower2,
  ArrowRight,
  UserPlus,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const FAQS = [
  {
    q: 'What are the hospital OPD timings?',
    a: 'Our OPD consultation hours operate Monday to Saturday from 08:00 AM to 04:00 PM (IST). Specialist departments see patients between 09:00 AM and 03:30 PM. The OPD is closed on Sundays and national public holidays.'
  },
  {
    q: 'What documents should I carry for my appointment?',
    a: 'Please carry: 1) Government-issued photo ID, 2) CareConnect Appointment Reference ID, 3) Past medical records, prescriptions, or discharge summaries, and 4) Recent diagnostic laboratory reports.'
  },
  {
    q: 'How do consultation fees work?',
    a: 'Doctor consultation fees range between ₹500 and ₹800 depending on the medical specialty. Fees are payable directly at the OPD registration counter upon arrival.'
  },
  {
    q: 'Can I cancel or reschedule an appointment?',
    a: 'Yes! Navigate to the "Track Booking" tab, enter your unique Reference ID (e.g. CC-XXXXXX), and click "Cancel Appointment". You can then select a new slot.'
  },
  {
    q: 'What should I do during a medical emergency?',
    a: 'In any life-threatening situation (chest pain, acute breathlessness, heavy bleeding, stroke signs), immediately call 112 or visit our 24/7 Emergency & Trauma wing.'
  },
  {
    q: 'What are in-patient visiting hours?',
    a: 'Visiting hours for admitted patients are strictly from 04:30 PM to 06:30 PM daily. Only one visitor pass is permitted per patient at a time.'
  }
];

export default function HospitalDirectory({ onBookDepartment }) {
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [hospitalInfo, setHospitalInfo] = useState(null);
  const [activeFaq, setActiveFaq] = useState(null);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');

  // Add Doctor Modal State
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
  const [submittingDoctor, setSubmittingDoctor] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });
  
  // Doctor Delete Confirmation Modal
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  const [deletingDoctor, setDeletingDoctor] = useState(false);

  // New Doctor Form Data
  const [newDoctorData, setNewDoctorData] = useState({
    name: '',
    department_id: '',
    qualification: 'MBBS, MD',
    specialization: '',
    experience_years: 8,
    room_no: 'OPD-105',
    consultation_fee: 600,
    available_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  });

  const loadData = () => {
    fetch(`${API_BASE}/hospital-info`)
      .then((res) => res.json())
      .then((d) => setHospitalInfo(d))
      .catch((e) => console.error(e));

    fetch(`${API_BASE}/departments`)
      .then((res) => res.json())
      .then((d) => {
        setDepartments(d);
        if (d.length > 0 && !newDoctorData.department_id) {
          setNewDoctorData((prev) => ({ ...prev, department_id: d[0].id }));
        }
      })
      .catch((e) => console.error(e));

    fetch(`${API_BASE}/doctors`)
      .then((res) => res.json())
      .then((d) => setDoctors(d))
      .catch((e) => console.error(e));
  };

  useEffect(() => {
    loadData();
  }, []);

  const getDeptIcon = (code) => {
    switch (code) {
      case 'CARD': return <HeartPulse size={20} />;
      case 'PED': return <Baby size={20} />;
      case 'ORTH': return <Bone size={20} />;
      case 'DERM': return <Sparkles size={20} />;
      case 'GYN-OBS': return <Flower2 size={20} />;
      default: return <Stethoscope size={20} />;
    }
  };

  const handleDayToggle = (day) => {
    setNewDoctorData((prev) => {
      const exists = prev.available_days.includes(day);
      return {
        ...prev,
        available_days: exists
          ? prev.available_days.filter((d) => d !== day)
          : [...prev.available_days, day]
      };
    });
  };

  const handleAddDoctorSubmit = async (e) => {
    e.preventDefault();
    if (!newDoctorData.name.trim() || !newDoctorData.department_id || !newDoctorData.specialization.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Please fill in doctor name, department, and specialization.' });
      return;
    }

    setSubmittingDoctor(true);
    setFeedbackMsg({ type: '', text: '' });

    try {
      const res = await fetch(`${API_BASE}/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDoctorData.name,
          department_id: Number(newDoctorData.department_id),
          qualification: newDoctorData.qualification,
          specialization: newDoctorData.specialization,
          experience_years: Number(newDoctorData.experience_years),
          room_no: newDoctorData.room_no,
          consultation_fee: Number(newDoctorData.consultation_fee),
          available_days: newDoctorData.available_days.join(',') || 'Mon,Tue,Wed,Thu,Fri'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add doctor.');
      }

      setFeedbackMsg({ type: 'success', text: `Dr. ${data.doctor.name} added successfully!` });
      setIsAddDoctorOpen(false);
      
      // Reset form
      setNewDoctorData({
        name: '',
        department_id: departments[0]?.id || '',
        qualification: 'MBBS, MD',
        specialization: '',
        experience_years: 8,
        room_no: 'OPD-105',
        consultation_fee: 600,
        available_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
      });

      // Reload doctors list
      loadData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setSubmittingDoctor(false);
    }
  };

  const handleConfirmDeleteDoctor = async () => {
    if (!doctorToDelete) return;
    setDeletingDoctor(true);

    try {
      const res = await fetch(`${API_BASE}/doctors/${doctorToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove doctor.');
      }

      setFeedbackMsg({
        type: 'success',
        text: `${doctorToDelete.name} has been removed from hospital active roster.`
      });
      setDoctorToDelete(null);
      loadData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setDeletingDoctor(false);
    }
  };

  const filteredDoctors = selectedDeptFilter === 'ALL'
    ? doctors
    : doctors.filter((doc) => doc.department_id === Number(selectedDeptFilter));

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Toast Feedback Banner */}
      {feedbackMsg.text && (
        <div
          style={{
            background: feedbackMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: '1px solid ' + (feedbackMsg.type === 'success' ? '#86efac' : '#fecaca'),
            color: feedbackMsg.type === 'success' ? '#166534' : '#991b1b',
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg({ type: '', text: '' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Hospital Overview Card */}
      {hospitalInfo && (
        <div
          className="card animate-fade-in"
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%)',
            borderColor: '#ccfbf1'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1.5rem', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase' }}>
                Healthcare Facility Information
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#134e4a', margin: '4px 0 8px 0' }}>
                {hospitalInfo.hospital_name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#115e59' }}>
                <MapPin size={16} /> {hospitalInfo.address}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ background: '#ffffff', padding: '0.75rem 1.25rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>OPD Consultation Hours</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{hospitalInfo.opd_hours}</div>
              </div>
              <div style={{ background: '#ffffff', padding: '0.75rem 1.25rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Reception Desk</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0284c7' }}>{hospitalInfo.reception_phone}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Departments Grid */}
      <div>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Clinical Departments</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Explore specialized clinical divisions and consultation schedules.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {departments.map((dept) => (
            <div key={dept.id} className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {getDeptIcon(dept.code)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{dept.name}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dept.code}</span>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    background: '#f1f5f9',
                    padding: '3px 8px',
                    borderRadius: '99px',
                    fontWeight: 600
                  }}
                >
                  {doctors.filter((d) => d.department_id === dept.id).length} Doctors
                </span>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', flex: 1 }}>
                {dept.description}
              </p>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.85rem', fontSize: '0.8rem', color: 'var(--text-subtle)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                  <Clock size={13} /> {dept.opd_timings}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={13} /> {dept.location}
                </div>
              </div>

              <button
                onClick={() => onBookDepartment && onBookDepartment(dept.id)}
                className="btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  background: 'var(--primary)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  padding: '0.65rem'
                }}
              >
                Book in {dept.name} <ArrowRight size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Specialist Doctors Directory & Management */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Doctors & Medical Faculty</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Consult with board-certified physicians or manage hospital specialists.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Add Doctor Trigger Button */}
            <button
              type="button"
              onClick={() => setIsAddDoctorOpen(true)}
              className="btn-primary"
              style={{
                background: 'linear-gradient(135deg, #0284c7, #0d9488)',
                color: '#fff',
                padding: '0.6rem 1.25rem',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <UserPlus size={16} /> Add New Doctor
            </button>
          </div>
        </div>

        {/* Department Filter Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <button
            onClick={() => setSelectedDeptFilter('ALL')}
            className={`quick-chip ${selectedDeptFilter === 'ALL' ? 'active' : ''}`}
            style={{
              background: selectedDeptFilter === 'ALL' ? 'var(--primary)' : '#fff',
              color: selectedDeptFilter === 'ALL' ? '#fff' : 'var(--text-muted)',
              fontWeight: 600
            }}
          >
            All Doctors ({doctors.length})
          </button>
          {departments.map((d) => {
            const count = doctors.filter((doc) => doc.department_id === d.id).length;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDeptFilter(String(d.id))}
                className={`quick-chip ${selectedDeptFilter === String(d.id) ? 'active' : ''}`}
                style={{
                  background: selectedDeptFilter === String(d.id) ? 'var(--primary)' : '#fff',
                  color: selectedDeptFilter === String(d.id) ? '#fff' : 'var(--text-muted)',
                  fontWeight: 600
                }}
              >
                {d.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Doctors Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="card animate-fade-in"
              style={{
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: '1px solid var(--border)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #0284c7, #0d9488)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      flexShrink: 0
                    }}
                  >
                    <Stethoscope size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.975rem', fontWeight: 700, color: 'var(--text-main)' }}>{doc.name}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary-dark)', fontWeight: 600 }}>{doc.specialization}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                      {doc.qualification} • {doc.experience_years} yrs exp
                    </div>
                  </div>
                </div>

                {/* Remove Doctor Button */}
                <button
                  type="button"
                  onClick={() => setDoctorToDelete(doc)}
                  title="Remove this doctor"
                  style={{
                    background: '#fff1f2',
                    border: '1px solid #fecdd3',
                    color: '#e11d48',
                    borderRadius: '8px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Department: <strong>{doc.department_name}</strong>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  marginBottom: '0.75rem',
                  marginTop: 'auto'
                }}
              >
                <span>Room: <strong>{doc.room_no}</strong></span>
                <span style={{ color: '#0f766e', fontWeight: 700 }}>Fee: ₹{doc.consultation_fee}</span>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '1rem' }}>
                Schedule: {doc.available_days}
              </div>

              <button
                onClick={() => onBookDepartment && onBookDepartment(doc.department_id)}
                className="btn-primary"
                style={{
                  background: '#0284c7',
                  color: '#fff',
                  justifyContent: 'center',
                  fontSize: '0.825rem',
                  padding: '0.55rem'
                }}
              >
                Book Appointment
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Doctor Modal */}
      {isAddDoctorOpen && (
        <div className="modal-overlay" onClick={() => setIsAddDoctorOpen(false)}>
          <div
            className="modal-content animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '600px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <UserPlus size={22} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Add New Doctor</h3>
              </div>
              <button
                onClick={() => setIsAddDoctorOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddDoctorSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Doctor Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="form-input"
                    value={newDoctorData.name}
                    onChange={(e) => setNewDoctorData({ ...newDoctorData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select
                    className="form-select"
                    required
                    value={newDoctorData.department_id}
                    onChange={(e) => setNewDoctorData({ ...newDoctorData, department_id: e.target.value })}
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Specialization *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Preventive Cardiology"
                    className="form-input"
                    value={newDoctorData.specialization}
                    onChange={(e) => setNewDoctorData({ ...newDoctorData, specialization: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Qualifications</label>
                  <input
                    type="text"
                    placeholder="e.g. MBBS, MD, DM"
                    className="form-input"
                    value={newDoctorData.qualification}
                    onChange={(e) => setNewDoctorData({ ...newDoctorData, qualification: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Experience (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    className="form-input"
                    value={newDoctorData.experience_years}
                    onChange={(e) => setNewDoctorData({ ...newDoctorData, experience_years: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Room / Cabin No.</label>
                  <input
                    type="text"
                    placeholder="OPD-203"
                    className="form-input"
                    value={newDoctorData.room_no}
                    onChange={(e) => setNewDoctorData({ ...newDoctorData, room_no: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Fee (₹)</label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    className="form-input"
                    value={newDoctorData.consultation_fee}
                    onChange={(e) => setNewDoctorData({ ...newDoctorData, consultation_fee: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Available Days in OPD</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {daysOfWeek.map((day) => {
                    const isSelected = newDoctorData.available_days.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(day)}
                        style={{
                          padding: '0.4rem 0.85rem',
                          borderRadius: '8px',
                          border: '1px solid ' + (isSelected ? 'var(--primary)' : 'var(--border)'),
                          background: isSelected ? 'var(--primary)' : '#ffffff',
                          color: isSelected ? '#ffffff' : 'var(--text-main)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddDoctorOpen(false)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDoctor}
                  className="btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #0284c7, #0d9488)',
                    color: '#fff',
                    padding: '0.65rem 1.5rem'
                  }}
                >
                  {submittingDoctor ? 'Adding Doctor...' : 'Save Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Doctor Confirmation Modal */}
      {doctorToDelete && (
        <div className="modal-overlay" onClick={() => setDoctorToDelete(null)}>
          <div
            className="modal-content animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Trash2 size={20} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#991b1b' }}>
                Remove Doctor?
              </h3>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Are you sure you want to remove <strong>{doctorToDelete.name}</strong> ({doctorToDelete.specialization})?
              They will be delisted from the OPD booking slots and directory.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDoctorToDelete(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingDoctor}
                onClick={handleConfirmDeleteDoctor}
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                {deletingDoctor ? 'Removing...' : 'Yes, Remove Doctor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQs Section */}
      <div className="card">
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Frequently Asked Questions
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Common guidelines regarding OPD procedures, appointments, and hospital policies.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {FAQS.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: isOpen ? '#f8fafc' : '#ffffff'
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'transparent',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.925rem',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {isOpen && (
                  <div style={{ padding: '0 1.25rem 1.25rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
