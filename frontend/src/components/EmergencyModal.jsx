import React, { useState } from 'react';
import {
  PhoneCall,
  ShieldAlert,
  Copy,
  Check,
  X,
  MapPin,
  Clock,
  AlertTriangle
} from 'lucide-react';

export default function EmergencyModal({ isOpen, onClose }) {
  const [copiedKey, setCopiedKey] = useState(null);

  if (!isOpen) return null;

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const emergencyContacts = [
    {
      title: 'National Emergency Helpline',
      subtitle: 'Ambulance, Police & Fire (24/7 All India)',
      number: '112',
      badge: '24/7 Toll-Free',
      urgent: true
    },
    {
      title: 'CareConnect Emergency Trauma Desk',
      subtitle: 'Hospital 24/7 Immediate Emergency Triage',
      number: '+91 11 2345 6789',
      badge: 'Direct Desk',
      urgent: true
    },
    {
      title: 'Hospital Reception & OPD Desk',
      subtitle: 'General inquiries, OPD appointments & doctor schedules',
      number: '+91 11 2345 6790',
      badge: '08:00 AM – 06:00 PM',
      urgent: false
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          border: '2px solid #fecdd3',
          background: '#ffffff'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: '#fee2e2',
                color: '#e11d48',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <ShieldAlert size={26} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#9f1239' }}>
                Emergency Helpline & Direct Contacts
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Immediate contacts for acute medical distress, trauma, or emergency admission
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Critical Notice */}
        <div
          style={{
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
            fontSize: '0.825rem',
            color: '#9f1239',
            lineHeight: 1.5,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>If you or a patient is experiencing:</strong> acute chest pain, sudden paralysis/facial drooping, heavy uncontrolled bleeding, or loss of consciousness, do not wait. Dial <strong>112</strong> or proceed directly to our trauma center.
          </div>
        </div>

        {/* Contacts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
          {emergencyContacts.map((contact, idx) => (
            <div
              key={idx}
              style={{
                border: contact.urgent ? '1.5px solid #fda4af' : '1px solid var(--border)',
                background: contact.urgent ? '#fffafb' : '#f8fafc',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: contact.urgent ? '#9f1239' : 'var(--text-main)' }}>
                    {contact.title}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: contact.urgent ? '#fee2e2' : '#e2e8f0',
                      color: contact.urgent ? '#be123c' : 'var(--text-muted)',
                      padding: '2px 6px',
                      borderRadius: '99px'
                    }}
                  >
                    {contact.badge}
                  </span>
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {contact.subtitle}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: contact.urgent ? '#e11d48' : '#0284c7'
                  }}
                >
                  {contact.number}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => handleCopy(contact.number, `num-${idx}`)}
                  style={{
                    background: copiedKey === `num-${idx}` ? '#dcfce7' : '#ffffff',
                    border: '1px solid ' + (copiedKey === `num-${idx}` ? '#86efac' : 'var(--border)'),
                    color: copiedKey === `num-${idx}` ? '#15803d' : 'var(--text-main)',
                    borderRadius: '8px',
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {copiedKey === `num-${idx}` ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedKey === `num-${idx}` ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Physical Address */}
        <div
          style={{
            background: '#f1f5f9',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            fontSize: '0.825rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '1.25rem'
          }}
        >
          <MapPin size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
          <div>
            <strong>Trauma Center Location:</strong> Plot 42, Health City, Sector 5, New Delhi - 110001 (Ground Floor, 24/7 Red Gate)
          </div>
        </div>

        {/* Close Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary"
            style={{
              background: '#0f172a',
              color: '#ffffff',
              padding: '0.6rem 1.5rem',
              fontSize: '0.875rem'
            }}
          >
            Close Emergency Panel
          </button>
        </div>
      </div>
    </div>
  );
}
