import React, { useState } from 'react';
import {
  MessageSquare,
  Calendar,
  Search,
  Building2,
  PhoneCall,
  ShieldAlert,
  HeartPulse,
  Clock,
  Sparkles,
  Bot
} from 'lucide-react';
import ChatAssistant from './components/ChatAssistant';
import BookingWizard from './components/BookingWizard';
import AppointmentTracker from './components/AppointmentTracker';
import HospitalDirectory from './components/HospitalDirectory';

import EmergencyModal from './components/EmergencyModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'booking' | 'lookup' | 'directory'
  const [selectedDeptForBooking, setSelectedDeptForBooking] = useState(null);
  const [lookupRefId, setLookupRefId] = useState('');
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

  const navigateToBooking = (deptId = null) => {
    setSelectedDeptForBooking(deptId);
    setActiveTab('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToLookup = (refId = '') => {
    setLookupRefId(refId);
    setActiveTab('lookup');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Emergency Helpline Modal */}
      <EmergencyModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
      />

      {/* 24/7 Emergency Notification Bar */}
      <div className="emergency-banner">
        <ShieldAlert size={18} />
        <span>
          <strong>24/7 Emergency Warning:</strong> In case of chest pain, acute shortness of breath, or trauma,{' '}
          <button
            type="button"
            onClick={() => setEmergencyModalOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              textDecoration: 'underline',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: 'inherit',
              padding: 0
            }}
          >
            call 112 immediately
          </button>{' '}
          or visit our Emergency Care center.
        </span>
      </div>

      {/* Main Header */}
      <header className="app-header">
        <div className="header-container">
          {/* Logo */}
          <div
            className="logo-section"
            onClick={() => setActiveTab('chat')}
            title="CareConnect Home"
          >
            <div className="logo-badge">
              <HeartPulse size={210} />
            </div>
            <div className="logo-text">
              <h1>NRI HOSPITAL</h1>
              <span>Multispecialty Hospital & AI Desk</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="nav-tabs">
            <button
              className={`nav-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <Bot size={17} />
              <span>AI Health Assistant</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'booking' ? 'active' : ''}`}
              onClick={() => {
                setSelectedDeptForBooking(null);
                setActiveTab('booking');
              }}
            >
              <Calendar size={17} />
              <span>Book Appointment</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'lookup' ? 'active' : ''}`}
              onClick={() => setActiveTab('lookup')}
            >
              <Search size={17} />
              <span>Track Booking</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
              onClick={() => setActiveTab('directory')}
            >
              <Building2 size={17} />
              <span>Hospital Guide</span>
            </button>
          </nav>

          {/* Quick Emergency Call Button */}
          <button
            type="button"
            onClick={() => setEmergencyModalOpen(true)}
            className="emergency-quick-btn"
            style={{ cursor: 'pointer' }}
          >
            <PhoneCall size={16} />
            <span>Emergency: 112</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Hero Banner for Welcoming Viewers */}
        {activeTab === 'chat' && (
          <div className="hero-banner animate-fade-in">
            <div className="hero-content">
              <div className="hero-tag">
                <Sparkles size={14} /> NRI Multispeciality Hospital Intelligent Clinical Triage
              </div>
              <h2 className="hero-title">
                Smart Healthcare Navigation & Instant OPD Scheduling
              </h2>
              <p className="hero-desc">
                Consult with our conversational AI assistant to evaluate your symptoms, identify the appropriate medical specialty, schedule in-person OPD appointments, or track your booking records.
              </p>
              <div className="hero-actions">
                <button
                  className="btn-primary"
                  onClick={() => navigateToBooking()}
                >
                  <Calendar size={16} /> Book Doctor Appointment
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => navigateToLookup()}
                >
                  <Search size={16} /> Track Appointment by Ref ID
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'chat' && (
          <ChatAssistant
            onNavigateToBooking={navigateToBooking}
            onNavigateToLookup={navigateToLookup}
          />
        )}

        {activeTab === 'booking' && (
          <BookingWizard
            initialDepartmentId={selectedDeptForBooking}
            onNavigateToLookup={navigateToLookup}
          />
        )}

        {activeTab === 'lookup' && (
          <AppointmentTracker initialRefId={lookupRefId} />
        )}

        {activeTab === 'directory' && (
          <HospitalDirectory onBookDepartment={navigateToBooking} />
        )}
      </main>

      {/* Floating Assistant Trigger when away from Chat tab */}
      {activeTab !== 'chat' && (
        <button
          className="floating-assistant-toggle animate-fade-in"
          onClick={() => setActiveTab('chat')}
          title="Open AI Health Assistant"
        >
          <Bot size={20} />
          <span>Ask AI Assistant</span>
        </button>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
            NRI Multispeciality Hospital & Clinical Research Center
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Plot 42, Health City, Sector 1, Mangalagiri, vijayawada - 522503 • Reception: +91 11 2345 6789 • Emergency: 112
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontStyle: 'italic', marginTop: '0.5rem' }}>
            ⚠️ Important Disclaimer: This platform provides automated scheduling and informational triage guidance. For acute medical emergencies, immediately contact emergency services or proceed to the nearest trauma hospital.
          </div>
        </div>
      </footer>
    </>
  );
}
