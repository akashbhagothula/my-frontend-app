import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  Stethoscope,
  Building2,
  DollarSign,
  MapPin
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function BookingWizard({ initialDepartmentId, onBookingSuccess, onNavigateToLookup }) {
  const [step, setStep] = useState(1);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Selections
  const [selectedDeptId, setSelectedDeptId] = useState(initialDepartmentId || null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  // Date & Slot
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [appointmentDate, setAppointmentDate] = useState(getTomorrowStr());
  const [slotsData, setSlotsData] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');

  // Patient Info
  const [formData, setFormData] = useState({
    patient_name: '',
    contact_number: '',
    email: '',
    notes: ''
  });

  // Confirmed booking state
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [copied, setCopied] = useState(false);

  // Load departments
  useEffect(() => {
    fetch(`${API_BASE}/departments`)
      .then((res) => res.json())
      .then((data) => {
        setDepartments(data);
        if (initialDepartmentId) {
          setSelectedDeptId(Number(initialDepartmentId));
          setStep(2);
        }
      })
      .catch((err) => console.error('Failed to load departments', err));
  }, [initialDepartmentId]);

  // Load doctors when dept changes
  useEffect(() => {
    if (selectedDeptId) {
      setLoading(true);
      fetch(`${API_BASE}/doctors?department_id=${selectedDeptId}`)
        .then((res) => res.json())
        .then((data) => {
          setDoctors(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load doctors', err);
          setLoading(false);
        });
    } else {
      setDoctors([]);
    }
  }, [selectedDeptId]);

  // Load slots when doctor or date changes
  useEffect(() => {
    if (selectedDoctor && appointmentDate) {
      setLoadingSlots(true);
      setSelectedSlot('');
      fetch(`${API_BASE}/slots?doctor_id=${selectedDoctor.id}&date=${appointmentDate}`)
        .then((res) => res.json())
        .then((data) => {
          setSlotsData(data);
          setLoadingSlots(false);
        })
        .catch((err) => {
          console.error('Failed to fetch slots', err);
          setLoadingSlots(false);
        });
    }
  }, [selectedDoctor, appointmentDate]);

  const handleCopyRef = (refId) => {
    navigator.clipboard.writeText(refId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedDoctor || !appointmentDate || !selectedSlot) {
      setErrorMsg('Please select a doctor, date, and time slot.');
      return;
    }
    if (!formData.patient_name.trim() || formData.patient_name.trim().length < 2) {
      setErrorMsg('Please provide a valid patient name.');
      return;
    }
    if (!formData.contact_number.trim() || formData.contact_number.trim().length < 8) {
      setErrorMsg('Please provide a valid phone contact number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: selectedDoctor.id,
          department_id: selectedDoctor.department_id,
          patient_name: formData.patient_name,
          contact_number: formData.contact_number,
          email: formData.email,
          appointment_date: appointmentDate,
          time_slot: selectedSlot,
          notes: formData.notes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to confirm booking.');
      }

      setConfirmedBooking(data.appointment);
      setStep(5);
      if (onBookingSuccess) onBookingSuccess(data.appointment);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setConfirmedBooking(null);
    setSelectedDeptId(null);
    setSelectedDoctor(null);
    setSelectedSlot('');
    setFormData({
      patient_name: '',
      contact_number: '',
      email: '',
      notes: ''
    });
    setStep(1);
    setErrorMsg('');
  };

  return (
    <div className="booking-container">
      {/* Stepper Header */}
      {!confirmedBooking && (
        <div className="stepper-header">
          <div className={`step-item ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
            <div className="step-circle">{step > 1 ? '✓' : '1'}</div>
            <div className="step-label">Department</div>
          </div>
          <div className={`step-item ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
            <div className="step-circle">{step > 2 ? '✓' : '2'}</div>
            <div className="step-label">Doctor</div>
          </div>
          <div className={`step-item ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}`}>
            <div className="step-circle">{step > 3 ? '✓' : '3'}</div>
            <div className="step-label">Date & Slot</div>
          </div>
          <div className={`step-item ${step === 4 ? 'active' : ''}`}>
            <div className="step-circle">4</div>
            <div className="step-label">Patient Details</div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            background: 'var(--emergency-bg)',
            color: 'var(--emergency)',
            border: '1px solid var(--emergency-border)',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            fontWeight: 600
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Select Department */}
      {step === 1 && (
        <div className="card animate-fade-in">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Step 1: Select Medical Department
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Choose the clinic department that fits your medical consultation requirement.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '1rem'
            }}
          >
            {departments.map((dept) => {
              const isSelected = selectedDeptId === dept.id;
              return (
                <div
                  key={dept.id}
                  onClick={() => {
                    setSelectedDeptId(dept.id);
                  }}
                  style={{
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: isSelected ? 'var(--primary-light)' : '#ffffff',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? 'var(--shadow-md)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: isSelected ? 'var(--primary-dark)' : 'var(--text-main)' }}>
                      {dept.name}
                    </div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: '#f1f5f9',
                        padding: '2px 8px',
                        borderRadius: '99px',
                        color: 'var(--text-muted)'
                      }}
                    >
                      {dept.code}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '12px', minHeight: '38px' }}>
                    {dept.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.775rem', color: 'var(--text-subtle)' }}>
                    <MapPin size={13} /> {dept.location}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn-primary"
              disabled={!selectedDeptId}
              onClick={() => {
                setErrorMsg('');
                setStep(2);
              }}
              style={{
                opacity: selectedDeptId ? 1 : 0.5,
                background: 'var(--primary)',
                color: '#fff'
              }}
            >
              Continue to Doctors <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Choose Doctor */}
      {step === 2 && (
        <div className="card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                Step 2: Choose Specialist Doctor
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Doctors currently practicing in {departments.find(d => d.id === selectedDeptId)?.name}
              </p>
            </div>
            <button
              onClick={() => setStep(1)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.85rem'
              }}
            >
              <ArrowLeft size={15} /> Change Department
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading available doctors...
            </div>
          ) : doctors.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No active doctors found in this department.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {doctors.map((doc) => {
                const isSelected = selectedDoctor?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoctor(doc)}
                    style={{
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: isSelected ? 'var(--primary-light)' : '#ffffff',
                      borderRadius: '14px',
                      padding: '1.25rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #0284c7, #0d9488)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 700,
                          flexShrink: 0
                        }}
                      >
                        <Stethoscope size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                          {doc.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary-dark)', fontWeight: 600 }}>
                          {doc.specialization}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                          {doc.qualification} • {doc.experience_years} yrs exp
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: '1rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px dashed var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.8rem'
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>Room: <strong>{doc.room_no}</strong></span>
                      <span style={{ color: '#0f766e', fontWeight: 700 }}>Fee: ₹{doc.consultation_fee}</span>
                    </div>

                    <div style={{ marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                      Days: {doc.available_days}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => setStep(1)}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Back
            </button>
            <button
              className="btn-primary"
              disabled={!selectedDoctor}
              onClick={() => {
                setErrorMsg('');
                setStep(3);
              }}
              style={{
                opacity: selectedDoctor ? 1 : 0.5,
                background: 'var(--primary)',
                color: '#fff'
              }}
            >
              Proceed to Slot Selection <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Date & Slot Selection */}
      {step === 3 && (
        <div className="card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                Step 3: Select Date & Appointment Slot
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Consulting with <strong>{selectedDoctor?.name}</strong> (Fee: ₹{selectedDoctor?.consultation_fee})
              </p>
            </div>
            <button
              onClick={() => setStep(2)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.85rem'
              }}
            >
              <ArrowLeft size={15} /> Change Doctor
            </button>
          </div>

          <div style={{ maxWidth: 300, marginBottom: '1.5rem' }}>
            <label className="form-label">
              <Calendar size={15} style={{ display: 'inline', marginRight: 4 }} />
              Appointment Date
            </label>
            <input
              type="date"
              className="form-input"
              value={appointmentDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setAppointmentDate(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">
              <Clock size={15} style={{ display: 'inline', marginRight: 4 }} />
              Available Time Slots
            </label>

            {loadingSlots ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Checking real-time slot schedule...
              </div>
            ) : slotsData && !slotsData.is_available_day ? (
              <div
                style={{
                  padding: '1.25rem',
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: '10px',
                  color: '#92400e',
                  fontSize: '0.9rem'
                }}
              >
                ⚠️ {slotsData.message}
              </div>
            ) : slotsData?.slots ? (
              <div className="slots-grid">
                {slotsData.slots.map((item, idx) => {
                  const isSelected = selectedSlot === item.slot;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!item.available}
                      className={`slot-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedSlot(item.slot)}
                    >
                      <div>{item.slot}</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.85, marginTop: '2px' }}>
                        {item.status}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => setStep(2)}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Back
            </button>
            <button
              className="btn-primary"
              disabled={!selectedSlot}
              onClick={() => {
                setErrorMsg('');
                setStep(4);
              }}
              style={{
                opacity: selectedSlot ? 1 : 0.5,
                background: 'var(--primary)',
                color: '#fff'
              }}
            >
              Enter Patient Details <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Patient Info Form */}
      {step === 4 && (
        <div className="card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                Step 4: Patient Information
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Please provide your contact details for appointment confirmation SMS/records.
              </p>
            </div>
            <button
              onClick={() => setStep(3)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.85rem'
              }}
            >
              <ArrowLeft size={15} /> Edit Slot
            </button>
          </div>

          {/* Booking Summary Pill */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.5rem',
              fontSize: '0.875rem'
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Doctor:</span>{' '}
              <strong>{selectedDoctor?.name}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Date:</span>{' '}
              <strong>{appointmentDate}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Slot:</span>{' '}
              <strong style={{ color: 'var(--primary)' }}>{selectedSlot}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Room:</span>{' '}
              <strong>{selectedDoctor?.room_no}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Consultation Fee:</span>{' '}
              <strong style={{ color: '#0f766e' }}>₹{selectedDoctor?.consultation_fee}</strong>
            </div>
          </div>

          <form onSubmit={handleSubmitBooking}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">
                  <User size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  className="form-input"
                  value={formData.patient_name}
                  onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Phone size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Phone / Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  className="form-input"
                  value={formData.contact_number}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Mail size={14} style={{ display: 'inline', marginRight: 4 }} />
                Email Address (Optional)
              </label>
              <input
                type="email"
                placeholder="e.g. ramesh@example.com"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <FileText size={14} style={{ display: 'inline', marginRight: 4 }} />
                Symptoms / Reason for Visit (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Briefly describe your health concern or symptoms..."
                className="form-textarea"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => setStep(3)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #0d9488)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.75rem 1.75rem'
                }}
              >
                {loading ? 'Confirming Booking...' : 'Confirm Appointment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 5: Success Confirmation Screen */}
      {step === 5 && confirmedBooking && (
        <div
          className="card animate-fade-in"
          style={{
            textAlign: 'center',
            padding: '2.5rem',
            border: '2px solid #bbf7d0',
            background: '#ffffff'
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#14532d', marginBottom: '0.5rem' }}>
            Appointment Confirmed!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
            Your in-person OPD consultation slot has been reserved successfully.
          </p>

          {/* Reference ID Banner */}
          <div
            style={{
              background: '#f8fafc',
              border: '2px dashed #0284c7',
              borderRadius: '14px',
              padding: '1.25rem',
              maxWidth: 420,
              margin: '0 auto 2rem auto'
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Your Appointment Reference ID
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.75rem',
                fontWeight: 800,
                color: '#0284c7',
                letterSpacing: '0.05em',
                margin: '6px 0'
              }}
            >
              {confirmedBooking.reference_id}
            </div>
            <button
              onClick={() => handleCopyRef(confirmedBooking.reference_id)}
              style={{
                background: '#e0f2fe',
                border: 'none',
                color: '#0369a1',
                padding: '0.35rem 0.85rem',
                borderRadius: '99px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied to Clipboard!' : 'Copy Reference ID'}
            </button>
          </div>

          {/* Detailed Summary Card */}
          <div
            style={{
              background: '#f1f5f9',
              borderRadius: '12px',
              padding: '1.25rem',
              textAlign: 'left',
              maxWidth: 480,
              margin: '0 auto 2rem auto',
              fontSize: '0.875rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Patient Name:</span>
              <strong>{confirmedBooking.patient_name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Doctor:</span>
              <strong>{confirmedBooking.doctor_name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Department:</span>
              <span>{confirmedBooking.department_name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Date & Time:</span>
              <strong>{confirmedBooking.appointment_date} at {confirmedBooking.time_slot}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Room Number:</span>
              <strong>{confirmedBooking.room_no}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Consultation Fee:</span>
              <strong style={{ color: '#0f766e' }}>₹{confirmedBooking.consultation_fee} (Payable at desk)</strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigateToLookup && onNavigateToLookup(confirmedBooking.reference_id)}
              className="btn-primary"
              style={{ background: '#0284c7', color: '#fff' }}
            >
              Track / View Appointment
            </button>
            <button
              onClick={resetForm}
              className="btn-secondary"
              style={{ color: 'var(--text-main)', borderColor: 'var(--border)' }}
            >
              Book Another Appointment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
