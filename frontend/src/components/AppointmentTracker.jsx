import React, { useState, useEffect } from 'react';
import {
  Search,
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  Stethoscope,
  XCircle,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function AppointmentTracker({ initialRefId }) {
  const [refId, setRefId] = useState(initialRefId || '');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of schedule');
  const [cancelling, setCancelling] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleLookup = async (overrideRef) => {
    const targetRef = (overrideRef || refId).trim().toUpperCase();
    if (!targetRef) {
      setErrorMsg('Please enter an Appointment Reference ID.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setAppointment(null);

    try {
      let url = `${API_BASE}/appointments/${encodeURIComponent(targetRef)}`;
      if (phone.trim()) {
        url += `?phone=${encodeURIComponent(phone.trim())}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Appointment not found.');
      }

      setAppointment(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialRefId) {
      setRefId(initialRefId);
      handleLookup(initialRefId);
    }
  }, [initialRefId]);

  const handleConfirmCancel = async () => {
    if (!appointment) return;
    setCancelling(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/appointments/${encodeURIComponent(appointment.reference_id)}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel appointment.');
      }

      setSuccessMsg(data.message);
      setAppointment((prev) => ({
        ...prev,
        status: 'CANCELLED',
        cancellation_reason: cancelReason
      }));
      setCancelModalOpen(false);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="lookup-card">
      <div className="card animate-fade-in" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.4rem' }}>
          Appointment Status & Management
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Enter your unique CareConnect Reference ID (format: <code>CC-XXXXXX</code>) to view schedule details or cancel a reservation.
        </p>

        {/* Demo Quick Fills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Demo IDs:</span>
          <button
            type="button"
            className="quick-chip"
            onClick={() => {
              setRefId('CC-DEMO-1001');
              handleLookup('CC-DEMO-1001');
            }}
          >
            CC-DEMO-1001 (Aarav Sharma)
          </button>
          <button
            type="button"
            className="quick-chip"
            onClick={() => {
              setRefId('CC-DEMO-1002');
              handleLookup('CC-DEMO-1002');
            }}
          >
            CC-DEMO-1002 (Neha Patel)
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup();
          }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}
        >
          <div>
            <label className="form-label">Reference ID *</label>
            <input
              type="text"
              placeholder="e.g. CC-DEMO-1001"
              className="form-input"
              value={refId}
              onChange={(e) => setRefId(e.target.value.toUpperCase())}
            />
          </div>
          <div>
            <label className="form-label">Phone Number (Optional)</label>
            <input
              type="tel"
              placeholder="Registered contact"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              background: 'var(--primary)',
              color: '#fff',
              height: '46px',
              padding: '0 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Search size={16} /> {loading ? 'Searching...' : 'Lookup'}
          </button>
        </form>

        {errorMsg && (
          <div
            style={{
              marginTop: '1.25rem',
              background: 'var(--emergency-bg)',
              color: 'var(--emergency)',
              border: '1px solid var(--emergency-border)',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
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

        {successMsg && (
          <div
            style={{
              marginTop: '1.25rem',
              background: 'var(--success-bg)',
              color: 'var(--success)',
              border: '1px solid var(--success-border)',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.875rem',
              fontWeight: 600
            }}
          >
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Appointment Result Card */}
      {appointment && (
        <div className="card animate-fade-in" style={{ border: '2px solid #e2e8f0', background: '#ffffff' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '1rem',
              borderBottom: '1px solid var(--border)',
              marginBottom: '1.25rem'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase' }}>
                Booking Reference
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)' }}>
                {appointment.reference_id}
              </div>
            </div>

            {appointment.status === 'CONFIRMED' ? (
              <span className="badge-confirmed">
                <CheckCircle2 size={14} /> Confirmed
              </span>
            ) : (
              <span className="badge-cancelled">
                <XCircle size={14} /> Cancelled
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', fontSize: '0.9rem' }}>
            <div>
              <div style={{ color: 'var(--text-subtle)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                Patient
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{appointment.patient_name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>📞 {appointment.contact_number}</div>
              {appointment.email && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>✉️ {appointment.email}</div>
              )}
            </div>

            <div>
              <div style={{ color: 'var(--text-subtle)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                Consulting Doctor
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{appointment.doctor_name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{appointment.doctor_specialization}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Room: {appointment.room_no} • {appointment.department_name}</div>
            </div>
          </div>

          <div
            style={{
              marginTop: '1.25rem',
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: '10px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.5rem',
              fontSize: '0.85rem'
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Appointment Date:</span>{' '}
              <strong>{appointment.appointment_date}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Time Slot:</span>{' '}
              <strong style={{ color: 'var(--primary)' }}>{appointment.time_slot}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Consultation Fee:</span>{' '}
              <strong style={{ color: '#0f766e' }}>₹{appointment.consultation_fee}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Clinic Location:</span>{' '}
              <span>{appointment.department_location}</span>
            </div>
          </div>

          {appointment.notes && (
            <div style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Notes:</span> {appointment.notes}
            </div>
          )}

          {appointment.status === 'CANCELLED' && appointment.cancellation_reason && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: '#fff1f2',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: '#9f1239'
              }}
            >
              <strong>Cancellation Reason:</strong> {appointment.cancellation_reason}
            </div>
          )}

          {/* Cancellation Option for Confirmed Appointments */}
          {appointment.status === 'CONFIRMED' && (
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setCancelModalOpen(true)}
                style={{
                  background: '#fff1f2',
                  border: '1px solid #fecdd3',
                  color: '#e11d48',
                  padding: '0.55rem 1.15rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Cancel Appointment
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#9f1239', marginBottom: '0.5rem' }}>
              Confirm Appointment Cancellation
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Are you sure you want to cancel appointment <strong>{appointment?.reference_id}</strong>?
              This slot will be released back to the hospital schedule.
            </p>

            <div className="form-group">
              <label className="form-label">Reason for Cancellation</label>
              <select
                className="form-select"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              >
                <option value="Change of personal schedule">Change of personal schedule</option>
                <option value="Symptoms improved / recovered">Symptoms improved / recovered</option>
                <option value="Booked another specialist">Booked another specialist</option>
                <option value="Visiting another clinic">Visiting another clinic</option>
                <option value="Emergency hospitalization elsewhere">Emergency hospitalization elsewhere</option>
                <option value="Other reason">Other reason</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Keep Appointment
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancel}
                style={{
                  background: '#e11d48',
                  color: '#fff',
                  border: 'none',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
